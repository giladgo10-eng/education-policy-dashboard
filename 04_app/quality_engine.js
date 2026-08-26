/**
 * QualityEngine - Master Data Reconciliation & Cleansing System
 * Calculates record-level Data Quality Scores and computes aggregated dataset health metrics.
 */
class QualityEngine {
  constructor(rules = null) {
    this.rules = rules || {
      weights: {
        full_name: 20,
        authority: 20,
        role: 20,
        phone_mobile: 20,
        email: 20
      },
      status_tiers: [
        { min_score: 100, status: "מלאה", color: "green" },
        { min_score: 80, status: "כמעט מלאה", color: "blue" },
        { min_score: 60, status: "חסרים נתונים", color: "orange" },
        { min_score: 0, status: "דורשת טיפול", color: "red" }
      ]
    };
  }

  setRules(rules) {
    if (rules) this.rules = rules;
  }

  /**
   * Evaluates individual MasterRecord quality
   * Returns: { score: number, status: string, color: string, details: object }
   */
  evaluateRecordQuality(record) {
    const weights = this.rules.weights;
    let score = 0;
    const checks = {};

    // 1. Full Name check (non-empty and >= 3 chars)
    if (record.full_name && record.full_name.trim().length >= 3) {
      score += weights.full_name;
      checks.full_name = true;
    } else {
      checks.full_name = false;
    }

    // 2. Authority check
    if (record.authority_name_standard && record.authority_name_standard.trim().length > 0 && record.authority_name_standard !== 'לא מוגדר') {
      score += weights.authority;
      checks.authority = true;
    } else {
      checks.authority = false;
    }

    // 3. Role check (non-empty and not unrecognized)
    if (record.role_standard && record.role_standard !== 'תפקיד לא מזוהה' && record.role_standard.trim().length > 0) {
      score += weights.role;
      checks.role = true;
    } else {
      checks.role = false;
    }

    // 4. Mobile phone check (valid 10 digits starting with 05)
    if (record.phone_mobile && record.phone_mobile.length === 10 && record.phone_mobile.startsWith('05')) {
      score += weights.phone_mobile;
      checks.phone_mobile = true;
    } else {
      checks.phone_mobile = false;
    }

    // 5. Email check (valid syntax with @)
    if (record.email && record.email.includes('@') && record.email.includes('.')) {
      score += weights.email;
      checks.email = true;
    } else {
      checks.email = false;
    }

    // Determine status tier
    let status = "דורשת טיפול";
    let color = "red";
    for (const tier of this.rules.status_tiers) {
      if (score >= tier.min_score) {
        status = tier.status;
        color = tier.color;
        break;
      }
    }

    return {
      score,
      status,
      color,
      checks
    };
  }

  /**
   * Generates full dataset health metrics & dashboard KPIs
   */
  generateDashboardMetrics(masterRecords, rawSources, matchPairs, conflictsList, auditLogger) {
    const totalMaster = masterRecords.length;
    const sourceStats = {};
    let totalRawRows = 0;

    Object.entries(rawSources).forEach(([srcId, srcData]) => {
      sourceStats[srcId] = {
        name: srcData.sourceName || `מקור ${srcId}`,
        fileName: srcData.fileName || '',
        count: srcData.rows ? srcData.rows.length : 0
      };
      totalRawRows += sourceStats[srcId].count;
    });

    let fullQualityCount = 0;
    let nearQualityCount = 0;
    let missingDataCount = 0;
    let actionRequiredCount = 0;
    let totalScoreSum = 0;

    let highConfidenceMatches = 0;
    let mediumConfidenceMatches = 0;
    let singleSourceRecords = 0;
    let multiSourceRecords = 0;
    let reviewRequiredCount = 0;

    masterRecords.forEach(m => {
      totalScoreSum += m.data_quality_score || 0;
      if (m.quality_status === 'מלאה') fullQualityCount++;
      else if (m.quality_status === 'כמעט מלאה') nearQualityCount++;
      else if (m.quality_status === 'חסרים נתונים') missingDataCount++;
      else actionRequiredCount++;

      if (m.source_count > 1) multiSourceRecords++;
      else singleSourceRecords++;

      if (m.requires_review) reviewRequiredCount++;
    });

    matchPairs.forEach(p => {
      if (p.comparison.confidenceTier === 'HIGH') highConfidenceMatches++;
      else if (p.comparison.confidenceTier === 'MEDIUM') mediumConfidenceMatches++;
    });

    const averageHealthScore = totalMaster > 0 ? Math.round(totalScoreSum / totalMaster) : 0;

    // Count audit events by category
    const auditEntries = auditLogger ? auditLogger.getEntries() : [];
    let phonesFixedCount = 0;
    let emailsFixedCount = 0;
    let authoritiesStandardizedCount = 0;
    let rolesStandardizedCount = 0;

    auditEntries.forEach(e => {
      if (e.field.includes('טלפון')) phonesFixedCount++;
      if (e.field.includes('דוא"ל') || e.field.includes('מייל')) emailsFixedCount++;
      if (e.field.includes('רשות')) authoritiesStandardizedCount++;
      if (e.field.includes('תפקיד')) rolesStandardizedCount++;
    });

    return {
      totalRawRows,
      totalMasterRecords: totalMaster,
      sourceStats,
      averageHealthScore,
      qualityDistribution: {
        full: fullQualityCount,
        near: nearQualityCount,
        missing: missingDataCount,
        critical: actionRequiredCount,
        fullPercent: totalMaster > 0 ? Math.round((fullQualityCount / totalMaster) * 100) : 0,
        nearPercent: totalMaster > 0 ? Math.round((nearQualityCount / totalMaster) * 100) : 0,
        missingPercent: totalMaster > 0 ? Math.round((missingDataCount / totalMaster) * 100) : 0,
        criticalPercent: totalMaster > 0 ? Math.round((actionRequiredCount / totalMaster) * 100) : 0
      },
      matchingStats: {
        highConfidenceMatches,
        mediumConfidenceMatches,
        multiSourceRecords,
        singleSourceRecords,
        reviewRequiredCount,
        conflictsCount: conflictsList ? conflictsList.length : 0
      },
      cleansingStats: {
        phonesFixedCount,
        emailsFixedCount,
        authoritiesStandardizedCount,
        rolesStandardizedCount,
        totalAuditEvents: auditEntries.length
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QualityEngine;
} else if (typeof window !== 'undefined') {
  window.QualityEngine = QualityEngine;
}
