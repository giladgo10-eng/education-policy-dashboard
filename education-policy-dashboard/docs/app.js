/**
 * education-policy-dashboard: V2.0 Phase 2
 * Epistemic & Methodological Separation:
 * 1. מצעי המפלגות (מה המפלגות מציעות) -> מפלגה במבט אחד | השוואה לפי סוגיה
 * 2. הסכמים קואליציוניים ומבחן הביצוע (מה הובטח ומה בוצע) -> בורר מפלגות קואליציה נפרד + 4 שלבי ביצוע
 * 3. שאל את המחקר (Ask the Research) -> מנוע שליפה והשוואת ידע מקומי מבוסס 106 יחידות מאומתות
 */

const STATE = {
  activeSection: "platforms", // "platforms" | "coalition" | "ask"
  activeSubview: "party",     // "party" | "issue"
  sources: [],
  parties: [],
  issues: [],
  positions: [],
  commitments: [],
  execution: [],
  selectedPartyId: "PARTY-BEYACHAD",
  selectedCoalitionPartyId: "PARTY-LIKUD",
  selectedIssueId: "ISSUE-CORE-CURRICULUM"
};

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
  under_review: { label: "טרם ניתן לקבוע", group: "undetermined", class: "status-undetermined" },
  default: { label: "טרם ניתן לקבוע", group: "undetermined", class: "status-undetermined" }
};

const SOURCE_TYPE_LABELS = {
  party_platform: "מצע מפלגה רשמי",
  coalition_agreement: "הסכם קואליציוני חתום",
  official_law: "חוק רשמי",
  government_decision: "החלטת ממשלה",
  official_budget: "דוח תקציב רשמי",
  secondary_research_source: "מסמך מחקר משני"
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
      executionRes
    ] = await Promise.all([
      fetch("data/sources.json"),
      fetch("data/parties.json"),
      fetch("data/issues.json"),
      fetch("data/positions.json"),
      fetch("data/commitments.json"),
      fetch("data/execution.json")
    ]);

    STATE.sources = (await sourcesRes.json()).sources || [];
    STATE.parties = (await partiesRes.json()).parties || [];
    STATE.issues = (await issuesRes.json()).issues || [];
    STATE.positions = (await positionsRes.json()).positions || [];
    STATE.commitments = (await commitmentsRes.json()).commitments || [];
    STATE.execution = (await executionRes.json()).executionRecords || [];

    // Initialize AskEngine
    if (window.AskEngine) {
      window.AskEngine.init();
    }

    setupTopNavigation();
    setupSubNavigation();
    renderPartyScreenSelectors();
    renderIssueScreenSelectors();
    renderCoalitionPartySelectors();
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
  }
}

// Helper: Get list of parties that actually have platform/research positions
function getPlatformParties() {
  const allowedStatuses = ["primary_source", "primary_historical", "secondary_research"];
  return STATE.parties.map(party => {
    const partyPositions = STATE.positions.filter(p => p.partyId === party.id);
    const validPos = partyPositions.find(p => p.sourceStatus && allowedStatuses.includes(p.sourceStatus));
    if (!validPos) return null;
    const sourceStatus = validPos.sourceStatus;
    return {
      ...party,
      sourceStatus,
      qualityInfo: SOURCE_QUALITY_CONFIG[sourceStatus] || SOURCE_QUALITY_CONFIG.default
    };
  }).filter(Boolean);
}

