const crypto = require('crypto');

function extractCandidateClaims(text, docMetadata, existingThemes, existingComparisons) {
  if (!text || text.length < 50) {
    return { candidateClaims: [], candidateThemes: [], affectedComparisons: [] };
  }

  // 1. Break text into candidate sentences or bullet paragraphs
  const rawParagraphs = text.split(/\n+|(?<=[.!?])\s+/).map(p => p.trim()).filter(p => p.length >= 35 && p.length <= 400);

  // Indicators of normative / policy claims
  const policyKeywords = [
    'דורש', 'דורשת', 'תובע', 'תובעת', 'מחייב', 'מחייבת', 'יש לקבוע', 'יש לפעול',
    'העברת סמכויות', 'אוטונומיה', 'ביזור', 'תקצוב מלא', 'שיפוי', 'גפ"ן', 'גפן',
    'גיל רך', '0-3', 'חינוך מיוחד', 'הסעות', 'מאצ\'ינג', 'שפ"ח', 'חוסן', 'מפעל חיוני',
    'בינה מלאכותית', 'בגרויות', 'מיומנויות', 'ממלכתיות', 'שכר מורים', 'תומכות חינוך'
  ];

  const matchedParagraphs = rawParagraphs.filter(p => 
    policyKeywords.some(kw => p.includes(kw))
  );

  const candidateClaims = [];
  const candidateThemes = [];
  const affectedComparisonsSet = new Set();

  // Deduplicate and limit to top candidates
  const seenQuotes = new Set();
  const selectedParagraphs = matchedParagraphs.slice(0, 5);

  selectedParagraphs.forEach((p, idx) => {
    if (seenQuotes.has(p.substring(0, 30))) return;
    seenQuotes.add(p.substring(0, 30));

    // Match theme
    let matchedThemeId = null;
    let maxKeywordMatches = 0;

    (existingThemes || []).forEach(t => {
      let count = 0;
      (t.keywords || []).forEach(kw => {
        if (p.includes(kw)) count++;
      });
      if (count > maxKeywordMatches) {
        maxKeywordMatches = count;
        matchedThemeId = t.id;
      }
    });

    // Fallback topic matching by semantic words
    if (!matchedThemeId) {
      if (p.includes('ביזור') || p.includes('אוטונומיה') || p.includes('משילות') || p.includes('גפ"ן') || p.includes('גפן')) {
        matchedThemeId = 'THEME-GOVERNANCE-DECENTRALIZATION';
      } else if (p.includes('גיל רך') || p.includes('0-3') || p.includes('מעונות')) {
        matchedThemeId = 'THEME-EARLY-CHILDHOOD';
      } else if (p.includes('חינוך מיוחד') || p.includes('הסעות') || p.includes('שילוב')) {
        matchedThemeId = 'THEME-SPECIAL-EDU';
      } else if (p.includes('בינה מלאכותית') || p.includes('בגרות') || p.includes('מיומנויות') || p.includes('ai')) {
        matchedThemeId = 'THEME-AI-FUTURE-SKILLS';
      } else if (p.includes('חירום') || p.includes('חוסן') || p.includes('שפ"ח') || p.includes('מפעל חיוני')) {
        matchedThemeId = 'THEME-EMERGENCY-RESILIENCE';
      } else if (p.includes('עובדי הוראה') || p.includes('תומכות') || p.includes('שכר')) {
        matchedThemeId = 'THEME-PERSONNEL-STATUS';
      } else {
        // Create candidate theme proposal
        const candThemeId = 'THEME-CANDIDATE-' + crypto.createHash('md5').update(p.substring(0, 20)).digest('hex').substring(0, 6).toUpperCase();
        matchedThemeId = candThemeId;
        if (!candidateThemes.some(ct => ct.id === candThemeId)) {
          candidateThemes.push({
            id: candThemeId,
            nameHe: 'סוגיה מוצעת: ' + p.substring(0, 30) + '...',
            suggestedFrom: docMetadata.title
          });
        }
      }
    }

    const THEME_TO_ISSUES = {
      'THEME-GOVERNANCE-DECENTRALIZATION': ['ISSUE-DECENTRALIZATION'],
      'THEME-SPECIAL-EDU': ['ISSUE-SPECIAL-EDUCATION'],
      'THEME-EARLY-CHILDHOOD': ['ISSUE-EARLY-CHILDHOOD'],
      'THEME-PERSONNEL-STATUS': ['ISSUE-TEACHER-SHORTAGE'],
      'THEME-AI-FUTURE-SKILLS': ['ISSUE-AI-TECH', 'ISSUE-CURRICULUM-STRUCTURE'],
      'THEME-BUDGET-RESOURCE-EQUITY': ['ISSUE-DIFFERENTIAL-FUNDING'],
      'THEME-EMERGENCY-RESILIENCE': ['ISSUE-PROTECTION-SAFETY']
    };
    const targetIssues = THEME_TO_ISSUES[matchedThemeId] || [matchedThemeId];

    // Check affected comparisons
    (existingComparisons || []).forEach(c => {
      if (targetIssues.includes(c.issueId) || c.issueId === matchedThemeId || c.unionClaimId?.includes(matchedThemeId.replace('THEME-', ''))) {
        affectedComparisonsSet.add(c.id);
      }
    });

    const claimId = 'CLM-PENDING-' + crypto.createHash('md5').update(docMetadata.title + p).digest('hex').substring(0, 8).toUpperCase();

    candidateClaims.push({
      candidateClaimId: claimId,
      claim: p.length > 120 ? p.substring(0, 117) + '...' : p,
      verbatimQuote: p,
      primaryTheme: matchedThemeId,
      suggestedAuthorityTier: docMetadata.suggestedAuthorityTier || 'F',
      sourceAuthority: docMetadata.suggestedAuthorityTier || 'F',
      sourceAuthorityLabel: docMetadata.authorityTierLabel || 'מקור ממתין לסיווג',
      authorityConfidence: docMetadata.authorityConfidence || 'low',
      authorityNeedsReview: docMetadata.authorityNeedsReview ?? true,
      authorityReason: docMetadata.authorityReason || null,
      status: 'pending_review',
      suggestedAt: new Date().toISOString()
    });
  });

  return {
    candidateClaims,
    candidateThemes,
    affectedComparisons: Array.from(affectedComparisonsSet)
  };
}

module.exports = {
  extractCandidateClaims
};