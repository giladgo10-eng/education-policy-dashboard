/**
 * askEngine.js — מנוע שאילתות וסינתזה מחקרית (Ask the Research Synthesis Engine)
 * Education Policy Dashboard 2026 — Client-Side Grounded RAG & Analytical Synthesis Engine
 * 
 * Core Capabilities:
 * 1. Natural Language Intent & Entity Classification (Comparisons, Summaries, Execution Tests, Budgets, Thematic Queries).
 * 2. Grounded Multi-Source Synthesis (2-4 analytical paragraphs, key takeaways, limitations, without external LLM/hallucinations).
 * 3. Exact Evidence Assembly (Clause cards, comparison items, execution records with specific Drive links).
 * 4. Human-Readable Metadata (Zero technical IDs shown to user).
 */

(function(window) {
  'use strict';

  const DRIVE_PLATFORMS_FOLDER_URL = "https://drive.google.com/drive/folders/1PvVXkV2KIxscPrIxE57-L1T_dF-0UxfM";
  const DRIVE_COALITION_FOLDER_URL = "https://drive.google.com/drive/folders/1GcfQe69kVhqQKPnAUwzIoE0TsrmN3l8_";
  const DRIVE_UNION_FOLDER_URL = "https://drive.google.com/drive/folders/19ScYmoBNpvxFndPh5sNQElzhNN42Im05?usp=sharing";

  const PLATFORM_DOC_MAP = {
    "ביחד": {
      url: "https://drive.google.com/file/d/1M_llcAkxPie446iaqDJKxPMGvKBy6xnV/view?usp=sharing",
      isPrimary: true,
      label: "תוכנית החינוך של ביחד",
      btnText: "📄 פתח את מסמך המקור ↗"
    },
    "ישר!": {
      url: "https://drive.google.com/file/d/1wsm1YEt5OVkLKWZ_o6D-S1ELH-pDvlK5/view?usp=sharing",
      isPrimary: true,
      label: "תוכנית החינוך של ישר! (גדי איזנקוט)",
      btnText: "📄 פתח את מסמך המקור ↗"
    },
    "הדמוקרטים": {
      url: "https://drive.google.com/file/d/1920qzJmHmqDXlXQq5ezKYfpYEivTUoed/view?usp=sharing",
      isPrimary: true,
      label: "תוכנית החינוך של הדמוקרטים (יאיר גולן)",
      btnText: "📄 פתח את מסמך המקור ↗"
    },
    "ישראל ביתנו": {
      url: "https://drive.google.com/file/d/1c0IHyot1UMBjvknFZdlKwr8a0ocul58X/view?usp=sharing",
      isPrimary: true,
      label: "מצע החינוך של ישראל ביתנו (אביגדור ליברמן)",
      btnText: "📄 פתח את מסמך המקור ↗"
    },
    "הציונות הדתית": {
      url: "https://drive.google.com/file/d/1dTvW2XLV3gdq7Qm_-fsM6BXth_Fmoz0k/view?usp=sharing",
      isPrimary: true,
      label: "פרק החינוך של הציונות הדתית",
      btnText: "📄 פתח את מסמך המקור ↗"
    },
        "רע״ם": {
      url: "https://drive.google.com/file/d/1kscIl_3H0ZqfoWKwt1SKfJMmFlcUWZ-O/view?usp=sharing",
      isPrimary: false,
      label: "עמדות החינוך של רע״ם (מסמך מחקר משני)",
      btnText: "📖 פתח את מסמך המחקר ↗"
    },
    "חד״ש–תע״ל": {
      url: "https://drive.google.com/file/d/1p1RzD-Z-wy6N_-vCdch_ffIHlp4Bkglm/view?usp=sharing",
      isPrimary: false,
      label: "ניתוח מצע החינוך של חד״ש–תע״ל (מחקר משני)",
      btnText: "📖 פתח את מסמך המחקר ↗"
    },
    "איגוד מנהלי אגפי החינוך": {
      url: "https://drive.google.com/drive/folders/19ScYmoBNpvxFndPh5sNQElzhNN42Im05?usp=sharing",
      isPrimary: true,
      label: "ארכיון עמדות ומסמכי איגוד מנהלי אגפי החינוך ב-Drive",
      btnText: "📂 פתח את ארכיון המקורות ב־Drive ↗"
    }
  };

  function getPlatformDocInfo(entity) {
    if (!entity) return null;
    for (const [k, v] of Object.entries(PLATFORM_DOC_MAP)) {
      if (entity.includes(k) || k.includes(entity)) {
        return v;
      }
    }
    return {
      url: DRIVE_PLATFORMS_FOLDER_URL,
      isPrimary: true,
      label: "תוכנית החינוך של " + entity,
      btnText: "📄 פתח את מסמך המקור ↗"
    };
  }

  const HUMAN_SOURCE_TITLES = {
    "KB-COAL-LIKUD-SHAS-PDF": "הסכם הליכוד–ש״ס",
    "KB-COAL-LIKUD-UTJ-PDF": "הסכם הליכוד–יהדות התורה",
    "KB-COAL-LIKUD-AGUDAT-ISRAEL-PDF": "נספח הליכוד–אגודת ישראל",
    "KB-COAL-LIKUD-UTJ-APPENDIX-PDF": "נספח הליכוד–אגודת ישראל",
    "KB-COAL-LIKUD-RZ-PDF": "הסכם הליכוד–הציונות הדתית",
    "KB-COAL-LIKUD-OTZMA-PDF": "הסכם הליכוד–עוצמה יהודית",
    "KB-COAL-LIKUD-OZMA-PDF": "הסכם הליכוד–עוצמה יהודית",
    "KB-COAL-LIKUD-NOAM-PDF": "הסכם הליכוד–סיעת נעם",
    "KB-COAL-LIKUD-YAMIN-MAMLACHTI-PDF": "הסכם הליכוד–הימין הממלכתי",
    "KB-COAL-LIKUD-YAMINST-PDF": "הסכם הליכוד–הימין הממלכתי",
    "SRC-LIKUD-SHAS-2022": "הסכם הליכוד–ש״ס",
    "SRC-LIKUD-UTJ-2022": "הסכם הליכוד–יהדות התורה",
    "SRC-LIKUD-RZ-2022": "הסכם הליכוד–הציונות הדתית",
    "SRC-LIKUD-OZMA-2022": "הסכם הליכוד–עוצמה יהודית",
    "SRC-LIKUD-NOAM-2022": "הסכם הליכוד–סיעת נעם",
    "KB-PLT-BENNETT-2026-PDF": "תוכנית החינוך של ביחד (נפתלי בנט)",
    "KB-PLT-BENNETT-2026-DOCX": "תוכנית החינוך של ביחד (נפתלי בנט)",
    "KB-PLT-YASHAR-2026-PDF": "תוכנית החינוך של ישר! (גדי איזנקוט)",
    "KB-PLT-YASHAR-2026-DOCX": "תוכנית החינוך של ישר! (גדי איזנקוט)",
    "KB-PLT-DEMOCRATS-PLAN-PDF": "תוכנית החינוך של הדמוקרטים (יאיר גולן)",
    "KB-PLT-DEMOCRATS-PLAN-DOCX": "תוכנית החינוך של הדמוקרטים (יאיר גולן)",
    "KB-PLT-BEYTENU-2026-PDF": "תוכנית החינוך של ישראל ביתנו (אביגדור ליברמן)",
    "KB-PLT-YESHATID-2022": "מצע החינוך של יש עתיד (יאיר לפיד)",
    "KB-PLT-YESHATID-HISTORIC-2013": "מצע יש עתיד ההיסטורי (2013)",
    "KB-SUP-RAAM-PDF": "עמדות החינוך של רע״ם",
    "KB-SUP-RAAM-DOCX": "עמדות החינוך של רע״ם",
    "KB-SUP-HADASH-ANALYSIS-PDF": "עמדות החינוך של חד״ש–תע״ל",
    "KB-SUP-HADASH-ANALYSIS-DOCX": "עמדות החינוך של חד״ש–תע״ל",
    "KB-SUP-HADASH-PLATFORM-2022": "מצע חד״ש–תע״ל הרשמי",
    "KB-BUD-MOE-EXEC-2024": "דוח ביצוע תקציב משרד החינוך 2024 (חשכ״ל / משרד האוצר)",
    "KB-BUD-MOE-MAIN-2025": "עיקרי תקציב משרד החינוך לשנת 2025",
    "KB-OFF-GEFEN-2026": "הנחיות תוכנית גפ״ן תשפ״ו (משרד החינוך)",
    "KB-RES-COALITION-STUDY-DOCX": "דוח הערכת מדיניות החינוך של מפלגות הקואליציה",
    "KB-RES-OPPOSITION-STUDY-DOCX": "דוח הערכת מצעי מפלגות האופוזיציה",
    "SRC-UNION-2012-TRACHTENBERG-POS": "נייר עמדה משותף איגוד–מש״מ (טרכטנברג, 2012)",
    "SRC-UNION-2015-KAMINSKY-REFORM": "הרצאת אבי קמינסקי במכון ון ליר: נדרשת רפורמה (2015)",
    "SRC-UNION-2019-KAMINSKY-TIMELINE": "סקירה היסטורית: מקום הרשות במערכת החינוך (קמינסקי, 2019)",
    "SRC-UNION-2019-CALL-PARTIES-0TO3": "פניית האיגוד למפלגות: רצף חינוכי מלידה (2019)",
    "SRC-UNION-2019-KAMINSKY-PYRAMID": "היפוך הפירמידה החינוכית מלידה עד 3 (קמינסקי, 2019)",
    "SRC-UNION-2019-HOCHMAN-EARLY": "דוח מומחה: החינוך בגיל הרך לידה עד 3 (רמי הוכמן, 2019)",
    "SRC-UNION-2020-KAMINSKY-FORMAL-INFORMAL": "חיבור החינוך הפורמלי והבלתי פורמלי (קמינסקי, 2020)",
    "SRC-UNION-2021-CORONA-OPP": "הזדמנויות תקופת הקורונה בחינוך (הנהלת האיגוד, 2021)",
    "SRC-UNION-2021-CHINUCH-2030": "חינוך 2030: המלצות ליישום (הנהלת האיגוד, 2021)",
    "SRC-UNION-2026-SECURITY-NET-IMPACT": "רשת ביטחון חינוכית: דוח שנתי (שירלי קוטלר וגלעד גולדמן, 2026)",
    "SRC-UNION-2026-SYNTHESIS-STUDY": "מהשטח למדיניות: חקר עמדות והשפעת האיגוד (גלעד גולדמן, 2026)"
  };

  function getHumanSourceTitle(sid) {
    if (!sid) return "מקור רשמי מאומת";
    if (HUMAN_SOURCE_TITLES[sid]) return HUMAN_SOURCE_TITLES[sid];
    return "מסמך מקור מאומת";
  }

  // Topic taxonomy & Hebrew keywords
  const TOPIC_CONFIG = {
    core_curriculum: {
      id: "core_curriculum",
      name: "לימודי ליבה ופיקוח",
      keywords: ["ליבה", "לימודי ליבה", "ליבה מלאה", "ליב\"ה", "ממ\"ח", "ממח", "מתמטיקה", "אנגלית", "מוסדות פטור", "פטור", "חרדי", "חרדים", "שלילת תקצוב", "התניה", "התניית תקציב", "מיצב", "מיצ\"ב", "pisa"]
    },
    teacher_wages_and_status: {
      id: "teacher_wages_and_status",
      name: "שכר מורים ומעמד עובדי הוראה",
      keywords: ["מורה", "מורים", "מורות", "שכר", "מעמד המורה", "שכר מורה", "שכר מורים", "מורה מתחיל", "10,000", "10000", "12,000", "12000", "25,000", "25000", "שכר מנהל", "מנהלים", "הסכמי שכר", "אופק חדש", "עוז לתמורה", "סעיף 167", "חוזים אישיים", "דור ב", "סייעות", "גננות", "פסיכולוגים"]
    },
    governance_and_autonomy: {
      id: "governance_and_autonomy",
      name: "משילות, ביזור סמכויות וניהול עצמי",
      keywords: ["סמכויות", "רשויות", "רשות מקומית", "רשויות מקומיות", "שלטון מקומי", "מועצה לאומית", "ביזור", "אוטונומיה", "ניהול עצמי", "סל גמיש", "סנכרון חופשות", "חופשות", "לוח חופשות", "גיוס ופיטורין", "אשכולות", "רישוי"]
    },
    early_childhood: {
      id: "early_childhood",
      name: "הגיל הרך (0–3)",
      keywords: ["0-3", "0–3", "גיל הרך", "הגיל הרך", "פעוטות", "מעונות", "מעונות יום", "חינוך חינם מגיל 0", "חינם 0-3", "נקודות זיכוי", "מס הכנסה", "סבסוד מעונות", "סבסוד אברכים"]
    },
    differential_budget: {
      id: "differential_budget",
      name: "תקצוב דיפרנציאלי ושוויון",
      keywords: ["תקצוב דיפרנציאלי", "דיפרנציאלי", "שוויון", "פערים", "טיפוח", "מדד טיפוח", "סל שעות", "הסעות", "מאצינג", "מצ'ינג", "פריפריה", "בינוי כיתות"]
    },
    special_education: {
      id: "special_education",
      name: "חינוך מיוחד והסעות",
      keywords: ["חינוך מיוחד", "חנ\"מ", "חנמ", "שילוב", "סייעות שילוב", "הסעות", "מאצינג חנ\"מ"]
    },
    jewish_identity_gefen: {
      id: "jewish_identity_gefen",
      name: "זהות יהודית, גפ״ן ותוכניות חיצוניות",
      keywords: ["זהות יהודית", "זהות לאומית", "אבי מעוז", "נעם", "נועם", "גפן", "גפ\"ן", "תוכניות חיצוניות", "שקיפות הורים", "רשות לזהות"]
    },
    technology_and_ai: {
      id: "technology_and_ai",
      name: "חדשנות, בינה מלאכותית (AI) ומצוינות",
      keywords: ["ai", "בינה מלאכותית", "טכנולוגיה", "מצוינות", "stem", "מדעים", "סייבר", "חדשנות"]
    }
  };

  // Entity configuration & Aliases
  const ENTITY_CONFIG = {
    "ביחד": {
      aliases: ["ביחד", "בנט", "נפתלי בנט", "יש עתיד", "ביחד (בנט)", "ביחד - נפתלי בנט", "beyachad", "bennett"],
      shortName: "ביחד"
    },
    "ישר!": {
      aliases: ["ישר", "ישר!", "איזנקוט", "גדי איזנקוט", "yashar", "eisenkot"],
      shortName: "ישר! (איזנקוט)"
    },
    "הדמוקרטים": {
      aliases: ["הדמוקרטים", "דמוקרטים", "יאיר גולן", "גולן", "העבודה", "מרצ", "democrats"],
      shortName: "הדמוקרטים (גולן)"
    },
    "ישראל ביתנו": {
      aliases: ["ישראל ביתנו", "ליברמן", "אביגדור ליברמן", "yisrael beytenu", "liberman"],
      shortName: "ישראל ביתנו (ליברמן)"
    },
        "הליכוד": {
      aliases: ["הליכוד", "ליכוד", "נתניהו", "קיש", "יואב קיש", "likud", "netanyahu"],
      shortName: "הליכוד (נתניהו)"
    },
    "ש״ס": {
      aliases: ["שס", "ש\"ס", "ש״ס", "דרעי", "בני יוסף", "מעיין החינוך", "shas"],
      shortName: "ש״ס"
    },
    "יהדות התורה": {
      aliases: ["יהדות התורה", "גולדקנופף", "גפני", "החינוך העצמאי", "אגודת ישראל", "דגל התורה", "utj"],
      shortName: "יהדות התורה"
    },
    "הציונות הדתית": {
      aliases: ["הציונות הדתית", "ציונות דתית", "סמוטריץ", "סמוטריץ'", "חמ\"ד", "חמד", "דרוקמן", "religious zionism"],
      shortName: "הציונות הדתית (סמוטריץ')"
    },
    "עוצמה יהודית": {
      aliases: ["עוצמה יהודית", "בן גביר", "בן-גביר", "otzma yehudit", "ben gvir"],
      shortName: "עוצמה יהודית"
    },
    "נעם": {
      aliases: ["נעם", "נועם", "אבי מעוז", "מעוז", "noam"],
      shortName: "סיעת נעם (אבי מעוז)"
    },
    "הימין הממלכתי": {
      aliases: ["הימין הממלכתי", "גדעון סער", "סער"],
      shortName: "הימין הממלכתי (סער)"
    },
    "רע״ם": {
      aliases: ["רעם", "רע\"ם", "רע״ם", "עבאס", "מנסור עבאס", "raam"],
      shortName: "רע״ם"
    },
    "חד״ש–תע״ל": {
      aliases: ["חדש", "חד\"ש", "תעל", "תע\"ל", "חדש תעל", "חד״ש–תע״ל", "טיבי", "עודה", "hadash"],
      shortName: "חד״ש–תע״ל"
    },
    "איגוד מנהלי אגפי החינוך": {
      aliases: ["איגוד מנהלי החינוך", "איגוד מנהלי אגפי החינוך", "איגוד מנהלות", "איגוד", "קמינסקי", "אבי קמינסקי", "שירלי קוטלר", "קוטלר", "הנהגת אגפי החינוך", "רמי הוכמן", "הוכמן"],
      shortName: "איגוד מנהלי אגפי החינוך"
    }
  };

  const AUTHORITY_LABELS = {
    'A': 'עמדה רשמית של האיגוד',
    'B': 'ביטוי מוסדי / נייר עמדה',
    'C': 'קול הנהגה מקצועית',
    'D': 'מחקר / הערכת מדיניות',
    'E': 'תיעוד / פרסום מקצועי',
    'F': 'מקור משני'
  };

  const ALIGNMENT_LABELS = {
    'high_alignment': 'התאמה גבוהה',
    'partial_alignment': 'התאמה חלקית',
    'tension': 'פער/מתח מהותי',
    'contradiction': 'סתירה',
    'insufficient_evidence': 'אין מספיק מידע במצע'
  };

  const ALIGNMENT_CLASSES = {
    'high_alignment': 'alignment-high',
    'partial_alignment': 'alignment-partial',
    'tension': 'alignment-tension',
    'contradiction': 'alignment-contradiction',
    'insufficient_evidence': 'alignment-insufficient'
  };

  const SUBSCORE_LABELS = {
    'aligned': 'תואם',
    'partial': 'חלקי',
    'conflicting': 'מתנגש',
    'insufficient_evidence': 'לא צוין במצע'
  };

  function generateHumanAlignmentReason(c) {
    if (c.alignment === 'insufficient_evidence') {
      return 'המצע הרשמי של המפלגה אינו כולל התייחסות מפורשת לסוגיה זו (היעדר מידע במצע ולא עמדת התנגדות).';
    }
    
    const mechanism = c.mechanismAlignment;
    const municipal = c.municipalRoleAlignment;

    if (c.alignment === 'high_alignment') {
      let text = 'קיימת הסכמה מלאה על היעד המרכזי והעקרון הפדגוגי';
      if (municipal === 'aligned') {
        text += ', לצד מנגנון יישום המעגן את מעמד הרשות המקומית כריבון בשטח.';
      } else {
        text += ', והמנגנונים המוצעים תואמים את תפיסת האיגוד.';
      }
      return text;
    }

    if (c.alignment === 'partial_alignment') {
      let text = 'קיימת תמיכה עקרונית ביעד';
      if (mechanism === 'partial' || mechanism === 'conflicting') {
        text += ', אך המנגנון המוצע שונה';
      }
      if (municipal === 'partial' || municipal === 'conflicting') {
        text += ' ומעמד הרשות המקומית מוגדר באופן חלקי בלבד לעומת תביעת האיגוד.';
      } else {
        text += ' או מתמקד בהיבטים חלקיים של המדיניות.';
      }
      return text;
    }

    if (c.alignment === 'tension') {
      let text = 'קיים פער מהותי מול עמדת האיגוד: ';
      if (municipal === 'conflicting' || municipal === 'partial') {
        text += 'המדיניות המוצעת אינה מעניקה אוטונומיה לרשות המקומית או מחלישה את הפיקוח הממלכתי-עירוני.';
      } else if (mechanism === 'conflicting') {
        text += 'המנגנון המוצע עומד בניגוד להמלצות המקצועיות של הנהגת אגפי החינוך.';
      } else {
        text += (c.differences && c.differences[0]) ? c.differences[0] : 'קיים חוסר הלימה במטרות ובחלוקת הסמכויות.';
      }
      return text;
    }

    if (c.alignment === 'contradiction') {
      let text = 'סתירה ישירה לעמדת האיגוד: ';
      if (c.differences && c.differences[0]) {
        text += c.differences[0];
      } else {
        text += 'מדיניות זו מנוגדת לחלוטין לעקרונות האיגוד ולמעמד הרשויות המקומיות.';
      }
      return text;
    }

    return 'נבחנו יעדי העקרון, מנגנון היישום ומעמד הרשות המקומית.';
  }

  class AskEngine {
    constructor() {
      this.claims = [];
      this.positions = [];
      this.commitments = [];
      this.evidence = [];
      this.coalitionClauses = [];
      this.unionClaims = [];
      this.unionDocuments = [];
      this.unionThemes = [];
      this.unionComparisons = [];
      this.unionTimeline = [];
      this.parties = [];
      this.positionsData = [];
      this.partyMap = new Map();
      this.claimMap = new Map();
      this.docMap = new Map();
      this.posMap = new Map();
      this.themeMap = new Map();
      this.isLoaded = false;
    }

    /**
     * Load all knowledge datasets (Legacy + Union Research Layer)
     */
    async init() {
      if (this.isLoaded) return;
      try {
        const [
          cRes, pRes, mRes, eRes, clRes,
          uClaimsRes, uDocsRes, uThemesRes, uCompsRes, uTimeRes,
          partiesRes, positionsRes
        ] = await Promise.all([
          fetch("data/knowledge/claims.json?v=2.5.0").then(r => r.json()),
          fetch("data/knowledge/policy-positions.json?v=2.5.0").then(r => r.json()),
          fetch("data/knowledge/commitments.json?v=2.5.0").then(r => r.json()),
          fetch("data/knowledge/execution-evidence.json?v=2.5.0").then(r => r.json()),
          fetch("data/knowledge/coalition-education-clauses.json?v=2.5.0").then(r => r.json()),
          fetch("data/union/union-claims.json?v=2.5.0").then(r => r.json()),
          fetch("data/union/union-documents.json?v=2.5.0").then(r => r.json()),
          fetch("data/union/union-themes.json?v=2.5.0").then(r => r.json()),
          fetch("data/union/union-party-comparison.json?v=2.5.0").then(r => r.json()),
          fetch("data/union/union-timeline.json?v=2.5.0").then(r => r.json()),
          fetch("data/parties.json?v=2.5.0").then(r => r.json()),
          fetch("data/positions.json?v=2.5.0").then(r => r.json())
        ]);

        this.claims = cRes.claims || [];
        this.positions = pRes.positions || [];
        this.commitments = mRes.commitments || [];
        this.evidence = eRes.evidence || [];
        this.coalitionClauses = clRes.clauses || [];

        this.unionClaims = uClaimsRes.claims || [];
        this.unionDocuments = uDocsRes.documents || [];
        this.unionThemes = uThemesRes.themes || [];
        this.unionComparisons = uCompsRes.comparisons || [];
        this.unionTimeline = (uTimeRes.events || uTimeRes.timeline || uTimeRes.milestones || []);
        this.parties = partiesRes.parties || [];
        this.positionsData = positionsRes.positions || [];

        this.partyMap = new Map(this.parties.map(p => [p.id, p]));
        this.claimMap = new Map(this.unionClaims.map(c => [c.id, c]));
        this.docMap = new Map(this.unionDocuments.map(d => [d.id, d]));
        this.posMap = new Map(this.positionsData.map(p => [p.id, p]));
        this.themeMap = new Map(this.unionThemes.map(t => [t.id, t]));

        this.isLoaded = true;
        console.log(`[AskEngine] Loaded knowledge + union layer: ${this.unionClaims.length} union claims, ${this.unionComparisons.length} comparisons, ${this.unionDocuments.length} union docs, ${this.coalitionClauses.length} coalition clauses.`);
      } catch (err) {
        console.error("[AskEngine] Failed to load knowledge base:", err);
      }
    }

    /**
     * Normalize Hebrew text for matching
     */
    normalizeText(text) {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/["״״'׳`]/g, '')
        .replace(/[-\/\\^$*+?.()|[\]{}]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    /**
     * Parse query to extract intents, target entities, and topic categories
     */
    parseQuery(query) {
      const norm = this.normalizeText(query);
      const matchedEntities = [];
      const matchedTopics = [];

      // Check entities
      for (const [entityName, config] of Object.entries(ENTITY_CONFIG)) {
        for (const alias of config.aliases) {
          const normAlias = this.normalizeText(alias);
          if (norm.includes(normAlias)) {
            matchedEntities.push({ entityName, shortName: config.shortName });
            break;
          }
        }
      }

      // Check topics
      for (const [topicKey, config] of Object.entries(TOPIC_CONFIG)) {
        for (const kw of config.keywords) {
          const normKw = this.normalizeText(kw);
          if (norm.includes(normKw)) {
            matchedTopics.push({ topicKey, name: config.name });
            break;
          }
        }
      }

      // Intent classification
      const isComparison = (matchedEntities.length >= 2) || norm.includes("הבדל") || norm.includes("הבדלים") || norm.includes("השווא") || norm.includes("מול") || norm.includes("לעומת") || (norm.includes("מצעי המפלגות") && norm.includes("נושא"));
      const isExecutionQuery = norm.includes("בוצע") || norm.includes("ביצוע") || norm.includes("יושם") || norm.includes("הובטח") || norm.includes("חלקי") || norm.includes("הוקפא") || norm.includes("חסם") || norm.includes("מבחן הביצוע") || norm.includes("התחייבויות");
      const isPartialExecutionQuery = isExecutionQuery && (norm.includes("חלקית") || norm.includes("חלקי") || norm.includes("הוקפאו") || norm.includes("אילו התחייבויות"));
      const isBudgetQuery = norm.includes("תקציב") || norm.includes("כסף") || norm.includes("מיליון") || norm.includes("מיליארד") || norm.includes("שקל") || norm.includes("סכום") || norm.includes("עלות");
      const isMunicipalQuery = norm.includes("רשות") || norm.includes("רשויות") || norm.includes("שלטון מקומי") || norm.includes("סמכויות") || norm.includes("ביזור") || norm.includes("מוניציפל");
      const isClausesQuery = norm.includes("סעיף") || norm.includes("סעיפים") || norm.includes("הסכם") || norm.includes("הסכמים");

      // Specific core scenarios
      const isChareidiComparison = (norm.includes("שס") || norm.includes("ש\"ס") || norm.includes("ש״ס")) && (norm.includes("יהדות התורה") || norm.includes("גולדקנופף") || norm.includes("גפני") || norm.includes("החינוך החרדי"));
      const isCoreComparison = norm.includes("ליבה") || norm.includes("ליב\"ה") || norm.includes("לימודי ליבה");

      return {
        rawQuery: query,
        normalizedQuery: norm,
        entities: matchedEntities,
        topics: matchedTopics,
        isComparison,
        isExecutionQuery,
        isPartialExecutionQuery,
        isBudgetQuery,
        isMunicipalQuery,
        isClausesQuery,
        isChareidiComparison,
        isCoreComparison
      };
    }

    /**
     * Retrieve matching knowledge units across all 5 datasets
     */
    retrieve(parsed) {
      const { normalizedQuery, entities, topics, isComparison, isExecutionQuery } = parsed;
      const entityNames = entities.map(e => e.entityName);
      const topicKeys = topics.map(t => t.topicKey);

      // Score and filter claims
      const scoredClaims = this.claims.map(c => {
        let score = 0;
        const normClaim = this.normalizeText(c.claim_text + " " + (c.verbatim_quote || ""));
        if (entityNames.includes(c.entity)) score += 5;
        if (topicKeys.includes(c.topic)) score += 4;
        if (c.epistemic_tier === "primary") score += 3;
        if (normalizedQuery.split(' ').some(w => w.length > 2 && normClaim.includes(w))) score += 2;
        return { item: c, score, type: "claim" };
      }).filter(s => s.score > 2).sort((a, b) => b.score - a.score);

      // Score and filter policy positions
      const scoredPositions = this.positions.map(p => {
        let score = 0;
        const normPos = this.normalizeText(p.position_title + " " + p.summary);
        if (entityNames.includes(p.entity)) score += 6;
        if (topicKeys.includes(p.topic)) score += 5;
        if (p.epistemic_tier === "primary") score += 3;
        if (normalizedQuery.split(' ').some(w => w.length > 2 && normPos.includes(w))) score += 2;
        return { item: p, score, type: "position" };
      }).filter(s => s.score > 2).sort((a, b) => b.score - a.score);

      // Score and filter commitments
      const scoredCommitments = this.commitments.map(m => {
        let score = 0;
        const normCom = this.normalizeText(m.commitment_title + " " + m.summary + " " + (m.clause_reference || ""));
        if (entityNames.includes(m.entity)) score += 6;
        if (topicKeys.includes(m.topic)) score += 5;
        if (isExecutionQuery) score += 4;
        if (normalizedQuery.split(' ').some(w => w.length > 2 && normCom.includes(w))) score += 2;
        return { item: m, score, type: "commitment" };
      }).filter(s => s.score > 2).sort((a, b) => b.score - a.score);

      // Score and filter execution evidence
      const scoredEvidence = this.evidence.map(e => {
        let score = 0;
        const normEv = this.normalizeText(e.finding_text + " " + (e.notes || ""));
        if (entityNames.includes(e.entity)) score += 5;
        if (topicKeys.includes(e.topic)) score += 4;
        if (isExecutionQuery) score += 6;
        if (normalizedQuery.split(' ').some(w => w.length > 2 && normEv.includes(w))) score += 2;
        return { item: e, score, type: "evidence" };
      }).filter(s => s.score > 2).sort((a, b) => b.score - a.score);

      // Score and filter coalition clauses
      const scoredClauses = this.coalitionClauses.map(cl => {
        let score = 0;
        const normCl = this.normalizeText(cl.summary + " " + cl.verbatim_text + " " + cl.section_number);
        if (entityNames.some(en => cl.party.includes(en) || en.includes(cl.party))) score += 6;
        if (topicKeys.some(tk => cl.education_topic === tk)) score += 5;
        if (normalizedQuery.split(' ').some(w => w.length > 2 && normCl.includes(w))) score += 3;
        return { item: cl, score, type: "clause" };
      }).filter(s => s.score > 3).sort((a, b) => b.score - a.score);

      return {
        claims: scoredClaims.map(s => s.item),
        positions: scoredPositions.map(s => s.item),
        commitments: scoredCommitments.map(s => s.item),
        evidence: scoredEvidence.map(s => s.item),
        coalitionClauses: scoredClauses.map(s => s.item)
      };
    }

    /**
     * Synthesize Grounded Research Answer
     */
    synthesize(parsed, retrieved) {
      const { claims, positions, commitments, evidence, coalitionClauses } = retrieved;
      const totalMatches = claims.length + positions.length + commitments.length + evidence.length + coalitionClauses.length;

      if (totalMatches === 0) {
        return {
          found: false,
          summaryParagraphs: ["בבסיס הידע הקיים אין די מידע כדי לקבוע זאת בביטחון."],
          keyFindings: [],
          coalitionClausesList: [],
          comparisonList: [],
          executionList: [],
          municipalSection: null,
          contradictionAlert: null,
          limitations: null,
          sources: []
        };
      }

      const sourceMap = new Map();
      const addSource = (sid, tier, title) => {
        if (!sid) return;
        if (!sourceMap.has(sid)) {
          sourceMap.set(sid, {
            id: sid,
            tier: tier === "primary" ? "מקור רשמי" : "מחקר משני",
            isPrimary: tier === "primary",
            title: getHumanSourceTitle(sid) || title || sid
          });
        }
      };

      claims.forEach(c => addSource(c.source_id, c.epistemic_tier, c.source_location));
      positions.forEach(p => (p.source_ids || []).forEach(sid => addSource(sid, p.epistemic_tier)));
      commitments.forEach(m => addSource(m.source_id, m.epistemic_tier, m.clause_reference));
      evidence.forEach(e => addSource(e.source_id, e.epistemic_tier));
      coalitionClauses.forEach(cl => addSource(cl.source_id, "primary", cl.section_number));

      let summaryParagraphs = [];
      let keyFindings = [];
      let comparisonList = [];
      let executionList = [];
      let coalitionClausesList = [];
      let municipalSection = null;
      let contradictionAlert = null;
      let limitations = null;

      const norm = parsed.normalizedQuery;

      // =========================================================================
      // SCENARIO 1: Chareidi Education Comparison (ש״ס מול יהדות התורה בחינוך החרדי)
      // =========================================================================
      if (parsed.isChareidiComparison || ((norm.includes("שס") || norm.includes("ש״ס")) && norm.includes("יהדות התורה"))) {
        summaryParagraphs = [
          "השוואת ההסכמים הקואליציוניים של ש״ס ויהדות התורה (הממשלה ה-37) מלמדת על מכנה משותף אידיאולוגי-תקציבי רחב ביותר, לצד הבדלי מוקד ארגוניים, מגזריים וגיאוגרפיים מובהקים.",
          "**המכנה המשותף:** שתי הסיעות דרשו והשיגו התחייבות להשוואת שכר מוחלטת של עובדי ההוראה ברשתות החינוך החרדיות לתנאי 'אופק חדש' ו'עוז לתמורה' (580 מיליון ₪ לכל רשת), תקצוב מוסדות הפטור בשיעור 55% ללא התניה בפיקוח או במבחנים חיצוניים (321.4 מיליון ₪), הגדלת תקציב הישיבות והכוללים (1.385 מיליארד ₪ בבסיס התקציב), והשבת סבסוד מעונות יום לאברכים.",
          "**ההבדלים המרכזיים:** ש״ס ממקדת את מאמציה בביצור רשת „מעיין החינוך התורני – בני יוסף”, תוך שימת דגש על פריפריה חברתית וגיאוגרפית, מימון הסעות מלא לתלמידי פריפריה (סעיף 22), מפעל הזנה מורחב (סעיף 24) ותרבות תורנית מוניציפלית. לעומתה, יהדות התורה מתמקדת ברשת „מרכז החינוך העצמאי” ובגני אגודת ישראל, ומדגישה אוטונומיה פדגוגית נוקשה מפני פיקוח משרד החינוך (סעיף 93), פטור ממבחני מיצ״ב/PISA (סעיף 3 בנספח), תקצוב סמינרים לבנות (סעיף 96), והבטחת הקצאות קרקע וכיתות בהסכמי גג עירוניים (סעיף 90)."
        ];

        keyFindings = [
          "זהות תקציבית בליבת השכר והישיבות: שתי הסיעות הבטיחו 580 מיליון ₪ לשכר ו-1.385 מיליארד ₪ לישיבות.",
          "ש״ס מתמקדת ברשת „בני יוסף”, הסעות בפריפריה והזנה; יהדות התורה ב„חינוך העצמאי”, בסמינרים ובאוטונומיה פדגוגית.",
          "יהדות התורה מעגנת חובת הקצאות קרקע למוסדות חרדיים בהסכמי גג עירוניים ובינוי כיתות לפי מפתח דמוגרפי.",
          "שתי הסיעות יצרו חזית אחידה לביטול סנקציות מנהליות והגנה על מוסדות הפטור מפיקוח ליבה חיצוני."
        ];

        limitations = "מההסכמים הקואליציוניים בלבד לא ניתן לקבוע את שיעור הביצוע הפרטני בתוך כל בית ספר או את התפלגות השכר הסופית למורים, שכן יישום אופק חדש נתקל בהגבלות חשבונאיות ועתירות משפטיות.";

        coalitionClausesList = this.coalitionClauses.filter(cl => 
          (cl.party === "ש״ס" || cl.party === "יהדות התורה" || cl.party === "אגודת ישראל") &&
          (cl.education_topic === "chareidi_wages_and_parity" || cl.education_topic === "core_curriculum" || cl.education_topic === "yeshivot_and_budget")
        ).slice(0, 8);
      }

      // =========================================================================
      // SCENARIO 2: Partial Execution Analysis (התחייבויות שבוצעו חלקית)
      // =========================================================================
      else if (parsed.isPartialExecutionQuery || (norm.includes("בוצעו") && norm.includes("חלקית")) || norm.includes("התחייבויות קואליציוניות שבוצעו רק חלקית")) {
        const partialClauses = this.coalitionClauses.filter(cl => cl.execution_status === "partially_implemented");
        
        summaryParagraphs = [
          `בדיקת מבחן הביצוע (2023–2026) מול מסמכי התקציב, דוחות החשב הכללי והחלטות הממשלה מעלה כי **${partialClauses.length} התחייבויות קואליציוניות בתחום החינוך בוצעו רק באופן חלקי** (\`partially_implemented\`).`,
          "הפערים הבולטים בין נוסח ההסכם לבין הביצוע בפועל נובעים משלושה חסמים עיקריים: מחסומים משפטיים ועתירות לבג״ץ, דרישות בקרה חשבונאית של משרד האוצר, והסטת תקציבים בעקבות מלחמת חרבות ברזל.",
          "שלושת המוקדים המרכזיים שיושמו חלקית הם: (1) רפורמת 'אופק חדש' ברשתות החרדיות (החינוך העצמאי ובני יוסף) שהוקפאה והותנתה בפיקוח שכר ישיר; (2) סבסוד מעונות יום לאברכים שניתן באופן חלקי בלבד כנקודות זיכוי להורים עובדים; (3) הרשות לזהות לאומית-יהודית (נעם) שתקציבה קוצץ משמעותית וסמכויותיה על מאגר גפ״ן הוגבלו."
        ];

        keyFindings = [
          "אופק חדש ברשתות החרדיות: תקציב של 580M ₪ אושר בממשלה אך נתקל בהוראות הקפאה של הייעוץ המשפטי ובג״ץ ללא דיווח שעות פרטני.",
          "מעונות יום (0–3): במקום סבסוד מלא לאברכים, אושרו נקודות זיכוי מס (עד 3 נקודות) שהיטיבו בעיקר עם הורים עובדים.",
          "הרשות לזהות לאומית (נעם): הוקמה בהחלטת ממשלה 129, אך לא קיבלה שליטה בלעדית על מאגר גפ״ן ותקציבה קוצץ לכ-8.5 מיליון ₪.",
          "השוואת שכר במוכש״ר ובחמ״ד (סעיף 167): אושרה עקרונית אך יושמה בהיקף חלקי בלבד עקב מגבלות תקציב המדינה."
        ];

        contradictionAlert = {
          title: "פער משפטי-תקציבי בביצוע אופק חדש",
          text: "למרות ההתחייבות החד-משמעית בהסכמים להשוואת שכר מלאה, חוות דעת של משרד המשפטים ודוחות החשכ״ל מנעו העברת כספים ללא מנגנון פיקוח על שעות שהייה וליווי פרטני."
        };

        coalitionClausesList = partialClauses;
      }

      // =========================================================================
      // SCENARIO 3: Core Curriculum Platform Differences (הבדלים במצעים בלימודי ליבה)
      // =========================================================================
      else if (parsed.isCoreComparison && (parsed.isComparison || norm.includes("מצע") || norm.includes("הבדל"))) {
        summaryParagraphs = [
          "בנושא לימודי הליבה מתקיימים במערכת הפוליטית שלושה מודלים מתחרים ומנוגדים לחלוטין, המשקפים תפיסות עולם שונות על תפקיד המדינה, סמכות הפיקוח והאוטונומיה המגזרית.",
          "**מודל 1: אכיפה והתניה תקציבית מלאה (100% התניה) — יש עתיד, הדמוקרטים, ישר! וישראל ביתנו:** מפלגות אלו דורשות לימודי ליבה מלאים (מתמטיקה, אנגלית, מדעים) בכל מוסד מתוקצב, תוך הצבת סנקציות כספיות ברורות ושלילה מוחלטת של תקציבי מדינה ממוסדות שיסרבו לעמוד בחובת הלימודים והמבחנים הארציים (מיצ״ב) והבינלאומיים (PISA).",
          "**מודל 2: תמרוץ והרחבת הזרם הממלכתי-חרדי (ממ״ח) — ביחד (נפתלי בנט):** גישה המעדיפה פיתוח הדרגתי ותמריצים חיוביים על פני כפייה ושלילת תקציבים, באמצעות חיזוק והרחבת רשת הממ״ח, הענקת תנאי שכר שוויוניים למורים חרדים המלמדים ליבה, והקמת מועצה לאומית לחינוך.",
          "**מודל 3: אוטונומיה תורנית והגנה על מוסדות הפטור — ש״ס ויהדות התורה:** עיגון תקצוב של 55% למוסדות פטור ללא התניה בהשתתפות במבחנים חיצוניים, תוך איסור על התערבות משרד החינוך בתכנים הפדגוגיים בישיבות ובסמינרים."
        ];

        keyFindings = [
          "יש עתיד, הדמוקרטים וישר! מציגות חזית אחידה של 100% התניה תקציבית ושלילת מימון מלאה מסרבני ליבה.",
          "ביחד (בנט) מציעה מסלול חלופי של תמרוץ והרחבת הממלכתי-חרדי (ממ״ח) ללא שלילת תקציבים גורפת.",
          "הסכמי ש״ס ויהדות התורה מבטיחים תקצוב מוסדות פטור בשיעור 55% (321.4M ₪) ופטור מלא מפיקוח ובחינות חיצוניות.",
          "סוגיית הליבה מהווה את קו השבר המרכזי בין מצעי האופוזיציה לבין ההסכמים הקואליציוניים של הממשלה ה-37."
        ];

        contradictionAlert = {
          title: "סתירה מתודולוגית בין המצעים להסכמים הקואליציוניים",
          text: "בעוד מצעי האופוזיציה דורשים הגברת הפיקוח והתניית תקציב בליבה, ההסכמים הקואליציוניים בפועל עיגנו פטור מוחלט מפיקוח ומבחנים עבור מוסדות הפטור."
        };

        this.positions.filter(p => p.topic === "core_curriculum").forEach(p => {
          const docInfo = getPlatformDocInfo(p.entity);
          comparisonList.push({
            entity: p.entity,
            stanceText: p.summary,
            quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
            tier: p.epistemic_tier,
            driveUrl: docInfo ? docInfo.url : null,
            driveBtnText: docInfo ? docInfo.btnText : null,
            sourceDocLabel: docInfo ? docInfo.label : null
          });
        });

        coalitionClausesList = this.coalitionClauses.filter(cl => cl.education_topic === "core_curriculum");
      }

      // =========================================================================
      // SCENARIO 4: Budget Summary in Coalition Agreements
      // =========================================================================
      else if (parsed.isBudgetQuery || norm.includes("כמה כסף") || norm.includes("סכום תקציבי")) {
        const budgetClauses = this.coalitionClauses.filter(cl => cl.budget_amount_nis && cl.budget_amount_nis > 0);
        summaryParagraphs = [
          `ניתוח 7 ההסכמים הקואליציוניים מעלה כי מופו **13 סעיפי חינוך הכוללים סכום תקציבי נקוב ומפורש בשקלים**, בהיקף מצטבר של מיליארדי שקלים בבסיס התקציב ובתוספות ייעודיות.`,
          "עיקר התקציבים המפורשים הוקצו לשלושה יעדים מרכזיים: (1) הגדלת תקציב הישיבות והכוללים (1.385 מיליארד ₪ בבסיס התקציב); (2) השוואת שכר עובדי הוראה ברשתות החרדיות לאופק חדש (580 מיליון ₪ לש״ס ו-580 מיליון ₪ ליהדות התורה); (3) השוואת תקציבי מוסדות הפטור (321.4 מיליון ₪).",
          "בנוסף הוקצו תקציבים ייעודיים לזהות לאומית ותרבות: הרשות לזהות יהודית של נעם (100 מיליון ₪ בשנה א' ו-70 מיליון ₪ בבסיס), ומאפייני החמ״ד, סמינריונים ומורשת דרוקמן בציונות הדתית (סך כולל של כ-58.5 מיליון ₪)."
        ];

        keyFindings = [
          "הקצאה כוללת של 1.385 מיליארד ₪ לישיבות ולכוללים בבסיס התקציב (ש״ס ויהדות התורה).",
          "תוספת שכר של 580 מיליון ₪ להחלת אופק חדש ברשתות החרדיות (סעיף 17 בש״ס, סעיף 86 ביהדות התורה).",
          "תוספת של 321.4 מיליון ₪ למוסדות הפטור ללא התניה בלימודי ליבה ומבחנים חיצוניים.",
          "תקציבי זהות ותרבות יהודית: 170 מיליון ₪ לנעם (סעיפים 34, 36) וכ-58.5 מיליון ₪ לחמ״ד ולציונות הדתית."
        ];

        coalitionClausesList = budgetClauses;
      }

      // =========================================================================
      // SCENARIO 5: Religious Zionism (הציונות הדתית) Focus
      // =========================================================================
      else if (norm.includes("ציונות דתית") || norm.includes("סמוטריץ")) {
        const rzClauses = this.coalitionClauses.filter(cl => cl.party === "הציונות הדתית");
        summaryParagraphs = [
          "ההסכם הקואליציוני של הציונות הדתית (11 סעיפים ממופים) מתמקד בביצור החינוך הממלכתי-דתי (חמ״ד), חיזוק מעמד מורי המוכש״ר, תקצובי מורשת וזהות יהודית, ותמיכה בגרעינים תורניים ומכינות.",
          "במרכז ההסכם עומדים: (1) **סעיף 167** להשוואת שכר עובדי הוראה במוכש״ר ובחמ״ד; (2) **תקציב מאפיינים ייחודיים לחמ״ד** בהיקף 20 מיליון ₪ ומימון סמינריונים ב-20 מיליון ₪; (3) תקצוב הנצחת מורשת הרב דרוקמן ומוסדות בני עקיבא (10 מיליון ₪); (4) חיזוק האגף לתרבות יהודית במשרד המשימות הלאומיות (7.07 מיליון ₪) ותמיכה בתנועות הנוער הדתיות ובתוכנית של״ף (1.5 מיליון ₪).",
          "בנוסף, ההסכם מעגן אוטונומיה רחבה למועצת החמ״ד במינוי מפקחים ומנהלים, ותוכניות לבינוי כיתות ומוסדות חמ״ד ביו״ש ובפריפריה."
        ];

        keyFindings = [
          "סעיף 167 להשוואת שכר מורי המוכש״ר והחמ״ד לתנאי החינוך הרשמי.",
          "סל תקציבי ייעודי של כ-58.5 מיליון ₪ למאפייני חמ״ד, סמינריונים, מורשת דרוקמן ותרבות יהודית.",
          "תמיכה בתנועות הנוער הדתיות (בני עקיבא, אריאל, עזרא) ובתוכנית של״ף (1.5 מיליון ₪).",
          "אוטונומיה ניהולית למועצת החמ״ד ובינוי כיתות ביו״ש ובפריפריה."
        ];

        coalitionClausesList = rzClauses;
      }

      // =========================================================================
      // SCENARIO 6: Teacher Wages & Status (שכר מורים)
      // =========================================================================
      else if (norm.includes("מורים") || norm.includes("שכר") || norm.includes("שכר מורה")) {
        summaryParagraphs = [
          "נושא שכר המורים ומעמד עובדי ההוראה מציג פער בולט בין יעדי המצעים לבין מוקדי ההסכמים הקואליציוניים.",
          "במצעי הבחירות (2026), מפלגות האופוזיציה מתמקדות בהעלאת שכר המורה המתחיל ובגמישות העסקה: **ביחד (בנט)** מציבה יעד שכר מורה מתחיל של 12,000 ₪ נטו וחוזים אישיים למצטיינים; **ישראל ביתנו (ליברמן)** מציעה 10,000 ₪ נטו; ו**ישר! (איזנקוט)** מציעה רפורמת 'הסכמי דור ב'' והרחבת סמכויות המנהלים לגיוס ותגמול.",
          "לעומת זאת, בהסכמים הקואליציוניים (הממשלה ה-37), מרכז הכובד הושם על סגירת פערי שכר מגזריים: החלת 'אופק חדש' ו'עוז לתמורה' על הרשתות החרדיות (580 מיליון ₪ לש״ס ו-580 מיליון ₪ ליהדות התורה) והשוואת שכר מורי המוכש״ר והחמ״ד (סעיף 167 לציונות הדתית)."
        ];

        keyFindings = [
          "מצעי המפלגות מציבים יעדי שכר מוגדרים: ביחד 12,000 ₪ נטו, ישראל ביתנו 10,000 ₪ נטו.",
          "ישר! (איזנקוט) וביחד (בנט) דורשות הכנסת חוזים אישיים וסמכויות תגמול ישירות למנהלי בתי ספר.",
          "ההסכמים הקואליציוניים התמקדו בהשוואת שכר הרשתות החרדיות (אופק חדש ב-580M ₪) והמוכש״ר.",
          "יישום אופק חדש ברשתות החרדיות הוקפא חלקית בשל דרישות בקרה של משרד האוצר ובג״ץ."
        ];

        coalitionClausesList = this.coalitionClauses.filter(cl => cl.education_topic === "teacher_wages_and_status");
      }

      // =========================================================================
      // SCENARIO 6.5: Union of Education Department Directors (איגוד מנהלי אגפי החינוך)
      // =========================================================================
      else if (norm.includes("איגוד") || norm.includes("קמינסקי") || norm.includes("קוטלר") || norm.includes("הוכמן") || (norm.includes("ביזור") && norm.includes("מנהל"))) {
        const isEarlyChild = norm.includes("0-3") || norm.includes("לידה") || norm.includes("גיל הרך");
        if (isEarlyChild) {
          summaryParagraphs = [
            "איגוד מנהלי אגפי החינוך הוביל מאז 2012 וביתר שאת בשנת 2019 מאבק מקצועי עקבי להעברת תחום הגיל הרך מלידה עד גיל 3 ממשרד העבודה והרווחה למשרד החינוך, ולביסוס רצף חינוכי מוניציפלי כולל.",
            "בנייר העמדה לקראת בחירות 2019 ובדוח המומחה של רמי הוכמן (ספטמבר 2019), הגדיר האיגוד את השלב מלידה עד 3 כשלב החינוכי הקריטי ביותר ('היפוך הפירמידה החינוכית' ע״פ עקומת הקמן), והתריע מפני פיצול ופגיעה ב-400,000 פעוטות. האיגוד דרש כי הרשויות המקומיות יקבלו סמכויות פיקוח, תכלול ותקצוב ישיר לפעוטונים ומעונות יום.",
            "**במבחן המדיניות והראיות:** העברת הגיל הרך למשרד החינוך עוגנה בהחלטת ממשלה 133 (יולי 2021) ויושמה בפועל בינואר 2022. אולם, בהתאם לכללי הראיות המחמירים של המאגר, נקבעה עמדת האיגוד כ**'קדימות בזמן' (דרגה 1)** בלבד, שכן המהלך היה תוצר של לחץ ציבורי, ועדות מומחים והחלטת ממשלה כוללת, ולא הוכח קשר סיבתי ישיר יחיד לפעולת האיגוד."
          ];
          keyFindings = [
            "האיגוד הציב את 'היפוך הפירמידה' ותפיסת הרצף החינוכי מלידה בראש סדר היום כבר מ-2012 ומ-2019.",
            "דוח רמי הוכמן (2019) הציג מודל רשותי מתכלל לטיפול ב-400 אלף פעוטות.",
            "מעונות היום הועברו למשרד החינוך בינואר 2022 (החלטה 133) — סווג כ'קדימות בזמן' (דרגה 1).",
            "דרישת האיגוד להסדרת חוק הפיקוח 2018 ולתקצוב שפ״י/מתי״א מגיל לידה טרם יושמה במלואה."
          ];
        } else {
          summaryParagraphs = [
            "איגוד מנהלי ומנהלות אגפי החינוך ברשויות המקומיות מציב תפיסה עקרונית של 'ביזור הדרגתי ודיפרנציאלי' במודל זיכיון רב-שנתי, הרואה ברשות המקומית את המנהלת הפדגוגית והארגונית של מערכת החינוך היישובית.",
            "יו״ר האיגוד לשעבר, אבי קמינסקי, גיבש את מודל הזיכיון עוד בשנת 2015 במכון ון ליר, והנהלת האיגוד שבה ודרשה להגדיר את משרד החינוך כרגולטור בלבד (קביעת מדיניות וסטנדרטים) ואת הרשות כאחראית על כלל הניהול והמשאבים בשטח.",
            "**במבחן המדיניות והראיות:** תוכנית גפ״ן (2022) אימצה את עקרון המשאבים הגמישים, אך מעורבות האיגוד הובילה ל**'השפעה מתועדת' (דרגה 3)** ישירה: עבודת ועדת השותפים (איגוד, משרד החינוך ואיגוד הגזברים) חילצה הוראת שעה מחייבת של משרד הפנים (ספטמבר 2022) להכרה במאגר הספקים של משרד החינוך ופתיחת חסם הרכש המוניציפלי, לצד 3 תיקונים רשמיים במדריך גפ״ן להגנה על מעמד מנהל האגף."
          ];
          keyFindings = [
            "מודל זיכיון רשותי ל-5 שנים וביזור דיפרנציאלי (קמינסקי 2015, חינוך 2030).",
            "השפעה מתועדת ישירה (דרגה 3): הוראת שעה של משרד הפנים להסדרת רכש גפ״ן (ספטמבר 2022).",
            "תיקון מדריך גפ״ן ב-3 מהדורות לשמירת מעמד וסמכויות מנהל אגף החינוך.",
            "דרישה לביזור שאינו עוקף את הרשות אלא מבסס ממשל רב-מפלסי מאוזן בין הרשות למנהלי בתי הספר."
          ];
        }
        limitations = "איגוד מנהלי החינוך הוא גוף מקצועי ולא פוליטי; עמדותיו משקפות ידע מן השטח וניהול מוניציפלי. סיווג השפעה מבוצע בסטנדרט ראיות מחמיר (השפעה מתועדת דרגה 3 רק בהינתן אסמכתה מפורשת לקשר ישיר).";
        
        const unionPos = this.positions.filter(p => p.entity === "איגוד מנהלי אגפי החינוך");
        unionPos.forEach(p => {
          comparisonList.push({
            entity: p.entity,
            stanceText: p.summary,
            quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
            tier: p.epistemic_tier,
            driveUrl: DRIVE_UNION_FOLDER_URL,
            driveBtnText: "📂 פתח ארכיון מקורות ב-Drive ↗",
            sourceDocLabel: "ארכיון עמדות איגוד מנהלי החינוך"
          });
        });
      }

      // =========================================================================
      // SCENARIO 7: General / Thematic Synthesis Fallback
      // =========================================================================
      else {
        summaryParagraphs = [
          `בסיס הידע המאומת כולל מסמכי מקור רשמיים, מצעי מפלגות והסכמים קואליציוניים המאפשרים לנתח את הסוגיה מנקודת מבט השוואתית.`,
          `אותרו ראיות מבוססות המתייחסות לנושא, המשלבות עמדות מדיניות מוצהרות מתוך המצעים לצד סעיפי התחייבויות חתומים ומבחני ביצוע בפועל.`
        ];

        keyFindings = [
          "המידע המוצג מבוסס על שרשרת ראיות מלאה (Primary Sources) ללא השערות חיצוניות.",
          "ההסכמים הקואליציוניים משקפים התחייבויות פוליטיות מחייבות, בעוד המצעים משקפים תוכניות מדיניות עתידיות.",
          "הראיות המפורטות להלן מציגות את הציטוטים המדויקים, הסכומים התקציביים וסטטוסי הביצוע שנבדקו."
        ];

        if (coalitionClauses.length > 0) {
          coalitionClausesList = coalitionClauses.slice(0, 6);
        } else if (positions.length > 0) {
          positions.slice(0, 4).forEach(p => {
            const docInfo = getPlatformDocInfo(p.entity);
            comparisonList.push({
              entity: p.entity,
              stanceText: p.summary,
              quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
              tier: p.epistemic_tier,
              driveUrl: docInfo ? docInfo.url : null,
              driveBtnText: docInfo ? docInfo.btnText : null,
              sourceDocLabel: docInfo ? docInfo.label : null
            });
          });
        }
      }

      return {
        found: true,
        summaryParagraphs,
        keyFindings,
        comparisonList,
        executionList,
        coalitionClausesList,
        municipalSection,
        contradictionAlert,
        limitations,
        sources: Array.from(sourceMap.values())
      };
    }

    /**
     * Match query to Union Themes / Research Scenarios
     */
    matchUnionTheme(query) {
      const norm = this.normalizeText(query);
      
      if (norm.includes('ביזור') || norm.includes('סמכויות') || norm.includes('משילות') || norm.includes('קמינסקי') || norm.includes('זיכיון') || norm.includes('גפנ') || (norm.includes('רשות') && (norm.includes('מקומי') || norm.includes('אגף')))) {
        return {
          themeId: 'THEME-GOVERNANCE-DECENTRALIZATION',
          nameHe: 'משילות וביזור סמכויות לרשויות'
        };
      }
      if ((norm.includes('גיל') && norm.includes('רך')) || norm.includes('0 3') || norm.includes('0–3') || norm.includes('מעונות') || norm.includes('פעוט') || norm.includes('חוק הפיקוח') || norm.includes('פירמידה')) {
        return {
          themeId: 'THEME-EARLY-CHILDHOOD',
          nameHe: 'חינוך לגיל הרך (לידה עד 3)'
        };
      }
      if ((norm.includes('חינוך') && norm.includes('מיוחד')) || norm.includes('חנמ') || norm.includes('הסעות') || norm.includes('סייעות שילוב') || norm.includes('מאצינג') || norm.includes('מאצ\'ינג')) {
        return {
          themeId: 'THEME-SPECIAL-EDU',
          nameHe: 'חינוך מיוחד, הסעות ושילוב'
        };
      }
      if (norm.includes('ai') || norm.includes('בינה מלאכותית') || norm.includes('טכנולוג') || norm.includes('בגרות') || norm.includes('בגרויות') || norm.includes('מיומנויות')) {
        return {
          themeId: 'THEME-AI-FUTURE-SKILLS',
          nameHe: 'בינה מלאכותית, מיומנויות עתיד ומודל הבגרות'
        };
      }
      if (norm.includes('חירום') || norm.includes('חוסן') || norm.includes('שפח') || norm.includes('פסיכולוג') || norm.includes('מפעל חיוני') || norm.includes('חרבות ברזל') || norm.includes('פינוי')) {
        return {
          themeId: 'THEME-EMERGENCY-RESILIENCE',
          nameHe: 'חירום, חוסן נפשי ושפ"ח'
        };
      }
      if (norm.includes('אלימות') || norm.includes('מוגנות') || norm.includes('מדריכי מוגנות')) {
        return {
          themeId: 'THEME-PROTECTION-SAFETY',
          nameHe: 'אלימות ומוגנות צוותי הוראה'
        };
      }
      if (norm.includes('פערים') || norm.includes('שוויון') || norm.includes('תלנ') || norm.includes('הפרטה') || norm.includes('חוק נהרי') || norm.includes('דיפרנציאלי')) {
        return {
          themeId: 'THEME-EQUITY-GAPS',
          nameHe: 'שוויון הזדמנויות, צמצום פערים ותל"ן'
        };
      }
      if (norm.includes('בלתי פורמלי') || norm.includes('תנועות נוער') || norm.includes('צהרונים')) {
        return {
          themeId: 'THEME-FORMAL-INFORMAL',
          nameHe: 'חינוך בלתי פורמלי, נוער וקהילה'
        };
      }
      if (norm.includes('קהילה') || norm.includes('הורים') || norm.includes('שותפות הורים')) {
        return {
          themeId: 'THEME-COMMUNITY-PARENTS',
          nameHe: 'קהילה והורים'
        };
      }
      if (norm.includes('כוח אדם') || norm.includes('מעמד עובדי הוראה') || norm.includes('תומכות הוראה') || norm.includes('שכר מורים') || norm.includes('מורים')) {
        return {
          themeId: 'THEME-TEACHER-STATUS',
          nameHe: 'כוח אדם ומעמד עובדי החינוך'
        };
      }
      if (norm.includes('פדגוגיה') || norm.includes('הערכה') || norm.includes('דרכי הוראה') || norm.includes('בחינות')) {
        return {
          themeId: 'THEME-PEDAGOGY-EVALUATION',
          nameHe: 'פדגוגיה, הערכה ודרכי הוראה'
        };
      }
      if (norm.includes('תקצוב') || norm.includes('מודל מימון') || norm.includes('בסיס תקציב')) {
        return {
          themeId: 'THEME-BUDGETING-FINANCE',
          nameHe: 'תקצוב ומימון החינוך'
        };
      }
      if (norm.includes('רצף חינוכי') || norm.includes('מלידה לבגרות')) {
        return {
          themeId: 'THEME-EDUCATION-CONTINUUM',
          nameHe: 'רצף חינוכי מלידה לבגרות'
        };
      }
      if (norm.includes('בינוי') || norm.includes('תשתיות') || norm.includes('כיתות לימוד')) {
        return {
          themeId: 'THEME-INFRASTRUCTURE-BUILDING',
          nameHe: 'תשתיות ובינוי כיתות'
        };
      }
      if (norm.includes('נשירה') || norm.includes('נוער בסיכון') || norm.includes('קידום נוער')) {
        return {
          themeId: 'THEME-DROPOUT-AT-RISK',
          nameHe: 'נשירה וילדים ונוער בסיכון'
        };
      }
      return null;
    }

    /**
     * Synthesize 4-Layer Grounded Research Hub Answer
     */
    synthesizeResearchHubAnswer(query, topic, activeFilter = 'all') {
      const relevantClaims = this.unionClaims.filter(c => c.theme === topic.themeId || (c.secondaryThemes && c.secondaryThemes.includes(topic.themeId)));
      // Sort so 'A' and official documents come first
      relevantClaims.sort((a, b) => (a.sourceAuthority || 'Z').localeCompare(b.sourceAuthority || 'Z'));
      const primaryClaim = relevantClaims[0] || this.unionClaims.find(c => c.theme === topic.themeId);

      // Find relevant comparisons
      const themeComparisons = this.unionComparisons.filter(c => {
        const clm = this.claimMap.get(c.unionClaimId);
        return clm && (clm.theme === topic.themeId || (clm.secondaryThemes && clm.secondaryThemes.includes(topic.themeId)));
      });

      const platformComps = themeComparisons.filter(c => c.comparisonType === 'union_vs_platform');
      const coalitionComps = themeComparisons.filter(c => c.comparisonType === 'union_vs_coalition_agreement');
      const executionComps = themeComparisons.filter(c => c.comparisonType === 'union_vs_implementation');

      // Layer 1: Short summary (2-3 sentences, clearly distinguishing Union -> Platforms -> Agreements/Execution)
      let shortSummary = '';
      if (topic.themeId === 'THEME-GOVERNANCE-DECENTRALIZATION') {
        shortSummary = 'עמדת האיגוד: איגוד מנהלי אגפי החינוך דורש מעבר מריכוזיות לביזור דיפרנציאלי והכרה ברשות המקומית כריבון פדגוגי בשטח. מצעי המפלגות: קיימת הסכמה עקרונית רחבה על הרחבת האוטונומיה לרשויות (התאמה גבוהה עם מפלגת ישר!, התאמה חלקית עם ביחד והדמוקרטים). הסכמים וביצוע: בהסכמים הקואליציוניים (2022) ובהחלטת ממשלה 129 מוסדו מנגנוני פיקוח פוליטיים על תוכניות גפ״ן, בניגוד לדרישת האיגוד לאוטונומיה מקומית מלאה.';
      } else if (topic.themeId === 'THEME-EARLY-CHILDHOOD') {
        shortSummary = 'עמדת האיגוד: תביעה עקבית להעברת האחריות הכוללת על גילאי 0–3 למשרד החינוך, תקצוב חוק הפיקוח והקמת יחידות גיל רך יישוביות. מצעי המפלגות: התאמה גבוהה מול הדמוקרטים וביחד הדורשים חינוך חינם ומפוקח מגיל אפס, ותמיכה עקרונית בישראל ביתנו. הסכמים וביצוע: חרף התחייבות בהסכמים הקואליציוניים (2022) לחינוך חינם מגיל אפס, במבחן הביצוע (2023–2024) הוחלו נקודות זיכוי מס בלבד ולא הוקמו מעונות ציבוריים מפוקחים.';
      } else if (topic.themeId === 'THEME-SPECIAL-EDU') {
        shortSummary = 'עמדת האיגוד: התרעה על קריסת מערך השילוב והשירותים, דרישה לשותפות מלאה ברפורמות ומימון ממשלתי מלא (100%) של עלויות ההסעות העירוניות. מצעי המפלגות: מצעי המפלגות (הדמוקרטים, ישר!, ישראל ביתנו) אינם כוללים התייחסות מפורטת למימון ההסעות והמאצ\'ינג העירוני (היעדר מידע במצע ולא עמדת התנגדות). הסכמים וביצוע: בהסכמים הקואליציוניים (2022) הושוו שירותי החנ״מ למוסדות הפטור החרדיים, ללא שיפוי עלויות ההסעה העודפות שהוטלו על הרשויות המקומיות.';
      } else if (topic.themeId === 'THEME-AI-FUTURE-SKILLS') {
        shortSummary = 'עמדת האיגוד: שילוב בינה מלאכותית ככלי הוראה וניהול לצד דרישה לשינוי מבנה הבגרות להערכת מיומנויות ושימור המפגש האנושי כערך שאינו ניתן להחלפה. מצעי המפלגות: התאמה גבוהה מול מצעי ישר! והדמוקרטים הקוראים לביטול בחינות הבגרות במתכונתן הנוכחית ומעבר ללמידת חקר, והתאמה חלקית עם ביחד. הסכמים וביצוע: בהסכמים הקואליציוניים ובמדיניות הממשלה (2022–2026) לא קיימת תוכנית לאומית מוסדרת להטמעת AI או להערכת מיומנויות בשלטון המקומי.';
      } else if (topic.themeId === 'THEME-EMERGENCY-RESILIENCE') {
        shortSummary = 'עמדת האיגוד: דוקטרינת החירום דורשת הכרה באגפי החינוך כמפעל חיוני, חיזוק תקני השפ״ח וניהול רשותי עצמאי מול פיקוד העורף. מצעי המפלגות: במצעי ביחד והדמוקרטים קיימת תמיכה עקרונית בהאצלת סמכויות חירום לשלטון המקומי. הסכמים וביצוע: במלחמת חרבות ברזל (2023–2024) נוצר מתח מתמשך בין השלטון המקומי לממשלה בעקבות עיכובים בהכרה בחינוך כמפעל חיוני וקשיי תיאום בפינוי תושבים.';
      } else {
        shortSummary = `עמדת האיגוד: מסמכי האיגוד מדגישים מענה פדגוגי מקצועי וחיזוק האוטונומיה של הנהגת החינוך המקומית בנושא ${topic.nameHe}. מצעי המפלגות: נבחנו עמדות המפלגות הרשמיות ביחס ליעדים, למנגנון היישום ולמעמד הרשות המקומית. הסכמים וביצוע: סעיפי ההסכמים הקואליציוניים ומדיניות הממשלה (2022–2026) נבחנו אל מול המשאבים שהוקצו והביצוע בשטח.`;
      }

      // Chronological evolution stations for Union position
      const rawStations = [];
      (this.unionTimeline || []).forEach(m => {
        const matchTheme = m.theme === topic.themeId ||
          (m.claimIds && m.claimIds.some(cid => relevantClaims.some(rc => rc.id === cid))) ||
          (m.title && topic.keywords && topic.keywords.some(kw => m.title.includes(kw))) ||
          (m.significance && topic.keywords && topic.keywords.some(kw => m.significance.includes(kw)));
        if (matchTheme) {
          rawStations.push({
            year: m.year,
            title: m.title,
            description: m.significance || m.phase || '',
            authority: m.sourceAuthority || 'A'
          });
        }
      });

      relevantClaims.forEach(c => {
        const d = this.docMap.get(c.documentId);
        const yr = d?.date ? parseInt(d.date.substring(0, 4), 10) : 2026;
        if (!rawStations.some(s => s.year === yr && s.title.includes(c.claim.substring(0, 20)))) {
          rawStations.push({
            year: yr,
            title: d?.title || c.subTopic || 'עמדת איגוד',
            description: c.claim,
            authority: c.sourceAuthority || 'B'
          });
        }
      });

      rawStations.sort((a, b) => (a.year || 0) - (b.year || 0));

      const evolutionStations = [];
      const seenStationKeys = new Set();
      rawStations.forEach(s => {
        const normTitle = (s.title || '').replace(/[״""'׳\-:–]/g, ' ').toLowerCase();
        let coreToken = '';
        if (normTitle.includes('ון ליר') || normTitle.includes('קמינסקי')) coreToken = 'vanleer';
        else if (normTitle.includes('קורונה')) coreToken = 'corona';
        else if (normTitle.includes('גפ ן') || normTitle.includes('גפן')) coreToken = 'gefen';
        else if (normTitle.includes('מרשת ביטחון') || normTitle.includes('תשפ ו') || normTitle.includes('תשפו')) coreToken = 'tashpo';
        else if (normTitle.includes('מבט רחב')) coreToken = 'mabat';
        else if (normTitle.includes('דורנר')) coreToken = 'dorner';
        else if (normTitle.includes('טרכטנברג') || normTitle.includes('חינוך חינם 3')) coreToken = 'trachtenberg';
        else if (normTitle.includes('היפוך הפירמידה') || normTitle.includes('לידה עד 3') || normTitle.includes('לידה עד שלוש')) coreToken = 'early_childhood';
        else if (normTitle.includes('2030')) coreToken = 'edu2030';
        else coreToken = normTitle.split(/\s+/).filter(w => w.length > 3).slice(0, 2).join('_');

        const key = `${s.year}_${coreToken}`;
        if (!seenStationKeys.has(key)) {
          seenStationKeys.add(key);
          evolutionStations.push(s);
        }
      });

      const hasMultiYearEvolution = evolutionStations.length > 1 &&
        evolutionStations.some(s => s.year !== evolutionStations[0].year);

      // Layer 2: Union Section
      let unionSection = null;
      if (primaryClaim) {
        const doc = this.docMap.get(primaryClaim.documentId);
        unionSection = {
          claimId: primaryClaim.id,
          claimText: primaryClaim.claim,
          subTopic: primaryClaim.subTopic,
          sourceAuthority: primaryClaim.sourceAuthority,
          sourceAuthorityLabel: AUTHORITY_LABELS[primaryClaim.sourceAuthority] || 'עמדת איגוד מתועדת',
          quote: primaryClaim.layers?.fact?.quote || '',
          sourceLocation: primaryClaim.layers?.fact?.sourceLocation || '',
          documentTitle: doc?.title || 'מסמך איגוד רשמי',
          documentYear: doc?.date ? doc.date.substring(0, 4) : '2026',
          documentUrl: doc?.publicDriveUrl || DRIVE_UNION_FOLDER_URL,
          evolutionStations: hasMultiYearEvolution ? evolutionStations : [],
          secondaryClaims: relevantClaims.slice(1).map(c => {
            const d = this.docMap.get(c.documentId);
            return {
              id: c.id,
              claim: c.claim,
              authorityLabel: AUTHORITY_LABELS[c.sourceAuthority] || c.sourceAuthority,
              quote: c.layers?.fact?.quote || '',
              documentTitle: d?.title || 'מסמך איגוד'
            };
          })
        };
      }

      // Layer 3: Parties Comparison Section
      const partiesSection = {
        title: 'מה מציעות המפלגות?',
        subtitle: 'השוואה בין עמדת האיגוד למצעי המפלגות הרשמיים',
        comparisons: platformComps.map(c => {
          const party = this.partyMap.get(c.partyId);
          const pos = this.posMap.get(c.partyPositionId);
          const docInfo = getPlatformDocInfo(party?.nameHe || c.partyId);
          const humanReason = generateHumanAlignmentReason(c);
          return {
            partyId: c.partyId,
            partyName: party?.nameHe || c.partyId,
            partyEn: party?.nameEn || '',
            alignment: c.alignment,
            alignmentLabel: ALIGNMENT_LABELS[c.alignment] || c.alignment,
            alignmentClass: ALIGNMENT_CLASSES[c.alignment] || 'alignment-insufficient',
            humanReason,
            similarities: c.similarities || [],
            differences: c.differences || [],
            evidence: c.evidence,
            principleLabel: SUBSCORE_LABELS[c.principleAlignment] || c.principleAlignment,
            mechanismLabel: SUBSCORE_LABELS[c.mechanismAlignment] || c.mechanismAlignment,
            municipalRoleLabel: SUBSCORE_LABELS[c.municipalRoleAlignment] || c.municipalRoleAlignment,
            sourceLocation: pos?.sourceLocation || 'מצע המפלגה הרשמי',
            platformUrl: docInfo?.url || party?.officialWebsite || DRIVE_PLATFORMS_FOLDER_URL
          };
        })
      };

      // Layer 4: Agreements & Execution Section
      const hasExecution = coalitionComps.length > 0 || executionComps.length > 0;
      let executionSection = null;
      if (hasExecution) {
        executionSection = {
          title: 'מה קרה בהסכמים הקואליציוניים ובמבחן הביצוע?',
          items: [
            ...coalitionComps.map(c => {
              const party = this.partyMap.get(c.partyId);
              return {
                track: 'coalition_agreement',
                trackLabel: 'הסכם קואליציוני חתום',
                partyName: party?.nameHe || c.partyId,
                alignment: c.alignment,
                alignmentLabel: ALIGNMENT_LABELS[c.alignment] || c.alignment,
                alignmentClass: ALIGNMENT_CLASSES[c.alignment] || 'alignment-tension',
                differences: c.differences || [],
                similarities: c.similarities || [],
                evidence: c.evidence
              };
            }),
            ...executionComps.map(c => {
              return {
                track: 'government_execution',
                trackLabel: 'מדיניות וביצוע בפועל (ממשלת ישראל)',
                partyName: 'ממשלת ישראל ה-37',
                alignment: c.alignment,
                alignmentLabel: ALIGNMENT_LABELS[c.alignment] || c.alignment,
                alignmentClass: ALIGNMENT_CLASSES[c.alignment] || 'alignment-contradiction',
                differences: c.differences || [],
                similarities: c.similarities || [],
                evidence: c.evidence
              };
            })
          ]
        };
      }

      // Layer 5: Sources List
      const sourcesList = [];
      if (unionSection) {
        sourcesList.push({
          title: unionSection.documentTitle,
          year: unionSection.documentYear,
          entity: 'איגוד מנהלי אגפי החינוך',
          typeLabel: unionSection.sourceAuthorityLabel,
          url: unionSection.documentUrl
        });
      }
      platformComps.forEach(c => {
        const party = this.partyMap.get(c.partyId);
        if (party) {
          const docInfo = getPlatformDocInfo(party.nameHe);
          sourcesList.push({
            title: `מצע החינוך של ${party.nameHe}`,
            year: '2025/2026',
            entity: party.nameHe,
            typeLabel: 'מצע מפלגה רשמי',
            url: docInfo?.url || party.officialWebsite || DRIVE_PLATFORMS_FOLDER_URL
          });
        }
      });
      if (coalitionComps.length > 0) {
        sourcesList.push({
          title: 'הסכמים קואליציוניים להקמת הממשלה ה-37',
          year: '2022',
          entity: 'מזכירות הממשלה / סיעות הקואליציה',
          typeLabel: 'הסכם קואליציוני חתום',
          url: DRIVE_COALITION_FOLDER_URL
        });
      }
      if (executionComps.length > 0) {
        sourcesList.push({
          title: 'דוחות מעקב ביצוע, החלטות ממשלה ופרוטוקולים',
          year: '2023-2026',
          entity: 'משרד החינוך / משרד האוצר',
          typeLabel: 'ביצוע מדיניות בפועל',
          url: DRIVE_COALITION_FOLDER_URL
        });
      }

      return {
        found: true,
        isResearchHub: true,
        query,
        activeFilter,
        topicName: topic.nameHe,
        shortSummary,
        summaryParagraphs: [shortSummary],
        unionSection,
        partiesSection,
        executionSection,
        sourcesList
      };
    }

    /**
     * Process query end-to-end
     */
    async answer(query, activeFilter = 'all') {
      if (!this.isLoaded) await this.init();
      if (!query || !query.trim()) {
        return {
          found: false,
          summaryParagraphs: ["אנא הקלד שאלה על מדיניות החינוך בישראל."],
          keyFindings: [],
          sources: []
        };
      }

      // 1. Check if matches Research Hub theme
      const unionTheme = this.matchUnionTheme(query);
      if (unionTheme) {
        return this.synthesizeResearchHubAnswer(query, unionTheme, activeFilter);
      }

      // 2. Legacy fallback
      const parsed = this.parseQuery(query);
      const hasSpecificIntent = parsed.entities.length > 0 || 
                                parsed.topics.length > 0 || 
                                parsed.isClausesQuery || 
                                parsed.isExecutionQuery || 
                                parsed.isBudgetQuery || 
                                parsed.isChareidiComparison || 
                                parsed.isCoreComparison;

      if (!hasSpecificIntent) {
        return {
          found: false,
          query,
          activeFilter,
          message: 'לא נמצא במאגר מידע מספק להשיב על השאלה.',
          summaryParagraphs: ['לא נמצא במאגר מידע מספק להשיב על השאלה.'],
          keyFindings: [],
          sources: []
        };
      }

      const retrieved = this.retrieve(parsed);
      const synthesis = this.synthesize(parsed, retrieved);

      if (!synthesis.found) {
        return {
          found: false,
          query,
          activeFilter,
          message: 'לא נמצא במאגר מידע מספק להשיב על השאלה.',
          summaryParagraphs: ['לא נמצא במאגר מידע מספק להשיב על השאלה.'],
          keyFindings: [],
          sources: []
        };
      }

      return {
        query,
        activeFilter,
        parsed,
        ...synthesis
      };
    }
  }

  // Export engine to window
  window.AskEngine = new AskEngine();

})(window);
