/**
 * Normalizer - Master Data Reconciliation & Cleansing System
 * Normalizes authorities and job roles using external dictionary mappings.
 */
class Normalizer {
  constructor(authoritiesDict = null, rolesDict = null, logger = null) {
    this.authoritiesDict = authoritiesDict || { authorities: [] };
    this.rolesDict = rolesDict || { clusters: [] };
    this.logger = logger;
    this._buildLookupIndexes();
  }

  setDictionaries(authoritiesDict, rolesDict) {
    if (authoritiesDict) this.authoritiesDict = authoritiesDict;
    if (rolesDict) this.rolesDict = rolesDict;
    this._buildLookupIndexes();
  }

  setLogger(logger) {
    this.logger = logger;
  }

  _cleanStringForLookup(str) {
    if (!str) return '';
    return String(str)
      .replace(/["'`\-–—.]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  _buildLookupIndexes() {
    this.authorityLookup = new Map();
    (this.authoritiesDict.authorities || []).forEach(auth => {
      // 1. Standard name key
      const stdKey = this._cleanStringForLookup(auth.standard_name);
      if (stdKey) this.authorityLookup.set(stdKey, auth);

      // 2. Aliases keys
      (auth.aliases || []).forEach(alias => {
        const aKey = this._cleanStringForLookup(alias);
        if (aKey) this.authorityLookup.set(aKey, auth);
      });
    });

    this.roleLookup = new Map();
    (this.rolesDict.clusters || []).forEach(cluster => {
      const stdKey = this._cleanStringForLookup(cluster.standard_role);
      if (stdKey) this.roleLookup.set(stdKey, cluster);

      (cluster.aliases || []).forEach(alias => {
        const aKey = this._cleanStringForLookup(alias);
        if (aKey) this.roleLookup.set(aKey, cluster);
      });
    });
  }

  /**
   * Normalizes authority name, returning standard name, district, and type
   */
  normalizeAuthority(rawVal, recordId = null, source = 'N/A') {
    if (!rawVal) {
      return {
        standardName: '',
        raw: '',
        type: '',
        district: '',
        isMatched: false
      };
    }

    const raw = String(rawVal).trim();
    const cleanKey = this._cleanStringForLookup(raw);

    // Direct lookup
    let match = this.authorityLookup.get(cleanKey);

    // Fuzzy/Partial lookup if no direct match
    if (!match) {
      for (const [key, auth] of this.authorityLookup.entries()) {
        if (cleanKey.includes(key) || key.includes(cleanKey)) {
          if (Math.abs(cleanKey.length - key.length) <= 4) {
            match = auth;
            break;
          }
        }
      }
    }

    if (match) {
      if (this.logger && recordId && match.standard_name !== raw) {
        this.logger.log({
          recordId,
          source,
          field: 'רשות מקומית',
          oldValue: raw,
          newValue: match.standard_name,
          ruleApplied: 'האחדת שם רשות מול מילון רשויות',
          details: `סוג: ${match.type}, מחוז: ${match.district}`
        });
      }

      return {
        standardName: match.standard_name,
        raw,
        type: match.type,
        district: match.district,
        isMatched: true
      };
    }

    // No match found in dictionary - preserve raw value
    return {
      standardName: raw,
      raw,
      type: 'לא מוגדר',
      district: '',
      isMatched: false
    };
  }

  /**
   * Normalizes role/job title to standard cluster
   */
  normalizeRole(rawVal, recordId = null, source = 'N/A') {
    if (!rawVal) {
      return {
        standardRole: 'תפקיד לא מזוהה',
        originalRole: '',
        department: '',
        isMatched: false
      };
    }

    const raw = String(rawVal).trim();
    const cleanKey = this._cleanStringForLookup(raw);

    // Direct lookup
    let match = this.roleLookup.get(cleanKey);

    // Partial contains lookup
    if (!match) {
      for (const [key, cluster] of this.roleLookup.entries()) {
        if (key.length >= 4 && cleanKey.includes(key)) {
          match = cluster;
          break;
        }
      }
    }

    if (match) {
      if (this.logger && recordId && match.standard_role !== raw) {
        this.logger.log({
          recordId,
          source,
          field: 'תפקיד',
          oldValue: raw,
          newValue: match.standard_role,
          ruleApplied: 'האחדת תפקיד לאשכול תקני',
          details: `אגף/יחידה: ${match.department_default}`
        });
      }

      return {
        standardRole: match.standard_role,
        originalRole: raw,
        department: match.department_default,
        isMatched: true
      };
    }

    // Unrecognized role
    return {
      standardRole: 'תפקיד לא מזוהה',
      originalRole: raw,
      department: '',
      isMatched: false
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Normalizer;
} else if (typeof window !== 'undefined') {
  window.Normalizer = Normalizer;
}
