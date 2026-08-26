/**
 * Parser - Master Data Reconciliation & Cleansing System
 * Parses CSV/XLSX sources, handles Hebrew encodings, duplicate headers, and generates structural QC.
 */
class DataParser {
  constructor(fieldAliases = null) {
    this.fieldAliases = fieldAliases || {
      mappings: {
        first_name: ["שם פרטי", "פרטי", "First Name", "fname"],
        last_name: ["שם משפחה", "משפחה", "Last Name", "lname"],
        full_name: ["שם מלא", "שם", "Full Name", "Name", "שם איש קשר", "שם ומשפחה"],
        authority: ["עיר", "רשות", "רשות מקומית", "שם רשות", "עירייה", "מועצה", "שם חברה"],
        role: ["תפקיד", "תפקיד ברשות", "תפקיד לרשימת תפוצה", "Role", "Position"],
        department: ["אגף", "מחלקה", "מינהל", "יחידה"],
        phone_mobile: ["טלפון נייד", "נייד", "סלולרי", "סלולר", "פלאפון", "Mobile"],
        phone_work: ["טלפון קווי", "טל ישיר", "טל רשות", "טלפון עבודה", "טלפון"],
        email: ["מייל", "דוא\"ל", "דואר אלקטרוני", "אימייל", "Email"],
        email_secondary: ["מייל פרטי אישי", "מייל משרד", "מייל אישי משרד", "דוא\"ל נוסף"],
        id_number: ["תעודת זהות", "ת\"ז", "ת.ז.", "ת.ז", "מספר זהות", "ID"],
        member_status: ["סטטוס חבר", "סטטוס", "חברות באיגוד", "Status"],
        notes: ["הערות", "הערה", "הערות 2", "Notes"]
      }
    };
  }

  setFieldAliases(aliases) {
    if (aliases) this.fieldAliases = aliases;
  }

  /**
   * Parses raw file content (ArrayBuffer or String)
   * fileType: 'csv' | 'xlsx' | 'xls'
   */
  async parseFile(fileOrBuffer, fileName, sourceId = 'A', sourceName = 'מקור') {
    let rows = [];
    let headers = [];
    let duplicateHeadersFound = [];

    if (fileName.endsWith('.csv') || (typeof fileOrBuffer === 'string')) {
      const result = this._parseCsv(fileOrBuffer);
      rows = result.rows;
      headers = result.headers;
      duplicateHeadersFound = result.duplicateHeadersFound;
    } else {
      const result = this._parseExcel(fileOrBuffer);
      rows = result.rows;
      headers = result.headers;
      duplicateHeadersFound = result.duplicateHeadersFound;
    }

    // Attach metadata to rows
    const enrichedRows = rows.map((row, idx) => ({
      _source_id: sourceId,
      _source_name: sourceName,
      _source_row_index: idx + 1,
      _raw_row_id: `${sourceId}:${idx + 1}`,
      ...row
    }));

    // Generate Structural QC report
    const qcReport = this._generateQcReport(enrichedRows, headers, duplicateHeadersFound, sourceId, sourceName, fileName);

    // Auto-suggest field mappings
    const suggestedMapping = this.suggestMapping(headers);

    return {
      sourceId,
      sourceName,
      fileName,
      headers,
      duplicateHeaders: duplicateHeadersFound,
      rows: enrichedRows,
      qcReport,
      suggestedMapping
    };
  }

  _parseCsv(data) {
    let text = data;
    if (data instanceof ArrayBuffer || (typeof Uint8Array !== 'undefined' && data instanceof Uint8Array)) {
      // Decode with UTF-8
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(data);
      // Strip UTF-8 BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
    }

    // Use PapaParse if available
    if (typeof Papa !== 'undefined') {
      const parsed = Papa.parse(text, {
        header: false,
        skipEmptyLines: 'greedy',
        dynamicTyping: false
      });

      if (!parsed.data || parsed.data.length === 0) {
        return { rows: [], headers: [], duplicateHeadersFound: [] };
      }

      const rawHeaders = parsed.data[0].map(h => (h === null || h === undefined ? '' : String(h).trim()));
      const { uniqueHeaders, duplicates } = this._deduplicateHeaders(rawHeaders);

      const rows = [];
      for (let i = 1; i < parsed.data.length; i++) {
        const line = parsed.data[i];
        if (!line || line.every(cell => cell === '' || cell === null || cell === undefined)) continue;
        const rowObj = {};
        uniqueHeaders.forEach((header, colIdx) => {
          rowObj[header] = line[colIdx] !== undefined ? String(line[colIdx]).trim() : '';
        });
        rows.push(rowObj);
      }

      return { rows, headers: uniqueHeaders, duplicateHeadersFound: duplicates };
    }

    // Fallback line parser
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { rows: [], headers: [], duplicateHeadersFound: [] };

    const rawHeaders = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    const { uniqueHeaders, duplicates } = this._deduplicateHeaders(rawHeaders);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      const rowObj = {};
      uniqueHeaders.forEach((header, colIdx) => {
        rowObj[header] = cols[colIdx] || '';
      });
      rows.push(rowObj);
    }

