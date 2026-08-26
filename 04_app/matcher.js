/**
 * Matcher - Master Data Reconciliation & Cleansing System
 * Multi-signal evidence record linkage engine for matching entities across sources.
 */
class RecordMatcher {
  constructor(rules = null) {
    this.rules = rules || {
      evidence_weights: {
        exact_mobile_match: 50,
        exact_email_match: 50,
        exact_id_number_match: 60,
        exact_full_name_match: 30,
        high_fuzzy_name_match: 20,
        medium_fuzzy_name_match: 15,
        exact_authority_match: 25,
        exact_role_cluster_match: 15
      },
      penalties: {
        conflicting_authority: -25,
        conflicting_valid_mobile: -35,
        dissimilar_names: -50
      },
      thresholds: {
        high_confidence_auto_merge_min: 90,
        medium_confidence_review_min: 65,
        fuzzy_name_high_ratio: 0.88,
        fuzzy_name_medium_ratio: 0.75
      }
    };
  }

  setRules(rules) {
    if (rules) this.rules = rules;
  }

  /**
   * Levenshtein Distance & Similarity Ratio (0.0 to 1.0)
   */
  stringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const a = String(s1).trim().toLowerCase();
    const b = String(s2).trim().toLowerCase();
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return Math.max(0, 1.0 - distance / maxLength);
  }

  /**
   * Evaluates pairwise match between two normalized records
   * Returns: { score: number, confidenceTier: 'HIGH'|'MEDIUM'|'LOW', reasons: string[], isMatch: boolean, hasConflicts: boolean }
   */
  comparePair(recA, recB) {
    const weights = this.rules.evidence_weights;
    const penalties = this.rules.penalties;
    const thresholds = this.rules.thresholds;

    let score = 0;
    const reasons = [];
    const conflicts = [];
    let signalCount = 0;

    // 1. Mobile Phone Check
    const hasValidMobileA = recA.phone_mobile && recA.phone_mobile.length === 10 && recA.phone_mobile.startsWith('05');
    const hasValidMobileB = recB.phone_mobile && recB.phone_mobile.length === 10 && recB.phone_mobile.startsWith('05');

    if (hasValidMobileA && hasValidMobileB) {
      if (recA.phone_mobile === recB.phone_mobile) {
        score += weights.exact_mobile_match;
        reasons.push(`טלפון נייד זהה (${recA.phone_mobile}): +${weights.exact_mobile_match}`);
        signalCount++;
      } else {
        score += penalties.conflicting_valid_mobile;
        conflicts.push(`טלפון נייד סותר (${recA.phone_mobile} מול ${recB.phone_mobile}): ${penalties.conflicting_valid_mobile}`);
      }
    }

    // 2. Email Check
    const hasValidEmailA = recA.email && recA.email.includes('@');
    const hasValidEmailB = recB.email && recB.email.includes('@');

    if (hasValidEmailA && hasValidEmailB) {
      if (recA.email.toLowerCase() === recB.email.toLowerCase()) {
        score += weights.exact_email_match;
        reasons.push(`דוא"ל זהה (${recA.email}): +${weights.exact_email_match}`);
        signalCount++;
      } else {
        // Different emails is a mild conflict (people often have private/work emails)
        conflicts.push(`דוא"ל שונה (${recA.email} מול ${recB.email})`);
      }
    }

    // 3. ID Number Check (Teudat Zehut)
    if (recA.id_number && recB.id_number && recA.id_number.length === 9 && recB.id_number.length === 9) {
      if (recA.id_number === recB.id_number) {
        score += weights.exact_id_number_match;
        reasons.push(`תעודת זהות זהה (${recA.id_number}): +${weights.exact_id_number_match}`);
        signalCount++;
      } else {
        score -= 50;
        conflicts.push(`תעודת זהות סותרת (${recA.id_number} מול ${recB.id_number})`);
      }
    }

    // 4. Full Name Check
    const nameA = (recA.full_name || `${recA.first_name || ''} ${recA.last_name || ''}`).trim();
    const nameB = (recB.full_name || `${recB.first_name || ''} ${recB.last_name || ''}`).trim();

    if (nameA && nameB) {
      if (nameA === nameB) {
        score += weights.exact_full_name_match;
        reasons.push(`שם מלא זהה ("${nameA}"): +${weights.exact_full_name_match}`);
        signalCount++;
      } else {
        const sim = this.stringSimilarity(nameA, nameB);
        if (sim >= thresholds.fuzzy_name_high_ratio) {
          score += weights.high_fuzzy_name_match;
          reasons.push(`שם דומה מאוד ("${nameA}" / "${nameB}", דמיון ${(sim * 100).toFixed(0)}%): +${weights.high_fuzzy_name_match}`);
          signalCount++;
        } else if (sim >= thresholds.fuzzy_name_medium_ratio) {
          score += weights.medium_fuzzy_name_match;
          reasons.push(`שם דומה חלקית ("${nameA}" / "${nameB}", דמיון ${(sim * 100).toFixed(0)}%): +${weights.medium_fuzzy_name_match}`);
        } else if (sim < 0.4 && !hasValidMobileA) {
          score += penalties.dissimilar_names;
          conflicts.push(`שמות שונים לחלוטין ("${nameA}" מול "${nameB}"): ${penalties.dissimilar_names}`);
        }
      }
    }

    // 5. Authority Check
    const authA = recA.authority_name_standard || recA.authority || '';
    const authB = recB.authority_name_standard || recB.authority || '';

    if (authA && authB) {
      if (authA === authB) {
        score += weights.exact_authority_match;
        reasons.push(`רשות מקומית זהה ("${authA}"): +${weights.exact_authority_match}`);
        signalCount++;
      } else {
        // Conflicting authority penalty
        score += penalties.conflicting_authority;
        conflicts.push(`רשות מקומית שונה ("${authA}" מול "${authB}"): ${penalties.conflicting_authority}`);
      }
    }

    // 6. Role Check
    const roleA = recA.role_standard || recA.role || '';
    const roleB = recB.role_standard || recB.role || '';

    if (roleA && roleB && roleA !== 'תפקיד לא מזוהה' && roleB !== 'תפקיד לא מזוהה') {
      if (roleA === roleB) {
        score += weights.exact_role_cluster_match;
        reasons.push(`תפקיד תקני זהה ("${roleA}"): +${weights.exact_role_cluster_match}`);
        signalCount++;
      }
    }

    // Cap score at 100 max and 0 min
    const finalScore = Math.max(0, Math.min(100, score));

    // Determine Confidence Tier
    let confidenceTier = 'LOW';
    if (finalScore >= thresholds.high_confidence_auto_merge_min) {
      confidenceTier = 'HIGH';
    } else if (finalScore >= thresholds.medium_confidence_review_min) {
      confidenceTier = 'MEDIUM';
    }

    // Safety Guard: Single Evidence Signal cannot be HIGH confidence
    if (confidenceTier === 'HIGH' && signalCount < 2) {
      confidenceTier = 'MEDIUM';
      reasons.push('הורד לרמת בדיקה: התאמה על בסיס אות ראיה בודד בלבד');
    }

    // Safety Guard: Conflicting valid mobile & email drops to MEDIUM or LOW
    if (hasValidMobileA && hasValidMobileB && recA.phone_mobile !== recB.phone_mobile) {
      if (confidenceTier === 'HIGH') confidenceTier = 'MEDIUM';
    }

    const isMatch = confidenceTier === 'HIGH' || confidenceTier === 'MEDIUM';

    return {
      score: finalScore,
      confidenceTier,
      isMatch,
      reasons,
      conflicts,
      hasConflicts: conflicts.length > 0,
      recAId: recA._raw_row_id || recA.id,
      recBId: recB._raw_row_id || recB.id
    };
  }

  /**
   * Clusters all records into matching groups across all loaded sources
   */
  clusterRecords(allNormalizedRecords) {
    const n = allNormalizedRecords.length;
    const matchPairs = [];
    const parent = Array.from({ length: n }, (_, i) => i);

    function find(i) {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]);
      return parent[i];
    }

    function union(i, j) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootJ] = rootI;
      }
    }

    // Compare all pairs (with indexing optimization by mobile, email, and normalized name)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const recA = allNormalizedRecords[i];
        const recB = allNormalizedRecords[j];

        // Quick skip heuristic: if no common phone, email, or name substring, skip heavy comparison
        const phoneMatch = recA.phone_mobile && recA.phone_mobile === recB.phone_mobile && recA.phone_mobile.length === 10;
        const emailMatch = recA.email && recA.email === recB.email && recA.email.includes('@');
        const nameA = (recA.full_name || '').toLowerCase();
        const nameB = (recB.full_name || '').toLowerCase();
        const nameMatch = nameA && nameB && (nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA));

        if (!phoneMatch && !emailMatch && !nameMatch) {
          continue;
        }

        const comp = this.comparePair(recA, recB);
        if (comp.isMatch) {
          matchPairs.push({
            recA,
            recB,
            indexA: i,
            indexB: j,
            comparison: comp
          });

          // Only merge into connected component if HIGH confidence or accepted
          if (comp.confidenceTier === 'HIGH') {
            union(i, j);
          }
        }
      }
    }

    // Group records by root parent
    const clusterMap = new Map();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      if (!clusterMap.has(root)) {
        clusterMap.set(root, []);
      }
      clusterMap.get(root).push(allNormalizedRecords[i]);
    }

    const clusters = Array.from(clusterMap.values()).map(members => {
      // Find pairwise matches among members
      const memberIds = new Set(members.map(m => m._raw_row_id || m.id));
      const internalMatches = matchPairs.filter(p => memberIds.has(p.recA._raw_row_id || p.recA.id) && memberIds.has(p.recB._raw_row_id || p.recB.id));

      let avgScore = 100;
      let hasConflicts = false;
      let highestTier = 'LOW';

      if (members.length > 1) {
        if (internalMatches.length > 0) {
          avgScore = Math.round(internalMatches.reduce((acc, m) => acc + m.comparison.score, 0) / internalMatches.length);
          hasConflicts = internalMatches.some(m => m.comparison.hasConflicts);
          highestTier = internalMatches.some(m => m.comparison.confidenceTier === 'HIGH') ? 'HIGH' : 'MEDIUM';
        }
      } else {
        avgScore = 100;
        highestTier = 'SINGLE';
      }

      return {
        clusterId: `CLUST_${members[0]._raw_row_id || members[0].id}`,
        members,
        memberCount: members.length,
        avgScore,
        highestTier,
        hasConflicts,
        matchEvidence: internalMatches.map(m => m.comparison)
      };
    });

    return {
      clusters,
      matchPairs,
      totalRecords: n,
      uniqueEntities: clusters.length,
      matchedClustersCount: clusters.filter(c => c.memberCount > 1).length
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecordMatcher;
} else if (typeof window !== 'undefined') {
  window.RecordMatcher = RecordMatcher;
}
