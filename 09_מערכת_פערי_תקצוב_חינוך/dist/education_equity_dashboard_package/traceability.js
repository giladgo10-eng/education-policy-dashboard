// ==============================================================================
// traceability.js - Data Provenance, Traceability & Methodology Engine
// Methodology Version: Methodology v1.0 — Baseline 2024
// ==============================================================================

window.METHODOLOGY_VERSION = "Methodology v1.0 — Baseline 2024";

// 1. Central Verified Google Drive Sources Index
window.DRIVE_SOURCES = {
  moin_2024: {
    id: "moin_2024",
    title: "דוחות כספיים מבוקרים של הרשויות המקומיות לשנת 2024",
    shortTitle: "משרד הפנים — דוחות כספיים מבוקרים 2024",
    publisher: "משרד הפנים — מינהל השלטון המקומי, אגף בכיר לתקצוב ופיתוח",
    fileName: "moin_audited_local_authorities_2024.xlsx",
    fileSize: "54.55 MB (1,024,771 שורות)",
    driveUrl: "https://docs.google.com/spreadsheets/d/1sPNpvv7PY7HDLL1U-iw4SKqxqphQu5fl/edit?usp=sharing&ouid=111380842784605458811&rtpof=true&sd=true",
    officialUrl: "https://www.gov.il/he/departments/ministry_of_interior",
    description: "דוחות ביצוע מבוקרים מלאים (טופס 1, טופס 2 ופרק 6 חינוך) לכל 257 הרשויות המקומיות.",
    variables: [
      "סך הוצאות חינוך בתקציב הרגיל (קוד 1486)",
      "סך תקבולי חינוך והשתתפות משה\"ח בתקציב הרגיל (קוד 1384)",
      "סך הכנסות עצמיות (קוד 1805)",
      "סך הכנסות התקציב הרגיל (קוד 4162 / 40814)",
      "ארנונה שאינה למגורים — עסקית, מסחר ותעשייה (קוד 4146)",
      "ארנונה למגורים (קוד 4138)",
      "מענק איזון כללי ממשרד הפנים (קוד 1819 / 43150)"
    ]
  },
  cbs_socio_pop_2024: {
    id: "cbs_socio_pop_2024",
    title: "קובץ הרשויות המקומיות בישראל 2024 — אוכלוסייה רשמית 2024 ומדד חברתי־כלכלי 2021",
    shortTitle: "הלמ״ס — רשויות מקומיות, אוכלוסייה 2024 ואשכול ח״כ 2021",
    publisher: "הלשכה המרכזית לסטטיסטיקה (למ״ס)",
    fileName: "p_libud_24.xlsx",
    fileSize: "1.13 MB",
    driveUrl: "https://docs.google.com/spreadsheets/d/1gdJKpOtYoJXsyVD0Zo7QuaVoofAkbcfj/edit?usp=drive_link&ouid=111380842784605458811&rtpof=true&sd=true",
    officialUrl: "https://www.cbs.gov.il/he/settlements/Pages/default.aspx",
    description: "מאגר נתונים רשמי לעיבוד — 257 רשויות מקומיות: אוכלוסייה רשמית 2024, אשכול חברתי־כלכלי 2021 (פרסום 1904), דירוג, ציונים, סיווג ומחוז.",
    variables: [
      "אוכלוסייה רשמית לסוף 2024 (נפשות)",
      "אשכול חברתי-כלכלי רשמי (1–10)",
      "דירוג סוציו-אקונומי ארצי וציון תקן (Z-Score)",
      "סיווג מוניציפלי (עירייה / מועצה מקומית / מועצה אזורית)",
      "שיוך מחוזי מנהלי רשמי"
    ]
  },
  cbs_periphery_2020: {
    id: "cbs_periphery_2020",
    title: "מדד הפריפריאליות של הרשויות המקומיות 2020 (לוח 1, הודעה לתקשורת 420/2022)",
    shortTitle: "הלמ״ס — מדד פריפריאליות 2020",
    publisher: "הלשכה המרכזית לסטטיסטיקה (למ״ס)",
    fileName: "table_01.xlsx",
    fileSize: "64.36 KB",
    driveUrl: "https://docs.google.com/spreadsheets/d/16RFIDdYd7Xm2S2kpnCcDHuwGP7d4S6KN/edit?usp=drive_link&ouid=111380842784605458811&rtpof=true&sd=true",
    officialUrl: "https://www.cbs.gov.il/he/publications/Pages/2022/periphery-index-2020.aspx",
    description: "לוח 1 רשמי של הודעה 420/2022: דירוג פריפריאליות, ציון נגישות רציף ואשכול פריפריאליות 2020 לכלל הרשויות.",
    variables: [
      "אשכול פריפריאליות רשמי (1 = פריפריאלי ביותר, 10 = מרכזי ביותר)",
      "ציון מדד פריפריאליות רציף",
      "דירוג פריפריאליות ארצי"
    ]
  }
};

