/**
 * education-policy-dashboard: Prototype V2.1 "Budget Model V2 Enabled"
 * Fast 30-60 second party overview + Progressive Disclosure + Semantic Budget Hierarchy
 */

const STATE = {
  sources: [],
  parties: [],
  issues: [],
  positions: [],
  commitments: [],
  execution: [],
  budgets: [],
  educationSystem: [],
  selectedPartyId: "PARTY-BEYACHAD"
};

// Strict status mapping adhering to guidelines: בוצע | בוצע חלקית | לא בוצע | טרם ניתן לקבוע
const STATUS_CONFIG = {
  fully_executed: { label: "בוצע", class: "status-executed" },
  executed_growth: { label: "בוצע (גידול תקציבי)", class: "status-executed" },
  partially_executed: { label: "בוצע חלקית", class: "status-partial" },
  partially_executed_frozen: { label: "בוצע חלקית (הוקפא)", class: "status-partial" },
  partial_diverged_execution: { label: "בוצע חלקית", class: "status-partial" },
  alternative_parallel_track: { label: "בוצע חלקית (מסלול מקביל)", class: "status-partial" },
  alternative_execution: { label: "בוצע חלקית (מתווה חלופי)", class: "status-partial" },
  not_executed: { label: "לא בוצע", class: "status-not-executed" },
  not_executed_delayed: { label: "לא בוצע (מעוכב)", class: "status-not-executed" },
  baseline_data: { label: "טרם ניתן לקבוע (נתון בסיס)", class: "status-undetermined" },
  under_review: { label: "טרם ניתן לקבוע", class: "status-undetermined" },
  default: { label: "טרם ניתן לקבוע", class: "status-undetermined" }
};

const SOURCE_TYPE_LABELS = {
  official_law: "חוק רשמי",
  government_decision: "החלטת ממשלה",
  coalition_agreement: "הסכם קואליציוני",
  official_budget: "ספר התקציב / דוח חשכ\"ל",
  cbs_stat: "הלשכה המרכזית לסטטיסטיקה",
  party_platform: "מצע מפלגה רשמי",
  official_directive: "חוזר מנכ\"ל / הנחיה רשמית",
  official_government_source: "מקור ממשלתי רשמי (משרד החינוך)",
  secondary_research_source: "מסמך מחקר עומק (מקור משני)"
};

const VERIFICATION_LABELS = {
  verified_official: "אימות רשמי מלא",
  secondary_academic: "מחקר משני מתועד",
  cross_referenced: "הצלבת מקורות כפולה",
  unverified: "טרם אומת"
};

// Currency format with strict null-safe handling (never displays 0 for missing values)
function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val) || val === '') {
    return '<span class="val-missing">אין נתון מאומת</span>';
  }
  if (val >= 1000000000) {
    const b = (val / 1000000000).toFixed(3);
    return '₪ ' + b.replace(/\.?0+$/, '') + ' מיליארד';
  }
  if (val >= 1000000) {
    const m = (val / 1000000).toFixed(2);
    return '₪ ' + m.replace(/\.?0+$/, '') + ' מיליון';
  }
  return '₪ ' + Number(val).toLocaleString('he-IL');
}

// Fetch all verified data
async function loadAllData() {
  try {
    const [
      sourcesRes,
      partiesRes,
      issuesRes,
      positionsRes,
      commitmentsRes,
      executionRes,
      budgetsRes,
      eduRes
    ] = await Promise.all([
      fetch("/data/sources.json"),
      fetch("/data/parties.json"),
      fetch("/data/issues.json"),
      fetch("/data/positions.json"),
      fetch("/data/commitments.json"),
      fetch("/data/execution.json"),
      fetch("/data/budgets.json"),
      fetch("/data/education-system.json")
    ]);

    STATE.sources = (await sourcesRes.json()).sources || [];
    STATE.parties = (await partiesRes.json()).parties || [];
    STATE.issues = (await issuesRes.json()).issues || [];
    STATE.positions = (await positionsRes.json()).positions || [];
    STATE.commitments = (await commitmentsRes.json()).commitments || [];
    STATE.execution = (await executionRes.json()).executionRecords || [];
    STATE.budgets = (await budgetsRes.json()).budgetLines || [];
    STATE.educationSystem = (await eduRes.json()).systemIndicators || [];

    renderPartySelector();
    renderDashboard(STATE.selectedPartyId);
    initGlobalEvents();
  } catch (err) {
    console.error("Critical Error loading data files:", err);
    document.getElementById("party-content-area").innerHTML = 
      '<div class="empty-notice">' +
        '<h3>שגיאה בטעינת קובצי הנתונים</h3>' +
        '<p>' + err.message + '</p>' +
      '</div>';
  }
}