    return { rows, headers: uniqueHeaders, duplicateHeadersFound: duplicates };
  }

  _parseExcel(buffer) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS (XLSX) library is not loaded');
    }

    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rawData || rawData.length === 0) {
      return { rows: [], headers: [], duplicateHeadersFound: [] };
    }

    const rawHeaders = rawData[0].map(h => (h === null || h === undefined ? '' : String(h).trim()));
    const { uniqueHeaders, duplicates } = this._deduplicateHeaders(rawHeaders);

    const rows = [];
    for (let i = 1; i < rawData.length; i++) {
      const line = rawData[i];
      if (!line || line.every(cell => cell === '' || cell === null || cell === undefined)) continue;
      const rowObj = {};
      uniqueHeaders.forEach((header, colIdx) => {
        rowObj[header] = line[colIdx] !== undefined ? String(line[colIdx]).trim() : '';
      });
      rows.push(rowObj);
    }

    return { rows, headers: uniqueHeaders, duplicateHeadersFound: duplicates };
  }

  _deduplicateHeaders(headers) {
    const counts = {};
    const uniqueHeaders = [];
    const duplicates = [];

    headers.forEach((h, idx) => {
      let headerName = h || `עמודה_${idx + 1}`;
      if (counts[headerName]) {
        counts[headerName]++;
        const newName = `${headerName}_${counts[headerName]}`;
        duplicates.push({ original: headerName, renamed: newName, index: idx });
        uniqueHeaders.push(newName);
      } else {
        counts[headerName] = 1;
        uniqueHeaders.push(headerName);
      }
    });

    return { uniqueHeaders, duplicates };
  }

  _generateQcReport(rows, headers, duplicates, sourceId, sourceName, fileName) {
    const totalRows = rows.length;
    const totalCols = headers.length;

    let missingNameCount = 0;
    let missingAuthorityCount = 0;
    let missingPhoneCount = 0;
    let missingEmailCount = 0;
    let emptyContactCount = 0;

    // Check common header names for QC
    const nameCol = headers.find(h => /שם|name/i.test(h));
    const authCol = headers.find(h => /עיר|רשות|city|authority/i.test(h));
    const phoneCol = headers.find(h => /נייד|סלולר|mobile|phone/i.test(h));
    const emailCol = headers.find(h => /מייל|דוא"ל|email/i.test(h));

    rows.forEach(r => {
      const hasName = nameCol ? Boolean(r[nameCol]) : false;
      const hasAuth = authCol ? Boolean(r[authCol]) : false;
      const hasPhone = phoneCol ? Boolean(r[phoneCol]) : false;
      const hasEmail = emailCol ? Boolean(r[emailCol]) : false;

      if (!hasName) missingNameCount++;
      if (!hasAuth) missingAuthorityCount++;
      if (!hasPhone) missingPhoneCount++;
      if (!hasEmail) missingEmailCount++;
      if (!hasPhone && !hasEmail) emptyContactCount++;
    });

    // Initial Quality Score Calculation (0-100)
    let score = 100;
    if (totalRows === 0) score = 0;
    else {
      const emptyContactRate = emptyContactCount / totalRows;
      const missingNameRate = missingNameCount / totalRows;
      score -= Math.round(emptyContactRate * 40 + missingNameRate * 40);
      if (duplicates.length > 0) score -= 5;
    }
    score = Math.max(0, Math.min(100, score));

    return {
      sourceId,
      sourceName,
      fileName,
      totalRows,
      totalCols,
      duplicateHeadersCount: duplicates.length,
      duplicateHeaders: duplicates,
      missingNameCount,
      missingAuthorityCount,
      missingPhoneCount,
      missingEmailCount,
      emptyContactCount,
      initialHealthScore: score
    };
  }

  suggestMapping(headers) {
    const mapping = {};
    const schemaFields = [
      'first_name', 'last_name', 'full_name', 'authority', 'role',
      'department', 'phone_mobile', 'phone_work', 'email', 'email_secondary',
      'id_number', 'member_status', 'notes'
    ];

    schemaFields.forEach(field => {
      const aliases = (this.fieldAliases.mappings && this.fieldAliases.mappings[field]) || [];
      const match = headers.find(h => {
        const cleanH = h.trim().toLowerCase();
        return aliases.some(alias => cleanH === alias.toLowerCase() || cleanH.includes(alias.toLowerCase()));
      });
      mapping[field] = match || '';
    });

    return mapping;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataParser;
} else if (typeof window !== 'undefined') {
  window.DataParser = DataParser;
}
