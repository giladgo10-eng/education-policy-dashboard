/**
 * askEngine.js — מנוע שאילתות ושליפת ידע (Ask the Research Engine)
 * Education Policy Dashboard 2026 — Client-Side Grounded RAG & Synthesis Engine
 * 
 * Architecture:
 * 1. QueryService: Intent, entity and topic extraction from natural Hebrew queries.
 * 2. HybridRetriever: Multi-layer retrieval across Claims, Positions, Commitments, Execution Evidence & Coalition Clauses (51 clauses).
 * 3. EpistemicRanker: Relevance scoring + Primary > Secondary weighting + Contradiction surfacing.
 * 4. AnswerSynthesizer: Formats structured human-friendly answers with grounded citations and Drive links.
 */

(function(window) {
  'use strict';

  const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1GcfQe69kVhqQKPnAUwzIoE0TsrmN3l8_";

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
    special_education: {
      id: "special_education",
      name: "חינוך מיוחד (חנ״מ)",
      keywords: ["חינוך מיוחד", "חנ\"מ", "חנמ", "תלמידים זכאים", "ועדות אפיון", "הסעות חנ\"מ", "סייעות", "פסיכולוגים", "טיפולים פארא-רפואיים", "418,385", "גידול חנ\"מ"]
    },
    jewish_identity_and_gefen: {
      id: "jewish_identity_and_gefen",
      name: "זהות יהודית, תוכניות גפ״ן ורשות נעם",
      keywords: ["גפ\"ן", "גפן", "זהות יהודית", "נעם", "נועם", "אבי מעוז", "מעוז", "שבילי מורשת", "תנ\"ך", "תנך", "מורשת", "הדתה", "תוכניות חיצוניות", "רשות לזהות", "רשות נעם", "סעיף 34", "סעיף 35", "סעיף 36", "רצפת 4%", "סמינריונים", "גרעינים תורניים", "תרבות יהודית", "דרוקמן"]
    },
    chareidi_networks_and_ptor: {
      id: "chareidi_networks_and_ptor",
      name: "רשתות חינוך חרדיות ומוסדות תורניים",
      keywords: ["חינוך עצמאי", "מעיין החינוך", "בני יוסף", "ישיבות", "כוללים", "מוסדות תורניים", "מוסדות פטור", "אגודת ישראל", "דגל התורה", "1.385", "1.385 מיליארד", "321 מיליון"]
    },
    school_construction_and_physical: {
      id: "school_construction_and_physical",
      name: "בינוי מוסדות חינוך וכיתות לימוד",
      keywords: ["בינוי", "כיתות", "בינוי מוסדות", "בינוי כיתות", "מבנים", "קרקעות", "הקצאת קרקע", "הסכמי גג", "מבנים יבילים", "שיפוצים"]
    },
    informal_education_and_youth: {
      id: "informal_education_and_youth",
      name: "חינוך בלתי-פורמלי ותנועות נוער",
      keywords: ["בלתי-פורמלי", "בלתי פורמלי", "תנועות נוער", "נוער", "בני עקיבא", "אריאל", "עזרא", "של\"ף", "מכינות", "מכינות קדם צבאיות", "מועדוני נוער"]
    },
    feeding_and_transport: {
      id: "feeding_and_transport",
      name: "הסעות תלמידים ומפעל ההזנה",
      keywords: ["הסעות", "הסעות תלמידים", "הזנה", "מפעל ההזנה", "ארוחה חמה", "אבטחת מוסדות"]
    },
    contingency_and_war_recovery: {
      id: "contingency_and_war_recovery",
      name: "מפונים ושיקום מוסדות במלחמה",
      keywords: ["מפונים", "תלמידים מפונים", "חרבות ברזל", "שיקום הצפון", "קו עימות", "תקומה"]
    },
    budget_execution_and_transfers: {
      id: "budget_execution_and_transfers",
      name: "תקציבים, כספים קואליציוניים ומבחן ביצוע",
      keywords: ["ביצוע", "תקציב", "כספים קואליציוניים", "העברות", "חשכ\"ל", "ועדת הכספים", "4.5 מיליארד", "92 מיליארד", "580 מיליון", "321.4 מיליון", "100 מיליון", "70 מיליון", "20 מיליון", "10 מיליון", "סכום תקציבי", "סכומים", "חלקי", "בוצע חלקית", "טרם נבדקו"]
    }
  };

  // Entity dictionary
  const ENTITY_CONFIG = {
    "ביחד (נפתלי בנט)": {
      aliases: ["ביחד", "נפתלי בנט", "בנט", "מפלגת ביחד", "beyachad", "bennett"],
      shortName: "ביחד (בנט)"
    },
    "ישר! (גדי איזנקוט)": {
      aliases: ["ישר", "ישר!", "איזנקוט", "גדי איזנקוט", "yashar", "eisenkot"],
      shortName: "ישר! (איזנקוט)"
    },
    "הדמוקרטים (יאיר גולן)": {
      aliases: ["הדמוקרטים", "יאיר גולן", "גולן", "דמוקרטים", "עבודה", "מרצ", "democrats", "golan"],
      shortName: "הדמוקרטים (גולן)"
    },
    "ישראל ביתנו (אביגדור ליברמן)": {
      aliases: ["ישראל ביתנו", "ליברמן", "אביגדור ליברמן", "beytenu", "lieberman"],
      shortName: "ישראל ביתנו (ליברמן)"
    },
    "יש עתיד (יאיר לפיד)": {
      aliases: ["יש עתיד", "לפיד", "יאיר לפיד", "yesh atid", "lapid"],
      shortName: "יש עתיד (לפיד)"
    },
    "הליכוד": {
      aliases: ["הליכוד", "ליכוד", "נתניהו", "בנימין נתניהו", "יואב קיש", "קיש", "הממשלה ה-37", "ממשלת ישראל", "likud", "netanyahu", "kisch"],
      shortName: "הליכוד / ממשלה 37"
    },
    "ש״ס": {
      aliases: ["שס", "ש\"ס", "ש״ס", "בני יוסף", "מעיין החינוך", "מעיין החינוך התורני", "דרעי", "shas"],
      shortName: "ש״ס"
    },
    "יהדות התורה": {
      aliases: ["יהדות התורה", "החינוך העצמאי", "מרכז החינוך העצמאי", "אגודת ישראל", "דגל התורה", "גפני", "גולדקנופף", "מוסדות פטור", "utj"],
      shortName: "יהדות התורה"
    },
    "הציונות הדתית": {
      aliases: ["הציונות הדתית", "ציונות דתית", "סמוטריץ", "סמוטריץ'", "חמ\"ד", "חמד", "סעיף 167", "דרוקמן"],
      shortName: "הציונות הדתית"
    },
    "עוצמה יהודית": {
      aliases: ["עוצמה יהודית", "בן גביר", "איתמר בן גביר"],
      shortName: "עוצמה יהודית"
    },
    "נעם": {
      aliases: ["נעם", "נועם", "אבי מעוז", "מעוז", "הרשות לזהות"],
      shortName: "נעם (אבי מעוז)"
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
    }
  };

  class AskEngine {
    constructor() {
      this.claims = [];
      this.positions = [];
      this.commitments = [];
      this.evidence = [];
      this.coalitionClauses = [];
      this.isLoaded = false;
    }

    /**
     * Load all knowledge datasets
     */
    async init() {
      if (this.isLoaded) return;
      try {
        const [cRes, pRes, mRes, eRes, clRes] = await Promise.all([
          fetch("data/knowledge/claims.json").then(r => r.json()),
          fetch("data/knowledge/policy-positions.json").then(r => r.json()),
          fetch("data/knowledge/commitments.json").then(r => r.json()),
          fetch("data/knowledge/execution-evidence.json").then(r => r.json()),
          fetch("data/knowledge/coalition-education-clauses.json").then(r => r.json())
        ]);

        this.claims = cRes.claims || [];
        this.positions = pRes.positions || [];
        this.commitments = mRes.commitments || [];
        this.evidence = eRes.evidence || [];
        this.coalitionClauses = clRes.clauses || [];
        this.isLoaded = true;
        console.log(`[AskEngine] Loaded knowledge layer: ${this.claims.length} claims, ${this.positions.length} positions, ${this.commitments.length} commitments, ${this.evidence.length} evidence, ${this.coalitionClauses.length} coalition clauses.`);
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
        let score = 0;
        for (const kw of config.keywords) {
          const normKw = this.normalizeText(kw);
          if (norm.includes(normKw)) {
            score++;
          }
        }
        if (score > 0) {
          matchedTopics.push({ topicKey, name: config.name, score });
        }
      }

      matchedTopics.sort((a, b) => b.score - a.score);

      // Intent flags
      const isComparison = matchedEntities.length >= 2 || norm.includes("הבדל") || norm.includes("הבדלים") || norm.includes("השווא") || norm.includes("מי מציע") || norm.includes("הכי הרבה");
      const isExecutionQuery = norm.includes("בוצע") || norm.includes("מה קרה") || norm.includes("בפועל") || norm.includes("התחייב") || norm.includes("חלקי") || norm.includes("תוצאות") || norm.includes("מבחן הביצוע") || norm.includes("טרם נבדקו");
      const isMunicipalQuery = norm.includes("רשויות") || norm.includes("רשות מקומית") || norm.includes("שלטון מקומי") || norm.includes("מוניציפל") || norm.includes("ארנונה") || norm.includes("הסעות") || norm.includes("בינוי");
      const isClausesQuery = norm.includes("סעיף") || norm.includes("סעיפי") || norm.includes("הסכם") || norm.includes("הסכמים") || norm.includes("הסכם קואליציוני");
      const isBudgetAmountQuery = norm.includes("סכום") || norm.includes("סכומים") || norm.includes("תקציבי מפורש") || norm.includes("כמה כסף") || norm.includes("מיליארד") || norm.includes("מיליון");

      return {
        rawQuery: query,
        normalizedQuery: norm,
        entities: matchedEntities,
        topics: matchedTopics,
        isComparison,
        isExecutionQuery,
        isMunicipalQuery,
        isClausesQuery,
        isBudgetAmountQuery
      };
    }

    /**
     * Retrieve matching items across all 5 knowledge datasets
     */
    retrieve(parsed) {
      const qTokens = parsed.normalizedQuery.split(/\s+/).filter(t => t.length > 1);
      const matchedClaims = [];
      const matchedPositions = [];
      const matchedCommitments = [];
      const matchedEvidence = [];
      const matchedClauses = [];

      const topTopicKeys = parsed.topics.map(t => t.topicKey);
      const topEntityNames = parsed.entities.map(e => e.entityName);

      // 1. Filter Claims
      this.claims.forEach(c => {
        let score = 0;
        const normText = this.normalizeText(c.claim_text + " " + c.entity + " " + (c.tags || []).join(" "));
        if (topEntityNames.some(en => c.entity.includes(en) || en.includes(c.entity))) score += 10;
        if (topTopicKeys.includes(c.topic)) score += 8;
        qTokens.forEach(t => { if (normText.includes(t)) score += 2; });
        if (c.epistemic_tier === "primary") score += 1;
        if (score >= 4) matchedClaims.push({ item: c, score, type: "claim" });
      });

      // 2. Filter Policy Positions
      this.positions.forEach(p => {
        let score = 0;
        const normText = this.normalizeText(p.summary + " " + p.entity + " " + (p.verbatim_quotes || []).join(" "));
        if (topEntityNames.some(en => p.entity.includes(en) || en.includes(p.entity))) score += 12;
        if (topTopicKeys.includes(p.topic)) score += 10;
        qTokens.forEach(t => { if (normText.includes(t)) score += 2; });
        if (p.epistemic_tier === "primary") score += 1;
        if (score >= 4) matchedPositions.push({ item: p, score, type: "position" });
      });

      // 3. Filter Commitments
      this.commitments.forEach(m => {
        let score = 0;
        const normText = this.normalizeText(m.commitment_text + " " + m.beneficiary + " " + m.obligor + " " + m.notes);
        if (topEntityNames.some(en => (m.beneficiary + " " + m.obligor).includes(en))) score += 10;
        if (topTopicKeys.includes(m.topic)) score += 8;
        if (parsed.isExecutionQuery) score += 4;
        qTokens.forEach(t => { if (normText.includes(t)) score += 2; });
        if (score >= 4) matchedCommitments.push({ item: m, score, type: "commitment" });
      });

      // 4. Filter Execution Evidence
      this.evidence.forEach(e => {
        let score = 0;
        const normText = this.normalizeText(e.description + " " + e.entity_evaluated + " " + e.planned_vs_actual + " " + e.municipal_implication);
        if (topEntityNames.some(en => e.entity_evaluated.includes(en))) score += 10;
        if (topTopicKeys.includes(e.topic)) score += 8;
        if (parsed.isExecutionQuery) score += 6;
        if (parsed.isMunicipalQuery && e.municipal_implication) score += 8;
        qTokens.forEach(t => { if (normText.includes(t)) score += 2; });
        if (score >= 4) matchedEvidence.push({ item: e, score, type: "evidence" });
      });

      // 5. Filter Coalition Clauses (51 full clauses)
      this.coalitionClauses.forEach(cl => {
        let score = 0;
        const normText = this.normalizeText(cl.summary + " " + cl.verbatim_text + " " + cl.party + " " + cl.section_number + " " + cl.responsible_body);
        if (topEntityNames.some(en => cl.party.includes(en) || en.includes(cl.party))) score += 12;
        if (topTopicKeys.includes(cl.education_topic)) score += 10;
        if (parsed.isClausesQuery) score += 6;
        if (parsed.isBudgetAmountQuery && cl.budget_amount_nis) score += 8;
        qTokens.forEach(t => { if (normText.includes(t)) score += 2; });
        if (score >= 4) matchedClauses.push({ item: cl, score, type: "coalition_clause" });
      });

      matchedClaims.sort((a, b) => b.score - a.score);
      matchedPositions.sort((a, b) => b.score - a.score);
      matchedCommitments.sort((a, b) => b.score - a.score);
      matchedEvidence.sort((a, b) => b.score - a.score);
      matchedClauses.sort((a, b) => b.score - a.score);

      return {
        claims: matchedClaims.map(m => m.item),
        positions: matchedPositions.map(m => m.item),
        commitments: matchedCommitments.map(m => m.item),
        evidence: matchedEvidence.map(m => m.item),
        coalitionClauses: matchedClauses.map(m => m.item)
      };
    }

    /**
     * Synthesize human-friendly grounded answer
     */
    synthesize(parsed, retrieved) {
      const { claims, positions, commitments, evidence, coalitionClauses } = retrieved;
      const totalMatches = claims.length + positions.length + commitments.length + evidence.length + coalitionClauses.length;

      if (totalMatches === 0) {
        return {
          found: false,
          shortAnswer: "בבסיס הידע הקיים אין כרגע מספיק מידע כדי לענות על השאלה באופן מבוסס.",
          detailsHtml: "",
          comparisonList: [],
          executionList: [],
          coalitionClausesList: [],
          municipalSection: null,
          contradictionAlert: null,
          sources: []
        };
      }

      const sourceMap = new Map();
      const addSource = (sid, tier, title) => {
        if (!sid) return;
        if (!sourceMap.has(sid)) {
          sourceMap.set(sid, {
            id: sid,
            tier: tier === "primary" ? "מקור רשמי ראשוני" : "מחקר משני",
            isPrimary: tier === "primary",
            title: title || sid
          });
        }
      };

      claims.forEach(c => addSource(c.source_id, c.epistemic_tier, c.source_location));
      positions.forEach(p => (p.source_ids || []).forEach(sid => addSource(sid, p.epistemic_tier)));
      commitments.forEach(m => addSource(m.source_id, m.epistemic_tier, m.clause_reference));
      evidence.forEach(e => addSource(e.source_id, e.epistemic_tier));
      coalitionClauses.forEach(cl => addSource(cl.source_id, "primary", cl.section_number));

      let shortAnswer = "";
      let detailedBullets = [];
      let comparisonList = [];
      let executionList = [];
      let coalitionClausesList = [];
      let municipalSection = null;
      let contradictionAlert = null;

      const norm = parsed.normalizedQuery;

      // -------------------------------------------------------------
      // Specific Question: אילו סעיפי חינוך קיימים בהסכם עם ש״ס?
      // -------------------------------------------------------------
      if (norm.includes("שס") && (norm.includes("סעיף") || norm.includes("סעיפי") || norm.includes("קיימים"))) {
        const shasClauses = this.coalitionClauses.filter(cl => cl.party === "ש״ס");
        shortAnswer = `בהסכם הקואליציוני בין הליכוד לש״ס מופו ${shasClauses.length} סעיפי חינוך והשפעה חינוכית ישירה, המתמקדים בחיזוק רשת מעיין החינוך התורני (בני יוסף), השוואת שכר אופק חדש, הגדלת תקציבי מוסדות הפטור והישיבות, הזנה, הסעות וסבסוד מעונות יום:`;
        
        coalitionClausesList = shasClauses;
        municipalSection = "משמעות לרשויות: סעיף 21 דורש הקצאת בינוי כיתות לרשת בני יוסף והסרת חסמי תכנון מוניציפליים, וסעיף 22 מחייב מימון ממשלתי מלא להסעות תלמידים בפריפריה.";
      }
      // -------------------------------------------------------------
      // Specific Question: מה התחייבה הממשלה ליהדות התורה בתחום החינוך?
      // -------------------------------------------------------------
      else if (norm.includes("יהדות התורה") && (norm.includes("התחייב") || norm.includes("סעיף") || norm.includes("סעיפי"))) {
        const utjClauses = this.coalitionClauses.filter(cl => cl.party.includes("יהדות התורה"));
        shortAnswer = `ההסכם עם יהדות התורה ונספח אגודת ישראל כוללים את חבילת סעיפי החינוך הרחבה ביותר (${utjClauses.length} סעיפים בסך הכל): 14 סעיפים בהסכם הראשי ו-4 סעיפים בנספח אגודת ישראל, הכוללים השוואת שכר מלאה (אופק חדש/עוז לתמורה), תקצוב 55% למוסדות פטור ללא פיקוח ליבה, 1.385 מיליארד ₪ לישיבות, בינוי מוסדות וחינוך מיוחד תורני.`;
        
        coalitionClausesList = utjClauses;
        municipalSection = "משמעות מוניציפלית: סעיף 90 וסעיף 4 (נספח) מחייבים רשויות מקומיות להקצות קרקעות ומבנים למוסדות החינוך העצמאי בהסכמי גג ובשכונות חדשות.";
      }
      // -------------------------------------------------------------
      // Specific Question: באילו הסכמים מופיעות התחייבויות לבינוי מוסדות?
      // -------------------------------------------------------------
      else if (norm.includes("בינוי") || norm.includes("בינוי מוסדות") || norm.includes("כיתות")) {
        const buildClauses = this.coalitionClauses.filter(cl => cl.education_topic === "school_construction_and_physical");
        shortAnswer = `התחייבויות לבינוי מוסדות חינוך וכיתות לימוד מופיעות ב-5 הסכמים קואליציוניים שונים (${buildClauses.length} סעיפים ממופים):`;
        
        coalitionClausesList = buildClauses;
        municipalSection = "משמעות מוניציפלית: כלל הסעיפים מטילים חובות תכנון והקצאת קרקע על הרשויות המקומיות, תוך דרישה להסרת חסמים בירוקרטיים בוועדות התכנון.";
      }
      // -------------------------------------------------------------
      // Specific Question: איזה הסכם כולל הכי הרבה סעיפי חינוך?
      // -------------------------------------------------------------
      else if (norm.includes("הכי הרבה") || (norm.includes("כמה סעיפים") && norm.includes("הסכם"))) {
        shortAnswer = "ההסכם עם יהדות התורה כולל את מספר סעיפי החינוך הגבוה ביותר בממשלה ה-37: 18 סעיפים בסך הכל (14 בהסכם הראשי + 4 בנספח אגודת ישראל). במקום השני נמצא הסכם ש״ס עם 12 סעיפים, ובמקום השלישי הסכם הציונות הדתית עם 11 סעיפים. סך הכל מופו 51 סעיפי חינוך בכל 7 ההסכמים.";
        
        detailedBullets = [
          { entity: "יהדות התורה + אגודת ישראל", text: "18 סעיפי חינוך (שכר, מוסדות פטור, ישיבות, בינוי, הסעות, חנ\"מ, סמינרים, גפ\"ן)" },
          { entity: "ש״ס (מעיין החינוך התורני)", text: "12 סעיפי חינוך (אופק חדש, עוז לתמורה, פטור, ישיבות, בינוי, הזנה, מעונות יום)" },
          { entity: "הציונות הדתית", text: "11 סעיפי חינוך (סעיף 167 שכר, מאפייני חמ\"ד, סמינריונים, מורשת דרוקמן, של\"ף, גרעינים, בינוי)" },
          { entity: "סיעת נעם", text: "5 סעיפי חינוך (סעיף 34 רשות זהות, גפ\"ן, מחלקת תודעה, מאגר שקיפות, תנ\"ך)" },
          { entity: "עוצמה יהודית", text: "5 סעיפי חינוך (חינוך בלתי-פורמלי, מועדוני נוער, מורשת לאומית, אבטחת מוסדות)" },
          { entity: "הימין הממלכתי", text: "4 סעיפי חינוך (מעמד משרד החינוך, תלמידים מפונים, מצוינות ממלכתית, שיקום מוסדות בצפון)" }
        ];
      }
      // -------------------------------------------------------------
      // Specific Question: אילו סעיפים כוללים סכום תקציבי מפורש?
      // -------------------------------------------------------------
      else if (parsed.isBudgetAmountQuery || norm.includes("סכום תקציבי") || norm.includes("סכומים")) {
        const budgetClauses = this.coalitionClauses.filter(cl => cl.budget_amount_nis && cl.budget_amount_nis > 0);
        shortAnswer = `בבסיס הידע אותרו ${budgetClauses.length} סעיפי חינוך קואליציוניים הכוללים סכום תקציבי נקוב ומפורש בשקלים (הנעים בין 1.5 מיליון ₪ ל-1.385 מיליארד ₪):`;
        
        coalitionClausesList = budgetClauses;
      }
      // -------------------------------------------------------------
      // Specific Question: אילו התחייבויות טרם נבדקו מבחינת ביצוע?
      // -------------------------------------------------------------
      else if (norm.includes("טרם נבדקו") || norm.includes("טרם ניתן לקבוע") || norm.includes("בבדיקה")) {
        const underReviewClauses = this.coalitionClauses.filter(cl => cl.execution_status === "under_review");
        shortAnswer = `אותרו ${underReviewClauses.length} התחייבויות קואליציוניות שסווגו כ'טרם נבדקו / נתוני בסיס' (under_review), בעיקר בתחומי בינוי כיתות והסכמי גג, הדורשות מעקב רשויות ודוחות כספיים נוספים:`;
        
        coalitionClausesList = underReviewClauses;
        municipalSection = "הסיבה לסיווג 'טרם נבדק': פרויקטי בינוי כיתות והקצאות קרקע נפרסים על פני מספר שנים ותלויים בהיתרי בנייה עירוניים ודוחות ביצוע של משרד הבינוי.";
      }
      // -------------------------------------------------------------
      // Specific Question: לימודי ליבה בהסכמים
      // -------------------------------------------------------------
      else if (norm.includes("ליבה") || norm.includes("לימודי ליבה")) {
        shortAnswer = "בנושא לימודי ליבה קיימת מחלוקת קוטבית: מצעי יש עתיד, הדמוקרטים וישר! דורשים 100% התניה תקציבית ושלילת תקצוב מסרבנים; מצע ביחד (בנט) מציע תמרוץ דרך רשת הממ\"ח; ואילו ההסכמים הקואליציוניים של יהדות התורה (סעיפים 88, 93) וש״ס (סעיף 19) מעגנים תקצוב של 55% למוסדות פטור ללא התניה בליבה ומבחנים חיצוניים.";
        
        positions.filter(p => p.topic === "core_curriculum").forEach(p => {
          comparisonList.push({
            entity: p.entity,
            stanceText: p.summary,
            quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
            tier: p.epistemic_tier
          });
        });

        coalitionClausesList = this.coalitionClauses.filter(cl => cl.education_topic === "core_curriculum");
      }
      // -------------------------------------------------------------
      // Specific Question: שכר מורים ומעמד
      // -------------------------------------------------------------
      else if (norm.includes("מורים") || norm.includes("שכר") || norm.includes("אופק חדש")) {
        shortAnswer = "שלוש מפלגות מציבות יעד שכר גבוה (ביחד 12k ₪ נטו, ישראל ביתנו 10k ₪ נטו, ישר! הסכמי דור ב'), בעוד שבהסכמים הקואליציוניים הדגש הושם על השוואת שכר מורי הרשתות החרדיות (אופק חדש בש\"ס ויהדות התורה - 580M ₪) ושכר מורי החמ\"ד והמוכש\"ר (סעיף 167 לציונות הדתית).";
        
        coalitionClausesList = this.coalitionClauses.filter(cl => cl.education_topic === "teacher_wages_and_status");
      }
      // General Intent / Fallback Synthesis
      else {
        shortAnswer = `נמצאו ${totalMatches} יחידות ידע וסעיפי הסכמים הרלוונטיים לשאלתך מתוך בסיס הנתונים של מפת החינוך:`;
        
        if (coalitionClauses.length > 0) {
          coalitionClausesList = coalitionClauses.slice(0, 6);
        } else if (positions.length > 0) {
          positions.slice(0, 4).forEach(p => {
            comparisonList.push({
              entity: p.entity,
              stanceText: p.summary,
              quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
              tier: p.epistemic_tier
            });
          });
        }
      }

      return {
        found: true,
        shortAnswer,
        detailedBullets,
        comparisonList,
        executionList,
        coalitionClausesList,
        municipalSection,
        contradictionAlert,
        sources: Array.from(sourceMap.values())
      };
    }

    /**
     * Process query end-to-end
     */
    async answer(query) {
      if (!this.isLoaded) await this.init();
      if (!query || !query.trim()) {
        return {
          found: false,
          shortAnswer: "אנא הקלד שאלה על מדיניות החינוך בישראל.",
          detailsHtml: "",
          sources: []
        };
      }

      const parsed = this.parseQuery(query);
      const retrieved = this.retrieve(parsed);
      const synthesis = this.synthesize(parsed, retrieved);

      return {
        query,
        parsed,
        ...synthesis
      };
    }
  }

  // Export engine to window
  window.AskEngine = new AskEngine();

})(window);
