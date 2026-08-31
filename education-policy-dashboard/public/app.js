/**
 * education-policy-dashboard: MVP 1.0
 * 3-Screen Working Dashboard:
 * 1. מפלגה במבט אחד
 * 2. השוואה לפי סוגיה
 * 3. מבחן הביצוע
 */

const STATE = {
  activeScreen: "party", // "party" | "issue" | "execution"
  sources: [],
  parties: [],
  issues: [],
  positions: [],
  commitments: [],
  execution: [],
  budgets: [],
  educationSystem: [],
  selectedPartyId: "PARTY-BEYACHAD",
  selectedIssueId: "ISSUE-CORE-CURRICULUM"
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
  fully_executed: { label: "בוצע", class: "status-executed" },
  executed_growth: { label: "בוצע (גידול תקציבי)", class: "status-executed" },
  partially_executed: { label: "בוצע חלקית", class: "status-partial" },
  partially_executed_frozen: { label: "בוצע חלקית (הוקפא)", class: "status-partial" },
  not_executed: { label: "לא בוצע", class: "status-not-executed" },
  under_review: { label: "טרם ניתן לקבוע", class: "status-undetermined" },
  default: { label: "טרם ניתן לקבוע", class: "status-undetermined" }
};

const SOURCE_TYPE_LABELS = {
  party_platform: "מצע מפלגה רשמי",
  coalition_agreement: "הסכם קואליציוני חתום",
  official_law: "חוק רשמי",
  government_decision: "החלטת ממשלה",
  official_budget: "דוח תקציב רשמי",
  secondary_research_source: "מסמך מחקר משני"
};

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

    setupScreenNavigation();
    renderPartyScreenSelectors();
    renderIssueScreenSelectors();
    renderActiveScreen();
    setupDrawerEvents();
  } catch (err) {
    console.error("Error loading application data:", err);
    document.getElementById("party-content-area").innerHTML = 
      '<div class="error-notice"><h3>שגיאה בטעינת הנתונים</h3><p>' + err.message + '</p></div>';
  }
}

// Setup Tab Navigation between the 3 screens
function setupScreenNavigation() {
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const screen = tab.getAttribute("data-screen");
      STATE.activeScreen = screen;

      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".screen-view").forEach(s => s.classList.remove("active"));
      const targetScreen = document.getElementById("screen-" + screen);
      if (targetScreen) targetScreen.classList.add("active");

      renderActiveScreen();
    });
  });
}

function renderActiveScreen() {
  if (STATE.activeScreen === "party") {
    renderPartyScreen(STATE.selectedPartyId);
  } else if (STATE.activeScreen === "issue") {
    renderIssueScreen(STATE.selectedIssueId);
  } else if (STATE.activeScreen === "execution") {
    renderExecutionScreen();
  }
}

