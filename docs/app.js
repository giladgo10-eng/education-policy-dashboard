/**
 * education-policy-dashboard: V2.0 Phase 2
 * Epistemic & Methodological Separation:
 * 1. מצעי המפלגות (מה המפלגות מציעות) -> מפלגה במבט אחד | השוואה לפי סוגיה + קישורי Drive למסמכי המקור
 * 2. הסכמים קואליציוניים ומבחן הביצוע (מה הובטח ומה בוצע) -> בורר מפלגות קואליציה נפרד + 4 שלבי ביצוע + קישורי Drive
 * 3. שאל את המחקר (Ask the Research) -> מנוע תשובות מחקריות מסונתזות מבוסס 106 יחידות מאומתות ו-51 סעיפי הסכמים
 */

const STATE = {
  activeSection: "platforms", // "platforms" | "coalition" | "union" | "ask"
  activeSubview: "party",     // "party" | "issue"
  sources: [],
  parties: [],
  issues: [],
  positions: [],
  commitments: [],
  execution: [],
  entities: [],
  unionPositions: [],
  selectedPartyId: "PARTY-BEYACHAD",
  selectedCoalitionPartyId: "PARTY-LIKUD",
  selectedIssueId: "ISSUE-CORE-CURRICULUM",
  selectedUnionTopic: "ALL",
  systemMetadata: null
};

const DRIVE_PLATFORMS_FOLDER_URL = "https://drive.google.com/drive/folders/1PvVXkV2KIxscPrIxE57-L1T_dF-0UxfM";
const DRIVE_COALITION_FOLDER_URL = "https://drive.google.com/drive/folders/1GcfQe69kVhqQKPnAUwzIoE0TsrmN3l8_";
const DRIVE_UNION_FOLDER_URL = "https://drive.google.com/drive/folders/19ScYmoBNpvxFndPh5sNQElzhNN42Im05?usp=sharing";

// Specific Google Drive Links for Party Platforms & Research Documents
const PLATFORM_DOC_MAP = {
  "PARTY-BEYACHAD": {
    url: "https://drive.google.com/file/d/1M_llcAkxPie446iaqDJKxPMGvKBy6xnV/view?usp=sharing",
    isPrimary: true,
    label: "תוכנית החינוך של ביחד",
    btnText: "📄 לצפייה במצע / מסמך המקור ↗"
  },
  "PARTY-YASHAR": {
    url: "https://drive.google.com/file/d/1wsm1YEt5OVkLKWZ_o6D-S1ELH-pDvlK5/view?usp=sharing",
    isPrimary: true,
    label: "תוכנית החינוך של ישר! (גדי איזנקוט)",
    btnText: "📄 לצפייה במצע / מסמך המקור ↗"
  },
  "PARTY-DEMOCRATS": {
    url: "https://drive.google.com/file/d/1920qzJmHmqDXlXQq5ezKYfpYEivTUoed/view?usp=sharing",
    isPrimary: true,
    label: "תוכנית החינוך של הדמוקרטים (יאיר גולן)",
    btnText: "📄 לצפייה במצע / מסמך המקור ↗"
  },
  "PARTY-YISRAEL-BEYTENU": {
    url: "https://drive.google.com/file/d/1c0IHyot1UMBjvknFZdlKwr8a0ocul58X/view?usp=sharing",
    isPrimary: true,
    label: "מצע החינוך של ישראל ביתנו (אביגדור ליברמן)",
    btnText: "📄 לצפייה במצע / מסמך המקור ↗"
  },
  "PARTY-RELIGIOUS-ZIONISM": {
    url: "https://drive.google.com/file/d/1dTvW2XLV3gdq7Qm_-fsM6BXth_Fmoz0k/view?usp=sharing",
    isPrimary: true,
    label: "פרק החינוך של הציונות הדתית",
    btnText: "📄 לצפייה במצע / מסמך המקור ↗"
  },
    "PARTY-RAAM": {
    url: "https://drive.google.com/file/d/1kscIl_3H0ZqfoWKwt1SKfJMmFlcUWZ-O/view?usp=sharing",
    isPrimary: false,
    label: "עמדות החינוך של רע״ם (מסמך מחקר משני)",
    btnText: "📖 לצפייה במסמך המחקר ↗"
  },
  "PARTY-HADASH": {
    url: "https://drive.google.com/file/d/1p1RzD-Z-wy6N_-vCdch_ffIHlp4Bkglm/view?usp=sharing",
    isPrimary: false,
    label: "ניתוח מצע החינוך של חד״ש–תע״ל (מחקר משני)",
    btnText: "📖 לצפייה במסמך המחקר ↗"
  },
  "PARTY-HADASH-TAAL": {
    url: "https://drive.google.com/file/d/1p1RzD-Z-wy6N_-vCdch_ffIHlp4Bkglm/view?usp=sharing",
    isPrimary: false,
    label: "ניתוח מצע החינוך של חד״ש–תע״ל (מחקר משני)",
    btnText: "📖 לצפייה במסמך המחקר ↗"
  }
};

function getPartyPlatformDoc(partyId) {
  if (partyId && PLATFORM_DOC_MAP[partyId]) return PLATFORM_DOC_MAP[partyId];
  return {
    url: DRIVE_PLATFORMS_FOLDER_URL,
    isPrimary: true,
    label: "מסמך מצע / מקור ב-Drive",
    btnText: "📄 לצפייה במצע / מסמך המקור ↗"
  };
}

// Specific Google Drive Links for all 7 Coalition Agreements
const COALITION_PDF_MAP = {
  "PARTY-SHAS": "https://drive.google.com/file/d/10UlNZ0uHKU6UGvddFwHnezp1Wo1x16OY/view?usp=sharing",
  "PARTY-UTJ": "https://drive.google.com/file/d/170jZW_rmd1LB1QcZvoIPHDaKsyKS0N1m/view?usp=sharing",
  "PARTY-RZ": "https://drive.google.com/file/d/1XyoY-dKRwtm5uHu6hyiu_dhftS0xQh98/view?usp=sharing",
  "PARTY-RELIGIOUS-ZIONISM": "https://drive.google.com/file/d/1XyoY-dKRwtm5uHu6hyiu_dhftS0xQh98/view?usp=sharing",
  "PARTY-OZMA": "https://drive.google.com/file/d/13aoUSFRcTOtUS3S6sNgrh1kNsxs0BTj5/view?usp=sharing",
  "PARTY-OTZMA-YEHUDIT": "https://drive.google.com/file/d/13aoUSFRcTOtUS3S6sNgrh1kNsxs0BTj5/view?usp=sharing",
  "PARTY-NOAM": "https://drive.google.com/file/d/1jWtYDXl5VkVwuaO9f8UJj60GLEDFJPrs/view?usp=sharing",
  "PARTY-YAMINST": "https://drive.google.com/file/d/1JREXh4SSzK6gwuneCTvYiRvdKvk_znrv/view?usp=sharing",
  "PARTY-YAMIN-MAMLACHTI": "https://drive.google.com/file/d/1JREXh4SSzK6gwuneCTvYiRvdKvk_znrv/view?usp=sharing",
  "KB-COAL-LIKUD-SHAS-PDF": "https://drive.google.com/file/d/10UlNZ0uHKU6UGvddFwHnezp1Wo1x16OY/view?usp=sharing",
  "KB-COAL-LIKUD-UTJ-PDF": "https://drive.google.com/file/d/170jZW_rmd1LB1QcZvoIPHDaKsyKS0N1m/view?usp=sharing",
  "KB-COAL-LIKUD-AGUDAT-ISRAEL-PDF": "https://drive.google.com/file/d/1EA_xVDPWQtByoZf0tvmKYEpGnr-Nan5w/view?usp=sharing",
  "KB-COAL-LIKUD-UTJ-APPENDIX-PDF": "https://drive.google.com/file/d/1EA_xVDPWQtByoZf0tvmKYEpGnr-Nan5w/view?usp=sharing",
  "KB-COAL-LIKUD-RZ-PDF": "https://drive.google.com/file/d/1XyoY-dKRwtm5uHu6hyiu_dhftS0xQh98/view?usp=sharing",
  "KB-COAL-LIKUD-OTZMA-PDF": "https://drive.google.com/file/d/13aoUSFRcTOtUS3S6sNgrh1kNsxs0BTj5/view?usp=sharing",
  "KB-COAL-LIKUD-OZMA-PDF": "https://drive.google.com/file/d/13aoUSFRcTOtUS3S6sNgrh1kNsxs0BTj5/view?usp=sharing",
  "KB-COAL-LIKUD-NOAM-PDF": "https://drive.google.com/file/d/1jWtYDXl5VkVwuaO9f8UJj60GLEDFJPrs/view?usp=sharing",
  "KB-COAL-LIKUD-YAMIN-MAMLACHTI-PDF": "https://drive.google.com/file/d/1JREXh4SSzK6gwuneCTvYiRvdKvk_znrv/view?usp=sharing",
  "KB-COAL-LIKUD-YAMINST-PDF": "https://drive.google.com/file/d/1JREXh4SSzK6gwuneCTvYiRvdKvk_znrv/view?usp=sharing",
  "SRC-LIKUD-SHAS-2022": "https://drive.google.com/file/d/10UlNZ0uHKU6UGvddFwHnezp1Wo1x16OY/view?usp=sharing",
  "SRC-LIKUD-UTJ-2022": "https://drive.google.com/file/d/170jZW_rmd1LB1QcZvoIPHDaKsyKS0N1m/view?usp=sharing",
  "SRC-LIKUD-RZ-2022": "https://drive.google.com/file/d/1XyoY-dKRwtm5uHu6hyiu_dhftS0xQh98/view?usp=sharing",
  "SRC-LIKUD-OZMA-2022": "https://drive.google.com/file/d/13aoUSFRcTOtUS3S6sNgrh1kNsxs0BTj5/view?usp=sharing",
  "SRC-LIKUD-NOAM-2022": "https://drive.google.com/file/d/1jWtYDXl5VkVwuaO9f8UJj60GLEDFJPrs/view?usp=sharing"
};

