const path = require('path');

const CATEGORIES = {
  UNION_DOC: 'מסמך איגוד',
  PARTY_PLATFORM: 'מצע מפלגה',
  COALITION_AGREEMENT: 'הסכם קואליציוני',
  GOV_RESOLUTION: 'החלטת ממשלה',
  EXECUTION_DOC: 'מסמך ביצוע',
  EXTERNAL_RESEARCH: 'מחקר חיצוני',
  MEDIA_DOC: 'תיעוד/פרסום'
};

const AUTHORITY_TIERS = {
  A: 'רמה A — עמדה רשמית מאושרת (אמנה, חוקה, סיכום תשפ"ו)',
  B: 'רמה B — ביטוי מוסדי משותף (נייר עמדה רשמי, מכתב שר/ועדה)',
  C: 'רמה C — קול הנהגה והרצאות מפתח (נאום יו"ר, ון ליר, כנס)',
  D: 'רמה D — מחקר אקדמי ומקצועי (דוחות מחקר, מודלים פדגוגיים)',
  E: 'רמה E — ביטאונים ומאמרים (תוך כדי קפה, מבט רחב, סקירות)',
  F: 'רמה F — מקור משני או תיעוד היסטורי (סיקור, חקיקה כללית)'
};

/**
 * Evaluates authority tier for Union documents.
 * Strict rules:
 * - A and B require positive institutional proof (board resolution, official protocol, verified institutional joint submission).
 * - Never infer A or B from file name or generic phrasing alone.
 * - When insufficient metadata is present, suggest baseline 'F' with authorityConfidence: 'low' and authorityNeedsReview: true.
 */
