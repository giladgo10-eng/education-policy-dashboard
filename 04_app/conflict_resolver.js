/**
 * ConflictResolver - Master Data Reconciliation & Cleansing System
 * Detects discrepancies across matched records, applies source priorities,
 * and manages user/automatic resolutions without data loss.
 */
class ConflictResolver {
  constructor(sourcePriority = null, logger = null) {
    this.sourcePriority = sourcePriority || {
      default_order: ["A", "B", "C"],
      rules: {
        null_never_overwrites_value: true,
        valid_overwrites_invalid: true
      }
    };
    this.logger = logger;
  }

  setSourcePriority(priority) {
    if (priority) this.sourcePriority = priority;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  _getSourceRank(sourceId) {
    const order = this.sourcePriority.default_order || ["A", "B", "C"];
    const idx = order.indexOf(sourceId);
    return idx === -1 ? 999 : idx;
  }

  /**
   * Scans a cluster for conflicts across standard fields
   */
  detectConflicts(cluster) {
    const members = cluster.members;
    if (members.length <= 1) {
      return { hasConflicts: false, conflicts: [] };
    }

    const conflicts = [];
    const fieldsToInspect = [
      { key: 'authority_name_standard', label: 'רשות מקומית', rawKey: 'authority' },
      { key: 'role_standard', label: 'תפקיד תקני', rawKey: 'role' },
      { key: 'phone_mobile', label: 'טלפון נייד', rawKey: 'phone_mobile' },
      { key: 'email', label: 'דוא"ל ראשי', rawKey: 'email' }
    ];

    fieldsToInspect.forEach(({ key, label }) => {
      const distinctValues = new Map();

      members.forEach(m => {
        const val = m[key];
        if (val && val !== 'תפקיד לא מזוהה' && val !== 'לא מוגדר' && val.trim() !== '') {
          if (!distinctValues.has(val)) {
            distinctValues.set(val, []);
          }
          distinctValues.get(val).push({
            sourceId: m._source_id || 'N/A',
            sourceName: m._source_name || 'מקור',
            rawId: m._raw_row_id || m.id,
            val
          });
        }
      });

      // If more than 1 distinct valid value exists, we have a conflict
      if (distinctValues.size > 1) {
        const valueList = Array.from(distinctValues.entries()).map(([v, srcs]) => ({
          value: v,
          sources: srcs.map(s => s.sourceName || s.sourceId),
          sourceIds: srcs.map(s => s.sourceId)
        }));

        // Determine recommended winning value based on Source Priority
        let recommendedValue = valueList[0].value;
        let lowestRank = 9999;

        valueList.forEach(item => {
          item.sourceIds.forEach(srcId => {
            const rank = this._getSourceRank(srcId);
            if (rank < lowestRank) {
              lowestRank = rank;
              recommendedValue = item.value;
            }
          });
        });

        conflicts.push({
          clusterId: cluster.clusterId,
          field: key,
          fieldLabel: label,
          distinctValues: valueList,
          recommendedValue,
          recommendedReason: `נבחר לפי עדיפות מקור (${this.sourcePriority.default_order.join(' > ')})`,
          isResolved: false,
          resolvedValue: null
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Resolves conflicts for a cluster, applying user overrides or default priority recommendations
   */
  resolveCluster(cluster, userOverrides = {}) {
    const { conflicts } = this.detectConflicts(cluster);
    const resolvedFields = {};
    const auditLogs = [];

    conflicts.forEach(c => {
      const overrideVal = userOverrides[`${c.clusterId}_${c.field}`];
      const winningValue = overrideVal !== undefined && overrideVal !== null ? overrideVal : c.recommendedValue;
      const isManual = overrideVal !== undefined && overrideVal !== null;

      resolvedFields[c.field] = {
        winningValue,
        isManual,
        originalConflict: c
      };

      if (this.logger) {
        this.logger.log({
          recordId: cluster.clusterId,
          source: 'RESOLVER',
          field: c.fieldLabel,
          oldValue: c.distinctValues.map(v => `${v.value} (${v.sources.join(',')})`).join(' | '),
          newValue: winningValue,
          ruleApplied: isManual ? 'הכרעה ידנית של המשתמש' : c.recommendedReason,
          actionType: isManual ? 'MANUAL' : 'AUTO'
        });
      }
    });

    return {
      resolvedFields,
      unresolvedCount: conflicts.filter(c => !resolvedFields[c.field]).length,
      allConflicts: conflicts
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConflictResolver;
} else if (typeof window !== 'undefined') {
  window.ConflictResolver = ConflictResolver;
}