// Helper: Get list of coalition parties that have commitments
function getCoalitionParties() {
  const coalitionPartyIds = Array.from(new Set(STATE.commitments.map(c => c.partyId)));
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
    return '<button class="party-btn ' + isActive + '" data-party-id="' + party.id + '">' +
      '<span class="btn-name">' + party.name + '</span>' +
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

  const partyPositions = STATE.positions.filter(p => p.partyId === partyId);
  const samplePos = partyPositions.find(p => p.sourceStatus && SOURCE_QUALITY_CONFIG[p.sourceStatus]) || partyPositions[0];
  const sourceQuality = (samplePos && samplePos.sourceStatus) ? 
    (SOURCE_QUALITY_CONFIG[samplePos.sourceStatus] || SOURCE_QUALITY_CONFIG.default) : 
    SOURCE_QUALITY_CONFIG.default;

  let html = '';
  html += '<div class="party-header-card">';
  html += '<div class="party-title-wrap">';
  html += '<h3 class="party-main-name">' + party.name + '</h3>';
  html += '<span class="party-leader-badge">יו״ר / מוביל: ' + party.leader + '</span>';
  html += '</div>';
  html += '<div class="party-quality-indicator ' + sourceQuality.class + '">';
  html += '<span class="indicator-icon">' + sourceQuality.icon + '</span>';
  html += '<div class="indicator-text">';
  html += '<strong>מעמד ראייתי: ' + sourceQuality.label + '</strong>';
  if (party.provenanceNote) {
    html += '<p class="indicator-note">' + party.provenanceNote + '</p>';
  }
  html += '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="positions-grid">';
  STATE.issues.forEach(issue => {
    const pos = partyPositions.find(p => p.issueId === issue.id);
    const stanceConfig = (pos && STANCE_CONFIG[pos.stance]) ? STANCE_CONFIG[pos.stance] : STANCE_CONFIG.default;
    const isNotStated = !pos || pos.stance === "not_stated";

    html += '<div class="position-card ' + (isNotStated ? 'is-not-stated' : '') + '">';
    html += '<div class="card-top">';
    html += '<h4 class="card-issue-title">' + issue.icon + ' ' + issue.name + '</h4>';
    html += '<span class="stance-pill ' + stanceConfig.class + '">' + stanceConfig.label + '</span>';
    html += '</div>';

    if (isNotStated) {
      html += '<div class="not-stated-box">';
      html += '<p class="not-stated-text">לא אותרה התייחסות מפורשת לסוגיה זו במסמך המקור שנבדק.</p>';
      html += '</div>';
    } else {
      html += '<p class="card-summary">' + pos.summary + '</p>';
      if (pos.verbatimQuote) {
        html += '<blockquote class="card-quote">' + pos.verbatimQuote + '</blockquote>';
      }
      if (pos.analysis) {
        html += '<div class="card-analysis"><span class="analysis-tag">הערכת מחקר:</span> ' + pos.analysis + '</div>';
      }
    }

    if (pos && pos.sourceId) {
      html += '<div class="card-footer">';
      html += '<button class="source-btn" data-source-id="' + pos.sourceId + '" data-citation="' + (pos.citation || '') + '">';
      html += '🔍 מקור: ' + pos.sourceId + (pos.citation ? ' (' + pos.citation + ')' : '');
      html += '</button>';
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
    return '<button class="issue-btn ' + isActive + '" data-issue-id="' + issue.id + '">' +
      '<span class="issue-icon">' + issue.icon + '</span> ' + issue.name +
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

  const validParties = getPlatformParties();
  let html = '';
  html += '<div class="issue-header-card">';
  html += '<div class="issue-header-title-wrap">';
  html += '<h3 class="issue-main-name">' + issue.icon + ' ' + issue.name + '</h3>';
  html += '<p class="issue-desc">' + issue.description + '</p>';
  html += '</div>';
  html += '</div>';

  html += '<div class="comparison-grid">';
  validParties.forEach(party => {
    const pos = STATE.positions.find(p => p.partyId === party.id && p.issueId === issueId);
    const stanceConfig = (pos && STANCE_CONFIG[pos.stance]) ? STANCE_CONFIG[pos.stance] : STANCE_CONFIG.default;
    const isNotStated = !pos || pos.stance === "not_stated";

    html += '<div class="comparison-card ' + (isNotStated ? 'is-not-stated' : '') + '">';
    html += '<div class="comp-header">';
    html += '<div class="comp-party-name">' + party.name + '</div>';
    html += '<span class="stance-pill ' + stanceConfig.class + '">' + stanceConfig.label + '</span>';
    html += '</div>';

    if (isNotStated) {
      html += '<div class="not-stated-box"><p class="not-stated-text">לא נאמר במפורש במסמך המקור.</p></div>';
    } else {
      html += '<p class="comp-summary">' + pos.summary + '</p>';
      if (pos.verbatimQuote) {
        html += '<blockquote class="comp-quote">' + pos.verbatimQuote + '</blockquote>';
      }
      if (pos.analysis) {
        html += '<div class="comp-analysis">' + pos.analysis + '</div>';
      }
    }

    if (pos && pos.sourceId) {
      html += '<div class="comp-footer">';
      html += '<button class="source-btn" data-source-id="' + pos.sourceId + '" data-citation="' + (pos.citation || '') + '">';
      html += '🔍 מקור: ' + pos.sourceId;
      html += '</button>';
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
    return '<button class="party-btn ' + isActive + '" data-coalition-party-id="' + party.id + '">' +
      '<span class="btn-name">' + party.name + '</span>' +
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
  const partyCommitments = STATE.commitments.filter(c => c.partyId === partyId);

  if (partyCommitments.length === 0) {
    container.innerHTML = '<div class="empty-notice"><p>לא נמצאו התחייבויות קואליציוניות מתועדות עבור סיעה זו.</p></div>';
    return;
  }

  let html = '';
  html += '<div class="execution-list">';
  partyCommitments.forEach(cmt => {
    const execRecord = STATE.execution.find(e => e.commitmentId === cmt.id);
    const statusKey = execRecord ? execRecord.status : "under_review";
    const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;

    html += '<div class="execution-card">';
    html += '<div class="exec-header">';
    html += '<div class="exec-meta-left">';
    html += '<span class="exec-party-tag">' + party.name + '</span>';
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
    html += '<button class="source-btn" data-source-id="' + cmt.sourceId + '">🔍 מקור ההתחייבות: ' + cmt.sourceId + '</button>';
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
    if (execRecord && execRecord.sourceId) {
      html += '<span class="status-source-note">מאומת מול: ' + execRecord.sourceId + '</span>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// SCREEN 3: ASK THE RESEARCH (שאל את המחקר)
// ----------------------------------------------------
function setupAskScreenEvents() {
  const queryInput = document.getElementById("ask-query-input");
  const submitBtn = document.getElementById("ask-submit-btn");
  const clearBtn = document.getElementById("ask-clear-btn");
  const chips = document.querySelectorAll(".sample-chip");

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const q = queryInput ? queryInput.value.trim() : "";
      handleAskQuery(q);
    });
  }

  if (queryInput) {
    queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAskQuery(queryInput.value.trim());
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
            <p>המנוע סורק בזמן אמת 48 טענות מחקריות, 24 עמדות מדיניות, 18 התחייבויות חתומות ו-16 ראיות ביצוע ומציג תשובה מסונתזת מבוססת עובדות.</p>
          </div>
        `;
      }
    });
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (queryInput) queryInput.value = q;
      handleAskQuery(q);
    });
  });
}

async function handleAskQuery(query) {
  if (!query) return;
  const resultsContainer = document.getElementById("ask-results-container");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="ask-empty-state">
      <div class="empty-icon">⏳</div>
      <h3>סורק את מאגר המחקר...</h3>
      <p>שולף ראיות ומצליב עמדות מתוך 106 יחידות הידע המאומתות...</p>
    </div>
  `;

  if (!window.AskEngine) {
    resultsContainer.innerHTML = '<div class="empty-notice"><p>מנוע החיפוש טרם נטען. אנא נסה שוב בעוד מספר שניות.</p></div>';
    return;
  }

  const result = await window.AskEngine.answer(query);
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
        <p>${result.shortAnswer || 'בבסיס הידע הקיים אין כרגע מספיק מידע כדי לענות על השאלה באופן מבוסס.'}</p>
      </div>
    `;
    return;
  }

  let html = '';
  html += '<div class="ask-answer-card">';

  // Header
  html += '<div class="answer-header">';
  html += '<h3 class="answer-query-title">״' + result.query + '״</h3>';
  html += '<span class="answer-meta-pill">תשובה מסונתזת מתוך בסיס הידע המאומת</span>';
  html += '</div>';

  // Summary box
  html += '<div class="answer-summary-box">';
  html += '<div class="summary-title">תשובה קצרה / תמצית מנהלים:</div>';
  html += '<div class="summary-text">' + result.shortAnswer + '</div>';
  html += '</div>';

  // Contradiction Alert if exists
  if (result.contradictionAlert) {
    html += '<div class="contradiction-alert-box">';
    html += '<div class="alert-title">⚠️ ' + result.contradictionAlert.title + '</div>';
    html += '<div class="alert-text">' + result.contradictionAlert.text + '</div>';
    html += '</div>';
  }

  // Comparison Grid if multiple parties
  if (result.comparisonList && result.comparisonList.length > 0) {
    html += '<div class="answer-section">';
    html += '<h4 class="answer-section-title">⚖️ מה אומרים המקורות — השוואת עמדות:</h4>';
    html += '<div class="answer-comparison-grid">';
    result.comparisonList.forEach(comp => {
      const badgeClass = comp.tier === "primary" ? "badge-primary" : "badge-secondary";
      const badgeLabel = comp.tier === "primary" ? "מקור רשמי" : "מחקר משני";
      html += '<div class="answer-comp-card">';
      html += '<div class="answer-comp-header">';
      html += '<span class="answer-comp-name">' + comp.entity + '</span>';
      html += '<span class="answer-comp-badge ' + badgeClass + '">' + badgeLabel + '</span>';
      html += '</div>';
      html += '<div class="answer-comp-body">' + comp.stanceText + '</div>';
      if (comp.quote) {
        html += '<blockquote class="answer-comp-quote">״' + comp.quote + '״</blockquote>';
      }
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // Execution List if execution query
  if (result.executionList && result.executionList.length > 0) {
    html += '<div class="answer-section">';
    html += '<h4 class="answer-section-title">📊 הבטחה מול ביצוע ותקציבים בפועל:</h4>';
    html += '<div class="answer-execution-list">';
    result.executionList.forEach(exec => {
      html += '<div class="answer-exec-item">';
      html += '<div class="exec-item-top">';
      html += '<span class="exec-item-title">' + (exec.beneficiary ? exec.beneficiary + ' — ' : '') + exec.title + '</span>';
      html += '<span class="status-badge ' + (exec.statusClass || 'status-partial') + '">' + exec.status + '</span>';
      html += '</div>';
      if (exec.budget) {
        html += '<div class="exec-item-budget">💰 היקף תקציבי: <strong>' + formatNIS(exec.budget) + '</strong></div>';
      }
      if (exec.notes) {
        html += '<div class="exec-item-notes">' + exec.notes + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // Detailed Bullets if general query
  if (result.detailedBullets && result.detailedBullets.length > 0 && (!result.comparisonList || result.comparisonList.length === 0)) {
    html += '<div class="answer-section">';
    html += '<h4 class="answer-section-title">📋 טענות ונתונים מרכזיים:</h4>';
    html += '<ul class="detailed-bullets-list" style="padding-right: 20px; line-height: 1.6; font-size: 0.92rem;">';
    result.detailedBullets.forEach(b => {
      html += '<li><strong>' + b.entity + ':</strong> ' + b.text + '</li>';
    });
    html += '</ul>';
    html += '</div>';
  }

  // Municipal Impact Callout
  if (result.municipalSection) {
    html += '<div class="municipal-impact-box">';
    html += '<div class="municipal-title">🏛️ משמעות לשלטון המקומי ולרשויות:</div>';
    html += '<div class="municipal-text">' + result.municipalSection + '</div>';
    html += '</div>';
  }

  // Sources Section
  if (result.sources && result.sources.length > 0) {
    html += '<div class="answer-sources-wrap">';
    html += '<span class="sources-label">מקורות מאומתים שעליהם מתבססת התשובה:</span>';
    html += '<div class="source-pills-list">';
    result.sources.forEach(src => {
      html += '<button class="source-pill-btn" data-source-id="' + src.id + '">';
      html += (src.isPrimary ? '📜 ' : '📖 ') + src.id + ' (' + src.tier + ')';
      html += '</button>';
    });
    html += '</div>';
    html += '</div>';
  }

  html += '</div>'; // End ask-answer-card

  container.innerHTML = html;

  // Bind source pill click events to the drawer modal
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
    html = '<div class="empty-notice"><p>מזהה מקור: ' + sourceId + '</p><p>פרטי המקור טרם הוזנו באינדקס.</p></div>';
  } else {
    html += '<div class="drawer-field"><label>מזהה מקור במערכת:</label><div class="drawer-val code-val">' + src.id + '</div></div>';
    html += '<div class="drawer-field"><label>כותרת המקור:</label><div class="drawer-val title-val">' + src.title + '</div></div>';
    html += '<div class="drawer-field"><label>סוג מסמך:</label><div class="drawer-val">' + (SOURCE_TYPE_LABELS[src.sourceType] || src.sourceType) + '</div></div>';
    if (citation) {
      html += '<div class="drawer-field"><label>מראה מקום מדויק:</label><div class="drawer-val">' + citation + '</div></div>';
    }
    html += '<div class="drawer-field"><label>גוף מפרסם:</label><div class="drawer-val">' + (src.publisher || 'לא צוין') + '</div></div>';
    html += '<div class="drawer-field"><label>תאריך פרסום / אימות:</label><div class="drawer-val">' + (src.publicationDate || src.accessDate || 'לא צוין') + '</div></div>';
    
    if (src.localFilePath) {
      html += '<div class="drawer-field"><label>גישה למסמך המקור:</label><div class="drawer-val local-file-val">📁 מקור ראשוני מאומת — קובץ מקומי בפרויקט (' + src.localFilePath + ')</div></div>';
    } else if (src.url) {
      html += '<div class="drawer-field"><label>קישור רשמי:</label><div class="drawer-val"><a href="' + src.url + '" target="_blank" rel="noopener">פתח קישור חיצוני &larr;</a></div></div>';
    }

    if (src.archiveHash) {
      html += '<div class="drawer-field"><label>גיבוב שלמות (SHA-256 Checksum):</label><div class="drawer-val hash-val">' + src.archiveHash + '</div></div>';
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