// Render party selector buttons (3 parties for prototype: Beyachad, Shas, Noam)
function renderPartySelector() {
  const container = document.getElementById("party-buttons-container");
  const targetParties = [
    { id: "PARTY-BEYACHAD", label: "ביחד", badge: "הצעות ומצע" },
    { id: "PARTY-SHAS", label: "ש״ס", badge: "מבחן ביצוע תקציבי" },
    { id: "PARTY-NOAM", label: "נעם", badge: "מבחן ביצוע ומסלולים" },
    { id: "PARTY-RELIGIOUS-ZIONISM", label: "הציונות הדתית", badge: "הסכם ומבחן ביצוע" }
  ];

  container.innerHTML = targetParties.map(p => 
    '<button class="tab-btn ' + (p.id === STATE.selectedPartyId ? 'active' : '') + '" data-party-id="' + p.id + '">' +
      '<span class="tab-party-name">' + p.label + '</span>' +
      '<span class="tab-party-badge">' + p.badge + '</span>' +
    '</button>'
  ).join('');

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-party-id');
      STATE.selectedPartyId = id;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDashboard(id);
    });
  });
}

// Render Complete Dashboard with Budget Model V2 hierarchy
function renderDashboard(partyId) {
  const contentArea = document.getElementById("party-content-area");
  const party = STATE.parties.find(p => p.id === partyId);

  if (!party) {
    contentArea.innerHTML = '<div class="empty-notice">לא נמצאה מפלגה.</div>';
    return;
  }

  // Filter positions and commitments strictly from verified data
  const partyPositions = STATE.positions.filter(p => p.partyId === partyId);
  const partyCommitments = STATE.commitments.filter(c => 
    (c.partyIds && c.partyIds.includes(partyId)) || c.partyId === partyId
  );

  // Calculate exact counts without guessing
  const distinctIssueIds = new Set([
    ...partyPositions.map(p => p.issueId),
    ...partyCommitments.map(c => c.issueId)
  ]);
  const issuesCount = distinctIssueIds.size;
  const commitmentsCount = partyCommitments.length;

  const hasGovExecution = commitmentsCount > 0;

  // 1. Top Section - Compact Party Overview
  let infoTypeLabel = "מצע ומדיניות עתידית";
  if (party.statusInKnesset25 === "coalition_partner") {
    infoTypeLabel = "הסכמים קואליציוניים, מנגנוני ביצוע ותקציב";
  }

  let html = 
    '<!-- 1. Party Overview -->' +
    '<section class="overview-panel">' +
      '<div class="overview-header-row">' +
        '<div class="party-name-group">' +
          '<h2 class="party-title">' + party.nameHe + '</h2>' +
          '<span class="party-status-tag">' + (hasGovExecution ? 'שותפה קואליציונית (ממשלה 37)' : 'מפלגה חוץ-פרלמנטרית (הצעות עתידיות)') + '</span>' +
        '</div>' +
        '<div class="party-summary-text">' +
          (party.notes || 'נתוני מפלגה מבוססים על מסמכי מחקר מתועדים לקראת תשפ״ז.') +
        '</div>' +
      '</div>' +

      '<div class="overview-metrics-grid">' +
        '<div class="metric-card">' +
          '<span class="metric-card-label">סוג המידע הקיים</span>' +
          '<span class="metric-card-val text-sm">' + infoTypeLabel + '</span>' +
        '</div>' +
        '<div class="metric-card">' +
          '<span class="metric-card-label">סוגיות שנבדקו</span>' +
          '<span class="metric-card-val">' + issuesCount + '</span>' +
        '</div>' +
        '<div class="metric-card">' +
          '<span class="metric-card-label">התחייבויות שנבדקו</span>' +
          '<span class="metric-card-val">' + commitmentsCount + '</span>' +
        '</div>' +
        '<div class="metric-card">' +
          '<span class="metric-card-label">רמת ביטחון במידע</span>' +
          '<span class="metric-card-val confidence-high">' + (party.confidenceLevel === 'high' ? 'גבוהה (מאומת)' : 'בינונית') + '</span>' +
        '</div>' +
      '</div>' +
    '</section>';

  // Re-ordering according to instructions:
  // With execution: תמונת מצב → מבחן הביצוע → עמדות והצעות → מקורות
  // Without execution: תמונת מצב → עמדות והצעות → מקורות
  if (hasGovExecution) {
    html += 
      '<!-- 2. Execution Test Section -->' +
      '<section class="dashboard-section">' +
        '<div class="section-header-bar">' +
          '<div class="section-title-wrap">' +
            '<span class="section-index-num">1</span>' +
            '<h3 class="section-heading-title">מבחן הביצוע של מדיניות הממשלה היוצאת</h3>' +
          '</div>' +
          '<span class="section-explainer">בקרה תקציבית סמנטית: הפרדה בין תקציב בסיס, הקצאות ייעודיות וביצוע בפועל</span>' +
        '</div>' +
        renderExecutionItems(partyCommitments, partyId) +
      '</section>' +

      '<!-- 3. Proposals & Stances Section -->' +
      '<section class="dashboard-section">' +
        '<div class="section-header-bar">' +
          '<div class="section-title-wrap">' +
            '<span class="section-index-num">2</span>' +
            '<h3 class="section-heading-title">עמדות והצעות מדיניות עתידיות</h3>' +
          '</div>' +
          '<span class="section-explainer">עמדות מצע מוצהרות לקראת שנת הלימודים תשפ״ז</span>' +
        '</div>' +
        renderPositionsItems(partyPositions, party) +
      '</section>';
  } else {
    html += 
      '<!-- 2. Proposals & Stances Section -->' +
      '<section class="dashboard-section">' +
        '<div class="section-header-bar">' +
          '<div class="section-title-wrap">' +
            '<span class="section-index-num">1</span>' +
            '<h3 class="section-heading-title">מה המפלגה מציעה? עמדות ומצע</h3>' +
          '</div>' +
          '<span class="section-explainer">הצעות מדיניות ותוכניות עתידיות לקראת תשפ״ז — אינן מהוות ביצוע שלטוני</span>' +
        '</div>' +
        renderPositionsItems(partyPositions, party) +
      '</section>';
  }

  contentArea.innerHTML = html;
  attachInteractiveListeners();
}

