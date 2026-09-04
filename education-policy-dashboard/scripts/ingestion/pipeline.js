const fs = require('fs');
const path = require('path');
const { computeSha256, extractFile } = require('./extractors');
const { classifyDocument } = require('./classifier');
const { extractCandidateClaims } = require('./claimExtractor');

const baseDir = path.resolve(__dirname, '..', '..');
const ingestionDir = path.join(baseDir, 'data', 'ingestion');
const configPath = path.join(ingestionDir, 'ingestion-config.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error('Config file not found: ' + configPath);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function loadJson(relPath, fallback = {}) {
  const full = path.join(baseDir, relPath);
  if (!fs.existsSync(full)) return fallback;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function saveJson(relPath, data) {
  const full = path.join(baseDir, relPath);
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Scan configured source folders and process new/changed files
 */
async function runScan({ isDryRun = false, force = false, sourceId = null } = {}) {
  console.log(`=== INGESTION PIPELINE V1 ${isDryRun ? '(DRY RUN - NO CHANGES PERSISTED)' : ''} ===`);
  const config = loadConfig();
  const indexData = loadJson(config.stagingPaths.index, { metadata: {}, files: [] });
  const pendingDocsData = loadJson(config.stagingPaths.pendingDocuments, { metadata: {}, documents: [] });
  const pendingClaimsData = loadJson(config.stagingPaths.pendingClaims, { metadata: {}, claims: [] });
  const pendingCompsData = loadJson(config.stagingPaths.pendingComparisons, { metadata: {}, comparisonUpdates: [] });

  const existingThemes = loadJson('data/union/union-themes.json', { themes: [] }).themes;
  const existingComparisons = loadJson('data/union/union-party-comparison.json', { comparisons: [] }).comparisons;

  const fileIndexMap = new Map((indexData.files || []).map(f => [f.filePath, f]));

  let scannedCount = 0;
  let newCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;
  let newCandidateClaimsCount = 0;
  let newCandidateThemesCount = 0;
  const allAffectedComparisons = new Set();
  const needsHumanReviewList = [];
  const errorsList = [];

  for (const source of config.sourceFolders) {
    if (!source.enabled) continue;
    if (sourceId && source.id !== sourceId && source.name !== sourceId) {
      continue;
    }
    const absSourceDir = path.isAbsolute(source.path) ? source.path : path.resolve(baseDir, source.path);
    if (!fs.existsSync(absSourceDir)) {
      console.log(`[Source: ${source.name}] Directory does not exist yet: ${source.path}`);
      continue;
    }

    console.log(`[Source: ${source.name}] Scanning: ${source.path} ...`);
    const entries = fs.readdirSync(absSourceDir, { withFileTypes: true });

    for (const ent of entries) {
      if (ent.isDirectory()) continue;
      const ext = path.extname(ent.name).toLowerCase();
      if (!config.supportedExtensions.includes(ext)) continue;

      const fullFilePath = path.join(absSourceDir, ent.name);
      const relFilePath = path.relative(baseDir, fullFilePath).replace(/\\/g, '/');
      const stats = fs.statSync(fullFilePath);

      if (stats.size > config.maxFileSizeBytes) {
        errorsList.push({ file: relFilePath, error: 'File size exceeds limit: ' + stats.size });
        continue;
      }

      scannedCount++;
      const currentHash = computeSha256(fullFilePath);
      const existingEntry = fileIndexMap.get(relFilePath);

      let fileStatus = 'new';
      const nowIso = new Date().toISOString();

      if (existingEntry && !force) {
        if (existingEntry.hash === currentHash) {
          fileStatus = 'unchanged';
          unchangedCount++;
          console.log(`  - [UNCHANGED] ${ent.name} (SHA-256 match, skipping re-processing)`);
          continue;
        } else {
          fileStatus = 'changed';
          changedCount++;
          console.log(`  * [CHANGED] ${ent.name} (SHA-256 changed: ${existingEntry.hash.substring(0,8)}... -> ${currentHash.substring(0,8)}...)`);
        }
      } else if (existingEntry && force) {
        fileStatus = 'recheck';
        changedCount++;
        console.log(`  🔄 [RECHECK] ${ent.name} (Forced re-evaluation requested)`);
      } else {
        newCount++;
        console.log(`  + [NEW FILE] ${ent.name} (${stats.size} bytes)`);
      }

      // Extract text
      const extractResult = extractFile(fullFilePath, ext);
      if (extractResult.needsReview) {
        fileStatus = 'needs_review';
        needsHumanReviewList.push({
          file: relFilePath,
          reason: extractResult.reviewReason
        });
        console.log(`    ⚠️ Flagged for human review (Extraction): ${extractResult.reviewReason}`);
      }

      // Classify document (Category separated from Authority)
      const classification = classifyDocument(ent.name, extractResult.text, relFilePath);
      console.log(`    📑 Classified: ${classification.detectedCategory} | מדרג משוער: ${classification.suggestedAuthorityTier || 'אין'} (ביטחון: ${classification.authorityConfidence})`);

      // Auto flag for human review if authority needs review (Requirement 4)
      if (classification.authorityNeedsReview) {
        fileStatus = 'needs_review';
        needsHumanReviewList.push({
          file: relFilePath,
          reason: classification.authorityReason || 'נדרשת בדיקה אנושית לקביעת מדרג הסמכות'
        });
        console.log(`    ⚠️ ביקורת אנושית לסמכות: ${classification.authorityReason}`);
      }

      // Extract Candidate Claims
      const claimsResult = extractCandidateClaims(extractResult.text, classification, existingThemes, existingComparisons);
      newCandidateClaimsCount += claimsResult.candidateClaims.length;
      newCandidateThemesCount += claimsResult.candidateThemes.length;
      claimsResult.affectedComparisons.forEach(ac => allAffectedComparisons.add(ac));

      console.log(`    💡 Extracted ${claimsResult.candidateClaims.length} candidate claims, ${claimsResult.candidateThemes.length} candidate themes, ${claimsResult.affectedComparisons.length} affected comparisons.`);

      // Construct Pending Document
      const pendingDocId = 'DOC-PENDING-' + currentHash.substring(0, 8).toUpperCase();
      const pendingDocRecord = {
        pendingDocId,
        fileName: ent.name,
        filePath: relFilePath,
        hash: currentHash,
        fileSize: stats.size,
        fileType: ext.replace(/^\./, ''),
        detectedTitle: classification.title,
        detectedDate: classification.date,
        detectedPublisher: classification.publisher,
        detectedCategory: classification.detectedCategory,
        suggestedAuthorityTier: classification.suggestedAuthorityTier,
        detectedAuthorityTier: classification.detectedAuthorityTier,
        detectedAuthorityLabel: classification.authorityTierLabel,
        authorityConfidence: classification.authorityConfidence,
        authorityNeedsReview: classification.authorityNeedsReview,
        authorityReason: classification.authorityReason,
        extractionReliable: extractResult.isReliable,
        wordCount: extractResult.wordCount,
        reviewReason: classification.authorityReason || extractResult.reviewReason || null,
        status: (fileStatus === 'needs_review' || classification.authorityNeedsReview || extractResult.needsReview) ? 'needs_review' : 'pending_approval',
        firstSeen: existingEntry ? existingEntry.firstSeen : nowIso,
        lastProcessed: nowIso,
        candidateClaimsCount: claimsResult.candidateClaims.length
      };

      // Construct Pending Claims
      const claimsWithDocId = claimsResult.candidateClaims.map(c => ({
        ...c,
        pendingDocId,
        sourceFilePath: relFilePath
      }));

      // Construct Pending Comparison Updates
      const compUpdates = claimsResult.affectedComparisons.map(acId => ({
        updateId: 'CMP-UPDATE-' + currentHash.substring(0, 6).toUpperCase() + '-' + acId,
        comparisonId: acId,
        pendingDocId,
        reason: 'התגלו טענות או מקורות חדשים הנוגעים לסוגיה זו',
        status: 'pending_review',
        timestamp: nowIso
      }));

      if (!isDryRun) {
        // Update Index entry
        const updatedIndexEntry = {
          filePath: relFilePath,
          fileName: ent.name,
          sourceFolder: source.path,
          fileType: ext.replace(/^\./, ''),
          fileSize: stats.size,
          lastModified: stats.mtime.toISOString(),
          hash: currentHash,
          firstSeen: existingEntry ? existingEntry.firstSeen : nowIso,
          lastProcessed: nowIso,
          status: (fileStatus === 'needs_review' || classification.authorityNeedsReview || extractResult.needsReview) ? 'needs_review' : 'processed'
        };
        fileIndexMap.set(relFilePath, updatedIndexEntry);

        // Update pending documents (replace if exists by filePath or pendingDocId or append)
        const docIdx = pendingDocsData.documents.findIndex(d => d.filePath === relFilePath || d.pendingDocId === pendingDocId);
        if (docIdx >= 0) pendingDocsData.documents[docIdx] = pendingDocRecord;
        else pendingDocsData.documents.push(pendingDocRecord);

        // Update pending claims
        claimsWithDocId.forEach(nc => {
          const cIdx = pendingClaimsData.claims.findIndex(c => c.candidateClaimId === nc.candidateClaimId);
          if (cIdx >= 0) pendingClaimsData.claims[cIdx] = nc;
          else pendingClaimsData.claims.push(nc);
        });

        // Update pending comparisons
        compUpdates.forEach(cu => {
          if (!pendingCompsData.comparisonUpdates.some(u => u.updateId === cu.updateId)) {
            pendingCompsData.comparisonUpdates.push(cu);
          }
        });
      }
    }
  }

  // Create Ingestion Report
  const report = {
    timestamp: new Date().toISOString(),
    runType: isDryRun ? 'dry_run' : 'scan',
    scannedCount,
    newCount,
    changedCount,
    unchangedCount,
    candidateClaimsCount: newCandidateClaimsCount,
    candidateThemesCount: newCandidateThemesCount,
    affectedComparisons: Array.from(allAffectedComparisons),
    needsHumanReview: needsHumanReviewList,
    errors: errorsList,
    summary: `סריקה הושלמה: ${scannedCount} קבצים נסרקו (${newCount} חדשים, ${changedCount} השתנו, ${unchangedCount} ללא שינוי). חולצו ${newCandidateClaimsCount} טענות מועמדות. ${needsHumanReviewList.length} פריטים דורשים בדיקה אנושית.`
  };

  if (!isDryRun) {
    indexData.metadata.lastScan = report.timestamp;
    indexData.metadata.totalIndexed = fileIndexMap.size;
    indexData.files = Array.from(fileIndexMap.values());
    saveJson(config.stagingPaths.index, indexData);

    pendingDocsData.metadata.lastUpdated = report.timestamp;
    pendingDocsData.metadata.count = pendingDocsData.documents.length;
    saveJson(config.stagingPaths.pendingDocuments, pendingDocsData);

    pendingClaimsData.metadata.lastUpdated = report.timestamp;
    pendingClaimsData.metadata.count = pendingClaimsData.claims.length;
    saveJson(config.stagingPaths.pendingClaims, pendingClaimsData);

    pendingCompsData.metadata.lastUpdated = report.timestamp;
    pendingCompsData.metadata.count = pendingCompsData.comparisonUpdates.length;
    saveJson(config.stagingPaths.pendingComparisons, pendingCompsData);

    saveJson(config.stagingPaths.report, report);

    // Update system metadata
    const sysMeta = loadJson(config.stagingPaths.systemMetadata, {});
    sysMeta.lastIngestionRun = report.timestamp;
    sysMeta.pendingItemsCount = pendingDocsData.documents.length + pendingClaimsData.claims.length;
    saveJson(config.stagingPaths.systemMetadata, sysMeta);
    // Also sync to public if exists
    if (fs.existsSync(path.join(baseDir, 'public', 'data'))) {
      saveJson('public/data/system-metadata.json', sysMeta);
    }
  }

  console.log('\n' + report.summary);
  return report;
}

/**
 * Approve a pending document or claim
 */
function approveItem(targetId) {
  const config = loadConfig();
  const pendingDocsData = loadJson(config.stagingPaths.pendingDocuments, { documents: [] });
  const pendingClaimsData = loadJson(config.stagingPaths.pendingClaims, { claims: [] });

  let found = false;

  if (targetId === '--all') {
    pendingDocsData.documents.forEach(d => { if (d.status !== 'needs_review') d.status = 'approved'; });
    pendingClaimsData.claims.forEach(c => { c.status = 'approved'; });
    console.log(`✓ All eligible pending items marked as approved.`);
    found = true;
  } else {
    const doc = pendingDocsData.documents.find(d => d.pendingDocId === targetId);
    if (doc) {
      doc.status = 'approved';
      console.log(`✓ Approved document: ${doc.detectedTitle} (${doc.pendingDocId})`);
      // Also approve its claims
      pendingClaimsData.claims.forEach(c => {
        if (c.pendingDocId === targetId) c.status = 'approved';
      });
      found = true;
    }

    const claim = pendingClaimsData.claims.find(c => c.candidateClaimId === targetId);
    if (claim) {
      claim.status = 'approved';
      console.log(`✓ Approved claim: ${claim.claim} (${claim.candidateClaimId})`);
      found = true;
    }
  }

  if (found) {
    saveJson(config.stagingPaths.pendingDocuments, pendingDocsData);
    saveJson(config.stagingPaths.pendingClaims, pendingClaimsData);
  } else {
    console.log(`✗ Item ID not found in pending queue: ${targetId}`);
  }
}

/**
 * Safe local integration of approved items into active knowledge base
 */
function integrateApproved() {
  console.log('=== CONTROLLED INTEGRATION OF APPROVED ITEMS ===');
  const config = loadConfig();
  const pendingDocsData = loadJson(config.stagingPaths.pendingDocuments, { documents: [] });
  const pendingClaimsData = loadJson(config.stagingPaths.pendingClaims, { claims: [] });

  const approvedDocs = pendingDocsData.documents.filter(d => d.status === 'approved');
  const approvedClaims = pendingClaimsData.claims.filter(c => c.status === 'approved');

  if (approvedDocs.length === 0 && approvedClaims.length === 0) {
    console.log('No approved items waiting for integration. Use "approve <id>" first.');
    return;
  }

  console.log(`Found ${approvedDocs.length} approved documents and ${approvedClaims.length} approved claims for integration.`);

  // 1. Integrate into union-documents.json
  const unionDocsPath = 'data/union/union-documents.json';
  const unionDocsData = loadJson(unionDocsPath, { documents: [] });
  const docIdMapping = new Map();

  approvedDocs.forEach((ad, i) => {
    // Generate official ID
    const year = ad.detectedDate ? ad.detectedDate.replace(/[^0-9]/g, '') : '2026';
    const officialDocId = `DOC-UNION-${year || '2026'}-INGESTED-${ad.hash.substring(0, 6).toUpperCase()}`;
    docIdMapping.set(ad.pendingDocId, officialDocId);

    // Safety rule: Never duplicate existing
    if (!unionDocsData.documents.some(d => d.id === officialDocId)) {
      unionDocsData.documents.push({
        id: officialDocId,
        title: ad.detectedTitle,
        type: ad.detectedCategory,
        author: ad.detectedPublisher,
        date: ad.detectedDate || '2026',
        sourceAuthority: ad.detectedAuthorityTier || 'C',
        sourceClassification: ad.detectedAuthorityTier || 'C',
        isPrimarySource: ad.detectedAuthorityTier === 'A' || ad.detectedAuthorityTier === 'B',
        fileName: ad.fileName,
        fileHash: ad.hash,
        ingestedAt: new Date().toISOString()
      });
      console.log(`  + Added to active union-documents: ${ad.detectedTitle} [${officialDocId}]`);
    }
  });

  // 2. Integrate into union-claims.json
  const unionClaimsPath = 'data/union/union-claims.json';
  const unionClaimsData = loadJson(unionClaimsPath, { claims: [] });

  approvedClaims.forEach((ac, i) => {
    const assignedDocId = docIdMapping.get(ac.pendingDocId) || 'DOC-UNION-2026-INGESTED';
    const officialClaimId = `CLM-UNION-${ac.primaryTheme ? ac.primaryTheme.substring(6, 9) : 'GEN'}-${ac.candidateClaimId.substring(12, 16)}`;

    if (!unionClaimsData.claims.some(c => c.id === officialClaimId)) {
      unionClaimsData.claims.push({
        id: officialClaimId,
        theme: ac.primaryTheme,
        subTopic: ac.claim.substring(0, 40),
        claim: ac.claim,
        documentId: assignedDocId,
        sourceAuthority: ac.sourceAuthority,
        layers: {
          fact: {
            quote: ac.verbatimQuote,
            sourceLocation: 'מסמך מקור שנקלט במערכת'
          }
        },
        ingestedAt: new Date().toISOString()
      });
      console.log(`  + Added to active union-claims: ${ac.claim} [${officialClaimId}]`);
    }
  });

  // Save updated active data (Local only!)
  saveJson(unionDocsPath, unionDocsData);
  saveJson(unionClaimsPath, unionClaimsData);

  // Mark pending items as integrated and remove from pending queue
  const archivePath = 'data/ingestion/archive/integrated-history.json';
  const archiveData = loadJson(archivePath, { history: [] });

  approvedDocs.forEach(ad => {
    archiveData.history.push({ ...ad, status: 'integrated', integratedAt: new Date().toISOString() });
  });
  approvedClaims.forEach(ac => {
    archiveData.history.push({ ...ac, status: 'integrated', integratedAt: new Date().toISOString() });
  });
  saveJson(archivePath, archiveData);

  // Clean pending queue
  pendingDocsData.documents = pendingDocsData.documents.filter(d => d.status !== 'approved');
  pendingDocsData.metadata.count = pendingDocsData.documents.length;
  saveJson(config.stagingPaths.pendingDocuments, pendingDocsData);

  pendingClaimsData.claims = pendingClaimsData.claims.filter(c => c.status !== 'approved');
  pendingClaimsData.metadata.count = pendingClaimsData.claims.length;
  saveJson(config.stagingPaths.pendingClaims, pendingClaimsData);

  // Update system metadata
  const sysMeta = loadJson(config.stagingPaths.systemMetadata, {});
  sysMeta.lastKnowledgeUpdate = new Date().toISOString().split('T')[0];
  sysMeta.documentsCount = unionDocsData.documents.length;
  sysMeta.claimsCount = unionClaimsData.claims.length;
  sysMeta.pendingItemsCount = pendingDocsData.documents.length + pendingClaimsData.claims.length;
  saveJson(config.stagingPaths.systemMetadata, sysMeta);

  console.log('✓ Integration completed locally. (No commit, push, or deployment executed).');
}

/**
 * Display Pipeline Status
 */
function showStatus() {
  const config = loadConfig();
  const indexData = loadJson(config.stagingPaths.index, { metadata: {}, files: [] });
  const pendingDocsData = loadJson(config.stagingPaths.pendingDocuments, { documents: [] });
  const pendingClaimsData = loadJson(config.stagingPaths.pendingClaims, { claims: [] });
  const report = loadJson(config.stagingPaths.report, {});
  const sysMeta = loadJson(config.stagingPaths.systemMetadata, {});

  console.log('====================================================');
  console.log('INGESTION PIPELINE V1 STATUS');
  console.log('====================================================');
  console.log(`Indexed Files: ${indexData.files.length}`);
  console.log(`Pending Documents: ${pendingDocsData.documents.length}`);
  console.log(`Pending Claims: ${pendingClaimsData.claims.length}`);
  console.log(`Last Scan: ${report.timestamp || 'Never'}`);
  console.log(`System Documents: ${sysMeta.documentsCount} | Claims: ${sysMeta.claimsCount} | Comparisons: ${sysMeta.comparisonsCount}`);

  if (pendingDocsData.documents.length > 0) {
    console.log('\nPending Documents Queue:');
    pendingDocsData.documents.forEach(d => {
      console.log(` - [${d.status}] ${d.detectedTitle}`);
      console.log(`   ID: ${d.pendingDocId} | Category: ${d.detectedCategory} | Suggested Tier: ${d.suggestedAuthorityTier || 'None'} (Confidence: ${d.authorityConfidence || 'low'})`);
      if (d.authorityNeedsReview) console.log(`   ⚠️ ביקורת סמכות נדרשת: ${d.authorityReason}`);
      if (d.reviewReason && d.reviewReason !== d.authorityReason) console.log(`   ⚠️ ביקורת חילוץ: ${d.reviewReason}`);
    });
  }
}

/**
 * Display Detailed Review for Pending Items
 */
function showReview() {
  const config = loadConfig();
  const pendingDocsData = loadJson(config.stagingPaths.pendingDocuments, { documents: [] });
  const pendingClaimsData = loadJson(config.stagingPaths.pendingClaims, { claims: [] });

  console.log('====================================================');
  console.log('INGESTION PIPELINE V1 - PENDING REVIEW');
  console.log('====================================================');

  console.log(`\n📄 Documents in Review (${pendingDocsData.documents.length}):`);
  pendingDocsData.documents.forEach((d, idx) => {
    console.log(`\n[Doc #${idx + 1}] ID: ${d.pendingDocId} | Status: ${d.status}`);
    console.log(`  File: ${d.fileName}`);
    console.log(`  Title: ${d.detectedTitle}`);
    console.log(`  Category: ${d.detectedCategory}`);
    console.log(`  Suggested Tier: ${d.suggestedAuthorityTier || 'None'} (Confidence: ${d.authorityConfidence || 'low'})`);
    console.log(`  Authority Needs Review: ${d.authorityNeedsReview ? 'YES' : 'NO'}`);
    if (d.authorityReason) console.log(`  Authority Reason: ${d.authorityReason}`);
    if (d.reviewReason && d.reviewReason !== d.authorityReason) console.log(`  Extraction Review: ${d.reviewReason}`);
  });

  console.log(`\n💡 Candidate Claims in Review (${pendingClaimsData.claims.length}):`);
  pendingClaimsData.claims.forEach((c, idx) => {
    console.log(`\n[Claim #${idx + 1}] ID: ${c.candidateClaimId} | Status: ${c.status}`);
    console.log(`  Claim: "${c.claim}"`);
    console.log(`  Theme: ${c.primaryTheme}`);
    console.log(`  Suggested Tier: ${c.suggestedAuthorityTier || c.sourceAuthority} (Confidence: ${c.authorityConfidence || 'low'})`);
    console.log(`  Authority Needs Review: ${c.authorityNeedsReview ? 'YES' : 'NO'}`);
    if (c.authorityReason) console.log(`  Authority Reason: ${c.authorityReason}`);
  });
}

// CLI argument dispatcher
const cmd = process.argv[2] || 'status';
const arg = process.argv[3];
const isForce = process.argv.includes('--force') || arg === '--force';
const sourceIdx = process.argv.indexOf('--source');
const sourceId = sourceIdx !== -1 && process.argv[sourceIdx + 1] ? process.argv[sourceIdx + 1] : null;

if (cmd === 'scan' || cmd === 'ingest') {
  runScan({ isDryRun: false, force: isForce, sourceId });
} else if (cmd === 'dry-run') {
  runScan({ isDryRun: true, force: isForce, sourceId });
} else if (cmd === 'review') {
  showReview();
} else if (cmd === 'approve') {
  if (!arg || arg === '--force' || arg === '--source') {
    console.log('Usage: node pipeline.js approve <pendingDocId|candidateClaimId|--all>');
  } else {
    approveItem(arg);
  }
} else if (cmd === 'integrate') {
  integrateApproved();
} else if (cmd === 'status') {
  showStatus();
} else {
  console.log('Commands: scan [--force] [--source <id>] | dry-run [--force] [--source <id>] | status | review | approve <id> | integrate');
}