const ISSUE_ICON_MAP = {
  "ISSUE-CORE-CURRICULUM": "📚",
  "ISSUE-SPECIAL-EDUCATION": "♿",
  "ISSUE-TEACHER-SHORTAGE": "👩‍🏫",
  "ISSUE-BUDGET-DIFFERENTIAL": "💰",
  "ISSUE-EARLY-CHILDHOOD": "👶",
  "ISSUE-MUNICIPAL-AUTONOMY": "🏛️",
  "ISSUE-JEWISH-IDENTITY": "📜"
};

// Safe Accessor Functions
function getPartyName(p) {
  if (!p) return "";
  return p.nameHe || p.name || p.id || "";
}

function getPartyLeader(p) {
  if (!p) return "";
  return p.knessetFaction25 || p.leader || "";
}

function getIssueTitle(i) {
  if (!i) return "";
  return i.title || i.name || i.id || "";
}

function getIssueIcon(i) {
  if (!i) return "📌";
  return i.icon || ISSUE_ICON_MAP[i.id] || "📌";
}

function getAnalysisText(analysis) {
  if (!analysis) return "";
  if (typeof analysis === "string") return analysis;
  if (typeof analysis === "object" && analysis.text) return analysis.text;
  return "";
}

function getAssessmentText(assessment) {
  if (!assessment) return "";
  if (typeof assessment === "string") return assessment;
  if (typeof assessment === "object" && assessment.text) return assessment.text;
  return "";
}

function getAgreementPdfUrl(sourceId, partyId) {
  if (sourceId && COALITION_PDF_MAP[sourceId]) return COALITION_PDF_MAP[sourceId];
  if (partyId && COALITION_PDF_MAP[partyId]) return COALITION_PDF_MAP[partyId];
  return DRIVE_COALITION_FOLDER_URL;
}

function getAgreementCleanTitle(partyName, sectionRef, pageNumber) {
  let agName = "";
  const p = partyName || "";
  if (p.includes("ש״ס") || p.includes("שס")) agName = "הסכם הליכוד–ש״ס";
  else if (p.includes("אגודת ישראל")) agName = "נספח הליכוד–אגודת ישראל";
  else if (p.includes("יהדות התורה")) agName = "הסכם הליכוד–יהדות התורה";
  else if (p.includes("ציונות דתית") || p.includes("הציונות הדתית")) agName = "הסכם הליכוד–הציונות הדתית";
  else if (p.includes("עוצמה יהודית")) agName = "הסכם הליכוד–עוצמה יהודית";
  else if (p.includes("נעם") || p.includes("נועם")) agName = "הסכם הליכוד–נעם";
  else if (p.includes("הימין הממלכתי")) agName = "הסכם הליכוד–הימין הממלכתי";
  else agName = "הסכם קואליציוני רשמי";

  let res = agName;
  if (sectionRef) res += " | " + sectionRef;
  if (pageNumber) res += " (עמ׳ " + pageNumber + ")";
  return res;
}

function getHumanSourceLabel(sourceId, citation) {
  const src = STATE.sources.find(s => s.id === sourceId);
  let title = src ? src.title : "מקור רשמי מאומת";
  title = title.replace(/\s*\((?:PDF|Word|גרסת Word|הסכם מלא|8 צעדים)\)/gi, '').trim();
  if (citation) {
    title += ' | ' + citation;
  }
  return title;
}

const SOURCE_QUALITY_CONFIG = {
  primary_source: { label: "מצע / מסמך רשמי", class: "quality-primary", icon: "📜" },
  primary_historical: { label: "מקור היסטורי (2013)", class: "quality-historical", icon: "🏛️" },
  secondary_research: { label: "מחקר משני", class: "quality-secondary", icon: "📖" },
  default: { label: "מקור מתועד", class: "quality-default", icon: "📄" }
};

const STANCE_CONFIG = {
  pro_enforcement: { label: "אכיפה / התניה מלאה", class: "stance-enforcement" },
  pro_autonomy: { label: "אוטונומיה / ביזור", class: "stance-autonomy" },
  pro_reform: { label: "רפורמה מבנית", class: "stance-reform" },
  pro_innovation: { label: "חדשנות וטכנולוגיה", class: "stance-innovation" },
  pro_equity: { label: "צמצום פערים ושוויון", class: "stance-equity" },
  pro_state_education: { label: "חיזוק הממלכתיות", class: "stance-state" },
  pro_support: { label: "תמיכה והרחבת מענים", class: "stance-support" },
  pro_religious_autonomy: { label: 'אוטונומיה דתית/חמ"ד', class: "stance-religious" },
  pro_sectoral_funding: { label: "השוואת תקציב מגזרי", class: "stance-sectoral" },
  not_stated: { label: "לא נאמר / לא נמצא במקור", class: "stance-not-stated" },
  default: { label: "עמדה מתועדת", class: "stance-default" }
};

const STATUS_CONFIG = {
  fully_executed: { label: "בוצע", group: "executed", class: "status-executed" },
  executed_growth: { label: "בוצע (גידול תקציבי)", group: "executed", class: "status-executed" },
  partially_executed: { label: "בוצע חלקית", group: "partial", class: "status-partial" },
  partially_executed_frozen: { label: "בוצע חלקית (הוקפא)", group: "partial", class: "status-partial" },
  alternative_execution: { label: "בוצע חלקית (מתווה חלופי)", group: "partial", class: "status-partial" },
  partial_diverged_execution: { label: "בוצע חלקית", group: "partial", class: "status-partial" },
  not_executed: { label: "לא בוצע", group: "not_executed", class: "status-not-executed" },
  not_executed_delayed: { label: "לא בוצע (מעוכב)", group: "not_executed", class: "status-not-executed" },
  baseline_data: { label: "טרם ניתן לקבוע (נתון בסיס)", group: "undetermined", class: "status-undetermined" },
  under_review: { label: "טרם ניתן לקבוע (בבדיקה)", group: "undetermined", class: "status-undetermined" },
  default: { label: "טרם ניתן לקבוע", group: "undetermined", class: "status-undetermined" }
};

const SOURCE_TYPE_LABELS = {
  party_platform: "מצע מפלגה רשמי",
  coalition_agreement: "הסכם קואליציוני חתום",
  official_law: "חוק רשמי",
  government_decision: "החלטת ממשלה",
  official_budget: "דוח תקציב רשמי",
  secondary_research_source: "מסמך מחקר משני",
  official_position_paper: "נייר עמדה רשמי (איגוד)",
  official_union_call: "קריאה רשמית של האיגוד",
  official_annual_report: "דוח שנתי רשמי",
  expert_presentation: "מצגת / הרצאת מומחה ויו״ר",
  research_report: "דוח מחקר ומומחה",
  expert_paper: "מאמר תפיסה מקצועי",
  secondary_academic: "מחקר סינתזה 2026"
};

const SOURCE_CLASSIFICATION_LABELS = {
  "A": { label: "קטגוריה A: עמדה רשמית של האיגוד", class: "cat-a" },
  "B": { label: "קטגוריה B: מסמך משותף עם מש״מ", class: "cat-b" },
  "C": { label: "קטגוריה C: הרצאת יו״ר / נייר מומחה", class: "cat-c" },
  "D": { label: "קטגוריה D: מחקר סינתזה 2026", class: "cat-d" }
};

const POLICY_TIER_CONFIG = {
  documented_influence: { label: "השפעה מתועדת (דרגה 3)", class: "documented-influence", icon: "🏆" },
  alignment: { label: "התאמה למדיניות (דרגה 2)", class: "alignment", icon: "⚖️" },
  precedence: { label: "קדימות בזמן (דרגה 1)", class: "precedence", icon: "⏳" },
  divergence: { label: "אי-התאמה / סטייה", class: "divergence", icon: "⚡" },
  not_applicable: { label: "לא רלוונטי להשוואה", class: "not-applicable", icon: "⚪" }
};

