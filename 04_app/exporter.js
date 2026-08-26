/**
 * Exporter - Master Data Reconciliation & Cleansing System
 * Exports the four mandatory deliverables to XLSX and UTF-8 BOM CSV.
 */
class DataExporter {
  constructor() {}

  /**
   * Transforms MasterRecords into flat tabular objects for export
   */
  prepareMasterExportRows(masterRecords) {
    return masterRecords.map(m => {
      const row = {
        "מזהה Master": m.master_id,
        "שם מלא": m.full_name,
        "שם פרטי": m.first_name,
        "שם משפחה": m.last_name,
        "רשות מקומית תקנית": m.authority_name_standard,
        "רשות מקורית": m.authority_name_raw,
        "סוג רשות": m.authority_type,
        "מחוז": m.district,
        "תפקיד תקני": m.role_standard,
        "תפקיד מקורי": m.role_original,
        "אגף / יחידה": m.department,
        "טלפון נייד תקני": m.phone_mobile,
        "טלפון נייד מקורי": m.phone_mobile_raw,
        "טלפון קווי/עבודה": m.phone_work,
        "דוא\"ל ראשי": m.email,
        "דוא\"ל משני": m.email_secondary,
        "תעודת זהות": m.id_number,
        "סטטוס חבר": m.member_status,
        "קיים במקור A": m.in_source_a ? 'כן' : 'לא',
        "קיים במקור B": m.in_source_b ? 'כן' : 'לא',
        "קיים במקור C": m.in_source_c ? 'כן' : 'לא',
        "מספר מקורות": m.source_count,
        "מזהי רשומות מקור": m.matched_source_ids,
        "ציון התאמה": m.matching_score,
        "ציון איכות נתונים": m.data_quality_score,
        "סטטוס איכות": m.quality_status,
        "דורש בדיקה": m.requires_review ? 'כן' : 'לא',
        "סיבות לבדיקה": m.review_reasons,
        "הערות": m.notes,
        "מקור שדות (Provenance)": m.field_provenance
      };

      // Append distribution lists
      if (m.distribution_lists && typeof m.distribution_lists === 'object') {
        Object.entries(m.distribution_lists).forEach(([k, v]) => {
          row[k] = v;
        });
      }

      return row;
    });
  }

  /**
   * Prepares REVIEW_REQUIRED rows
   */
  prepareReviewExportRows(masterRecords) {
    const reviewRecords = masterRecords.filter(m => m.requires_review);
    return reviewRecords.map(m => ({
      "מזהה Master": m.master_id,
      "שם מלא": m.full_name,
      "רשות מקומית": m.authority_name_standard,
      "תפקיד": m.role_standard,
      "טלפון נייד": m.phone_mobile,
      "דוא\"ל": m.email,
      "מקורות": m.matched_source_ids,
      "סיבות עיקריות לבדיקה": m.review_reasons,
      "ציון התאמה": m.matching_score,
      "ציון איכות": m.data_quality_score,
      "הערות": m.notes
    }));
  }

  /**
   * Prepares MATCHED_DUPLICATES rows
   */
  prepareMatchedDuplicatesRows(matchPairs, clusters) {
    const matchedClusters = clusters.filter(c => c.memberCount > 1);
    const rows = [];

    matchedClusters.forEach(cluster => {
      cluster.members.forEach((m, idx) => {
        rows.push({
          "מזהה קבוצת התאמה": cluster.clusterId,
          "מספר חבר בקבוצה": idx + 1,
          "סה\"כ חברים בקבוצה": cluster.memberCount,
          "מקור הרשומה": m._source_name || m._source_id,
          "מזהה שורה במקור": m._raw_row_id,
          "שם מלא במקור": m.full_name || `${m.first_name || ''} ${m.last_name || ''}`,
          "רשות מקומית": m.authority_name_standard || m.authority,
          "תפקיד": m.role_standard || m.role,
          "טלפון נייד": m.phone_mobile,
          "דוא\"ל": m.email,
          "ציון התאמה קבוצתי": cluster.avgScore,
          "רמת ביטחון": cluster.highestTier === 'HIGH' ? 'גבוהה (90-100)' : 'בינונית (65-89)',
          "קיום סתירות": cluster.hasConflicts ? 'כן - אותרו סתירות' : 'לא - התאמה חלקה'
        });
      });
    });

    return rows;
  }

  /**
   * Creates Excel workbook from rows array
   */
  createExcelWorkbook(rows, sheetName = 'Sheet1') {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS (XLSX) is required for Excel export.');
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
  }

  /**
   * Converts rows to CSV string with UTF-8 BOM
   */
  createCsvWithBom(rows) {
    if (typeof Papa !== 'undefined') {
      const csv = Papa.unparse(rows, { quotes: true });
      return '\uFEFF' + csv; // Prepend UTF-8 BOM
    }

    if (rows.length === 0) return '\uFEFF';
    const headers = Object.keys(rows[0]);
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines = [headers.map(escapeCsv).join(',')];
    rows.forEach(r => {
      lines.push(headers.map(h => escapeCsv(r[h])).join(','));
    });

    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Triggers browser download for Excel file
   */
  downloadExcel(rows, fileName, sheetName = 'Master') {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS not loaded');
    }
    const wb = this.createExcelWorkbook(rows, sheetName);
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Triggers browser download for CSV file (UTF-8 BOM)
   */
  downloadCsv(rows, fileName) {
    const csvContent = this.createCsvWithBom(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExporter;
} else if (typeof window !== 'undefined') {
  window.DataExporter = DataExporter;
}
