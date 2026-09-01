/**
 * askEngine.js — מנוע שאילתות ושליפת ידע (Ask the Research Engine)
 * Education Policy Dashboard 2026 — Client-Side Grounded RAG & Synthesis MVP
 * 
 * Architecture:
 * 1. QueryService: Intent, entity and topic extraction from natural Hebrew queries.
 * 2. HybridRetriever: Multi-layer retrieval across Claims, Positions, Commitments & Evidence.
 * 3. EpistemicRanker: Relevance scoring + Primary > Secondary weighting + Contradiction surfacing.
 * 4. AnswerSynthesizer: Formats structured human-friendly answers with grounded citations.
 */

(function(window) {
  'use strict';

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
      keywords: ["מורה", "מורים", "מורות", "שכר", "מעמד המורה", "שכר מורה", "שכר מורים", "מורה מתחיל", "10,000", "10000", "12,000", "12000", "25,000", "25000", "שכר מנהל", "מנהלים", "הסכמי שכר", "אופק חדש", "סעיף 167", "חוזים אישיים", "דור ב", "סייעות", "פסיכולוגים"]
    },
    governance_and_autonomy: {
      id: "governance_and_autonomy",
      name: "משילות, ביזור סמכויות וניהול עצמי",
      keywords: ["סמכויות", "רשויות", "רשות מקומית", "רשויות מקומיות", "שלטון מקומי", "מועצה לאומית", "ביזור", "אוטונומיה", "ניהול עצמי", "סל גמיש", "סנכרון חופשות", "חופשות", "לוח חופשות", "גיוס ופיטורין", "אשכולות"]
    },
    early_childhood: {
      id: "early_childhood",
      name: "הגיל הרך (0–3)",
      keywords: ["0-3", "0–3", "גיל הרך", "הגיל הרך", "פעוטות", "מעונות", "מעונות יום", "חינוך חינם מגיל 0", "חינם 0-3", "נקודות זיכוי", "מס הכנסה", "סבסוד מעונות"]
    },
    special_education: {
      id: "special_education",
      name: "חינוך מיוחד (חנ״מ)",
      keywords: ["חינוך מיוחד", "חנ\"מ", "חנמ", "תלמידים זכאים", "ועדות אפיון", "הסעות חנ\"מ", "סייעות", "פסיכולוגים", "טיפולים פארא-רפואיים", "418,385", "גידול חנ\"מ"]
    },
    jewish_identity_and_gefen: {
      id: "jewish_identity_and_gefen",
      name: "זהות יהודית, תוכניות גפ״ן ורשות נעם",
      keywords: ["גפ\"ן", "גפן", "זהות יהודית", "נעם", "נועם", "אבי מעוז", "מעוז", "שבילי מורשת", "תנ\"ך", "תנך", "מורשת", "הדתה", "תוכניות חיצוניות", "רשות לזהות", "רשות נעם", "סעיף 34", "רצפת 4%", "סמינריונים", "גרעינים תורניים"]
    },
    arab_sector_equality: {
      id: "arab_sector_equality",
      name: "החברה הערבית וצמצום פערים",
      keywords: ["ערבי", "ערבים", "ערבית", "החברה הערבית", "בדואי", "בדואים", "בינוי כיתות", "אוטונומיה פדגוגית", "נרטיב", "תקצוב דיפרנציאלי", "רע\"ם", "רעם", "חד\"ש", "חדש", "תע\"ל", "תעל"]
    },
    stem_ai_and_matriculation: {
      id: "stem_ai_and_matriculation",
      name: "AI, STEM ורפורמת הבגרויות",
      keywords: ["ai", "בינה מלאכותית", "stem", "מדעים", "מתמטיקה 5 יח\"ל", "בגרויות", "בגרות", "ביטול בגרויות", "הערכה חלופית", "pbl", "מיומנויות"]
    },
    budget_execution_and_transfers: {
      id: "budget_execution_and_transfers",
      name: "תקציבים, כספים קואליציוניים ומבחן ביצוע",
      keywords: ["ביצוע", "תקציב", "כספים קואליציוניים", "העברות", "חשכ\"ל", "ועדת הכספים", "4.5 מיליארד", "92 מיליארד", "חינוך עצמאי", "מעיין החינוך", "מוסדות פטור", "מוסדות תורניים", "ישיבות", "חלקי", "בוצע חלקית", "לא בוצע"]
    },
    municipal_financial_impact: {
      id: "municipal_financial_impact",
      name: "השלכות מוניציפליות ופערי רשויות",
      keywords: ["ארנונה", "ארנונה עסקית", "מאצ'ינג", "matching", "פורום ה-15", "רשויות חלשות", "גירעון מוניציפלי", "הסעות", "קרקעות"]
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
      this.isLoaded = false;
    }

    /**
     * Load knowledge base datasets
     */
    async init() {
      if (this.isLoaded) return;
      try {
        const [cRes, pRes, mRes, eRes] = await Promise.all([
          fetch("data/knowledge/claims.json").then(r => r.json()),
          fetch("data/knowledge/policy-positions.json").then(r => r.json()),
          fetch("data/knowledge/commitments.json").then(r => r.json()),
          fetch("data/knowledge/execution-evidence.json").then(r => r.json())
        ]);

        this.claims = cRes.claims || [];
        this.positions = pRes.positions || [];
        this.commitments = mRes.commitments || [];
        this.evidence = eRes.evidence || [];
        this.isLoaded = true;
        console.log(`[AskEngine] Successfully loaded ${this.claims.length} claims, ${this.positions.length} positions, ${this.commitments.length} commitments, ${this.evidence.length} evidence records.`);
      } catch (err) {
        console.error("[AskEngine] Failed to load knowledge base:", err);
      }
    }

    /**
     * Normalize Hebrew text for search
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

      // Sort topics by keyword match score
      matchedTopics.sort((a, b) => b.score - a.score);

      // Intent flags
      const isComparison = matchedEntities.length >= 2 || norm.includes("הבדל") || norm.includes("הבדלים") || norm.includes("השווא") || norm.includes("מי מציע");
      const isExecutionQuery = norm.includes("בוצע") || norm.includes("מה קרה") || norm.includes("בפועל") || norm.includes("התחייב") || norm.includes("חלקי") || norm.includes("תוצאות") || norm.includes("מבחן הביצוע");
      const isMunicipalQuery = norm.includes("רשויות") || norm.includes("רשות מקומית") || norm.includes("שלטון מקומי") || norm.includes("מוניציפל") || norm.includes("ארנונה") || norm.includes("הסעות");

      return {
        rawQuery: query,
        normalizedQuery: norm,
        entities: matchedEntities,
        topics: matchedTopics,
        isComparison,
        isExecutionQuery,
        isMunicipalQuery
      };
    }

    /**
     * Retrieve matching items across all 4 knowledge datasets
     */
    retrieve(parsed) {
      const qTokens = parsed.normalizedQuery.split(/\s+/).filter(t => t.length > 1);
      const matchedClaims = [];
      const matchedPositions = [];
      const matchedCommitments = [];
      const matchedEvidence = [];

      const topTopicKeys = parsed.topics.map(t => t.topicKey);
      const topEntityNames = parsed.entities.map(e => e.entityName);

      // 1. Filter Claims
      this.claims.forEach(c => {
        let score = 0;
        const normText = this.normalizeText(c.claim_text + " " + c.entity + " " + (c.tags || []).join(" "));
        
        // Entity match
        if (topEntityNames.some(en => c.entity.includes(en) || en.includes(c.entity))) score += 10;
        // Topic match
        if (topTopicKeys.includes(c.topic)) score += 8;
        // Token match
        qTokens.forEach(token => {
          if (normText.includes(token)) score += 2;
        });

        // Primary epistemic tier bonus
        if (c.epistemic_tier === "primary") score += 1;

        if (score >= 4) {
          matchedClaims.push({ item: c, score, type: "claim" });
        }
      });

      // 2. Filter Policy Positions
      this.positions.forEach(p => {
        let score = 0;
        const normText = this.normalizeText(p.summary + " " + p.entity + " " + (p.verbatim_quotes || []).join(" "));
        
        if (topEntityNames.some(en => p.entity.includes(en) || en.includes(p.entity))) score += 12;
        if (topTopicKeys.includes(p.topic)) score += 10;
        qTokens.forEach(token => {
          if (normText.includes(token)) score += 2;
        });

        if (p.epistemic_tier === "primary") score += 1;
        if (score >= 4) {
          matchedPositions.push({ item: p, score, type: "position" });
        }
      });

      // 3. Filter Commitments
      this.commitments.forEach(m => {
        let score = 0;
        const normText = this.normalizeText(m.commitment_text + " " + m.beneficiary + " " + m.obligor + " " + m.notes);
        
        if (topEntityNames.some(en => (m.beneficiary + " " + m.obligor).includes(en))) score += 10;
        if (topTopicKeys.includes(m.topic)) score += 8;
        if (parsed.isExecutionQuery) score += 4;
        qTokens.forEach(token => {
          if (normText.includes(token)) score += 2;
        });

        if (score >= 4) {
          matchedCommitments.push({ item: m, score, type: "commitment" });
        }
      });

      // 4. Filter Execution Evidence
      this.evidence.forEach(e => {
        let score = 0;
        const normText = this.normalizeText(e.description + " " + e.entity_evaluated + " " + e.planned_vs_actual + " " + e.municipal_implication);
        
        if (topEntityNames.some(en => e.entity_evaluated.includes(en))) score += 10;
        if (topTopicKeys.includes(e.topic)) score += 8;
        if (parsed.isExecutionQuery) score += 6;
        if (parsed.isMunicipalQuery && e.municipal_implication) score += 8;
        qTokens.forEach(token => {
          if (normText.includes(token)) score += 2;
        });

        if (score >= 4) {
          matchedEvidence.push({ item: e, score, type: "evidence" });
        }
      });

      // Sort matches by relevance score
      matchedClaims.sort((a, b) => b.score - a.score);
      matchedPositions.sort((a, b) => b.score - a.score);
      matchedCommitments.sort((a, b) => b.score - a.score);
      matchedEvidence.sort((a, b) => b.score - a.score);

      return {
        claims: matchedClaims.map(m => m.item),
        positions: matchedPositions.map(m => m.item),
        commitments: matchedCommitments.map(m => m.item),
        evidence: matchedEvidence.map(m => m.item)
      };
    }

    /**
     * Synthesize human-friendly grounded answer
     */
    synthesize(parsed, retrieved) {
      const { claims, positions, commitments, evidence } = retrieved;
      const totalMatches = claims.length + positions.length + commitments.length + evidence.length;

      // Fallback if sparse/empty
      if (totalMatches === 0) {
        return {
          found: false,
          shortAnswer: "בבסיס הידע הקיים אין כרגע מספיק מידע כדי לענות על השאלה באופן מבוסס.",
          detailsHtml: "",
          comparisonList: [],
          evidenceList: [],
          municipalSection: null,
          contradictionAlert: null,
          sources: []
        };
      }

      // Collect sources
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

      // Build synthesis sections
      let shortAnswer = "";
      let detailedBullets = [];
      let comparisonList = [];
      let executionList = [];
      let municipalSection = null;
      let contradictionAlert = null;

      // Check specific preset questions or generalized queries
      const norm = parsed.normalizedQuery;

      // Specific Query 1: לימודי ליבה
      if (norm.includes("ליבה") || norm.includes("לימודי ליבה")) {
        shortAnswer = "בנושא לימודי ליבה קיימת מחלוקת קוטבית בין שלוש תפיסות מרכזיות: התניה תקציבית מוחלטת (ישר!, הדמוקרטים, יש עתיד), הרחבת החינוך הממלכתי-חרדי (ממ\"ח) ותמרוץ (ביחד בנט), והתנגדות לכפיית ליבה תוך דרישה להשוואת תקציב (יהדות התורה וש\"ס).";
        
        positions.filter(p => p.topic === "core_curriculum").forEach(p => {
          comparisonList.push({
            entity: p.entity,
            stanceText: p.summary,
            quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
            tier: p.epistemic_tier
          });
        });
      }
      // Specific Query 2: סמכויות לרשויות מקומיות / ביזור
      else if (norm.includes("סמכויות") && (norm.includes("רשויות") || norm.includes("שלטון מקומי"))) {
        shortAnswer = "מפלגות המרכז והימין-הליברלי מציעות ביזור סמכויות מקיף: מפלגת „ישר!” (איזנקוט) מציעה חוק מועצה לאומית וביזור לאשכולות אזוריים; „ביחד” (בנט) מציעה מועצה לאומית ואוטונומיה תקציבית ופדגוגית מלאה למנהלים; ו„ישראל ביתנו” דורשת סמכות למנהל בגיוס ופיטורי מורים וסנכרון חופשות.";
        
        claims.filter(c => c.topic === "governance_and_autonomy").forEach(c => {
          detailedBullets.push({
            entity: c.entity,
            text: c.claim_text,
            tier: c.epistemic_tier,
            source: c.source_id
          });
        });

        municipalSection = "השלכות מוניציפליות: מחקרי העומק מראים כי ביזור ללא תקצוב דיפרנציאלי מעמיק פערים בין רשויות חזקות (פורום ה-15 המוסיפות 10k–15k ₪ לתלמיד) לבין פריפריה, עקב פערי ארנונה עסקית.";
      }
      // Specific Query 3: ש״ס בחינוך וביצוע
      else if (norm.includes("שס") || norm.includes("ש\"ס") || norm.includes("בני יוסף")) {
        shortAnswer = "ש״ס התחייבה בהסכם הקואליציוני לחזק את רשת מעיין החינוך התורני (בני יוסף) ולהחיל בה את שכר 'אופק חדש' (החלטות ממשלה 511 ו-1096). במבחן הביצוע: תקציב הרשת גדל לכ-1.234 מיליארד ₪ ב-2026, אך שכר אופק חדש יושם חלקית ובהדרגה בלבד בעקבות עתירות לבג\"ץ ודרישות פיקוח חשבונאיות.";
        
        commitments.filter(m => (m.beneficiary || "").includes("ש״ס")).forEach(m => {
          executionList.push({
            title: m.commitment_text,
            budget: m.budget_amount_nis,
            status: m.status === "implemented" ? "בוצע" : (m.status === "partially_implemented" ? "בוצע חלקית" : "בבדיקה"),
            statusClass: m.status === "implemented" ? "status-executed" : "status-partial",
            notes: m.notes
          });
        });

        municipalSection = "השלכה לשלטון המקומי: צמיחת מוסדות הרשת בפריפריה הגדילה את נטל שירותי ההסעות והמעטפת שהרשות המקומית מחויבת לממן על פי חוק.";
      }
      // Specific Query 4: הבדלים במורים (ישראל ביתנו, ביחד, ישר!)
      else if (norm.includes("הבדלים") && (norm.includes("מורים") || norm.includes("מורה") || norm.includes("שכר"))) {
        shortAnswer = "שלוש המפלגות מציבות יעד שכר גבוה, אך נבדלות במודל ההעסקה: „ביחד” (בנט) מציעה שכר מורה מתחיל של 12,000 ₪ נטו וחוזים אישיים למצטיינים; „ישראל ביתנו” (ליברמן) מציעה מורה מתחיל ב-10,000 ₪, מנהל ב-25,000 ₪ וסמכות פיטורין למנהל; ו„ישר!” (איזנקוט) מציעה רפורמה בהסכמי השכר ומעבר להסכמי 'דור ב' דיפרנציאליים לפי אזור ומקצוע.";
        
        comparisonList = [
          {
            entity: "ביחד (נפתלי בנט)",
            stanceText: "שכר מורה מתחיל 12,000 ₪ נטו, חוזים אישיים ומענקי מצוינות ב-STEM, תגמול דיפרנציאלי.",
            tier: "primary",
            source: "KB-PLT-BENNETT-2026-PDF"
          },
          {
            entity: "ישראל ביתנו (אביגדור ליברמן)",
            stanceText: "שכר מורה מתחיל 10,000 ₪ נטו, מנהל 25,000 ₪ נטו, אוטונומיה בגיוס ופיטורין, מענקי 15k ₪ לסייעות ופסיכולוגים.",
            tier: "primary",
            source: "KB-PLT-BEYTENU-2026-PDF"
          },
          {
            entity: "ישר! (גדי איזנקוט)",
            stanceText: "הסכמי שכר 'דור ב' גמישים ודיפרנציאליים לפי אזור עדיפות ומקצוע, סל שקלי גמיש למנהלים.",
            tier: "primary",
            source: "KB-PLT-YASHAR-2026-PDF"
          }
        ];
      }
      // Specific Query 5: חינוך חינם מגיל 0–3
      else if (norm.includes("0-3") || norm.includes("0–3") || norm.includes("לידה עד שלוש") || norm.includes("גיל הרך")) {
        shortAnswer = "הבטחת הבחירות של הליכוד מ-2022 לחינוך חינם מגיל לידה עד שלוש מומשה רק חלקית: במקום הקמת מעונות ציבוריים חינם, הממשלה הנהיגה הטבות מס (עד 2 נקודות זיכוי להורים עובדים) ומענקי סבסוד במעונות מפוקחים (עד 940 ₪ לפעוט). לעומת זאת, 'הדמוקרטים' דורשים חינוך חינם אוניברסלי מלא מגיל 0, ו'ישר!' מציעה להעביר את גילאי 0–3 לאחריות משרד החינוך.";
        
        contradictionAlert = {
          title: "פער הבטחה מול ביצוע: חינוך חינם 0–3",
          text: "בבחירות 2022 הובטח חינוך חינם אוניברסלי; בפועל המימוש נעשה כהטבת מס להורים עובדים ולא כרשת מעונות ציבורית חינם, עקב מגבלות תקציב ומחסור במטפלות ובמבנים."
        };

        municipalSection = "משמעות מוניציפלית: רשויות מקומיות מתקשות לאתר שטחים ומבנים להקמת מעונות יום חדשים ומתמודדות עם מצוקת גיוס כוח אדם בשכר נמוך.";
      }
      // Specific Query 6: התחייבויות קואליציוניות שבוצעו חלקית
      else if (norm.includes("חלקית") || norm.includes("בוצעו רק חלקית") || norm.includes("התחייבויות קואליציוניות")) {
        shortAnswer = "מחקרי העומק מזהים 4 התחייבויות קואליציוניות מרכזיות של הממשלה ה-37 שבוצעו באופן חלקי בלבד בעקבות חסמים משפטיים, קיצוצי מלחמה ומגבלות בירוקרטיות:";
        
        commitments.filter(m => m.status === "partially_implemented").forEach(m => {
          executionList.push({
            title: m.commitment_text,
            beneficiary: m.beneficiary,
            budget: m.budget_amount_nis,
            status: "בוצע חלקית",
            statusClass: "status-partial",
            notes: m.notes
          });
        });
      }
      // General Intent / Fallback Synthesis
      else {
        shortAnswer = `נמצאו ${totalMatches} יחידות ידע מאומתות הרלוונטיות לשאלתך מתוך בסיס הנתונים של מפת החינוך:`;
        
        positions.slice(0, 4).forEach(p => {
          comparisonList.push({
            entity: p.entity,
            stanceText: p.summary,
            quote: p.verbatim_quotes ? p.verbatim_quotes[0] : null,
            tier: p.epistemic_tier
          });
        });

        claims.slice(0, 4).forEach(c => {
          detailedBullets.push({
            entity: c.entity,
            text: c.claim_text,
            tier: c.epistemic_tier,
            source: c.source_id
          });
        });

        if (evidence.length > 0 && evidence[0].municipal_implication) {
          municipalSection = evidence[0].municipal_implication;
        }
      }

      return {
        found: true,
        shortAnswer,
        detailedBullets,
        comparisonList,
        executionList,
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
