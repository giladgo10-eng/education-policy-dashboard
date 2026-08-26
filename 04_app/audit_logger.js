/**
 * AuditLogger - Master Data Reconciliation & Cleansing System
 * Tracks and documents every change, normalization, and merge decision.
 */
class AuditLogger {
  constructor(runId = null) {
    this.runId = runId || `RUN_${new Date().toISOString().replace(/[-:T.]/g, '_').slice(0, 19)}`;
    this.entries = [];
  }

  log({ masterId = 'N/A', sourceRecordId = 'N/A', source = 'SYSTEM', fieldName, oldValue, newValue, ruleId = 'GENERAL_CLEANSE', actionType = 'AUTO', details = '' }) {
    if (oldValue === newValue && actionType === 'AUTO') return;

    const entry = {
      run_id: this.runId,
      timestamp: new Date().toISOString(),
      master_id: String(masterId || 'N/A'),
      source_record_id: String(sourceRecordId || 'N/A'),
      source: String(source),
      field_name: String(fieldName),
      original_value: oldValue === undefined || oldValue === null ? '' : String(oldValue),
      new_value: newValue === undefined || newValue === null ? '' : String(newValue),
      rule_id: String(ruleId || 'GENERAL_CLEANSE'),
      action_type: String(actionType), // 'AUTO' | 'MANUAL' | 'MERGE' | 'HUMAN_REVIEW_CONFIRMED'
      details: String(details)
    };

    this.entries.push(entry);
  }

  getEntries() {
    return this.entries;
  }

  getCount() {
    return this.entries.length;
  }

  clear() {
    this.entries = [];
  }

  toExportRows() {
    return this.entries.map((e, idx) => ({
      "מסד": idx + 1,
      "קוד הרצה (run_id)": e.run_id,
      "תאריך ושעה (timestamp)": e.timestamp,
      "מזהה Master (master_id)": e.master_id,
      "מזהה שורת מקור (source_record_id)": e.source_record_id,
      "מקור (source)": e.source,
      "שם שדה (field_name)": e.field_name,
      "ערך מקורי (original_value)": e.original_value,
      "ערך חדש (new_value)": e.new_value,
      "מזהה חוק (rule_id)": e.rule_id,
      "סוג פעולה (action_type)": e.action_type,
      "פרטים נוספים": e.details
    }));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuditLogger;
} else if (typeof window !== 'undefined') {
  window.AuditLogger = AuditLogger;
}