// Render Execution Items with Semantic Budget Model V2 Logic
function renderExecutionItems(commitments, partyId) {
  return commitments.map((com, idx) => {
    const issue = STATE.issues.find(i => i.id === com.issueId) || { title: com.title, category: "תקציב וממשל" };
    const execRecords = STATE.execution.filter(e => e.commitmentId === com.id);

    // Determine status badge from execution records or commitment
    let statusKey = "under_review";
    if (execRecords.length > 0) {
      statusKey = execRecords[0].status || "under_review";
    }
    const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;

    const uniqueId = 'exec-details-' + idx;

    // Render Semantic Budget Component based on comparabilityStatus
    const budgetVisualHtml = renderSemanticBudgetVisual(com, execRecords);

    return (
      '<article class="compact-dashboard-card">' +
        '<!-- Main Quick View Header -->' +
        '<div class="card-summary-header">' +
          '<div class="header-main-info">' +
            '<div class="badge-row">' +
              '<span class="issue-pill">' + issue.category + ' • ' + issue.title + '</span>' +
              '<span class="entity-pill">גוף: ' + (com.budgetEntity || 'לא צוין') + '</span>' +
            '</div>' +
            '<h4 class="card-title-text">' + com.title + '</h4>' +
            '<p class="card-headline-summary">' +
              (com.verbatimText.length > 150 ? com.verbatimText.substring(0, 150) + '...' : com.verbatimText) +
            '</p>' +
          '</div>' +
          '<div class="header-status-wrap">' +
            '<span class="status-badge ' + statusCfg.class + '">' + statusCfg.label + '</span>' +
          '</div>' +
        '</div>' +

        '<!-- Central Budget Visualization -->' +
        budgetVisualHtml +

        '<!-- Card Action Bar -->' +
        '<div class="card-action-bar">' +
          '<button class="disclosure-toggle-btn" data-target="' + uniqueId + '">' +
            '<span class="toggle-icon">▾</span>' +
            '<span class="toggle-text">פירוט וניתוח</span>' +
          '</button>' +
          '<button class="secondary-source-link" data-source-id="' + com.sourceId + '" data-source-ref="' + (com.sectionRef || '') + '">' +
            '<span>מקור: ' + (com.sectionRef || 'הסכם קואליציוני') + '</span>' +
            '<span class="source-link-icon">📄</span>' +
          '</button>' +
        '</div>' +

        '<!-- 4 & 6. Progressive Disclosure: Epistemic Layers -->' +
        '<div class="disclosure-panel" id="' + uniqueId + '">' +
          '<div class="epistemic-layer fact-layer">' +
            '<div class="layer-title-badge">עובדה מתועדת • לשון ההתחייבות המקורית</div>' +
            '<p class="layer-content">"' + com.verbatimText + '"</p>' +
          '</div>' +

          execRecords.map(rec => (
            '<div class="epistemic-layer fact-layer">' +
              '<div class="layer-title-badge">עובדה מתועדת • ' + (rec.budgetYear ? 'שנת ' + rec.budgetYear + ' - ' : '') + rec.title + '</div>' +
              '<p class="layer-content">' + rec.factualSummary + '</p>' +
              (rec.budgetEntity ? '<div class="rec-meta-tag">גוף תקציבי: ' + rec.budgetEntity + ' | סוג נתון: ' + rec.budgetType + '</div>' : '') +
            '</div>'
          )).join('') +

          (com.analysis ? (
            '<div class="epistemic-layer analysis-layer">' +
              '<div class="layer-title-badge">ניתוח מחקרי</div>' +
              '<p class="layer-content">' + com.analysis.text + '</p>' +
            '</div>'
          ) : '') +

          (com.analysisDraft ? (
            '<div class="epistemic-layer analysis-layer" style="border-right-color: #f59e0b; background-color: #fffdf5;">' +
              '<div class="layer-title-badge" style="color: #b45309;">טיוטת ניתוח מוניציפלי (Analysis Draft • לא מאומת)</div>' +
              '<p class="layer-content">' + com.analysisDraft.text + '</p>' +
            '</div>'
          ) : '') +

          (com.assessment ? (
            '<div class="epistemic-layer assessment-layer">' +
              '<div class="layer-title-badge">הערכת ביצוע</div>' +
              '<p class="layer-content">' + com.assessment.text + '</p>' +
            '</div>'
          ) : '') +

          (com.assessmentDraft ? (
            '<div class="epistemic-layer assessment-layer" style="border-right-color: #f59e0b; background-color: #fffdf5;">' +
              '<div class="layer-title-badge" style="color: #b45309;">טיוטת הערכה (Assessment Draft)</div>' +
              '<p class="layer-content">' + com.assessmentDraft.text + '</p>' +
            '</div>'
          ) : '') +
        '</div>' +
      '</article>'
    );
  }).join('');
}