function evaluateUnionAuthority(fileName, text) {
  const combined = (fileName + ' ' + (text ? text.slice(0, 3000) : '')).toLowerCase().replace(/[-_–—]/g, ' ');

  // Positive proof criteria
  const hasBoardApproval = /אישור הנהל[הת]|פרוטוקול (מספר|מס['׳]|ישיבת הנהלה)|החלטת ועיד[הת]|מסמך רשמי מאושר ומחייב/.test(combined);
  const hasInstitutionalJoint = /מרכז השלטון המקומי בשיתוף|מסמך עמדה משותף לשלטון המקומי|לוועדת (החינוך|הכנסת) בצירוף מכתב רשמי/.test(combined);
  const hasCanonicalAmana = /אמנת מנהלי החינוך 2026|חוקת איגוד מנהלי החינוך/.test(combined);

  // Check for phrases indicating high claims without proof
  const mentionsAmana = combined.includes('אמנה') || combined.includes('חוקה');
  const mentionsPositionPaper = combined.includes('נייר עמדה') || combined.includes('מסמך עמדה');

  if (hasCanonicalAmana && hasBoardApproval) {
    return {
      suggestedTier: 'A',
      confidence: 'high',
      needsReview: false,
      reason: 'מסמך יסוד/אמנה רשמית מאושרת עם ראיה חיובית של החלטת הנהלה/ועידה.'
    };
  }

  if (hasInstitutionalJoint && (hasBoardApproval || combined.includes('מרכז השלטון המקומי'))) {
    return {
      suggestedTier: 'B',
      confidence: 'high',
      needsReview: false,
      reason: 'ביטוי מוסדי משותף מאומת מול מרכז השלטון המקומי או ועדות הכנסת.'
    };
  }

  if (mentionsAmana || mentionsPositionPaper) {
    // Mentions formal terms, but lacks authenticated institutional provenance
    return {
      suggestedTier: 'F',
      confidence: 'low',
      needsReview: true,
      reason: `המסמך כולל ביטויים כמו "${mentionsPositionPaper ? 'נייר עמדה' : 'אמנה'}", אך חסר מטא-דאטה מוסדי מאומת (פרוטוקול, חתימת הנהלה, או פרסום רשמי מאושר). על פי הכללים אין להסיק רמות A–B משם הקובץ או מהניסוח בלבד; נדרשת בדיקה אנושית לקביעת המדרג.`
    };
  }

  if (combined.includes('ון ליר') || combined.includes('הרצאה') || combined.includes('נאום יו"ר') || combined.includes('דברי פתיחה')) {
    return {
      suggestedTier: 'C',
      confidence: 'medium',
      needsReview: true,
      reason: 'זוהה כנאום או הרצאת מפתח (רמה C מוצעת), נדרש אימות זהות הדובר/ת והפורום.'
    };
  }

  if (combined.includes('דוח מחקר') || combined.includes('חינוך 2030') || combined.includes('מחקר אקדמי')) {
    return {
      suggestedTier: 'D',
      confidence: 'medium',
      needsReview: true,
      reason: 'זוהה כמחקר מקצועי (רמה D מוצעת), נדרש אימות מודל המחקר.'
    };
  }

  if (combined.includes('מבט רחב') || combined.includes('תוך כדי קפה') || combined.includes('טור דעה') || combined.includes('מאמר')) {
    return {
      suggestedTier: 'E',
      confidence: 'medium',
      needsReview: true,
      reason: 'זוהה כמאמר ביטאון או טור אישי (רמה E מוצעת), נדרש אישור שיוך לפרסומי האיגוד.'
    };
  }

  return {
    suggestedTier: 'F',
    confidence: 'low',
    needsReview: true,
    reason: 'מסמך איגוד ללא מטא-דאטה מספיק להוכחת מעמד סמכות. מדרג משוער נקבע כ-F וממתין לבדיקה אנושית.'
  };
}

function classifyDocument(fileName, text, filePath) {
  const combined = (fileName + ' ' + (text ? text.slice(0, 3000) : '')).toLowerCase().replace(/[-_–—]/g, ' ');

  // 1. Determine Document Category (Separated from Authority)
  let category = CATEGORIES.MEDIA_DOC;
  let publisher = 'לא ידוע';
  let date = null;

  // Detect Date
  const yearMatch = combined.match(/(201[0-9]|202[0-9]|תשפ["״][א-ז])/);
  if (yearMatch) {
    date = yearMatch[1];
  } else {
    date = '2026';
  }

  // Detect Publisher and Category
  if (combined.includes('הסכם קואליציוני') || (combined.includes('סיעת') && combined.includes('נספח')) || (combined.includes('הליכוד') && combined.includes('הסכם'))) {
    category = CATEGORIES.COALITION_AGREEMENT;
    publisher = 'מזכירות הממשלה / סיעות הקואליציה';
  } else if (combined.includes('החלטת ממשלה') || combined.includes('מזכירות הממשלה')) {
    category = CATEGORIES.GOV_RESOLUTION;
    publisher = 'ממשלת ישראל';
  } else if (combined.includes('דוח ביצוע') || combined.includes('ביצוע תקציב') || combined.includes('החשב הכללי') || combined.includes('דוח מבקר')) {
    category = CATEGORIES.EXECUTION_DOC;
    publisher = 'משרד החינוך / משרד האוצר / מבקר המדינה';
  } else if (combined.includes('איגוד מנהלי') || combined.includes('איגוד מחלקות') || combined.includes('איגוד חינוך') || combined.includes('שלי קרן') || combined.includes('אבי קמינסקי') || combined.includes('מבט רחב') || combined.includes('תוך כדי קפה')) {
    category = CATEGORIES.UNION_DOC;
    publisher = 'איגוד מנהלי ומנהלות אגפי החינוך ברשויות המקומיות';
  } else if (combined.includes('מצע') || combined.includes('תוכנית חינוך') || combined.includes('מפלגת') || combined.includes('יש עתיד') || combined.includes('הדמוקרטים') || combined.includes('ישראל ביתנו') || combined.includes('הציונות הדתית') || combined.includes('ביחד') || combined.includes('ישר')) {
    category = CATEGORIES.PARTY_PLATFORM;
    if (combined.includes('יש עתיד')) publisher = 'יש עתיד';
    else if (combined.includes('הדמוקרטים')) publisher = 'הדמוקרטים';
    else if (combined.includes('ישראל ביתנו')) publisher = 'ישראל ביתנו';
    else if (combined.includes('הציונות הדתית')) publisher = 'הציונות הדתית';
    else if (combined.includes('ביחד')) publisher = 'ביחד';
    else if (combined.includes('ישר')) publisher = 'ישר!';
    else publisher = 'מפלגה פוליטית';
  } else if (combined.includes('אוניברסיטת') || combined.includes('מכון') || combined.includes('מחקר') || combined.includes('סקר')) {
    category = CATEGORIES.EXTERNAL_RESEARCH;
    publisher = 'מוסד מחקר / אקדמיה';
  }

  // 2. Evaluate Authority Tier and Confidence (Separated from Category)
  let authorityResult = null;

  if (category === CATEGORIES.UNION_DOC) {
    authorityResult = evaluateUnionAuthority(fileName, text);
  } else if (category === CATEGORIES.COALITION_AGREEMENT || category === CATEGORIES.GOV_RESOLUTION || category === CATEGORIES.PARTY_PLATFORM) {
    authorityResult = {
      suggestedTier: null,
      confidence: 'high',
      needsReview: false,
      reason: 'מסמך שלטוני/מפלגתי רשמי מאומת'
    };
  } else if (category === CATEGORIES.EXTERNAL_RESEARCH) {
    authorityResult = {
      suggestedTier: null,
      confidence: 'medium',
      needsReview: false,
      reason: 'מחקר אקדמי/חיצוני'
    };
  } else {
    authorityResult = {
      suggestedTier: null,
      confidence: 'low',
      needsReview: true,
      reason: 'מקור תקשורתי או תיעוד כללי'
    };
  }

  // Derive Document Title
  let title = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');
  if (text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 90);
    if (lines.length > 0 && !lines[0].includes('<?xml')) {
      title = lines[0];
    }
  }

  return {
    title,
    date,
    publisher,
    category,
    detectedCategory: category,
    suggestedAuthorityTier: authorityResult.suggestedTier,
    detectedAuthorityTier: authorityResult.needsReview ? null : authorityResult.suggestedTier,
    authorityTier: authorityResult.suggestedTier,
    authorityTierLabel: authorityResult.suggestedTier ? AUTHORITY_TIERS[authorityResult.suggestedTier] : null,
    authorityConfidence: authorityResult.confidence,
    authorityNeedsReview: authorityResult.needsReview,
    authorityReason: authorityResult.reason
  };
}

module.exports = {
  CATEGORIES,
  AUTHORITY_TIERS,
  evaluateUnionAuthority,
  classifyDocument
};