// ----------------------------------------------------
// SCREEN 1: מפלגה במבט אחד
// ----------------------------------------------------
function renderPartyScreenSelectors() {
  const container = document.getElementById("party-buttons-container");
  if (!container) return;

  const targetPartyIds = [
    "PARTY-BEYACHAD",
    "PARTY-YASHAR",
    "PARTY-DEMOCRATS",
    "PARTY-RELIGIOUS-ZIONISM",
    "PARTY-YESH-ATID",
    "PARTY-SHAS",
    "PARTY-NOAM",
    "PARTY-HADASH",
    "PARTY-RAAM",
    "PARTY-HADASH-TAAL"
  ];

  const partyList = targetPartyIds.map(id => STATE.parties.find(p => p.id === id)).filter(Boolean);

  container.innerHTML = partyList.map(p => {
    const isSelected = p.id === STATE.selectedPartyId;
    return '<button class="party-btn ' + (isSelected ? 'active' : '') + '" data-party-id="' + p.id + '">' +
      '<span class="party-btn-name">' + p.nameHe + '</span>' +
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

  let html = '<div class="party-header-box">';
  html += '<div class="party-title-row">';
  html += '<h2 class="party-title">' + party.nameHe + '</h2>';
  if (party.notes) {
    html += '<span class="party-notes-badge">' + party.notes + '</span>';
  }
  html += '</div>';
  html += '<p class="party-subtitle">' + (party.knessetFaction25 ? 'סיעה בכנסת ה-25: ' + party.knessetFaction25 : 'יוזמה / מפלגה לקראת תשפ״ז') + '</p>';
  html += '</div>';

  if (partyPositions.length === 0) {
    html += '<div class="empty-notice"><p>טרם נקלטו עמדות מפורטות למפלגה זו ב-MVP Dataset.</p></div>';
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

      // Historical / Secondary Notice Banner if applicable
      if (pos.sourceStatus === "primary_historical") {
        html += '<div class="status-banner banner-historical">📜 מקור היסטורי (מצע 2013) — אינו עמדה עדכנית לתשפ״ז</div>';
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
// SCREEN 2: השוואה לפי סוגיה
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

  // Compare parties
  const comparedPartyIds = [
    "PARTY-BEYACHAD",
    "PARTY-YASHAR",
    "PARTY-DEMOCRATS",
    "PARTY-RELIGIOUS-ZIONISM",
    "PARTY-YESH-ATID",
    "PARTY-HADASH",
    "PARTY-RAAM",
    "PARTY-HADASH-TAAL"
  ];

  html += '<div class="comparison-grid">';
  comparedPartyIds.forEach(pId => {
    const party = STATE.parties.find(p => p.id === pId);
    if (!party) return;

    const pos = STATE.positions.find(p => p.partyId === pId && p.issueId === issueId);

    html += '<div class="compare-card">';
    html += '<div class="compare-party-head">';
    html += '<h3>' + party.nameHe + '</h3>';
    
    if (pos) {
      const stanceInfo = STANCE_CONFIG[pos.stance] || STANCE_CONFIG.default;
      html += '<span class="card-stance-badge ' + stanceInfo.class + '">' + stanceInfo.label + '</span>';
    } else {
      html += '<span class="card-stance-badge stance-not-stated">לא נאמר / לא נמצא במקור</span>';
    }
    html += '</div>';

    if (pos && pos.stance !== "not_stated") {
      if (pos.sourceStatus === "primary_historical") {
        html += '<div class="status-banner banner-historical">📜 מקור היסטורי (2013)</div>';
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
// SCREEN 3: מבחן הביצוע
// ----------------------------------------------------
function renderExecutionScreen() {
  const container = document.getElementById("execution-content-area");
  if (!container) return;

  if (STATE.commitments.length === 0) {
    container.innerHTML = '<div class="empty-notice">לא נמצאו התחייבויות מאומתות במאגר.</div>';
    return;
  }

  let html = '<div class="execution-list">';
  STATE.commitments.forEach(com => {
    const issue = STATE.issues.find(i => i.id === com.issueId);
    const partyNames = (com.partyIds || []).map(pId => {
      const p = STATE.parties.find(party => party.id === pId);
      return p ? p.nameHe : pId;
    }).join(", ");

    const execRecord = STATE.execution.find(e => e.commitmentId === com.id);
    const statusKey = execRecord ? execRecord.status : "under_review";
    const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;

    html += '<div class="execution-card">';
    
    // Header
    html += '<div class="execution-card-header">';
    html += '<div class="exec-tags">';
    html += '<span class="exec-party-tag">' + partyNames + '</span>';
    if (issue) {
      html += '<span class="exec-issue-tag">' + issue.title + '</span>';
    }
    html += '</div>';
    html += '<span class="status-badge ' + statusInfo.class + '">' + statusInfo.label + '</span>';
    html += '</div>';

    // Title
    html += '<h3 class="exec-title">' + com.title + '</h3>';

    // Verbatim Text from signed agreement
    html += '<div class="exec-quote-box">';
    html += '<span class="quote-label">לשון הסעיף המאומת מילה במילה מההסכם החתום (' + (com.sectionRef || '') + '):</span>';
    html += '<blockquote class="exec-quote">"' + com.verbatimText + '"</blockquote>';
    html += '</div>';

    // Analysis / Municipal Impact
    if (com.analysisDraft && com.analysisDraft.text) {
      html += '<div class="exec-analysis-box">';
      html += '<span class="analysis-label">טיוטת ניתוח מוניציפלי (Analysis Draft):</span>';
      html += '<p class="analysis-text">' + com.analysisDraft.text + '</p>';
      html += '</div>';
    }

    // Footer with Source Button
    html += '<div class="exec-footer">';
    html += '<span class="exec-meta">תאריך חתימה: ' + (com.date || '2022-12-28') + ' • שנת תקציב: ' + (com.budgetYear || '2023') + '</span>';
    if (com.sourceId) {
      html += '<button class="source-btn" data-source-id="' + com.sourceId + '" data-citation="' + (com.sectionRef || '') + '">';
      html += '📁 מקור: ' + com.sourceId;
      html += '</button>';
    }
    html += '</div>';

    html += '</div>';
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

  if (closeBtn) {
    closeBtn.addEventListener("click", closeSourceDrawer);
  }
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

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