function formatNIS(num) {
  if (!num || isNaN(num)) return null;
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' מיליארד ₪';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' מיליון ₪';
  return Number(num).toLocaleString('he-IL') + ' ₪';
}

// Initialize Application
async function initApp() {
  try {
    const [
      sourcesRes,
      partiesRes,
      issuesRes,
      positionsRes,
      commitmentsRes,
      executionRes,
      entitiesRes,
      unionPositionsRes,
      sysMetaRes
    ] = await Promise.all([
      fetch("data/sources.json?v=2.5.0"),
      fetch("data/parties.json?v=2.5.0"),
      fetch("data/issues.json?v=2.5.0"),
      fetch("data/positions.json?v=2.5.0"),
      fetch("data/commitments.json?v=2.5.0"),
      fetch("data/execution.json?v=2.5.0"),
      fetch("data/professional-entities.json?v=2.5.0"),
      fetch("data/union-positions.json?v=2.5.0"),
      fetch("data/system-metadata.json?v=2.5.0").then(r => r.json()).catch(() => null)
    ]);

    STATE.sources = (await sourcesRes.json()).sources || [];
    STATE.parties = (await partiesRes.json()).parties || [];
    STATE.issues = (await issuesRes.json()).issues || [];
    STATE.positions = (await positionsRes.json()).positions || [];
    STATE.commitments = (await commitmentsRes.json()).commitments || [];
    STATE.execution = (await executionRes.json()).executionRecords || [];
    STATE.entities = (await entitiesRes.json()).entities || [];
    STATE.unionPositions = (await unionPositionsRes.json()).positions || [];
    STATE.systemMetadata = sysMetaRes || null;

    // Initialize AskEngine
    if (window.AskEngine) {
      window.AskEngine.init();
    }

    setupTopNavigation();
    setupSubNavigation();
    renderPartyScreenSelectors();
    renderIssueScreenSelectors();
    renderCoalitionPartySelectors();
    renderUnionTopicSelectors();
    setupAskScreenEvents();
    renderActiveView();
    setupDrawerEvents();
  } catch (err) {
    console.error("Error loading application data:", err);
    document.getElementById("party-content-area").innerHTML = 
      '<div class="error-notice"><h3>שגיאה בטעינת הנתונים</h3><p>' + err.message + '</p></div>';
  }
}

// ----------------------------------------------------
// NAVIGATION LOGIC (Section -> Subview)
// ----------------------------------------------------
function setupTopNavigation() {
  document.querySelectorAll(".main-nav-bar .nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const section = tab.getAttribute("data-section");
      if (!section) return;
      STATE.activeSection = section;

      document.querySelectorAll(".main-nav-bar .nav-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".main-section-view").forEach(s => s.classList.remove("active"));
      const targetSec = document.getElementById("section-" + section);
      if (targetSec) targetSec.classList.add("active");

      renderActiveView();
    });
  });
}

function setupSubNavigation() {
  document.querySelectorAll(".sub-nav-bar .sub-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const subview = tab.getAttribute("data-subview");
      STATE.activeSubview = subview;

      document.querySelectorAll(".sub-nav-bar .sub-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".sub-view").forEach(v => v.classList.remove("active"));
      const targetSub = document.getElementById("subview-" + subview);
      if (targetSub) targetSub.classList.add("active");

      renderActiveView();
    });
  });
}

function renderActiveView() {
  if (STATE.activeSection === "platforms") {
    if (STATE.activeSubview === "party") {
      renderPartyScreen(STATE.selectedPartyId);
    } else if (STATE.activeSubview === "issue") {
      renderIssueScreen(STATE.selectedIssueId);
    }
  } else if (STATE.activeSection === "coalition") {
    renderCoalitionPartySelectors();
    renderExecutionScreen(STATE.selectedCoalitionPartyId);
  } else if (STATE.activeSection === "union") {
    renderUnionTopicSelectors();
    renderUnionScreen();
  } else if (STATE.activeSection === "methodology") {
    renderMethodologyScreen();
  }
}

function renderMethodologyScreen() {
  const meta = STATE.systemMetadata;
  if (!meta) return;
  const lastUpdateEl = document.getElementById("meta-last-update");
  const docsCountEl = document.getElementById("meta-docs-count");
  const claimsCountEl = document.getElementById("meta-claims-count");
  const compsCountEl = document.getElementById("meta-comps-count");

  if (lastUpdateEl && meta.lastKnowledgeUpdate) {
    lastUpdateEl.textContent = meta.lastKnowledgeUpdate;
  }
  if (docsCountEl && meta.documentsCount) {
    docsCountEl.textContent = meta.documentsCount + " מסמכים";
  }
  if (claimsCountEl && meta.claimsCount) {
    claimsCountEl.textContent = meta.claimsCount + " טענות";
  }
  if (compsCountEl && meta.comparisonsCount) {
    compsCountEl.textContent = meta.comparisonsCount + " השוואות";
  }
}

// Helper: Get list of parties that actually have platform/research positions (with robust Fallback Protection)
function getPlatformParties() {
  const legacyAliases = ["PARTY-YESH-ATID", "PARTY-BENNETT", "PARTY-NAFTALI-BENNETT", "YESH-ATID", "BENNETT"];
  
  return STATE.parties
    .filter(party => {
      // Epistemic Fallback Filter: Never create separate buttons for Yesh Atid or Bennett
      if (legacyAliases.includes(party.id)) return false;
      if (party.nameHe === "יש עתיד" || party.nameHe === "בנט" || party.nameHe === "נפתלי בנט") return false;
      return STATE.positions.some(p => p.partyId === party.id || (party.id === "PARTY-BEYACHAD" && legacyAliases.includes(p.partyId)));
    })
    .map(party => {
      const partyPositions = STATE.positions.filter(p => p.partyId === party.id || (party.id === "PARTY-BEYACHAD" && legacyAliases.includes(p.partyId)));
      const samplePos = partyPositions.find(p => p.sourceType || p.verificationLevel || p.sourceStatus) || partyPositions[0];
      let qualityKey = "primary_source";
      if (samplePos) {
        if (samplePos.sourceType === "secondary_research_source" || samplePos.verificationLevel === "secondary_research") {
          qualityKey = "secondary_research";
        } else if (samplePos.sourceType === "party_platform_historical") {
          qualityKey = "primary_historical";
        } else {
          qualityKey = "primary_source";
        }
      }
      const displayName = party.id === "PARTY-BEYACHAD" ? "ביחד" : getPartyName(party);
      return {
        ...party,
        nameHe: displayName,
        displayName: displayName,
        qualityInfo: SOURCE_QUALITY_CONFIG[qualityKey] || SOURCE_QUALITY_CONFIG.default
      };
    });
}

// Helper: Get list of coalition parties that have commitments
function getCoalitionParties() {
  const coalitionPartyIds = Array.from(new Set(STATE.commitments.flatMap(c => c.partyIds || (c.partyId ? [c.partyId] : []))));
  return STATE.parties.filter(p => coalitionPartyIds.includes(p.id));
}

// ----------------------------------------------------
// SCREEN 1.1: PARTY SCREEN (מפלגה במבט אחד)
// ----------------------------------------------------
function renderPartyScreenSelectors() {
  const container = document.getElementById("party-buttons-container");
  if (!container) return;

  const validParties = getPlatformParties();
  container.innerHTML = validParties.map(party => {
    const isActive = party.id === STATE.selectedPartyId ? "active" : "";
    const pName = getPartyName(party);
    return '<button class="party-btn ' + isActive + '" data-party-id="' + party.id + '">' +
      '<span class="btn-name">' + pName + '</span>' +
      '<span class="btn-quality-badge ' + party.qualityInfo.class + '">' + party.qualityInfo.icon + ' ' + party.qualityInfo.label + '</span>' +
      '</button>';
  }).join("");

  container.querySelectorAll(".party-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.selectedPartyId = btn.getAttribute("data-party-id");
      container.querySelectorAll(".party-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderPartyScreen(STATE.selectedPartyId);
    });
  });
}