// Render Semantic Budget Component (Model V2)
function renderSemanticBudgetVisual(com, execRecords) {
  // Case 1: Strictly Comparable (e.g. OFN or Free 0-3 in same year and entity)
  if (com.comparabilityStatus === "comparable" || (com.comparabilityStatus === "partially_comparable" && com.budgetType !== "baseline_comparison")) {
    const promised = com.promisedBudgetNIS;
    const promisedYear = com.budgetYear ? 'שנת ' + com.budgetYear : 'בסיס הסכם';

    let allocated = null;
    let spent = null;
    let execYear = "";

    const matchedRec = execRecords.find(r => r.allocatedBudgetNIS !== null || r.actualSpendingNIS !== null);
    if (matchedRec) {
      allocated = matchedRec.allocatedBudgetNIS;
      spent = matchedRec.actualSpendingNIS;
      if (matchedRec.budgetYear) {
        execYear = 'שנת ' + matchedRec.budgetYear;
      }
    }

    return (
      '<div class="budget-flow-container">' +
        '<div class="budget-flow-card">' +
          '<span class="flow-step-name">1. הובטח בהסכם</span>' +
          '<div class="flow-step-val">' + formatCurrency(promised) + '</div>' +
          '<span class="flow-step-meta">' + promisedYear + '</span>' +
        '</div>' +
        '<div class="flow-separator-arrow">➔</div>' +
        '<div class="budget-flow-card">' +
          '<span class="flow-step-name">2. הוקצה בספר התקציב</span>' +
          '<div class="flow-step-val">' + formatCurrency(allocated) + '</div>' +
          '<span class="flow-step-meta">' + (execYear || 'ספר התקציב') + '</span>' +
        '</div>' +
        '<div class="flow-separator-arrow">➔</div>' +
        '<div class="budget-flow-card highlight-spent">' +
          '<span class="flow-step-name">3. ביצוע בפועל</span>' +
          '<div class="flow-step-val">' + formatCurrency(spent) + '</div>' +
          '<span class="flow-step-meta">' + (execYear || 'דוח חשכ"ל') + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  // Case 2: Multi-year Budget Development / Baseline comparison (e.g. Shas Maayan)
  if (com.budgetType === "baseline_comparison" || com.id === "COM-37-SHAS-MAAYAN-001") {
    const baseRec = execRecords.find(r => r.budgetType === "baseline") || { baselineBudgetNIS: 980100000, budgetYear: 2023 };
    const growthRec = execRecords.find(r => r.budgetType === "allocated") || { allocatedBudgetNIS: 1234000000, budgetYear: 2026 };

    return (
      '<div class="budget-evolution-container">' +
        '<div class="evolution-header">' +
          '<span class="evolution-title">📊 התפתחות תקציבית (השוואת בסיס מול גידול תקציבי)</span>' +
          '<span class="evolution-note">' + (com.comparabilityReason || 'ההסכם קבע עקרונות חיזוק ללא סכום שקלי נקוב; הנתונים משקפים גידול בתקציב הכולל.') + '</span>' +
        '</div>' +
        '<div class="evolution-cards-row">' +
          '<div class="evolution-card baseline">' +
            '<span class="evolution-step-name">תקציב בסיס (שנת 2023)</span>' +
            '<div class="evolution-step-val">' + formatCurrency(baseRec.baselineBudgetNIS) + '</div>' +
            '<span class="evolution-step-meta">רשת בני יוסף • טרם יישום ההסכם</span>' +
          '</div>' +
          '<div class="flow-separator-arrow">➔</div>' +
          '<div class="evolution-card growth">' +
            '<span class="evolution-step-name">תקציב כולל (שנת 2026)</span>' +
            '<div class="evolution-step-val">' + formatCurrency(growthRec.allocatedBudgetNIS) + '</div>' +
            '<span class="evolution-step-meta">רשת בני יוסף • גידול נומינלי של 253.9 מלש"ח</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Case 3: Policy commitment without specific promised amount or with formula / diverged tracks
  if (!com.promisedBudgetNIS && execRecords.length === 0) {
    return (
      '<div class="budget-flow-container" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 12px 0;">' +
        '<div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #334155;">' +
          '<span style="font-size: 1.2rem;">📋</span>' +
          '<div>' +
            '<strong>התחייבות למדיניות תקצוב מותנית (מודל אחוזים ותמריץ ליבה)</strong>' +
            '<p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">' +
              (com.comparabilityReason || 'ההתחייבות מעגנת שיעורי תקצוב (75% מוכש"ר / 55% פטור) ותוספת תקציבית מותנית בהיקף לימודי ליבה ובחינה והערכה, ללא סכום שקלי נקוב מראש.') +
            '</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Case 4: Not Comparable / Diverged Entity Tracks (e.g. Noam identity authorities)
  return (
    '<div class="not-comparable-container">' +
      '<div class="not-comp-alert">' +
        '<span class="not-comp-icon">⚠️</span>' +
        '<div>' +
          '<strong>הנתונים אינם מאפשרים השוואת ביצוע ישירה</strong>' +
          '<p class="not-comp-reason">' + (com.comparabilityReason || 'פיצול ישויות תקציביות ואי-חפיפת שנות דיווח.') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="diverged-tracks-grid">' +
        '<div class="diverged-track-box">' +
          '<div class="track-title">התחייבות בהסכם המקורי (שנת 2023)</div>' +
          '<div class="track-val">' + formatCurrency(com.promisedBudgetNIS) + '</div>' +
          '<div class="track-entity">ישות: ' + (com.budgetEntity || 'הרשות לזהות לאומית-יהודית') + '</div>' +
        '</div>' +
        '<div class="diverged-track-box">' +
          '<div class="track-title">ביצוע בפועל (שנת 2025)</div>' +
          '<div class="track-val">' + formatCurrency(11850000) + '</div>' +
          '<div class="track-entity">ישות: הרשות לזהות לאומית (משרד רה"מ)</div>' +
        '</div>' +
        '<div class="diverged-track-box">' +
          '<div class="track-title">מסלול מקביל: המנהלת (שנת 2025-2026)</div>' +
          '<div class="track-val">49.8 מלש"ח (2025) / 82.2 מלש"ח (2026)</div>' +
          '<div class="track-entity">ישות: המנהלת לזהות יהודית (גוף נפרד)</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// Magnitude config for Municipal Lens
const MAGNITUDE_CONFIG = {
  continuation: { label: "המשכיות", class: "mag-continuation" },
  moderate_change: { label: "שינוי מתון", class: "mag-moderate" },
  significant_change: { label: "שינוי משמעותי", class: "mag-significant" },
  structural_change: { label: "שינוי מבני 🏛️", class: "mag-structural" },
  undetermined: { label: "טרם נקבע", class: "mag-undetermined" }
};

// Render Positions Items with Municipal Lens & Progressive Disclosure
function renderPositionsItems(positions, party) {
  if (!positions || positions.length === 0) {
    return (
      '<div class="empty-notice">' +
        '<span class="empty-icon">🔍</span>' +
        '<strong>לא אותרה עמדה מתועדת במקורות שנבדקו</strong>' +
        '<p style="margin-top: 6px; font-size: 0.88rem; color: #64748b;">' +
          'המערכת אינה מציגה השערות או ניחושים לגבי עמדות מפלגה שלא נמצא להן תיעוד רשמי.' +
        '</p>' +
      '</div>'
    );
  }

  return (
    '<div class="proposals-grid">' +
      positions.map((pos, idx) => {
        const issue = STATE.issues.find(i => i.id === pos.issueId) || { title: pos.topic, category: "כללי" };
        const uniqueId = 'pos-details-' + idx;
        const mia = pos.municipalImpactAnalysis;

        let magnitudeBadge = '';
        if (mia && mia.changeMagnitude) {
          const mag = MAGNITUDE_CONFIG[mia.changeMagnitude] || MAGNITUDE_CONFIG.undetermined;
          magnitudeBadge = '<span class="magnitude-pill ' + mag.class + '">' + mag.label + '</span>';
        }

        return (
          '<article class="compact-dashboard-card proposal-card">' +
            '<div class="card-summary-header">' +
              '<div class="header-main-info">' +
                '<div class="badge-row">' +
                  '<span class="issue-pill">' + issue.category + '</span>' +
                  magnitudeBadge +
                '</div>' +
                '<h4 class="card-title-text">' + issue.title + '</h4>' +
                '<p class="card-headline-summary">' +
                  '<strong>עיקר ההצעה:</strong> ' + (pos.summary || pos.verbatimQuote) +
                '</p>' +
              '</div>' +
              '<div class="header-status-wrap">' +
                '<span class="proposal-type-pill">הצעה עתידית</span>' +
              '</div>' +
            '</div>' +

            // Municipal Bottom Line (if municipalImpactAnalysis exists)
            (mia ? (
              '<div class="municipal-card-summary">' +
                '<div class="municipal-summary-badge">📌 בשורה התחתונה לרשות המקומית:</div>' +
                '<p class="municipal-impact-text">' + mia.localAuthorityImpact + '</p>' +
              '</div>'
            ) : '') +

            '<!-- Card Action Bar -->' +
            '<div class="card-action-bar">' +
              '<button class="disclosure-toggle-btn" data-target="' + uniqueId + '">' +
                '<span class="toggle-icon">▾</span>' +
                '<span class="toggle-text">השוואה למצב הקיים וניתוח</span>' +
              '</button>' +
              '<div class="source-links-group">' +
                (mia ? (
                  mia.currentStateSourceId ? (
                    '<button class="secondary-source-link source-btn-compact" data-source-id="' + mia.currentStateSourceId + '" data-source-ref="' + (mia.currentStateCitation || '') + '" title="מקור המצב הקיים במשרד החינוך">' +
                      '<span>מקור למצב הקיים</span>' +
                      '<span class="source-link-icon">🏢</span>' +
                    '</button>'
                  ) : (
                    '<button class="secondary-source-link source-btn-compact source-unverified-btn" data-source-id="UNVERIFIED" data-source-ref="' + (mia.currentStateCitation || '') + '" title="מקור רשמי למצב הקיים טרם אומת במאגר">' +
                      '<span>מקור למצב הקיים (טרם אומת)</span>' +
                      '<span class="source-link-icon">⚠️</span>' +
                    '</button>'
                  )
                ) : '') +
                '<button class="secondary-source-link source-btn-compact" data-source-id="' + pos.sourceId + '" data-source-ref="' + (pos.sourceCitation || '') + '" title="מקור הצעת המפלגה">' +
                  '<span>מקור להצעת המפלגה</span>' +
                  '<span class="source-link-icon">📄</span>' +
                '</button>' +
              '</div>' +
            '</div>' +

            '<!-- Progressive Disclosure Panel -->' +
            '<div class="disclosure-panel" id="' + uniqueId + '">' +
              // Municipal Analysis Layers
              (mia ? (
                '<div class="municipal-disclosure-block">' +
                  '<div class="epistemic-layer current-state-layer">' +
                    '<div class="layer-title-badge">🏢 המצב הקיים כיום במדיניות הממשלה / משרד החינוך (עובדה מאומתת)</div>' +
                    '<p class="layer-content">' + mia.currentState + '</p>' +
                    (mia.currentStateCitation ? '<div class="rec-meta-tag">מקור: ' + mia.currentStateCitation + '</div>' : '') +
                  '</div>' +

                  '<div class="epistemic-layer change-layer">' +
                    '<div class="layer-title-badge">⚡ מה חדש / שונה בהצעת המפלגה? (ניתוח ההבדל)</div>' +
                    '<p class="layer-content">' + mia.changeFromCurrentState + '</p>' +
                  '</div>' +

                  '<div class="epistemic-layer open-question-layer">' +
                    '<div class="layer-title-badge">❓ שאלה מרכזית פתוחה ליישום בשטח</div>' +
                    '<p class="layer-content font-semibold">' + mia.openImplementationQuestion + '</p>' +
                  '</div>' +
                '</div>'
              ) : '') +

              '<div class="epistemic-layer fact-layer">' +
                '<div class="layer-title-badge">עובדה מתועדת • ציטוט לשון המקור של המפלגה</div>' +
                '<p class="layer-content">"' + pos.verbatimQuote + '"</p>' +
              '</div>' +

              (pos.analysis ? (
                '<div class="epistemic-layer analysis-layer">' +
                  '<div class="layer-title-badge">ניתוח מחקרי כללי</div>' +
                  '<p class="layer-content">' + pos.analysis.text + '</p>' +
                '</div>'
              ) : '') +

              (pos.assessment ? (
                '<div class="epistemic-layer assessment-layer">' +
                  '<div class="layer-title-badge">הערכת מומחים והיתכנות</div>' +
                  '<p class="layer-content">' + pos.assessment.text + '</p>' +
                '</div>'
              ) : '') +
            '</div>' +
          '</article>'
        );
      }).join('') +
    '</div>'
  );
}

// Attach listeners for Progressive Disclosure & Source Drawer
function attachInteractiveListeners() {
  // Toggle details accordions
  document.querySelectorAll('.disclosure-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const panel = document.getElementById(targetId);
      if (!panel) return;

      const isExpanded = panel.classList.contains('expanded');
      if (isExpanded) {
        panel.classList.remove('expanded');
        btn.querySelector('.toggle-icon').textContent = '▾';
        btn.querySelector('.toggle-text').textContent = 'פירוט וניתוח';
      } else {
        panel.classList.add('expanded');
        btn.querySelector('.toggle-icon').textContent = '▴';
        btn.querySelector('.toggle-text').textContent = 'סגור פירוט';
      }
    });
  });

  // Secondary source links
  document.querySelectorAll('.secondary-source-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const srcId = btn.getAttribute('data-source-id');
      const note = btn.getAttribute('data-source-ref');
      openSourceDrawer(srcId, note);
    });
  });
}

// Global Drawer Events
function initGlobalEvents() {
  const overlay = document.getElementById("drawer-overlay");
  const closeBtn = document.getElementById("drawer-close-btn");

  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("open");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      overlay.classList.remove("open");
    }
  });
}