// 2. Official Sources Catalog for Methodology Tab
window.OfficialSourcesCatalog = [
  {
    id: "moin_audited_2024",
    driveKey: "moin_2024",
    name: "דוחות כספיים מבוקרים של הרשויות המקומיות לשנת 2024 (טופס 2 ופרק 6 - חינוך)",
    publisher: "משרד הפנים — מינהל השלטון המקומי, אגף בכיר לתקצוב ופיתוח",
    dataYear: "2024 (מבוקר)",
    fileName: "moin_audited_local_authorities_2024.xlsx",
    driveUrl: window.DRIVE_SOURCES.moin_2024.driveUrl,
    officialUrl: window.DRIVE_SOURCES.moin_2024.officialUrl,
    variables: window.DRIVE_SOURCES.moin_2024.variables,
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "דוחות מבוקרים ע\"י רואי חשבון מטעם משרד הפנים לכל 257 הרשויות המקומיות."
  },
  {
    id: "cbs_socio_pop_2024",
    driveKey: "cbs_socio_pop_2024",
    name: "קובץ הרשויות המקומיות בישראל 2024 (אוכלוסייה 2024 ומדד חברתי־כלכלי 2021)",
    publisher: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    dataYear: "אוכלוסייה 2024 / מדד ח״כ 2021 (פרסום 1904)",
    fileName: "p_libud_24.xlsx",
    driveUrl: window.DRIVE_SOURCES.cbs_socio_pop_2024.driveUrl,
    officialUrl: window.DRIVE_SOURCES.cbs_socio_pop_2024.officialUrl,
    variables: window.DRIVE_SOURCES.cbs_socio_pop_2024.variables,
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "משמש כמכנה המדויק לכלל חישובי ההוצאה והמענקים לנפש, וכמדד חברתי-כלכלי רשמי (1–10)."
  },
  {
    id: "cbs_periphery_2020",
    driveKey: "cbs_periphery_2020",
    name: "מדד פריפריאליות של הרשויות המקומיות 2020 (מיפוי מרחק ונגישות פוטנציאלית)",
    publisher: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    dataYear: "2020 (הודעה לתקשורת 420/2022 מיום 26.12.2022)",
    fileName: "table_01.xlsx",
    driveUrl: window.DRIVE_SOURCES.cbs_periphery_2020.driveUrl,
    officialUrl: window.DRIVE_SOURCES.cbs_periphery_2020.officialUrl,
    variables: window.DRIVE_SOURCES.cbs_periphery_2020.variables,
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "מודד נגישות תחבורתית ומרחק גיאוגרפי משוקלל למוקדי תעסוקה ומרכז הארץ (אשכול 1–10)."
  }
];

