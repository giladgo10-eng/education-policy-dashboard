/**
 * education-policy-dashboard: V2.0 Phase 2
 * Epistemic & Methodological Separation:
 * 1. מצעי המפלגות (מה המפלגות מציעות) -> מפלגה במבט אחד | השוואה לפי סוגיה
 * 2. הסכמים קואליציוניים ומבחן הביצוע (מה הובטח ומה בוצע) -> בורר מפלגות קואליציה נפרד + 4 שלבי ביצוע
 * 3. שאל את המחקר (Placeholder)
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
      fetch("/data/sources.json"),
      fetch("/data/parties.json"),
      fetch("/data/issues.json"),
      fetch("/data/positions.json"),
      fetch("/data/commitments.json"),
      fetch("/data/execution.json")
    ]);

    STATE.sources = (await sourcesRes.json()).sources || [];
    STATE.parties = (await partiesRes.json()).parties || [];
    STATE.issues = (await issuesRes.json()).issues || [];
    STATE.positions = (await positionsRes.json()).positions || [];
    STATE.commitments = (await commitmentsRes.json()).commitments || [];
    STATE.execution = (await executionRes.json()).executionRecords || [];

    setupTopNavigation();
    setupSubNavigation();
    renderPartyScreenSelectors();
    renderIssueScreenSelectors();
    renderCoalitionPartySelectors();
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

// Helper: Get list of coalition agreement parties from commitments.json
function getCoalitionParties() {
  const partyIdsInCommitments = new Set(STATE.commitments.flatMap(c => c.partyIds || []));
  return STATE.parties.filter(p => partyIdsInCommitments.has(p.id)).map(party => {
    const count = STATE.commitments.filter(c => (c.partyIds || []).includes(party.id)).length;
    return {
      ...party,
      commitmentCount: count
    };
  });
}

// ----------------------------------------------------
// AREA 1.1: מצעי המפלגות — מפלגה במבט אחד
// ----------------------------------------------------
function renderPartyScreenSelectors() {
  const container = document.getElementById("party-buttons-container");
  if (!container) return;

  const platformParties = getPlatformParties();

  container.innerHTML = platformParties.map(p => {
    const isSelected = p.id === STATE.selectedPartyId;
    return '<button class="party-btn ' + (isSelected ? 'active' : '') + '" data-party-id="' + p.id + '">' +
      '<span class="party-btn-name">' + p.nameHe + '</span>' +
      '<span class="quality-mini-badge ' + p.qualityInfo.class + '">' + p.qualityInfo.label + '</span>' +
    '</button>';
  }).join("");

  container.querySelectorAll(".party-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-party-id");
      STATE.selectedPartyId = id;
      container.querySelectorAll(".party-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderPartyScreen(id);
    });
  });
}

function renderPartyScreen(partyId) {
  const container = document.getElementById("party-content-area");
  if (!container) return;

  const party = STATE.parties.find(p => p.id === partyId);
  if (!party) {
    container.innerHTML = '<div class="empty-notice">לא נמצאו נתונים למפלגה שנבחרה</div>';
    return;
  }

  const partyPositions = STATE.positions.filter(pos => pos.partyId === partyId);
  const samplePos = partyPositions[0];
  const sourceQuality = samplePos ? (SOURCE_QUALITY_CONFIG[samplePos.sourceStatus] || SOURCE_QUALITY_CONFIG.default) : SOURCE_QUALITY_CONFIG.default;

  let html = '<div class="party-header-box">';
  html += '<div class="party-title-row">';
  html += '<h2 class="party-title">' + party.nameHe + '</h2>';
  html += '<span class="source-quality-pill ' + sourceQuality.class + '">' + sourceQuality.icon + ' ' + sourceQuality.label + '</span>';
  if (party.notes) {
    html += '<span class="party-notes-badge">' + party.notes + '</span>';
  }
  html += '</div>';
  html += '<p class="party-subtitle">' + (party.knessetFaction25 ? 'סיעה בכנסת ה-25: ' + party.knessetFaction25 : 'יוזמה / מפלגה לקראת תשפ״ז') + '</p>';
  html += '</div>';

  if (partyPositions.length === 0) {
    html += '<div class="empty-notice"><p>לא אותרו עמדות מפורטות במצע המפלגה עבור הסוגיות המוגדרות.</p></div>';
  } else {
    html += '<div class="positions-grid">';
    partyPositions.forEach(pos => {
      const issue = STATE.issues.find(i => i.id === pos.issueId);
      const issueTitle = issue ? issue.title : pos.issueId;
      const stanceInfo = STANCE_CONFIG[pos.stance] || STANCE_CONFIG.default;

      html += '<div class="position-card ' + (pos.sourceStatus || '') + '">';
      
      // Card Header
      html += '<div class="card-header">';
      html += '<span class="card-issue-tag">' + issueTitle + '</span>';
      html += '<span class="card-stance-badge ' + stanceInfo.class + '">' + stanceInfo.label + '</span>';
      html += '</div>';

      // Historical / Secondary Notice Banner
      if (pos.sourceStatus === "primary_historical") {
        html += '<div class="status-banner banner-historical">🏛️ מקור היסטורי (מצע 2013) — אינו עמדה רשמית מעודכנת לתשפ״ז</div>';
      } else if (pos.sourceStatus === "secondary_research") {
        html += '<div class="status-banner banner-secondary">📖 מחקר משני וניתוח פרשני — אינו מצע רשמי של המפלגה</div>';
      }

      // Claim / Topic
      html += '<h4 class="card-topic">' + (pos.topic || pos.summary) + '</h4>';
      html += '<p class="card-summary">' + pos.summary + '</p>';

      // Verbatim Quote if available
      if (pos.verbatimQuote) {
        html += '<div class="card-quote-box">';
        html += '<span class="quote-label">ציטוט מאומת מתוך המקור:</span>';
        html += '<blockquote class="quote-text">"' + pos.verbatimQuote + '"</blockquote>';
        html += '</div>';
      }

      // Municipal Impact Preview
      if (pos.municipalImpactAnalysis && pos.municipalImpactAnalysis.localAuthorityImpact) {
        html += '<div class="card-municipal-box">';
        html += '<strong>השפעה על הרשות המקומית: </strong>' + pos.municipalImpactAnalysis.localAuthorityImpact;
        html += '</div>';
      }

      // Card Footer with Source button
      html += '<div class="card-footer">';
      if (pos.sourceId) {
        html += '<button class="source-btn" data-source-id="' + pos.sourceId + '" data-citation="' + (pos.sourceCitation || '') + '">';
        html += '🔍 מקור: ' + (pos.sourceCitation || 'הצג מקור מלא');
        html += '</button>';
      } else {
        html += '<span class="no-source-tag">לא צוין מקור ישיר</span>';
      }
      html += '</div>';

      html += '</div>';
    });
    html += '</div>';
  }

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// AREA 1.2: מצעי המפלגות — השוואה לפי סוגיה
// ----------------------------------------------------
function renderIssueScreenSelectors() {
  const container = document.getElementById("issue-buttons-container");
  if (!container) return;

  container.innerHTML = STATE.issues.map(iss => {
    const isSelected = iss.id === STATE.selectedIssueId;
    return '<button class="issue-btn ' + (isSelected ? 'active' : '') + '" data-issue-id="' + iss.id + '">' +
      '<span class="issue-btn-title">' + iss.title + '</span>' +
    '</button>';
  }).join("");

  container.querySelectorAll(".issue-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-issue-id");
      STATE.selectedIssueId = id;
      container.querySelectorAll(".issue-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderIssueScreen(id);
    });
  });
}

function renderIssueScreen(issueId) {
  const container = document.getElementById("issue-content-area");
  if (!container) return;

  const issue = STATE.issues.find(i => i.id === issueId);
  if (!issue) {
    container.innerHTML = '<div class="empty-notice">סוגיה לא נמצאה</div>';
    return;
  }

  let html = '<div class="issue-header-box">';
  html += '<div class="issue-header-top">';
  html += '<span class="issue-cat-badge">' + (issue.category || 'סוגיית ליבה') + '</span>';
  html += '<h2 class="issue-title">' + issue.title + '</h2>';
  html += '</div>';
  html += '<p class="issue-desc">' + issue.description + '</p>';
  html += '</div>';

  const platformParties = getPlatformParties();

  html += '<div class="comparison-grid">';
  platformParties.forEach(party => {
    const pos = STATE.positions.find(p => p.partyId === party.id && p.issueId === issueId);

    html += '<div class="compare-card">';
    html += '<div class="compare-party-head">';
    html += '<div class="compare-party-title-wrap">';
    html += '<h3>' + party.nameHe + '</h3>';
    html += '<span class="quality-mini-badge ' + party.qualityInfo.class + '">' + party.qualityInfo.label + '</span>';
    html += '</div>';
    
    if (pos) {
      const stanceInfo = STANCE_CONFIG[pos.stance] || STANCE_CONFIG.default;
      html += '<span class="card-stance-badge ' + stanceInfo.class + '">' + stanceInfo.label + '</span>';
    } else {
      html += '<span class="card-stance-badge stance-not-stated">לא נאמר / לא נמצא במקור</span>';
    }
    html += '</div>';

    if (pos && pos.stance !== "not_stated") {
      if (pos.sourceStatus === "primary_historical") {
        html += '<div class="status-banner banner-historical">🏛️ מקור היסטורי (2013)</div>';
      } else if (pos.sourceStatus === "secondary_research") {
        html += '<div class="status-banner banner-secondary">📖 מחקר משני</div>';
      }

      html += '<p class="compare-summary">' + pos.summary + '</p>';

      if (pos.verbatimQuote) {
        html += '<blockquote class="compare-quote">"' + pos.verbatimQuote + '"</blockquote>';
      }

      if (pos.sourceId) {
        html += '<div class="compare-footer">';
        html += '<button class="source-btn" data-source-id="' + pos.sourceId + '" data-citation="' + (pos.sourceCitation || '') + '">';
        html += '🔍 מקור: ' + (pos.sourceCitation || 'הצג מקור');
        html += '</button>';
        html += '</div>';
      }
    } else {
      html += '<div class="not-stated-box">';
      html += '<p>המפלגה לא פירטה עמדה רשמית מפורשת בסוגיה זו במסמך המדיניות שנקלט.</p>';
      html += '</div>';
    }

    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
}

// ----------------------------------------------------
// AREA 2: הסכמים קואליציוניים ומבחן הביצוע (V2 Phase 2)
// ----------------------------------------------------
function renderCoalitionPartySelectors() {
  const container = document.getElementById("coalition-party-buttons-container");
  if (!container) return;

  const coalitionParties = getCoalitionParties();

  container.innerHTML = coalitionParties.map(p => {
    const isSelected = p.id === STATE.selectedCoalitionPartyId;
    return '<button class="party-btn ' + (isSelected ? 'active' : '') + '" data-coalition-party-id="' + p.id + '">' +
      '<span class="party-btn-name">' + p.nameHe + '</span>' +
      '<span class="quality-mini-badge quality-default">' + p.commitmentCount + ' התחייבויות</span>' +
    '</button>';
  }).join("");

  container.querySelectorAll(".party-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-coalition-party-id");
      STATE.selectedCoalitionPartyId = id;
      container.querySelectorAll(".party-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderExecutionScreen(id);
    });
  });
}

function renderExecutionScreen(partyId = STATE.selectedCoalitionPartyId) {
  const container = document.getElementById("execution-content-area");
  if (!container) return;

  const party = STATE.parties.find(p => p.id === partyId);
  const partyName = party ? party.nameHe : partyId;

  // Filter commitments where this party is a signatory/partner
  const partyCommitments = STATE.commitments.filter(c => (c.partyIds || []).includes(partyId));

  if (partyCommitments.length === 0) {
    container.innerHTML = '<div class="empty-notice">לא נמצאו התחייבויות קואליציוניות מאומתות למפלגה זו במאגר.</div>';
    return;
  }

  // Calculate summary stats
  let executedCount = 0;
  let partialCount = 0;
  let notExecutedCount = 0;
  let undeterminedCount = 0;

  partyCommitments.forEach(com => {
    const execRecord = STATE.execution.find(e => e.commitmentId === com.id);
    const statusKey = execRecord ? execRecord.status : "under_review";
    const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;

    if (statusInfo.group === "executed") executedCount++;
    else if (statusInfo.group === "partial") partialCount++;
    else if (statusInfo.group === "not_executed") notExecutedCount++;
    else undeterminedCount++;
  });

  let html = '';

  // 1. Party Summary Box
  html += '<div class="coalition-summary-box">';
  html += '<div class="coalition-summary-head">';
  html += '<h3>סיכום התחייבויות חינוך בהסכמים — ' + partyName + '</h3>';
  html += '<span class="summary-total-badge">סה״כ במאגר: ' + partyCommitments.length + ' התחייבויות</span>';
  html += '</div>';

  html += '<div class="summary-stats-row">';
  html += '<div class="stat-pill stat-executed"><span class="stat-num">' + executedCount + '</span><span class="stat-label">בוצעו</span></div>';
  html += '<div class="stat-pill stat-partial"><span class="stat-num">' + partialCount + '</span><span class="stat-label">בוצעו חלקית</span></div>';
  html += '<div class="stat-pill stat-not-executed"><span class="stat-num">' + notExecutedCount + '</span><span class="stat-label">לא בוצעו</span></div>';
  html += '<div class="stat-pill stat-undetermined"><span class="stat-num">' + undeterminedCount + '</span><span class="stat-label">טרם ניתן לקבוע</span></div>';
  html += '</div>';

  html += '<p class="summary-disclaimer">📌 הנתונים משקפים את המאגר המאומת הקיים ואינם בהכרח את מלוא ההסכם הקואליציוני.</p>';
  html += '</div>';

  // 2. Commitments 4-Tier Cards
  html += '<div class="execution-list">';
  partyCommitments.forEach(com => {
    const issue = STATE.issues.find(i => i.id === com.issueId);
    const partnerNames = (com.partyIds || []).map(pId => {
      const p = STATE.parties.find(party => party.id === pId);
      return p ? p.nameHe : pId;
    }).join(", ");

    const execRecord = STATE.execution.find(e => e.commitmentId === com.id);
    const statusKey = execRecord ? execRecord.status : "under_review";
    const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;

    html += '<div class="execution-card">';
    
    // Main Card Header
    html += '<div class="execution-card-header">';
    html += '<div class="exec-tags">';
    html += '<span class="exec-party-tag">שותפי ההסכם: ' + partnerNames + '</span>';
    if (issue) {
      html += '<span class="exec-issue-tag">' + issue.title + '</span>';
    }
    html += '</div>';
    html += '<span class="status-badge ' + statusInfo.class + '">' + statusInfo.label + '</span>';
    html += '</div>';

    // 1. נחתם
    html += '<div class="tier-section tier-signed">';
    html += '<div class="tier-head"><span class="tier-num">1</span> <h4>ההתחייבות שנחתמה</h4></div>';
    html += '<h3 class="exec-title">' + com.title + '</h3>';
    html += '<div class="exec-quote-box">';
    html += '<span class="quote-label">לשון הסעיף המקורי מתוך ההסכם (' + (com.sectionRef || 'ללא מראה מקום') + '):</span>';
    html += '<blockquote class="exec-quote">"' + com.verbatimText + '"</blockquote>';
    html += '</div>';
    html += '<div class="tier-meta-row">';
    html += '<span><strong>תאריך חתימה:</strong> ' + (com.date || '2022-12-28') + '</span>';
    html += '<span><strong>שנת יעד:</strong> ' + (com.targetYear || com.budgetYear || '2023-2024') + '</span>';
    if (com.promisedBudgetNIS) {
      html += '<span><strong>סכום שהובטח:</strong> ' + formatNIS(com.promisedBudgetNIS) + '</span>';
    }
    if (com.sourceId) {
      html += '<button class="source-btn" data-source-id="' + com.sourceId + '" data-citation="' + (com.sectionRef || '') + '">';
      html += '📁 מקור: ' + com.sourceId;
      html += '</button>';
    }
    html += '</div>';
    html += '</div>';

    // 2. מה אושר לביצוע
    html += '<div class="tier-section tier-approved">';
    html += '<div class="tier-head"><span class="tier-num">2</span> <h4>מה אושר לביצוע</h4></div>';
    if (com.allocatedBudgetEstimatedNIS || com.budgetEntity || (execRecord && execRecord.allocatedBudgetNIS)) {
      const allocatedNIS = (execRecord && execRecord.allocatedBudgetNIS) || com.allocatedBudgetEstimatedNIS;
      html += '<div class="approved-grid">';
      html += '<div><strong>מנגנון / גוף מתוקצב:</strong> ' + (com.budgetEntity || 'משרד החינוך / גורם ממשלתי') + '</div>';
      html += '<div><strong>שנת תקציב מאושרת:</strong> ' + (com.budgetYear || '2023-2024') + '</div>';
      if (allocatedNIS) {
        html += '<div><strong>תקציב שאושר / הוקצה:</strong> ' + formatNIS(allocatedNIS) + '</div>';
      }
      if (com.comparabilityReason) {
        html += '<div class="approved-notes"><strong>הערת התאמה:</strong> ' + com.comparabilityReason + '</div>';
      }
      html += '</div>';
    } else {
      html += '<p class="missing-tier-notice">טרם קיים במאגר מידע מאומת על אישור לביצוע.</p>';
    }
    html += '</div>';

    // 3. מה בוצע בפועל
    html += '<div class="tier-section tier-executed">';
    html += '<div class="tier-head"><span class="tier-num">3</span> <h4>מה בוצע בפועל</h4></div>';
    if (execRecord && (execRecord.factualSummary || execRecord.actualSpendingNIS || execRecord.completionPercentage !== undefined)) {
      html += '<div class="executed-body">';
      if (execRecord.factualSummary) {
        html += '<p class="executed-summary"><strong>סיכום עובדתי:</strong> ' + execRecord.factualSummary + '</p>';
      }
      html += '<div class="executed-metrics">';
      if (execRecord.actualSpendingNIS) {
        html += '<span><strong>ביצוע תקציבי בפועל:</strong> ' + formatNIS(execRecord.actualSpendingNIS) + '</span>';
      }
      if (execRecord.completionPercentage !== null && execRecord.completionPercentage !== undefined) {
        html += '<span><strong>אחוז ביצוע מוערך:</strong> ' + execRecord.completionPercentage + '%</span>';
      }
      if (execRecord.legalStatus) {
        html += '<span><strong>סטטוס משפטי:</strong> ' + execRecord.legalStatus + '</span>';
      }
      html += '</div>';
      if (execRecord.analysis && execRecord.analysis.text) {
        html += '<div class="exec-analysis-box">';
        html += '<span class="analysis-label">ניתוח ביצוע (Analysis):</span>';
        html += '<p class="analysis-text">' + execRecord.analysis.text + '</p>';
        html += '</div>';
      }
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

    html += '</div>'; // End execution-card
  });
  html += '</div>';

  container.innerHTML = html;
  attachSourceButtonEvents(container);
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
