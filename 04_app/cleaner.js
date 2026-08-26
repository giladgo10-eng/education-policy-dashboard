/**
 * Cleaner - Master Data Reconciliation & Cleansing System
 * Cleans and standardizes raw phones, emails, names, and text values.
 */
class Cleaner {
  constructor(rules = null, logger = null) {
    this.rules = rules || {
      phones: {
        valid_mobile_prefixes: ["050", "051", "052", "053", "054", "055", "058"],
        valid_landline_prefixes: ["02", "03", "04", "08", "09", "072", "073", "074", "076", "077", "079"],
        mobile_length: 10,
        strip_chars: ["-", " ", "(", ")", ".", "/", "\\", "\t", "\r", "\n"]
      },
      emails: {
        regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        domain_typo_fixes: {
          "@gmai.com": "@gmail.com",
          "@gmial.com": "@gmail.com",
          "@gamil.com": "@gmail.com",
          "@gmaill.com": "@gmail.com",
          "@walla.co.il.": "@walla.co.il",
          "@walla.com": "@walla.co.il",
          ".con": ".com",
          ".cpm": ".com"
        }
      }
    };
    this.logger = logger;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  /**
   * Cleans and normalizes text fields (names, notes, general strings)
   */
  cleanText(val, fieldName = 'text', recordId = null, source = 'N/A') {
    if (val === null || val === undefined) return '';
    let original = String(val);
    let str = original;

    // 1. Remove corrupted mojibake replacement chars (0xFFFD, , ??? if strictly corrupted)
    str = str.replace(/[\uFFFD]/g, '');
    str = str.replace(//g, '');

    // 2. Normalize backticks to standard single/double quotes
    str = str.replace(/`/g, '"');
    str = str.replace(/''/g, '"');

    // 3. Normalize whitespace (remove tabs, double spaces, trim)
    str = str.replace(/\s+/g, ' ').trim();

    if (this.logger && str !== original && recordId) {
      this.logger.log({
        recordId,
        source,
        field: fieldName,
        oldValue: original,
        newValue: str,
        ruleApplied: 'ניקוי תווים משובשים ורווחים כפולים'
      });
    }

    return str;
  }

  /**
   * Cleans and formats mobile phones
   * Returns: { isValid: boolean, cleaned: string, original: string, isFixed: boolean, error: string|null }
   */
  cleanMobilePhone(val, recordId = null, source = 'N/A') {
    if (!val && val !== 0) {
      return { isValid: false, cleaned: '', original: '', isFixed: false, error: 'ריק' };
    }

    const original = String(val).trim();
    let digits = original.replace(/[^0-9]/g, '');

    // Handle Israeli country code: +972 or 972
    if (digits.startsWith('972') && digits.length >= 11) {
      digits = '0' + digits.slice(3);
    }

    // Auto-restore leading zero if 9 digits starting with 5 (e.g. 547728415 -> 0547728415)
    let isFixed = false;
    if (digits.length === 9 && digits.startsWith('5')) {
      digits = '0' + digits;
      isFixed = true;
    }

    // Validate 10 digits and valid prefix
    const prefixes = this.rules.phones.valid_mobile_prefixes;
    const hasValidPrefix = prefixes.some(p => digits.startsWith(p));
    const isValid = digits.length === 10 && hasValidPrefix;

    let error = null;
    if (!isValid) {
      if (digits.length === 0) error = 'ריק';
      else if (digits.length < 9) error = 'מספר קצר מדי';
      else if (digits.length > 10) error = 'מספר ארוך מדי';
      else if (!hasValidPrefix) error = 'קידומת סלולרית לא מוכרת';
      else error = 'מספר לא תקין';
    }

    if (this.logger && recordId && (isFixed || digits !== original)) {
      this.logger.log({
        recordId,
        source,
        field: 'טלפון נייד',
        oldValue: original,
        newValue: isValid ? digits : original,
        ruleApplied: isFixed ? 'שחזור אפס מוביל וניקוי תווים' : isValid ? 'ניקוי מקפים ורווחים' : 'סימון טלפון חריג / לא תקין',
        details: error || 'טלפון נייד תקין'
      });
    }

    return {
      isValid,
      cleaned: isValid ? digits : original,
      original,
      isFixed,
      error
    };
  }

  /**
   * Cleans and formats landline / work phones
   */
  cleanWorkPhone(val, recordId = null, source = 'N/A') {
    if (!val && val !== 0) {
      return { isValid: false, cleaned: '', original: '', isFixed: false, error: 'ריק' };
    }

    const original = String(val).trim();
    let digits = original.replace(/[^0-9]/g, '');

    // Country code handling
    if (digits.startsWith('972') && digits.length >= 10) {
      digits = '0' + digits.slice(3);
    }

    // Auto-restore leading zero if 8 digits starting with 2,3,4,8,9
    let isFixed = false;
    if (digits.length === 8 && /^[23489]/.test(digits)) {
      digits = '0' + digits;
      isFixed = true;
    }

    const prefixes = this.rules.phones.valid_landline_prefixes;
    const hasValidPrefix = prefixes.some(p => digits.startsWith(p));
    const isValid = (digits.length === 9 || digits.length === 10) && hasValidPrefix;

    let error = null;
    if (!isValid) {
      if (digits.length === 0) error = 'ריק';
      else if (digits.length < 8) error = 'מספר קווי קצר מדי';
      else if (!hasValidPrefix) error = 'קידומת קווית לא מוכרת';
      else error = 'מספר קווי לא תקין';
    }

    // Format with dash: 04-9568865 or 077-1234567
    let formatted = digits;
    if (isValid) {
      if (digits.length === 9) formatted = digits.slice(0, 2) + '-' + digits.slice(2);
      else if (digits.length === 10) formatted = digits.slice(0, 3) + '-' + digits.slice(3);
    }

    if (this.logger && recordId && (isFixed || formatted !== original)) {
      this.logger.log({
        recordId,
        source,
        field: 'טלפון קווי/עבודה',
        oldValue: original,
        newValue: isValid ? formatted : original,
        ruleApplied: isFixed ? 'שחזור אפס מוביל לקווי' : isValid ? 'נרמול טלפון קווי' : 'טלפון קווי חריג',
        details: error || 'טלפון קווי תקין'
      });
    }

    return {
      isValid,
      cleaned: isValid ? formatted : original,
      original,
      isFixed,
      error
    };
  }

  /**
   * Cleans, trims, lowercases and validates email addresses
   */
  cleanEmail(val, recordId = null, source = 'N/A') {
    if (!val) {
      return { isValid: false, cleaned: '', original: '', isFixed: false, error: 'ריק' };
    }

    const original = String(val).trim();
    let email = original.toLowerCase().replace(/\s+/g, '');

    // Apply safe domain typo fixes
    let isFixed = false;
    const typoMap = this.rules.emails.domain_typo_fixes || {};
    for (const [typo, fix] of Object.entries(typoMap)) {
      if (email.endsWith(typo)) {
        email = email.slice(0, -typo.length) + fix;
        isFixed = true;
        break;
      }
    }

    const regex = new RegExp(this.rules.emails.regex || '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    const isValid = regex.test(email);

    let error = null;
    if (!isValid) {
      if (!email.includes('@')) error = 'כתובת ללא @';
      else if (email.startsWith('@') || email.endsWith('@')) error = 'מבנה @ שגוי';
      else if (!email.includes('.')) error = 'סיומת דומיין חסרה';
      else error = 'כתובת דוא"ל לא חוקית';
    }

    if (this.logger && recordId && (isFixed || email !== original)) {
      this.logger.log({
        recordId,
        source,
        field: 'דוא"ל',
        oldValue: original,
        newValue: isValid ? email : original,
        ruleApplied: isFixed ? 'תיקון שגיאת סיומת נפוצה + lowercase' : isValid ? 'הסרת רווחים והמרה ל-lowercase' : 'סימון דוא"ל שגוי',
        details: error || 'דוא"ל תקין'
      });
    }

    return {
      isValid,
      cleaned: isValid ? email : original,
      original,
      isFixed,
      error
    };
  }

  /**
   * Cleans Israeli ID number (Teudat Zehut)
   */
  cleanIdNumber(val, recordId = null, source = 'N/A') {
    if (!val && val !== 0) return { isValid: false, cleaned: '', original: '' };
    const original = String(val).trim();
    let digits = original.replace(/[^0-9]/g, '');

    // Pad with leading zeros up to 9 digits if valid length 7-8
    if (digits.length >= 7 && digits.length <= 8) {
      digits = digits.padStart(9, '0');
    }

    // Check Luhn checksum for Israeli ID if 9 digits
    let isValid = false;
    if (digits.length === 9) {
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        let num = Number(digits[i]) * ((i % 2) + 1);
        sum += num > 9 ? num - 9 : num;
      }
      isValid = sum % 10 === 0;
    }

    return {
      isValid,
      cleaned: digits.length === 9 ? digits : original,
      original
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cleaner;
} else if (typeof window !== 'undefined') {
  window.Cleaner = Cleaner;
}