function renderPartyScreen(partyId) {
  const container = document.getElementById("party-content-area");
  if (!container) return;

  const party = STATE.parties.find(p => p.id === partyId);
  if (!party) {
    container.innerHTML = '<div class="empty-notice"><p>מפלגה לא נמצאה.</p></div>';
    return;
  }

  const pName = getPartyName(party);
  const pLeader = getPartyLeader(party);
  const partyPositions = STATE.positions.filter(p => p.partyId === partyId);
  const samplePos = partyPositions[0];
  let qualityKey = "primary_source";
  if (samplePos) {
    if (samplePos.sourceType === "secondary_research_source" || samplePos.verificationLevel === "secondary_research") {
      qualityKey = "secondary_research";
    } else if (samplePos.sourceType === "party_platform_historical") {
      qualityKey = "primary_historical";
    }
  }
  const sourceQuality = SOURCE_QUALITY_CONFIG[qualityKey] || SOURCE_QUALITY_CONFIG.default;
  const partyDoc = getPartyPlatformDoc(party.id);

  let html = '';

  // Top General Google Drive Folder Banner for Party Platforms
  html += '<div class="drive-all-agreements-banner">';
  html += '<a href="' + DRIVE_PLATFORMS_FOLDER_URL + '" target="_blank" rel="noopener noreferrer" class="drive-all-btn">';
  html += '📂 צפייה בכל מצעי המפלגות ב־Drive ↗';
  html += '</a>';
  html += '<span class="drive-all-hint">ספריית מסמכי המצע והמחקר המלאה לקראת תשפ״ז והבחירות לכנסת</span>';
  html += '</div>';

  html += '<div class="party-header-card">';
  html += '<div class="party-title-wrap">';
  html += '<h3 class="party-main-name">' + pName + '</h3>';
  if (pLeader) {
    html += '<span class="party-leader-badge">יו״ר / סיעה: ' + pLeader + '</span>';
  }
  html += '</div>';
  html += '<div class="party-quality-indicator ' + sourceQuality.class + '">';
  html += '<span class="indicator-icon">' + sourceQuality.icon + '</span>';
  html += '<div class="indicator-text">';
  html += '<strong>מעמד ראייתי: ' + sourceQuality.label + '</strong>';
  if (party.notes) {
    html += '<p class="indicator-note">' + party.notes + '</p>';
  }
  html += '</div>';
  html += '</div>';

  // Direct Document Access Button
  html += '<div class="party-doc-action-wrap">';
  html += '<a href="' + partyDoc.url + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn primary-doc-btn">';
  html += partyDoc.btnText;
  html += '</a>';
  html += '</div>';

  html += '</div>'; // End party-header-card

  html += '<div class="positions-grid">';
  STATE.issues.forEach(issue => {
    const pos = partyPositions.find(p => p.issueId === issue.id);
    const stanceConfig = (pos && STANCE_CONFIG[pos.stance]) ? STANCE_CONFIG[pos.stance] : STANCE_CONFIG.default;
    const isNotStated = !pos || pos.stance === "not_stated";
    const isTitle = getIssueTitle(issue);
    const isIcon = getIssueIcon(issue);

    html += '<div class="position-card ' + (isNotStated ? 'is-not-stated' : '') + '">';
    html += '<div class="card-top">';
    html += '<h4 class="card-issue-title">' + isIcon + ' ' + isTitle + '</h4>';
    html += '<span class="stance-pill ' + stanceConfig.class + '">' + stanceConfig.label + '</span>';
    html += '</div>';

    if (isNotStated) {
      html += '<div class="not-stated-box">';
      html += '<p class="not-stated-text">לא אותרה התייחסות מפורשת לסוגיה זו במסמך המקור שנבדק.</p>';
      html += '</div>';
    } else {
      html += '<p class="card-summary">' + (pos.summary || '') + '</p>';
      if (pos.verbatimQuote) {
        html += '<blockquote class="card-quote">' + pos.verbatimQuote + '</blockquote>';
      }
      const analysisText = getAnalysisText(pos.analysis);
      if (analysisText) {
        html += '<div class="card-analysis"><span class="analysis-tag">הערכת מחקר:</span> ' + analysisText + '</div>';
      }
      const assessmentText = getAssessmentText(pos.assessment);
      if (assessmentText) {
        html += '<div class="card-analysis" style="margin-top:6px; background-color:#eff6ff; border-right-color:#3b82f6;"><span class="analysis-tag" style="color:#1e40af;">משמעות מוניציפלית:</span> ' + assessmentText + '</div>';
      }
    }

    if (pos && pos.sourceId) {
      const sourceHumanText = getHumanSourceLabel(pos.sourceId, pos.sourceCitation || pos.citation);
      html += '<div class="card-footer">';
      html += '<button class="source-btn" data-source-id="' + pos.sourceId + '" data-citation="' + (pos.sourceCitation || pos.citation || '') + '">';
      html += '🔍 מקור: ' + sourceHumanText;
      html += '</button>';
      html += '<a href="' + partyDoc.url + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">';
      html += partyDoc.btnText;
      html += '</a>';
      html += '</div>';
    }

    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// SCREEN 1.2: ISSUE SCREEN (השוואה לפי סוגיה)
// ----------------------------------------------------
function renderIssueScreenSelectors() {
  const container = document.getElementById("issue-buttons-container");
  if (!container) return;

  container.innerHTML = STATE.issues.map(issue => {
    const isActive = issue.id === STATE.selectedIssueId ? "active" : "";
    const isTitle = getIssueTitle(issue);
    const isIcon = getIssueIcon(issue);
    return '<button class="issue-btn ' + isActive + '" data-issue-id="' + issue.id + '">' +
      '<span class="issue-icon">' + isIcon + '</span> ' + isTitle +
      '</button>';
  }).join("");

  container.querySelectorAll(".issue-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.selectedIssueId = btn.getAttribute("data-issue-id");
      container.querySelectorAll(".issue-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderIssueScreen(STATE.selectedIssueId);
    });
  });
}

function renderIssueScreen(issueId) {
  const container = document.getElementById("issue-content-area");
  if (!container) return;

  const issue = STATE.issues.find(i => i.id === issueId);
  if (!issue) {
    container.innerHTML = '<div class="empty-notice"><p>סוגיה לא נמצאה.</p></div>';
    return;
  }

  const isTitle = getIssueTitle(issue);
  const isIcon = getIssueIcon(issue);
  const validParties = getPlatformParties();

  let html = '';

  // Top General Google Drive Folder Banner for Party Platforms
  html += '<div class="drive-all-agreements-banner">';
  html += '<a href="' + DRIVE_PLATFORMS_FOLDER_URL + '" target="_blank" rel="noopener noreferrer" class="drive-all-btn">';
  html += '📂 צפייה בכל מצעי המפלגות ב־Drive ↗';
  html += '</a>';
  html += '<span class="drive-all-hint">ספריית מסמכי המצע והמחקר המלאה לקראת תשפ״ז והבחירות לכנסת</span>';
  html += '</div>';

  html += '<div class="issue-header-card">';
  html += '<div class="issue-header-title-wrap">';
  html += '<h3 class="issue-main-name">' + isIcon + ' ' + isTitle + '</h3>';
  html += '<p class="issue-desc">' + (issue.description || '') + '</p>';
  html += '</div>';
  html += '</div>';

  // Professional Municipal Leadership Callout (Union of Education Department Directors)
  const unionPositionsForIssue = (STATE.unionPositions || []).filter(u => u.issueId === issueId);
  if (unionPositionsForIssue.length > 0) {
    html += '<div class="union-issue-callout">';
    html += '<div class="union-callout-header">';
    html += '<div class="union-callout-title">🏛️ עמדת איגוד מנהלי אגפי החינוך (הנהגה מקצועית רשותית)</div>';
    html += '<span class="tier-badge alignment">השוואת מדיניות מקצועית</span>';
    html += '</div>';
    html += '<div class="union-callout-body">';
    unionPositionsForIssue.forEach(up => {
      const tierConf = POLICY_TIER_CONFIG[up.policyComparison ? up.policyComparison.comparisonTier : 'alignment'] || POLICY_TIER_CONFIG.alignment;
      const catConf = SOURCE_CLASSIFICATION_LABELS[up.sourceClassification] || { label: "מקור מקצועי", class: "cat-a" };
      const tierLabel = (up.policyComparison && up.policyComparison.tierLabelHe) ? up.policyComparison.tierLabelHe : tierConf.label;
      html += '<div style="margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid rgba(16,185,129,0.18);">';
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">';
      html += '<strong style="color:#065f46; font-size:0.98rem;">' + (up.topic || '') + '</strong>';
      html += '<div style="display:flex; gap:6px; align-items:center;">';
      html += '<span class="source-cat-pill ' + catConf.class + '">' + catConf.label + '</span>';
      html += '<span class="tier-badge ' + tierConf.class + '">' + tierConf.icon + ' ' + tierLabel + '</span>';
      html += '</div>';
      html += '</div>';
      if (up.verbatimQuote) {
        html += '<blockquote class="union-quote-box" style="margin:8px 0;"><span class="union-quote-label">ציטוט ממסמך המקור:</span><p class="union-quote-text">"' + up.verbatimQuote + '"</p><span class="union-quote-citation">' + (up.sourceCitation || '') + '</span></blockquote>';
      }
      html += '<p style="font-size:0.9rem; color:#334155; margin:6px 0;"><strong>עיקרי העמדה:</strong> ' + (up.summary || '') + '</p>';
      if (up.policyComparison && up.policyComparison.evidenceDetails) {
        html += '<div class="union-epistemic-box evidence-box"><span class="epistemic-prefix">מבחן ראיות והשפעה:</span> ' + up.policyComparison.evidenceDetails + '</div>';
      }
      const srcObj = STATE.sources ? STATE.sources.find(s => s.id === up.sourceId) : null;
      const driveUrl = (srcObj && srcObj.url) ? srcObj.url : DRIVE_UNION_FOLDER_URL;
      html += '<div class="union-callout-footer">';
      html += '<button class="source-btn" data-source-id="' + (up.sourceId || '') + '" data-citation="' + (up.sourceCitation || '') + '">🔍 פרטי מקור האיגוד</button>';
      html += '<a href="' + driveUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">📄 פתח מסמך מקור ב-Drive ↗</a>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  html += '<div class="comparison-grid">';
  validParties.forEach(party => {
    const pos = STATE.positions.find(p => p.partyId === party.id && p.issueId === issueId);
    const stanceConfig = (pos && STANCE_CONFIG[pos.stance]) ? STANCE_CONFIG[pos.stance] : STANCE_CONFIG.default;
    const isNotStated = !pos || pos.stance === "not_stated";
    const pName = getPartyName(party);
    const partyDoc = getPartyPlatformDoc(party.id);

    html += '<div class="comparison-card ' + (isNotStated ? 'is-not-stated' : '') + '">';
    html += '<div class="comp-header">';
    html += '<div class="comp-party-name">' + pName + '</div>';
    html += '<span class="stance-pill ' + stanceConfig.class + '">' + stanceConfig.label + '</span>';
    html += '</div>';

    if (isNotStated) {
      html += '<div class="not-stated-box"><p class="not-stated-text">לא נאמר במפורש במסמך המקור.</p></div>';
    } else {
      html += '<p class="comp-summary">' + (pos.summary || '') + '</p>';
      if (pos.verbatimQuote) {
        html += '<blockquote class="comp-quote">' + pos.verbatimQuote + '</blockquote>';
      }
      const analysisText = getAnalysisText(pos.analysis);
      if (analysisText) {
        html += '<div class="comp-analysis">' + analysisText + '</div>';
      }
    }

    if (pos && pos.sourceId) {
      const sourceHumanText = getHumanSourceLabel(pos.sourceId, pos.sourceCitation || pos.citation);
      html += '<div class="comp-footer">';
      html += '<button class="source-btn" data-source-id="' + pos.sourceId + '" data-citation="' + (pos.sourceCitation || pos.citation || '') + '">';
      html += '🔍 מקור: ' + sourceHumanText;
      html += '</button>';
      html += '<a href="' + partyDoc.url + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">';
      html += partyDoc.btnText;
      html += '</a>';
      html += '</div>';
    }

    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// SCREEN 2: COALITION SCREEN (הסכמים קואליציוניים ומבחן הביצוע)
// ----------------------------------------------------
function renderCoalitionPartySelectors() {
  const container = document.getElementById("coalition-party-buttons-container");
  if (!container) return;

  const coalitionParties = getCoalitionParties();
  container.innerHTML = coalitionParties.map(party => {
    const isActive = party.id === STATE.selectedCoalitionPartyId ? "active" : "";
    const pName = getPartyName(party);
    return '<button class="party-btn ' + isActive + '" data-coalition-party-id="' + party.id + '">' +
      '<span class="btn-name">' + pName + '</span>' +
      '</button>';
  }).join("");

  container.querySelectorAll(".party-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.selectedCoalitionPartyId = btn.getAttribute("data-coalition-party-id");
      container.querySelectorAll(".party-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderExecutionScreen(STATE.selectedCoalitionPartyId);
    });
  });
}

function renderExecutionScreen(partyId) {
  const container = document.getElementById("execution-content-area");
  if (!container) return;

  const party = STATE.parties.find(p => p.id === partyId);
  const pName = getPartyName(party);
  const partyCommitments = STATE.commitments.filter(c => (c.partyIds && c.partyIds.includes(partyId)) || c.partyId === partyId);

  let html = '';

  // Top General Google Drive Folder Banner
  html += '<div class="drive-all-agreements-banner">';
  html += '<a href="' + DRIVE_COALITION_FOLDER_URL + '" target="_blank" rel="noopener noreferrer" class="drive-all-btn">';
  html += '📂 צפייה בכל 7 ההסכמים הקואליציוניים ב־Drive ↗';
  html += '</a>';
  html += '<span class="drive-all-hint">ספריית המקורות המלאה של 7 ההסכמים החתומים (הממשלה ה-37) ב-Google Drive</span>';
  html += '</div>';

  if (partyCommitments.length === 0) {
    html += '<div class="empty-notice"><p>לא נמצאו התחייבויות קואליציוניות מתועדות עבור סיעה זו.</p></div>';
    container.innerHTML = html;
    return;
  }

  html += '<div class="execution-list">';
  partyCommitments.forEach(cmt => {
    const execRecord = STATE.execution.find(e => e.commitmentId === cmt.id);
    const statusKey = execRecord ? execRecord.status : "under_review";
    const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;
    const pdfUrl = getAgreementPdfUrl(cmt.sourceId, party ? party.id : null);
    const cleanSourceLabel = getAgreementCleanTitle(pName, cmt.sectionRef, cmt.pageNumber);

    html += '<div class="execution-card">';
    html += '<div class="exec-header">';
    html += '<div class="exec-meta-left">';
    html += '<span class="exec-party-tag">' + pName + '</span>';
    html += '<span class="exec-clause-tag">' + (cmt.sectionRef || 'סעיף הסכם') + '</span>';
    html += '</div>';
    html += '<span class="status-badge ' + statusInfo.class + '">' + statusInfo.label + '</span>';
    html += '</div>';

    // 1. נוסח ההתחייבות
    html += '<div class="tier-section tier-commitment">';
    html += '<div class="tier-head"><span class="tier-num">1</span> <h4>נוסח ההתחייבות בהסכם הקואליציוני החתום</h4></div>';
    html += '<blockquote class="verbatim-clause">' + cmt.verbatimText + '</blockquote>';
    if (cmt.budgetAmountNIS) {
      html += '<div class="budget-tag-wrap">💰 תקציב נקוב בהסכם: <strong>' + formatNIS(cmt.budgetAmountNIS) + '</strong></div>';
    }
    html += '<div class="tier-source-row">';
    html += '<div class="source-human-label">מקור: <strong>' + cleanSourceLabel + '</strong></div>';
    html += '<a href="' + pdfUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">📄 לצפייה בהסכם המקורי ↗</a>';
    html += '</div>';
    html += '</div>';

    // 2. החלטות ממשלה ותקציב
    html += '<div class="tier-section tier-budget">';
    html += '<div class="tier-head"><span class="tier-num">2</span> <h4>החלטות ממשלה, תקציב וצעדי יישום רשמיים</h4></div>';
    if (execRecord && (execRecord.governmentDecision || execRecord.budgetExecutionNIS || execRecord.description)) {
      html += '<div class="decision-box">';
      if (execRecord.governmentDecision) {
        html += '<p><strong>החלטת ממשלה:</strong> ' + execRecord.governmentDecision + '</p>';
      }
      if (execRecord.budgetExecutionNIS) {
        html += '<p><strong>ביצוע תקציבי מאומת:</strong> ' + formatNIS(execRecord.budgetExecutionNIS) + '</p>';
      }
      if (execRecord.description) {
        html += '<p class="exec-desc-text">' + execRecord.description + '</p>';
      }
      html += '</div>';
    } else {
      html += '<p class="missing-tier-notice">לא אותרו צעדי יישום או החלטות ממשלה נוספות במאגר.</p>';
    }
    html += '</div>';

    // 3. מבחן הביצוע בפועל
    html += '<div class="tier-section tier-reality">';
    html += '<div class="tier-head"><span class="tier-num">3</span> <h4>מבחן הביצוע בפועל והערכת מחקר</h4></div>';
    if (execRecord && execRecord.divergenceAnalysis) {
      html += '<div class="divergence-box">';
      html += '<p>' + execRecord.divergenceAnalysis + '</p>';
      html += '</div>';
    } else {
      html += '<p class="missing-tier-notice">טרם קיים במאגר מידע מאומת על ביצוע בפועל.</p>';
    }
    html += '</div>';

    // 4. סטטוס סופי
    html += '<div class="tier-section tier-status">';
    html += '<div class="tier-head"><span class="tier-num">4</span> <h4>סטטוס ביצוע מאומת</h4></div>';
    html += '<div class="status-tier-row">';
    html += '<span class="status-badge ' + statusInfo.class + '">' + statusInfo.label + '</span>';
    html += '<span class="status-source-note">מאומת מול: מסמכי מקור רשמיים ודוחות ביצוע</span>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// SCREEN 2.5: UNION SCREEN (עמדות איגוד מנהלי אגפי החינוך)
// ----------------------------------------------------
function renderUnionTopicSelectors() {
  const container = document.getElementById("union-topic-buttons-container");
  if (!container) return;

  const topics = [
    { id: "ALL", name: "כלל העמדות (6 עמדות ליבה)" },
    { id: "ISSUE-DECENTRALIZATION", name: "ביזור סמכויות וגפ״ן" },
    { id: "ISSUE-EARLY-CHILDHOOD", name: "הגיל הרך (0–3)" },
    { id: "ISSUE-SPECIAL-EDUCATION", name: "חינוך מיוחד והסעות" },
    { id: "ISSUE-CURRICULUM-STRUCTURE", name: "תוכניות לימודים וחינוך 2030" }
  ];

  container.innerHTML = topics.map(top => {
    const isActive = top.id === STATE.selectedUnionTopic ? "active" : "";
    return '<button class="party-btn ' + isActive + '" data-union-topic="' + top.id + '">' +
      '<span class="btn-name">' + top.name + '</span>' +
      '</button>';
  }).join("");

  container.querySelectorAll(".party-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.selectedUnionTopic = btn.getAttribute("data-union-topic");
      container.querySelectorAll(".party-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderUnionScreen();
    });
  });
}

function renderUnionScreen() {
  const container = document.getElementById("union-content-area");
  if (!container) return;

  const allPositions = STATE.unionPositions || [];
  const filtered = STATE.selectedUnionTopic === "ALL" 
    ? allPositions 
    : allPositions.filter(p => p.issueId === STATE.selectedUnionTopic);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-notice"><p>לא נמצאו עמדות בתחום שנבחר.</p></div>';
    return;
  }

  let html = '<div class="union-grid">';
  filtered.forEach(pos => {
    const tierConf = POLICY_TIER_CONFIG[pos.policyComparison ? pos.policyComparison.comparisonTier : 'alignment'] || POLICY_TIER_CONFIG.alignment;
    const catConf = SOURCE_CLASSIFICATION_LABELS[pos.sourceClassification] || { label: "מקור מקצועי", class: "cat-a" };
    const tierLabel = (pos.policyComparison && pos.policyComparison.tierLabelHe) ? pos.policyComparison.tierLabelHe : tierConf.label;
    const issueObj = (STATE.issues || []).find(i => i.id === pos.issueId);
    const issueTitle = (issueObj && (issueObj.subCategory || getIssueTitle(issueObj))) || (pos && pos.issueId) || "";

    html += '<div class="union-card">';

    // 1. Header
    html += '<div class="union-card-header">';
    html += '<div class="union-card-topic">' + (pos.topic || '') + '</div>';
    html += '</div>';

    // 2. Badges Wrap
    html += '<div class="union-badges-wrap">';
    html += '<span class="source-cat-pill ' + catConf.class + '">' + catConf.label + '</span>';
    html += '<span class="tier-badge ' + tierConf.class + '" title="' + tierLabel + '">' + tierConf.icon + ' ' + tierLabel + '</span>';
    if (issueTitle && issueTitle !== "undefined") {
      html += '<span class="stance-pill stance-pro">' + issueTitle + '</span>';
    }
    html += '</div>';

    // 3. Verbatim Quote from Source
    if (pos.verbatimQuote) {
      html += '<blockquote class="union-quote-box">';
      html += '<span class="union-quote-label">📜 ציטוט עובדתי ממסמך המקור:</span>';
      html += '<p class="union-quote-text">"' + pos.verbatimQuote + '"</p>';
      if (pos.sourceCitation) {
        html += '<span class="union-quote-citation">' + pos.sourceCitation + (pos.date ? ' (' + pos.date + ')' : '') + '</span>';
      }
      html += '</blockquote>';
    }

    // 4. Summary
    html += '<p class="union-summary-text"><strong>עיקרי העמדה:</strong> ' + (pos.summary || '') + '</p>';

    // 5. Epistemic Analysis Block
    if (pos.analysis && pos.analysis.text) {
      html += '<div class="union-epistemic-box analysis-box">';
      html += '<span class="epistemic-prefix">🔬 ניתוח מקצועי:</span> ' + pos.analysis.text;
      html += '</div>';
    }

    // 6. Epistemic Assessment Block
    if (pos.assessment && pos.assessment.text) {
      html += '<div class="union-epistemic-box assessment-box">';
      html += '<span class="epistemic-prefix">📊 הערכת מדיניות:</span> ' + pos.assessment.text;
      html += '</div>';
    }

    // 7. Policy Comparison Evidence Details (Strict Evidence Scale)
    if (pos.policyComparison && pos.policyComparison.evidenceDetails) {
      html += '<div class="union-epistemic-box evidence-box">';
      html += '<span class="epistemic-prefix">⚖️ מבחן ראיות והשפעה (' + tierLabel + '):</span> ' + pos.policyComparison.evidenceDetails;
      html += '</div>';
    }

    // 8. Municipal Lens Impact
    if (pos.municipalImpactAnalysis) {
      const mia = pos.municipalImpactAnalysis;
      html += '<div class="card-analysis" style="margin-top:8px; background-color:#eff6ff; border-right-color:#3b82f6;">';
      html += '<span class="analysis-tag" style="color:#1e40af;">🏛️ משמעות מוניציפלית:</span> ' + (mia.localAuthorityImpact || mia.changeFromCurrentState || '');
      html += '</div>';
    }

    // 9. Card Footer with Source Drawer and direct Drive doc link
    const srcObj = STATE.sources ? STATE.sources.find(s => s.id === pos.sourceId) : null;
    const driveUrl = (srcObj && srcObj.url) ? srcObj.url : DRIVE_UNION_FOLDER_URL;
    html += '<div class="comp-footer" style="margin-top:14px;">';
    html += '<button class="source-btn" data-source-id="' + (pos.sourceId || '') + '" data-citation="' + (pos.sourceCitation || '') + '">🔍 פרטי מקור האיגוד</button>';
    html += '<a href="' + driveUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">📄 פתח מסמך מקור ב-Drive ↗</a>';
    html += '</div>';

    html += '</div>'; // End union-card
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// ----------------------------------------------------
// SCREEN 3: ASK THE RESEARCH / RESEARCH HUB (מרכז המחקר)
// ----------------------------------------------------
let currentResearchFilter = "all";

function setupAskScreenEvents() {
  const queryInput = document.getElementById("ask-query-input");
  const submitBtn = document.getElementById("ask-submit-btn");
  const clearBtn = document.getElementById("ask-clear-btn");
  const chips = document.querySelectorAll(".sample-chip");
  const filterPills = document.querySelectorAll(".filter-pill");

  if (filterPills && filterPills.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        filterPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentResearchFilter = pill.getAttribute("data-filter") || "all";
        const q = queryInput ? queryInput.value.trim() : "";
        if (q) {
          handleAskQuery(q, currentResearchFilter);
        }
      });
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const q = queryInput ? queryInput.value.trim() : "";
      handleAskQuery(q, currentResearchFilter);
    });
  }

  if (queryInput) {
    queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAskQuery(queryInput.value.trim(), currentResearchFilter);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (queryInput) queryInput.value = "";
      const resultsContainer = document.getElementById("ask-results-container");
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="ask-empty-state">
            <div class="empty-icon">🔎</div>
            <h3>בחר שאלה לדוגמה או הקלד שאילתה משלך</h3>
            <p>המנוע סורק בזמן אמת עמדות רשמיות של איגוד מנהלי החינוך, 51 השוואות למצעי המפלגות, התחייבויות קואליציוניות ומבחן הביצוע, ומציג תשובה רב-שכבתית מבוססת מקורות.</p>
          </div>
        `;
      }
    });
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (queryInput) queryInput.value = q;
      handleAskQuery(q, currentResearchFilter);
    });
  });
}

async function handleAskQuery(query, activeFilter = 'all') {
  if (!query) return;
  const resultsContainer = document.getElementById("ask-results-container");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="ask-empty-state">
      <div class="empty-icon">⏳</div>
      <h3>מרכז המחקר מעבד את השאילתה ומצליב מקורות...</h3>
      <p>סורק עמדות איגוד, מצעי מפלגות רשמיים, הסכמים קואליציוניים ומבחן ביצוע...</p>
    </div>
  `;

  if (!window.AskEngine) {
    resultsContainer.innerHTML = '<div class="empty-notice"><p>מנוע המחקר טרם נטען. אנא נסה שוב בעוד מספר שניות.</p></div>';
    return;
  }

  const result = await window.AskEngine.answer(query, activeFilter);
  renderAskAnswer(result);
}

function renderAskAnswer(result) {
  const container = document.getElementById("ask-results-container");
  if (!container) return;

  if (!result || !result.found) {
    container.innerHTML = `
      <div class="ask-empty-state">
        <div class="empty-icon">🔍</div>
        <h3>לא נמצא מספיק מידע</h3>
        <p>${(result && (result.message || (result.summaryParagraphs && result.summaryParagraphs[0]))) || 'לא נמצא במאגר מידע מספק להשיב על השאלה.'}</p>
      </div>
    `;
    return;
  }

  // 1. Research Hub 4-Layer Mode
  if (result.isResearchHub) {
    const filter = result.activeFilter || 'all';
    let html = '';
    html += '<div class="ask-answer-card">';

    // Format natural query display title
    let displayTitle = result.query || '';
    if (displayTitle) {
      let q = displayTitle.trim().replace(/^["״']|["״']$/g, '').trim();
      const prefixes = [
        /^מה עמדת האיגוד בנושא\s*/i,
        /^אילו מפלגות קרובות לעמדת האיגוד בנושא\s*/i,
        /^מה הפער בין האיגוד למפלגות בנושא\s*/i,
        /^מה אומר המחקר על\s*/i,
        /^מה הובטח ומה בוצע בנושא\s*/i,
        /^מה עמדת האיגוד לגבי\s*/i,
        /^מה עמדת איגוד מנהלי החינוך לגבי\s*/i,
        /^מה עמדת האיגוד ב\s*/i
      ];
      for (const prefix of prefixes) {
        if (prefix.test(q)) {
          q = q.replace(prefix, '').replace(/\?$/, '').trim();
          break;
        }
      }
      displayTitle = `תוצאות המחקר בנושא: ${q || result.topicName || 'מדיניות חינוך'}`;
    } else {
      displayTitle = `תוצאות המחקר בנושא: ${result.topicName || 'מדיניות חינוך'}`;
    }

    // Header
    html += '<div class="answer-header">';
    html += '<h3 class="answer-query-title">' + displayTitle + '</h3>';
    html += '<span class="answer-meta-pill">מרכז המחקר | ' + (result.topicName || 'ניתוח רב-שכבתי מבוסס מקורות') + '</span>';
    html += '</div>';

    // Layer 1: Short Summary (2-3 sentences, 3-part bolded)
    const formattedShortSummary = (result.shortSummary || '')
      .replace(/(עמדת האיגוד:?)/g, '<strong>$1</strong>')
      .replace(/(מצעי המפלגות:?)/g, '<strong>$1</strong>')
      .replace(/(הסכמים וביצוע:?|הסכמים\/ביצוע:?)/g, '<strong>$1</strong>');

    html += '<div class="answer-short-summary">';
    html += '<span class="short-summary-badge">⚡ תשובה קצרה ומסונתזת</span>';
    html += '<p class="short-summary-text">' + formattedShortSummary + '</p>';
    html += '</div>';

    // Layer 2: What Does the Union Say?
    const showUnion = (filter === 'all' || filter === 'union' || filter === 'comparison') && result.unionSection;
    if (showUnion) {
      const u = result.unionSection;
      html += '<div class="union-layer-card">';
      html += '<div class="union-layer-header">';
      html += '<h4 class="union-layer-title">🎓 מה אומר איגוד מנהלי ומנהלות אגפי החינוך?</h4>';
      html += '<span class="union-authority-badge">' + u.sourceAuthorityLabel + '</span>';
      html += '</div>';
      html += '<p class="union-claim-p">' + u.claimText + '</p>';
      if (u.quote) {
        html += '<blockquote class="union-quote-box-clean">״' + u.quote + '״</blockquote>';
      }
      html += '<div class="union-source-ref-bar">';
      html += '<span>📄 מקור: <strong>' + u.documentTitle + '</strong> (' + u.documentYear + ')</span>';
      html += '<a href="' + u.documentUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">📂 פתח מסמך מקור ב-Drive ↗</a>';
      html += '</div>';

      // Evolution stations over the years
      if (u.evolutionStations && u.evolutionStations.length > 1) {
        html += '<div class="union-evolution-box">';
        html += '<h5 class="union-evolution-title">⏱️ התפתחות העמדה לאורך השנים</h5>';
        html += '<div class="union-evolution-timeline">';
        u.evolutionStations.forEach(st => {
          html += '<div class="union-evolution-station">';
          html += '<span class="union-station-year">' + st.year + '</span>';
          html += '<div class="union-station-content">';
          html += '<span class="union-station-title">' + st.title + '</span>';
          if (st.description && st.description !== st.title) {
            html += '<p class="union-station-desc">' + st.description + '</p>';
          }
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
        html += '</div>';
      }

      if (u.secondaryClaims && u.secondaryClaims.length > 0) {
        html += '<div style="margin-top: 8px; border-top: 1px dashed #bbf7d0; padding-top: 8px;">';
        html += '<span style="font-size: 0.78rem; font-weight: 700; color: #166534;">דגשים נוספים בעמדת האיגוד:</span>';
        html += '<ul style="margin: 4px 0 0 0; padding-right: 18px; font-size: 0.84rem; color: #1e293b;">';
        u.secondaryClaims.forEach(sc => {
          html += '<li>' + sc.claim + ' <span style="font-size: 0.72rem; color: #047857;">[' + sc.authorityLabel + ']</span></li>';
        });
        html += '</ul>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Layer 3: What Do the Parties Offer?
    const showParties = (filter === 'all' || filter === 'platforms' || filter === 'comparison') && result.partiesSection && result.partiesSection.comparisons && result.partiesSection.comparisons.length > 0;
    if (showParties) {
      html += '<div class="answer-section">';
      html += '<h4 class="answer-section-title">⚖️ מה מציעות המפלגות? — השוואת עמדות מול האיגוד</h4>';
      html += '<div style="font-size: 0.82rem; color: #64748b; margin-bottom: 8px;">';
      html += 'ההשוואה נבחנה מול מצעי המפלגות הרשמיים. היעדר עמדה במצע מסומן כהיעדר מידע במצע ולא כהתנגדות.';
      html += '</div>';
      html += '<div class="party-comp-grid">';
      result.partiesSection.comparisons.forEach(c => {
        html += '<div class="party-comp-card">';
        html += '<div class="party-comp-header">';
        html += '<span class="party-comp-name">' + c.partyName + '</span>';
        html += '<span class="alignment-badge ' + c.alignmentClass + '">' + c.alignmentLabel + '</span>';
        html += '</div>';

        if (c.humanReason) {
          html += '<div class="comp-why-box">';
          html += '<span class="comp-why-label">💡 למה?</span>';
          html += '<span class="comp-why-text">' + c.humanReason + '</span>';
          html += '</div>';
        }

        html += '<details class="comp-details-expand">';
        html += '<summary class="comp-expand-summary">🔍 הצג פירוט מלא והשוואת מדדים</summary>';
        html += '<div class="comp-expanded-content">';

        html += '<div class="subscores-row">';
        html += '<span class="subscore-pill">עיקרון: <strong>' + c.principleLabel + '</strong></span>';
        html += '<span class="subscore-pill">מנגנון: <strong>' + c.mechanismLabel + '</strong></span>';
        html += '<span class="subscore-pill">מעמד הרשות: <strong>' + c.municipalRoleLabel + '</strong></span>';
        html += '</div>';

        if (c.similarities && c.similarities.length > 0) {
          html += '<div class="comp-points-block">';
          html += '<div class="comp-points-title" style="color: #065f46;">✓ נקודות דמיון:</div>';
          html += '<ul style="margin: 0; padding-right: 18px;">';
          c.similarities.forEach(s => { html += '<li>' + s + '</li>'; });
          html += '</ul>';
          html += '</div>';
        }

        if (c.differences && c.differences.length > 0) {
          html += '<div class="comp-points-block">';
          html += '<div class="comp-points-title" style="color: #991b1b;">✕ הבדלים ופערים:</div>';
          html += '<ul style="margin: 0; padding-right: 18px;">';
          c.differences.forEach(d => { html += '<li>' + d + '</li>'; });
          html += '</ul>';
          html += '</div>';
        }

        if (c.evidence) {
          html += '<div class="comp-evidence-box">';
          html += '<strong>ראיה:</strong> ' + c.evidence;
          html += '</div>';
        }

        html += '</div>'; // End comp-expanded-content
        html += '</details>'; // End comp-details-expand

        html += '<div class="party-comp-footer">';
        html += '<span>מקור: ' + c.sourceLocation + '</span>';
        html += '<a href="' + c.platformUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">📄 מצע המפלגה ↗</a>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    // Layer 4: What was Promised & Executed?
    const showExecution = (filter === 'all' || filter === 'execution') && result.executionSection && result.executionSection.items && result.executionSection.items.length > 0;
    if (showExecution) {
      html += '<div class="execution-layer-card">';
      html += '<h4 class="execution-layer-title">🏛️ מה קרה בהסכמים הקואליציוניים ובמבחן הביצוע?</h4>';
      html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
      result.executionSection.items.forEach(i => {
        html += '<div class="execution-item">';
        html += '<div class="execution-item-top">';
        html += '<span class="track-badge">' + i.trackLabel + ' (' + i.partyName + ')</span>';
        html += '<span class="alignment-badge ' + i.alignmentClass + '">' + i.alignmentLabel + '</span>';
        html += '</div>';
        if (i.evidence) {
          html += '<div style="font-size: 0.88rem; color: #1e293b; line-height: 1.5;"><strong>ממצא וראיה:</strong> ' + i.evidence + '</div>';
        }
        if (i.differences && i.differences.length > 0) {
          html += '<div style="font-size: 0.82rem; color: #9a3412;"><strong>פער מהותי:</strong> ' + i.differences.join('; ') + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    // Layer 5: Collapsible Sources & Evidence Drawer
    if (result.sourcesList && result.sourcesList.length > 0) {
      html += '<details class="research-sources-drawer">';
      html += '<summary>📁 מקורות וראיות מאומתים במאגר (' + result.sourcesList.length + ' מקורות) — לחץ לצפייה</summary>';
      html += '<div class="sources-drawer-body">';
      html += '<table class="sources-table">';
      html += '<thead><tr><th>מסמך / מקור</th><th>גוף / ישות</th><th>שנה</th><th>רמת סמכות / סוג מקור</th><th>קישור</th></tr></thead>';
      html += '<tbody>';
      result.sourcesList.forEach(s => {
        html += '<tr>';
        html += '<td><strong>' + s.title + '</strong></td>';
        html += '<td>' + s.entity + '</td>';
        html += '<td>' + s.year + '</td>';
        html += '<td><span class="union-authority-badge" style="font-size: 0.72rem; padding: 2px 8px;">' + s.typeLabel + '</span></td>';
        html += '<td class="source-link-cell"><a href="' + s.url + '" target="_blank" rel="noopener noreferrer">פתח מקור ↗</a></td>';
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
      html += '</div>';
      html += '</details>';
    }

    html += '</div>'; // End ask-answer-card
    container.innerHTML = html;
    return;
  }

  // 2. Legacy Fallback Mode
  let html = '';
  html += '<div class="ask-answer-card">';
  html += '<div class="answer-header">';
  html += '<h3 class="answer-query-title">״' + result.query + '״</h3>';
  html += '<span class="answer-meta-pill">ניתוח מחקרי מסונתז מתוך בסיס הידע המאומת</span>';
  html += '</div>';

  if (result.summaryParagraphs && result.summaryParagraphs.length > 0) {
    html += '<div class="answer-synthesis-card">';
    html += '<div class="synthesis-header-label">📑 תשובה מחקרית מסונתזת:</div>';
    html += '<div class="synthesis-body">';
    result.summaryParagraphs.forEach(p => {
      const formattedP = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += '<p class="synthesis-p">' + formattedP + '</p>';
    });
    html += '</div>';
    html += '</div>';
  }

  if (result.keyFindings && result.keyFindings.length > 0) {
    html += '<div class="answer-section">';
    html += '<h4 class="answer-section-title">💡 נקודות מרכזיות וממצאים עיקריים:</h4>';
    html += '<ul class="key-findings-list">';
    result.keyFindings.forEach(f => {
      const formattedF = f.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += '<li class="finding-item">' + formattedF + '</li>';
    });
    html += '</ul>';
    html += '</div>';
  }

  if (result.contradictionAlert) {
    html += '<div class="contradiction-alert-box">';
    html += '<div class="alert-title">⚠️ ' + result.contradictionAlert.title + '</div>';
    html += '<div class="alert-text">' + result.contradictionAlert.text + '</div>';
    html += '</div>';
  }

  if (result.limitations) {
    html += '<div class="limitations-callout-box">';
    html += '<div class="limitations-title">📌 מגבלות המידע והמתודולוגיה:</div>';
    html += '<div class="limitations-text">' + result.limitations + '</div>';
    html += '</div>';
  }

  if (result.coalitionClausesList && result.coalitionClausesList.length > 0) {
    html += '<div class="answer-section">';
    html += '<h4 class="answer-section-title">📜 הראיות המרכזיות — סעיפי הסכמים קואליציוניים מאומתים:</h4>';
    html += '<div class="answer-clauses-grid">';
    result.coalitionClausesList.forEach(cl => {
      const statusInfo = STATUS_CONFIG[cl.execution_status] || STATUS_CONFIG.default;
      const pdfUrl = cl.drive_url || getAgreementPdfUrl(cl.source_id, null);
      const cleanSourceTitle = getAgreementCleanTitle(cl.party, cl.section_number, cl.page_number);

      html += '<div class="answer-clause-card">';
      html += '<div class="clause-header">';
      html += '<span class="clause-party-badge">' + cl.party + '</span>';
      html += '<span class="clause-section-tag">' + cl.section_number + '</span>';
      html += '<span class="status-badge ' + statusInfo.class + '">' + statusInfo.label + '</span>';
      html += '</div>';
      html += '<div class="clause-summary">' + cl.summary + '</div>';
      if (cl.verbatim_text) {
        html += '<blockquote class="clause-verbatim-quote">״' + cl.verbatim_text + '״</blockquote>';
      }
      if (cl.budget_amount_nis) {
        html += '<div class="clause-budget-tag">💰 תקציב נקוב: ' + formatNIS(cl.budget_amount_nis) + '</div>';
      }
      html += '<div class="clause-footer-clean">';
      html += '<span class="clause-source-text">' + cleanSourceTitle + '</span>';
      html += '<a href="' + pdfUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">📄 לצפייה בהסכם המקורי ↗</a>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  if (result.sources && result.sources.length > 0) {
    html += '<div class="answer-sources-wrap">';
    html += '<span class="sources-label">מקורות מאומתים שעליהם מתבססת התשובה:</span>';
    html += '<div class="source-pills-list">';
    result.sources.forEach(src => {
      html += '<button class="source-pill-btn" data-source-id="' + src.id + '">';
      html += (src.isPrimary ? '📜 ' : '📖 ') + (src.title || src.id);
      html += '</button>';
    });
    html += '</div>';
    html += '</div>';
  }

  html += '</div>'; // End ask-answer-card
  container.innerHTML = html;

  container.querySelectorAll(".source-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sourceId = btn.getAttribute("data-source-id");
      openSourceDrawer(sourceId);
    });
  });
}

// ----------------------------------------------------
// EVIDENCE DRAWER MODAL
// ----------------------------------------------------
function attachSourceButtonEvents(parent) {
  parent.querySelectorAll(".source-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sourceId = btn.getAttribute("data-source-id");
      const citation = btn.getAttribute("data-citation");
      openSourceDrawer(sourceId, citation);
    });
  });
}

function setupDrawerEvents() {
  const overlay = document.getElementById("drawer-overlay");
  const closeBtn = document.getElementById("drawer-close-btn");

  if (closeBtn) closeBtn.addEventListener("click", closeSourceDrawer);
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeSourceDrawer();
    });
  }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSourceDrawer();
  });
}

function openSourceDrawer(sourceId, citation) {
  const overlay = document.getElementById("drawer-overlay");
  const drawer = document.getElementById("source-drawer");
  const content = document.getElementById("drawer-content");

  const src = STATE.sources.find(s => s.id === sourceId);

  let html = '';
  if (!src) {
    html = '<div class="empty-notice"><p>פרטי המקור המבוקש:</p><p>מקור רשמי מאומת בבסיס הידע.</p></div>';
  } else {
    html += '<div class="drawer-field"><label>כותרת המקור:</label><div class="drawer-val title-val">' + src.title + '</div></div>';
    html += '<div class="drawer-field"><label>סוג מסמך:</label><div class="drawer-val">' + (SOURCE_TYPE_LABELS[src.sourceType] || src.sourceType) + '</div></div>';
    if (citation) {
      html += '<div class="drawer-field"><label>מראה מקום מדויק:</label><div class="drawer-val">' + citation + '</div></div>';
    }
    html += '<div class="drawer-field"><label>גוף מפרסם:</label><div class="drawer-val">' + (src.publisher || 'לא צוין') + '</div></div>';
    html += '<div class="drawer-field"><label>תאריך פרסום / אימות:</label><div class="drawer-val">' + (src.publicationDate || src.accessDate || 'לא צוין') + '</div></div>';
    
    const specificPdfUrl = COALITION_PDF_MAP[sourceId] || (src.url || null);
    if (specificPdfUrl) {
      const btnLabel = (src.id && src.id.startsWith("SRC-UNION-")) 
        ? "📄 לצפייה במסמך המקור ב-Drive ↗" 
        : (COALITION_PDF_MAP[sourceId] ? "📄 לצפייה בהסכם המקורי ↗" : "📄 לצפייה במסמך המקור ב-Drive ↗");
      html += '<div class="drawer-field"><label>קישור למסמך המקורי ב-Google Drive:</label><div class="drawer-val"><a href="' + specificPdfUrl + '" target="_blank" rel="noopener noreferrer" class="drive-doc-link-btn">' + btnLabel + '</a></div></div>';
    }

    if (src.notes) {
      html += '<div class="drawer-field"><label>הערות אימות וביקורת:</label><div class="drawer-val notes-val">' + src.notes + '</div></div>';
    }
  }

  content.innerHTML = html;
  overlay.classList.add("active");
  drawer.classList.add("active");
}

function closeSourceDrawer() {
  const overlay = document.getElementById("drawer-overlay");
  const drawer = document.getElementById("source-drawer");
  if (overlay) overlay.classList.remove("active");
  if (drawer) drawer.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", initApp);