// 3. Data Traceability Dictionary ("איך חושב?") - 4-Tier Taxonomy
window.DataTraceabilityDictionary = {
  "cbs_socio_cluster": {
    label: "אשכול חברתי-כלכלי (למ\"ס)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    sourceDoc: "מדד חברתי-כלכלי של הרשויות המקומיות 2021 (פרסום 1904)",
    sourceField: "עמודת 'אשכול' בקובץ הרשויות המקומיות לעיבוד (p_libud_24.xlsx)",
    sourceKeys: ["cbs_socio_pop_2024"],
    calculation: "סיווג רשמי של הלמ\"ס מ-1 (החלש ביותר) עד 10 (האיתן ביותר). ללא עיבוד נוסף.",
    formula: "ערך מקור גולמי מהלמ\"ס (1 עד 10)",
    limitations: "מתעדכן אחת למספר שנים; נתוני המדד הרשמי העדכני ביותר מתייחסים לשנת 2021."
  },
  "cbs_periphery_cluster": {
    label: "אשכול פריפריאליות (למ\"ס)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    sourceDoc: "מדד פריפריאליות של הרשויות המקומיות 2020 (הודעה לתקשורת 420/2022)",
    sourceField: "עמודת 'אשכול פריפריאליות 2020' בלוח 1 (table_01.xlsx)",
    sourceKeys: ["cbs_periphery_2020"],
    calculation: "סיווג רשמי של הלמ\"ס מ-1 (פריפריאלי ביותר) עד 10 (מרכזי ביותר).",
    formula: "ערך מקור גולמי מהלמ\"ס (1 עד 10)",
    limitations: "מתמקד במרחק גיאוגרפי ונגישות תחבורתית, אינו מודד מצב כלכלי של התושבים."
  },
  "population": {
    label: "אוכלוסיית הרשות (נפש / תושבים)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    sourceDoc: "קובץ הרשויות המקומיות בישראל 2024",
    sourceField: "עמודה C ('אוכלוסייה בסוף השנה 2024') בקובץ p_libud_24.xlsx",
    sourceKeys: ["cbs_socio_pop_2024"],
    calculation: "מספר התושבים הרשומים ברשות המקומית לסוף שנת 2024.",
    formula: "ערך מקור רשמי גולמי (נפשות)",
    limitations: "מבוסס מרשם אוכלוסין רשמי של הלמ\"ס. משמש כיחידת הבסיס לחישוב מדדים לנפש."
  },
  "education_expense_1486_tk": {
    label: "סך הוצאות חינוך בתקציב הרגיל (קוד 1486)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "טופס 2 ופרק 6 (דוח ביצוע תקציב רגיל - הוצאות חינוך)",
    sourceField: "קוד סעיף תקציבי 1486 — 'חינוך: תשלומים - ביצוע'",
    sourceKeys: ["moin_2024"],
    calculation: "סך כל ההוצאות הרשמיות של הרשות המקומית על שירותי חינוך (הוראה, מנהלה, אחזקה, הסעות ושירותים תומכים).",
    formula: "ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "משקף תקציב רגיל בלבד; אינו כולל השקעות בינוי ופיתוח מתוך תקציב בלתי רגיל (תב\"ר)."
  },
  "education_revenue_1384_tk": {
    label: "סך תקבולי חינוך והשתתפות המדינה (קוד 1384)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "טופס 2 ופרק 6 (דוח ביצוע תקציב רגיל - הכנסות חינוך)",
    sourceField: "קוד סעיף תקציבי 1384 — 'חינוך: תקבולים - ביצוע'",
    sourceKeys: ["moin_2024"],
    calculation: "סך כל התקבולים הייעודיים שהועברו לרשות ממשרד החינוך, משרדי ממשלה אחרים וגורמי חוץ עבור סעיפי חינוך.",
    formula: "ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "מבטא החזרי שכר והשתתפויות בפועל המדווחות בדוח הכספי של הרשות."
  },
  "own_revenue_1805_tk": {
    label: "סך הכנסות עצמיות (קוד 1805)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "טופס 2 (דוח ביצוע תקציב רגיל - הכנסות)",
    sourceField: "קוד סעיף תקציבי 1805 — 'הכנסות עצמיות: תקבולים - ביצוע'",
    sourceKeys: ["moin_2024"],
    calculation: "סך ההכנסות שנגבו ישירות ע\"י הרשות (ארנונה, אגרות, היטלים, דמי שימוש ונכסים).",
    formula: "ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "מבטא גבייה בפועל בתקציב הרגיל בשנת הדוח."
  },
  "arnona_other_4146_tk": {
    label: "ארנונה אחרת / שאינה למגורים (קוד 4146)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "נספח 2 לטופס 1 (דוח גביית ארנונה ומים)",
    sourceField: "שורה 'ארנונה אחרת', עמודה 'סהכ גביות בשנת הדוח', קוד 4146",
    sourceKeys: ["moin_2024"],
    calculation: "גביית ארנונה בפועל (שוטף ופיגורים) מנכסים שאינם למגורים (מסחר, תעשייה, משרדים, שירותים, מבני ציבור ועסקים).",
    formula: "ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "משקף גבייה בפועל באלפי ש\"ח ללא הערכות שווי מלאכותיות."
  },
  "arnona_total_4162_tk": {
    label: "סך גביית ארנונה כללית (קוד 4162)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "נספח 2 לטופס 1 (דוח גביית ארנונה ומים)",
    sourceField: "שורה 'סה\"כ ארנונה', קוד 4162 (זהות חשבונאית: 4138 + 4146 = 4162)",
    sourceKeys: ["moin_2024"],
    calculation: "סך כל גביית הארנונה ברשות (ארנונה למגורים + ארנונה אחרת).",
    formula: "ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "זהות חשבונאית אומתה ב-100% מכל 257 הרשויות המקומיות."
  },
  "balancing_grant_1819_tk": {
    label: "מענק איזון כללי (קוד 1819)",
    tier: "1_OFFICIAL",
    category: "OFFICIAL_DATA",
    categoryLabel: "🟢 1. נתון מקור רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "טופס 2 (דוח ביצוע תקציב רגיל - הכנסות)",
    sourceField: "שורה 'מענק כללי / מענק איזון', קוד 1819 / 43150",
    sourceKeys: ["moin_2024"],
    calculation: "סכום מענק האיזון שהועבר לרשות ממשרד הפנים לצמצום הפער התקציבי הכללי.",
    formula: "ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "198 רשויות זכאיות למענק איזון; 59 רשויות עצמאיות מקבלות 0 ש\"ח."
  },
  "education_net_difference_tk": {
    label: "השתתפות עצמית נטו של הרשות בחינוך (מימון עצמי)",
    tier: "2_CALCULATED",
    category: "CALCULATED_METRIC",
    categoryLabel: "🔵 2. נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "נגזר מדוחות כספיים מבוקרים 2024 (משרד הפנים)",
    sourceDoc: "טופס 2 ופרק 6 — הפרש סעיפים מבוקרים",
    sourceField: "הפרש בין סעיף 1486 לסעיף 1384",
    sourceKeys: ["moin_2024"],
    calculation: "הפחתת תקבולי משרד החינוך (1384) מסך הוצאות החינוך הכוללות (1486). זהו הסכום המדויק שמומן מקופתה העצמית של הרשות (מארנונה ומקורות עצמיים).",
    formula: "השתתפות עצמית נטו (אלפי ₪) = הוצאות חינוך (1486) - תקבולי חינוך (1384)",
    limitations: "ערך זה מייצג השקעה מוניציפלית נטו מתוך תקציב הרשות בלבד."
  },
  "municipal_education_self_funding_rate": {
    label: "שיעור השתתפות עצמית בחינוך (%)",
    tier: "2_CALCULATED",
    category: "CALCULATED_METRIC",
    categoryLabel: "🔵 2. נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "נגזר מדוחות כספיים מבוקרים 2024 (משרד הפנים)",
    sourceDoc: "טופס 2 ופרק 6 — יחס תקציבי",
    sourceField: "חישוב מנה: (השתתפות עצמית נטו / הוצאות חינוך 1486) * 100",
    sourceKeys: ["moin_2024"],
    calculation: "אחוז ההוצאה שמומן ממקורותיה העצמיים של הרשות מתוך כלל תקציב החינוך המקומי שלה.",
    formula: "שיעור השתתפות עצמית (%) = [(1486 - 1384) / 1486] × 100",
    limitations: "ברשויות שבהן ההוצאה נמוכה מאוד, אחוז נמוך משקף תלות מוחלטת בהשתתפות ממשלתית."
  },
  "education_net_expenditure_per_capita_nis": {
    label: "הוצאה עצמית נטו לנפש בחינוך (₪/נפש)",
    tier: "2_CALCULATED",
    category: "CALCULATED_METRIC",
    categoryLabel: "🔵 2. נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "שקלול דוחות מבוקרים 2024 (משרד הפנים) עם מפקד אוכלוסין 2024 (הלמ\"ס)",
    sourceDoc: "פרק 6 (דוחות כספיים) + למ\"ס (p_libud_24.xlsx)",
    sourceField: "השתתפות עצמית נטו כפול 1,000 מחולק באוכלוסייה רשמית 2024",
    sourceKeys: ["moin_2024", "cbs_socio_pop_2024"],
    calculation: "סך ההשתתפות העצמית נטו של הרשות בשקלים מחולק במספר תושבי הרשות (אוכלוסייה רשמית לסוף 2024).",
    formula: "הוצאה לנפש (₪) = [השתתפות עצמית נטו (אלפי ₪) × 1,000] / אוכלוסייה 2024",
    limitations: "מחושב לכלל תושבי הרשות (לנפש). מודד את ההשקעה המוניציפלית העצמית הממוצעת לתושב."
  },
  "own_revenue_share_pct": {
    label: "שיעור הכנסות עצמיות מתוך התקציב הרגיל (%)",
    tier: "2_CALCULATED",
    category: "CALCULATED_METRIC",
    categoryLabel: "🔵 2. נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "טופס 2 — דוח ביצוע תקציב רגיל (הכנסות)",
    sourceField: "יחס בין סעיף 1805 (הכנסות עצמיות) לסעיף 4162 / 40814 (סך הכנסות)",
    sourceKeys: ["moin_2024"],
    calculation: "מדד העצמאות והאיתנות הפיסקלית של הרשות: אחוז ההכנסות מארנונה, אגרות והיטלים מתוך סך התקציב.",
    formula: "שיעור הכנסות עצמיות (%) = [סך הכנסות עצמיות (1805) / סך כל הכנסות הרשות (4162)] × 100",
    limitations: "רשויות עם אזורי תעשייה ומסחר גדולים נהנות משיעור גבוה במיוחד (חציון ארצי 45.2%, אחוזון 80 עומד על 64.61%)."
  },
  "empirical_p80_threshold": {
    label: "סף אחוזון 80 של הכנסות עצמיות (P80 Threshold)",
    tier: "2_CALCULATED",
    category: "CALCULATED_METRIC",
    categoryLabel: "🔵 2. נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "גזירה סטטיסטית אמפירית מתוך מאגר 257 הרשויות (משרד הפנים 2024)",
    sourceDoc: "התפלגות own_revenue_share_pct בכל 257 רשויות ישראל",
    sourceField: "P80(own_revenue_share_pct) = 64.61%",
    sourceKeys: ["moin_2024"],
    calculation: "הסף האמפירי שמעליו נמצאות בדיוק 20% מהרשויות בעלות העצמאות הפיסקלית הגבוהה ביותר בישראל (P80 = 64.61%).",
    formula: "P80 = אחוזון 80 מתוך מערך ממוין של 257 ערכי own_revenue_share_pct",
    limitations: "נגזר אמפירית מהנתונים המבוקרים 2024; מתעדכן אוטומטית בהתאם למאגר השנתי."
  },
  "composite_need_score": {
    label: "ציון צורך משולב של הרשות (Composite Need)",
    tier: "3_POLICY",
    category: "POLICY_CHOICE",
    categoryLabel: "🟣 3. בחירת מדיניות של המודל",
    categoryColor: "#8b5cf6",
    sourceBody: "איגוד מנהלי אגפי ומחלקות החינוך — מודל מדיניות מוצע (Methodology v1.0)",
    sourceDoc: "מתודולוגיית תקצוב דיפרנציאלי מתקן v1.0",
    sourceField: "שקלול 50% סוציו (למ\"ס) + 30% פריפריה (למ\"ס) + 20% תלות פיסקלית (משרד הפנים)",
    sourceKeys: ["cbs_socio_pop_2024", "cbs_periphery_2020", "moin_2024"],
    calculation: "ציון מנורמל בטווח 0.0 עד 1.0 המבטא את מידת הצורך היחסי של הרשות במשאבי חינוך מתקנים.",
    formula: "CompositeNeed = (0.50 × SocioScore) + (0.30 × PeriScore) + (0.20 × FiscalDependency)\nכאשר:\n• SocioScore = (10 - אשכול למ\"ס) / 9\n• PeriScore = (10 - אשכול פריפריה) / 9\n• FiscalDependency = 1.0 - (שיעור הכנסות עצמיות / 100)",
    limitations: "משקולות 50/30/20 הן בחירת מדיניות נורמטיבית של המודל לצורך סימולציה, ולא הוראה ממשלתית מחייבת."
  },
  "fiscal_taper_mechanism": {
    label: "מנגנון ריסון פיסקלי (Fiscal Taper P80)",
    tier: "3_POLICY",
    category: "POLICY_CHOICE",
    categoryLabel: "🟣 3. בחירת מדיניות של המודל",
    categoryColor: "#8b5cf6",
    sourceBody: "איגוד מנהלי החינוך — כיול מתודולוגי v1.0",
    sourceDoc: "מנגנון ריסון לינארי רציף לרשויות עשירות פיסקלית",
    sourceField: "TaperFactor(own_revenue_share_pct)",
    sourceKeys: ["moin_2024", "cbs_socio_pop_2024"],
    calculation: "20% מהרשויות בעלות שיעור ההכנסות העצמיות הגבוה ביותר (מעל P80 = 64.61%) מקבלות הפחתה הדרגתית במענק המוצע. ככל שהעצמאות הפיסקלית גבוהה יותר, ההפחתה גדלה. ההפחתה רציפה ואינה מבטלת לחלוטין את ההכרה בצרכים החברתיים והגאוגרפיים (רצפת 10%). אין אינטראקציית פיסקלי-פריפריה.",
    formula: "עבור הכנסות עצמיות <= P80 (64.61%): TaperFactor = 1.0\nעבור הכנסות עצמיות > P80: TaperFactor = 1.0 - (1.0 - 0.10) × [(הכנסות עצמיות - 64.61) / (100 - 64.61)]",
    limitations: "P80 נגזר אמפירית מנתוני 2024; רצפת 10% (Floor) היא בחירת מדיניות של המודל להבטחת רציפות והכרה בצרכים בסיסיים."
  },
  "simulated_grant_per_capita": {
    label: "מענק מוצע בתרחיש הסימולציה לנפש (₪/נפש)",
    tier: "4_SIMULATION",
    category: "SIMULATION_OUTPUT",
    categoryLabel: "🟠 4. תוצאת סימולציה",
    categoryColor: "#f59e0b",
    sourceBody: "מנוע סימולציית הקצאה מתקנת (EducationSimulator v1.0)",
    sourceDoc: "תרחיש סל תקציב מתקן מוצע (ברירת מחדל: 1 מיליארד ₪)",
    sourceField: "הקצאה יחסית מתוך סל התקציב",
    sourceKeys: ["moin_2024", "cbs_socio_pop_2024", "cbs_periphery_2020"],
    calculation: "סכום המענק שהרשות הייתה מקבלת אילו הופעל מודל ההקצאה המוצע ע\"י האיגוד (מעריך לינארי 1.0 עם טייפר P80).",
    formula: "ציון הרשות = אוכלוסייה × (CompositeNeed × TaperFactor)\nמענק לרשות (₪) = סל התקציב × [ציון הרשות / סך כל ציוני הרשויות בארץ]\nמענק לנפש (₪) = מענק לרשות / אוכלוסייה",
    limitations: "זוהי סימולציה היפותטית של תרחיש מדיניות מוצע! אין מדובר בתקציב שהוקצה בפועל ע\"י הממשלה."
  },
  "gini_coefficient": {
    label: "מדד ג'יני לאי-שוויון בהוצאה העצמית בחינוך",
    tier: "2_CALCULATED",
    category: "CALCULATED_METRIC",
    categoryLabel: "🔵 2. נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "חישוב סטטיסטי משוקלל אוכלוסייה מתוך דוחות משרד הפנים והלמ\"ס",
    sourceDoc: "עקומת לורנץ של התפלגות ההוצאה העצמית נטו לנפש",
    sourceField: "אינטגרציית עקומת לורנץ לפי אוכלוסיית 257 הרשויות",
    sourceKeys: ["moin_2024", "cbs_socio_pop_2024"],
    calculation: "מדד סטטיסטי תקני (0 עד 1) המודד את רמת הריכוזיות ואי-השוויון בהוצאה העצמית נטו לנפש של הרשויות המקומיות בישראל.",
    formula: "G = 1 - 2 × שטח מתחת לעקומת לורנץ המשוקללת באוכלוסייה",
    limitations: "מודד אך ורק אי-שוויון בהוצאה העצמית של הרשויות (מתקציבן המקומי); אינו מודד את כלל אי-השוויון במערכת החינוך."
  }
};

window.DataTraceabilityEngine = {
  // Generates HTML for Single or Multi-source Drive links
  renderSourcesDriveBox: function(sourceKeys) {
    if (!sourceKeys || sourceKeys.length === 0) return '';
    const sources = sourceKeys.map(k => window.DRIVE_SOURCES[k]).filter(Boolean);
    if (sources.length === 0) return '';

    const isMulti = sources.length > 1;
    const title = isMulti ? '📎 קובצי המקור ששימשו לניתוח:' : '📎 קובץ המקור ששימש לניתוח:';

    const linksHtml = sources.map(s => `
      <a href="${s.driveUrl}" target="_blank" rel="noopener noreferrer" class="source-drive-link" title="פתיחת הקובץ המקורי לצפייה ב-Google Drive">
        📊 ${s.shortTitle} (<code>${s.fileName}</code>) ↗
      </a>
    `).join('');

    return `
      <div class="source-drive-box">
        <div class="source-drive-title">${title}</div>
        <div class="source-drive-links">${linksHtml}</div>
      </div>
    `;
  },

  // Shows modal dialog explaining "איך חושב?" with verified Drive link(s)
  showTraceabilityModal: function(varKey) {
    const info = window.DataTraceabilityDictionary[varKey];
    if (!info) {
      console.warn("Traceability key not found:", varKey);
      return;
    }

    let modal = document.getElementById("traceabilityModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "traceabilityModal";
      modal.className = "trace-modal-backdrop";
      document.body.appendChild(modal);
    }

    const driveLinksBox = this.renderSourcesDriveBox(info.sourceKeys || []);

    modal.innerHTML = `
      <div class="trace-modal-dialog">
        <div class="trace-modal-header">
          <div>
            <span class="trace-tag" style="background:${info.categoryColor}20; color:${info.categoryColor}; border: 1px solid ${info.categoryColor}40;">
              ${info.categoryLabel}
            </span>
            <h3 class="trace-modal-title">${info.label}</h3>
          </div>
          <button class="trace-modal-close" onclick="document.getElementById('traceabilityModal').style.display='none'">&times;</button>
        </div>
        
        <div class="trace-modal-body">
          <div class="trace-row">
            <span class="trace-label">🏛️ גוף מקור רשמי:</span>
            <span class="trace-val font-bold">${info.sourceBody}</span>
          </div>
          <div class="trace-row">
            <span class="trace-label">📄 מסמך / קובץ מקור:</span>
            <span class="trace-val">${info.sourceDoc}</span>
          </div>
          <div class="trace-row">
            <span class="trace-label">🔍 שדה / קוד סעיף:</span>
            <span class="trace-val font-mono">${info.sourceField}</span>
          </div>

          ${driveLinksBox}
          
          <div class="trace-box" style="margin-top:14px;">
            <div class="trace-box-title">📐 שיטת החישוב והגזירה:</div>
            <p style="margin:0 0 8px 0; font-size:14px; line-height:1.5;">${info.calculation}</p>
            <div class="trace-formula font-mono">${info.formula.replace(/\n/g, '<br>')}</div>
          </div>

          <div class="trace-box trace-box-alert" style="margin-top:12px;">
            <div class="trace-box-title">⚠️ מגבלות ודגשי מתודולוגיה:</div>
            <p style="margin:0; font-size:13px; color:#991b1b; line-height:1.4;">${info.limitations}</p>
          </div>
        </div>

        <div class="trace-modal-footer">
          <span style="font-size:12px; color:var(--text-muted);">${window.METHODOLOGY_VERSION}</span>
          <button class="btn btn-secondary" onclick="document.getElementById('traceabilityModal').style.display='none'">סגור חלונית</button>
        </div>
      </div>
    `;

    modal.style.display = "flex";
  },

  // Renders the full Methodology & Sources Tab
  renderMethodologyTab: function(containerEl) {
    if (typeof containerEl === 'string') {
      containerEl = document.getElementById(containerEl);
    }
    if (!containerEl) return;

    let sourcesHtml = window.OfficialSourcesCatalog.map(s => `
      <div class="source-card">
        <div class="source-header">
          <div class="source-title">${s.name}</div>
          <span class="source-badge">מאומת 100%</span>
        </div>
        <div class="source-meta">
          <div><strong>גוף מפרסם:</strong> ${s.publisher}</div>
          <div><strong>שנת נתונים:</strong> ${s.dataYear}</div>
          <div><strong>קובץ בפרויקט:</strong> <code class="font-mono">${s.fileName}</code></div>
          <div style="margin-top: 6px;">
            <strong>קישור לקובץ המקור:</strong> 
            <a href="${s.driveUrl}" target="_blank" rel="noopener noreferrer" class="source-drive-link" style="margin-top: 4px;">
              📎 פתיחת קובץ המקור ב-Google Drive ↗
            </a>
            ${s.officialUrl ? `<a href="${s.officialUrl}" target="_blank" rel="noopener noreferrer" class="source-official-link">🌐 אתר הגוף המפרסם ↗</a>` : ''}
          </div>
        </div>
        <div class="source-vars">
          <strong>משתנים שנלקחו מהמקור:</strong>
          <ul>
            ${s.variables.map(v => `<li>${v}</li>`).join('')}
          </ul>
        </div>
        <div class="source-notes">📌 ${s.notes}</div>
      </div>
    `).join('');

    containerEl.innerHTML = `
      <div class="methodology-container">
        <!-- Banner -->
        <div class="card methodology-banner">
          <div class="methodology-badge">🛡️ שקיפות מלאה ועקיבות נתונים (Data Provenance)</div>
          <h2 style="margin: 8px 0; font-size: 24px; color: var(--text-main);">מתודולוגיה, מקורות ושיטת החישוב</h2>
          <div style="font-size: 14px; color: var(--text-muted);">
            גרסה פעילה: <strong>${window.METHODOLOGY_VERSION}</strong> | בסיס נתונים: דוחות כספיים מבוקרים 2024 (משרד הפנים והלמ"ס)
          </div>
          <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.6; color: var(--text-main);">
            מערכת זו פועלת על פי סטנדרט מדעי קפדני של שקיפות מלאה. כל נתון מוצג מקושר ישירות לקובץ המקור המדויק ב-Google Drive ששימש לבנייתו, וכל נוסחה או הנחת מדיניות מפורטת בשפה גלויה וברורה על פי 4 שכבות השקיפות.
          </p>
        </div>

        <!-- 4-Tier Taxonomy Guide -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">1. סיווג 4 השכבות של המערכת (Transparency Taxonomy)</h3>
          <p class="card-subtitle">הבחנה חזותית ומושגית קשיחה למניעת הטעיה בין עובדות לתרחישים:</p>
          
          <div class="taxonomy-grid">
            <div class="taxonomy-card" style="border-top: 4px solid #10b981;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 1. נתוני מקור רשמיים (Official Data)</span>
              </div>
              <p>נתון גולמי שנלקח ישירות ממקור ממשלתי/סטטיסטי מוסמך (משרד הפנים או הלמ"ס) ללא כל עיבוד או שינוי.</p>
              <div class="tax-example">למשל: סעיף הוצאות 1486, סעיף תקבולים 1384, אשכול למ"ס 2021, אוכלוסייה רשמית 2024.</div>
            </div>

            <div class="taxonomy-card" style="border-top: 4px solid #2563eb;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8;">🔵 2. נתונים מחושבים (Calculated Metrics)</span>
              </div>
              <p>אינדיקטור שנגזר מתמטית מנתוני המקור המבוקרים על פי הגדרה חשבונאית או סטטיסטית מקובלת.</p>
              <div class="tax-example">למשל: מימון עצמי נטו (1486-1384), שיעור השתתפות עצמית (%), מדד ג'יני, סף אחוזון P80 (64.61%).</div>
            </div>

            <div class="taxonomy-card" style="border-top: 4px solid #8b5cf6;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#8b5cf620; color:#6d28d9;">🟣 3. בחירות מדיניות של המודל (Policy Choices)</span>
              </div>
              <p>פרמטר שנקבע כבחירת מדיניות נורמטיבית או כיול מודליסטי של האיגוד, ולא כנוסחה מחייבת בחוק.</p>
              <div class="tax-example">למשל: משקולות 50/30/20, מעריך פרוגרסיביות לינארי 1.0, רצפת טייפר 10% (Floor), שלילת אינטראקציית פיסקלי-פריפריה.</div>
            </div>

            <div class="taxonomy-card" style="border-top: 4px solid #f59e0b;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#f59e0b20; color:#b45309;">🟠 4. תוצאות סימולציה (Simulation Outputs)</span>
              </div>
              <p>תוצאה היפותטית המייצגת מה היה מתרחש אילו הופעל מודל ההקצאה המתקן המוצע ע\"י האיגוד.</p>
              <div class="tax-example">למשל: מענק מוצע לרשות, מענק מוצע לנפש (₪/נפש), הוצאה מדומה לאחר מענק.</div>
            </div>
          </div>
        </div>

        <!-- End-to-End Pipeline -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">2. שרשרת עיבוד הנתונים מקצה לקצה (Data Pipeline)</h3>
          <div class="pipeline-steps">
            <div class="pipeline-step">
              <div class="step-num">1</div>
              <div class="step-title">איסוף מקורות גלם</div>
              <div class="step-desc">דוחות כספיים מבוקרים 2024 (משרד הפנים) + קובצי למ"ס רשמיים (חברתי-כלכלי, אוכלוסייה ופריפריאליות).</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">2</div>
              <div class="step-title">טיוב ואימות נתונים</div>
              <div class="step-desc">מיפוי שמות רשויות, הצלבת סמלי למ"ס ומשרד הפנים, טיפול ברשויות מלחמה ופינוי (2024).</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">3</div>
              <div class="step-title">מאגר 257 הרשויות המאומת</div>
              <div class="step-desc">קובץ אב אחיד (<code class="font-mono">education_equity_master.json</code>) ללא נתון סינתטי בודד.</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">4</div>
              <div class="step-title">גזירת ספים אמפיריים ומדדים</div>
              <div class="step-desc">חישוב מדד ג'יני משוקלל אוכלוסייה, יחס פער אשכולות, וגזירת סף P80 האמפירי להכנסות עצמיות (64.61%).</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">5</div>
              <div class="step-title">מנוע הסימולציה המתקן v1.0</div>
              <div class="step-desc">חישוב ציון צורך משולב (מעריך 1.0), הפעלת טייפר P80 רציף, והקצאת מענק מוצע לנפש (₪/נפש).</div>
            </div>
          </div>
        </div>

        <!-- Open Formulas Section -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">3. נוסחאות גלויות והסבר פרמטרים (Methodology v1.0)</h3>
          
          <div class="formula-block">
            <div class="formula-header">
              <span class="font-bold">נוסחה 1: שיעור ההשתתפות העצמית של הרשות בחינוך</span>
              <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8;">🔵 2. נתון מחושב</span>
            </div>
            <div class="formula-code font-mono">
              שיעור השתתפות עצמית (%) = [(הוצאות חינוך 1486 - תקבולי חינוך 1384) / הוצאות חינוך 1486] × 100
            </div>
            <p class="formula-expl">
              מבטא איזה חלק מתקציב החינוך השנתי של הרשות ממומן ישירות מקופתה (מארנונה ומקורות עצמיים), מעבר להשתתפות משרד החינוך.
            </p>
          </div>

          <div class="formula-block" style="margin-top:12px;">
            <div class="formula-header">
              <span class="font-bold">נוסחה 2: ציון הצורך המשולב (Composite Need Score)</span>
              <span class="tax-tag" style="background:#8b5cf620; color:#6d28d9;">🟣 3. בחירת מדיניות של המודל</span>
            </div>
            <div class="formula-code font-mono">
              CompositeNeed = (0.50 × SocioScore) + (0.30 × PeriScore) + (0.20 × FiscalDependency)
            </div>
            <div class="formula-expl">
              רכיבי המודל המנורמלים (סולם 0.0 עד 1.0):
              <ul>
                <li><strong>SocioScore (צורך חברתי-כלכלי):</strong> <code class="font-mono">(10 - אשכול למ"ס) / 9</code> — נע בין 0.0 (אשכול 10) ל-1.0 (אשכול 1).</li>
                <li><strong>PeriScore (צורך פריפריאלי):</strong> <code class="font-mono">(10 - אשכול פריפריה) / 9</code> — נע בין 0.0 (מרכז מובהק) ל-1.0 (פריפריה עמוקה).</li>
                <li><strong>FiscalDependency (תלות פיסקלית):</strong> <code class="font-mono">1.0 - (שיעור הכנסות עצמיות / 100)</code> — נע בין 0.0 (100% עצמאות) ל-1.0 (0% עצמאות).</li>
              </ul>
              <em>הערת שקיפות: משקולות 50/30/20 הן בחירת מדיניות נורמטיבית של המודל. אין אינטראקציית פיסקלי-פריפריה.</em>
            </div>
          </div>

          <div class="formula-block" style="margin-top:12px;">
            <div class="formula-header">
              <span class="font-bold">נוסחה 3: מנגנון ריסון פיסקלי אמפירי (Fiscal Taper P80)</span>
              <span class="tax-tag" style="background:#8b5cf620; color:#6d28d9;">🔵 סף אמפירי + 🟣 בחירת מדיניות</span>
            </div>
            <div class="formula-code font-mono">
              עבור הכנסות עצמיות &le; P80 (64.61%): TaperFactor = 1.0<br>
              עבור הכנסות עצמיות &gt; P80 (64.61%): TaperFactor = 1.0 - (1.0 - 0.10) × [(הכנסות עצמיות - 64.61) / (100 - 64.61)]
            </div>
            <p class="formula-expl" style="margin-top: 8px; line-height: 1.6;">
              <strong>הסבר פשוט:</strong> 20% מהרשויות בעלות שיעור ההכנסות העצמיות הגבוה ביותר מקבלות הפחתה הדרגתית במענק המוצע. ככל שהעצמאות הפיסקלית גבוהה יותר, ההפחתה גדלה. ההפחתה רציפה ואינה מבטלת לחלוטין את ההכרה בצרכים החברתיים והגאוגרפיים.<br>
              <em>דגשי שקיפות:</em>
              <br>• <strong>סף P80 (64.61%):</strong> מבוסס על ההתפלגות האמפירית המדויקת של 257 הרשויות בישראל בשנת 2024.
              <br>• <strong>רצפת 10% (Floor):</strong> בחירת מדיניות של המודל (ולא תוצאה סטטיסטית או הוראה ממשלתית), שנועדה למנוע מדרגות ולאפשר מענק בסיסי מזערי לכל תושב בישראל.
            </p>
          </div>

          <div class="formula-block" style="margin-top:12px;">
            <div class="formula-header">
              <span class="font-bold">נוסחה 4: מענק מוצע בתרחיש הסימולציה מתוך סל התקציב (מעריך לינארי 1.0)</span>
              <span class="tax-tag" style="background:#f59e0b20; color:#b45309;">🟠 4. תוצאת סימולציה</span>
            </div>
            <div class="formula-code font-mono">
              ציון משוקלל לרשות = אוכלוסייה × (CompositeNeed × TaperFactor)<br>
              מענק מוצע לרשות (₪) = סל התקציב (₪) × [ציון הרשות / סך כל ציוני הרשויות בארץ]<br>
              מענק מוצע לנפש (₪/נפש) = מענק מוצע לרשות / אוכלוסייה
            </div>
            <p class="formula-expl">
              <em>הערת שקיפות: במתודולוגיה v1.0 המודל הינו לינארי רציף (מעריך 1.0), דבר המבטיח הקצאה שקופה, יציבה והיעדר עיוותי מדרגות.</em>
            </p>
          </div>
        </div>

        <!-- Version History / Changelog -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">4. היסטוריית גרסאות מתודולוגיה (Methodology Versioning)</h3>
          <div style="font-size: 13.5px; line-height: 1.6;">
            <div style="border-right: 3px solid var(--primary); padding-right: 12px; margin-bottom: 12px;">
              <div style="font-weight: 700; color: var(--primary);">Methodology v1.0 — Baseline 2024 (גרסה פעילה רשמית - ספטמבר 2026)</div>
              <ul style="margin: 4px 0 0 0; padding-right: 20px;">
                <li><strong>מעבר למודל לינארי רציף:</strong> מעריך פרוגרסיביות שונה מ-1.4 ל-1.0 למניעת רגישות יתר ועיוותי קצה.</li>
                <li><strong>שילוב מנגנון ריסון פיסקלי אמפירי (P80 Fiscal Taper):</strong> הפחתה רציפה לרשויות מעל אחוזון 80 של הכנסות עצמיות (64.61%) עד רצפת 10%. פותר את עיוות תמר ורשויות עשירות בפריפריה.</li>
                <li><strong>שלילת אינטראקציית פיסקלי-פריפריה:</strong> שמירה על מודל חיבורי שקוף ופשוט ללא כפל משתנים שרירותי.</li>
                <li><strong>סיווג שקיפות ב-4 שכבות קשיחות:</strong> הפרדה מלאה בין נתוני מקור רשמיים, נתונים מחושבים, בחירות מדיניות ותוצאות סימולציה.</li>
                <li><strong>דיוק טרמינולוגי:</strong> הגדרה עקבית ומדויקת של כלל המענקים כ\"מענק מוצע לנפש\" (₪/נפש) על בסיס אוכלוסיית הרשות.</li>
              </ul>
            </div>
            <div style="border-right: 3px solid var(--text-muted); padding-right: 12px; opacity: 0.8;">
              <div style="font-weight: 700; color: var(--text-muted);">Methodology v0.9 — Draft / Baseline 2024 (טיוטה ראשונית)</div>
              <ul style="margin: 4px 0 0 0; padding-right: 20px; color: var(--text-muted);">
                <li>נוסחת צורך 50/30/20 עם מעריך פרוגרסיביות 1.4 וללא מנגנון טייפר פיסקלי. הוחלפה ב-v1.0.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Official Sources Catalog -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">5. קטלוג מקורות רשמיים וקובצי נתונים ב-Google Drive (Verified Source Catalog)</h3>
          <p class="card-subtitle">שלושת קובצי המקור המאומתים ששימשו בפועל לבניית מאגר 257 הרשויות זמינים לצפייה ישירה:</p>
          <div class="sources-list" style="margin-top: 12px;">
            ${sourcesHtml}
          </div>
        </div>
      </div>
    `;
  }
};