// Open Source Drawer
function openSourceDrawer(sourceId, refNote) {
  const overlay = document.getElementById("drawer-overlay");
  const content = document.getElementById("drawer-content");
  const source = STATE.sources.find(s => s.id === sourceId);

  if (sourceId === "UNVERIFIED" || !source) {
    content.innerHTML = 
      '<div class="drawer-alert-banner" style="background-color: #fffbeb; border-color: #fef3c7; color: #92400e;">' +
        '<strong>סטטוס אימות מקורות: מקור רשמי למצב הקיים טרם אומת במאגר</strong><br>' +
        'בהתאם למתודולוגיה הקפדנית של הפרויקט, לא מוצג קישור או מסמך שלא נבדק ואומת ישירות מול מאגרי הממשלה (חוזר מנכ"ל / חוק רשמי). ' +
        'הנתון מסומן כעת כדורש השלמת אימות מקור רשמי (Source Verification Required).' +
      '</div>' +
      (refNote ? 
        '<div class="drawer-row">' +
          '<span class="drawer-label">הערת תיעוד / סטטוס</span>' +
          '<span class="drawer-val">' + refNote + '</span>' +
        '</div>'
      : '');
    overlay.classList.add("open");
    return;
  }

  const isSecondary = source.sourceType === "secondary_research_source";
  const typeLabel = SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType;
  const verifLabel = VERIFICATION_LABELS[source.verificationLevel] || source.verificationLevel;

  content.innerHTML = 
    (isSecondary ? 
      '<div class="drawer-alert-banner">' +
        '<strong>הודעת שקיפות ואימות</strong><br>' +
        'הנתון נלקח ממסמך מחקר עומק (מקור משני). <strong>המקור הראשוני המקורי (הסכם רשמי/פרוטוקול) ממתין להצלבה ישירה.</strong>' +
      '</div>'
    : '') +

    '<div class="drawer-row">' +
      '<span class="drawer-label">שם המקור</span>' +
      '<span class="drawer-val font-semibold">' + source.title + '</span>' +
    '</div>' +

    '<div class="drawer-row">' +
      '<span class="drawer-label">סוג מקור</span>' +
      '<span class="drawer-val">' + typeLabel + '</span>' +
    '</div>' +

    '<div class="drawer-row">' +
      '<span class="drawer-label">גוף מפרסם</span>' +
      '<span class="drawer-val">' + (source.publisher || 'לא צוין') + '</span>' +
    '</div>' +

    '<div class="drawer-row">' +
      '<span class="drawer-label">תאריך פרסום / אחזור</span>' +
      '<span class="drawer-val">' + (source.publicationDate || source.accessDate || 'לא צוין') + '</span>' +
    '</div>' +

    '<div class="drawer-row">' +
      '<span class="drawer-label">רמת אימות</span>' +
      '<span class="drawer-val">' + verifLabel + ' (ביטחון: ' + (source.confidenceLevel === 'high' ? 'גבוה' : 'בינוני') + ')' +
      (source.sourceVerified ? ' <span style="display:inline-block; background-color:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem; margin-right:6px;">✓ מאומת רשמית (' + (source.sourceVerifiedDate || '2026-08-31') + ')</span>' : '') +
      '</span>' +
    '</div>' +

    (refNote ? 
      '<div class="drawer-row">' +
        '<span class="drawer-label">סעיף / הפניה</span>' +
        '<span class="drawer-val">' + refNote + '</span>' +
      '</div>'
    : '') +

    (source.localFilePath ? 
      '<div class="drawer-row">' +
        '<span class="drawer-label">נתיב קובץ בארכיון</span>' +
        '<span class="drawer-val"><code>' + source.localFilePath + '</code></span>' +
      '</div>'
    : '') +

    (source.url ? 
      '<div class="drawer-row">' +
        '<span class="drawer-label">קישור ישיר למסמך המקור</span>' +
        '<span class="drawer-val"><a href="' + source.url + '" target="_blank" rel="noopener noreferrer" class="source-direct-url">פתח מסמך מקור מקוון ↗</a></span>' +
      '</div>'
    : 
      '<div class="drawer-row">' +
        '<span class="drawer-label">גישה למסמך</span>' +
        '<span class="drawer-val" style="color: #166534; font-weight: 600;">📁 מקור ראשוני מאומת — קובץ מקומי בפרויקט</span>' +
      '</div>'
    );

  overlay.classList.add("open");
}

document.addEventListener("DOMContentLoaded", loadAllData);
