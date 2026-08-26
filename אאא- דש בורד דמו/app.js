/**
 * Pure Aggregated Demo Dashboard - Application Logic (Zero PII)
 * Version: UNION_DASHBOARD_PUBLIC_DEMO_V1.0
 * איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות
 */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.AGGREGATED_DATA || {};

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const statModal = document.getElementById('statModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalOk = document.getElementById('btnModalOk');
  const statModalTitle = document.getElementById('statModalTitle');
  const statModalBody = document.getElementById('statModalBody');

  const btnExportXlsx = document.getElementById('btnExportAggregatedXlsx');
  const btnExportCsv = document.getElementById('btnExportAggregatedCsv');

  init();

  function init() {
    renderKPIs();
    renderCategoriesTable();
    renderPrioritiesTable();
    renderIssuesTable();
    renderAuthoritiesTable();
    renderRolesTable();
    setupEventListeners();
  }

  function renderKPIs() {
    const ov = data.overview || {};
    const aff = data.professional_affiliation || {};

    document.getElementById('affilMemberCount').textContent = (aff.education_role || 0).toLocaleString();
    document.getElementById('affilContactCount').textContent = (aff.other_contact || 0).toLocaleString();
    document.getElementById('affilExternalCount').textContent = aff.external_entity_display || '<5';
    document.getElementById('affilUnknownCount').textContent = (aff.unspecified || 0).toLocaleString();

    document.getElementById('kpiTotalRecords').textContent = (ov.total_records || 0).toLocaleString();
    document.getElementById('kpiReadyRecords').textContent = (ov.data_ready || 0).toLocaleString();
    document.getElementById('kpiReadyPct').textContent = `${ov.data_ready_pct || 0}% מהמאגר`;

    document.getElementById('kpiCommAllowed').textContent = (ov.communication_allowed || 0).toLocaleString();
    document.getElementById('kpiCommAllowedPct').textContent = `${ov.communication_allowed_pct || 0}%`;

    document.getElementById('kpiUnsubRecords').textContent = (ov.communication_blocked || 0).toLocaleString();

    document.getElementById('kpiMobileRecords').textContent = (ov.valid_mobile || 0).toLocaleString();
    document.getElementById('kpiMobilePct').textContent = `${ov.valid_mobile_pct || 0}%`;

    document.getElementById('kpiEmailRecords').textContent = (ov.valid_email || 0).toLocaleString();
    document.getElementById('kpiEmailPct').textContent = `${ov.valid_email_pct || 0}%`;

    document.getElementById('kpiNoContactRecords').textContent = (ov.missing_all_contacts || 0).toLocaleString();
    document.getElementById('kpiUnresolvedRecords').textContent = (ov.unresolved || 0).toLocaleString();
  }

  function renderCategoriesTable() {
    const tbody = document.getElementById('tbodyCategories');
    const list = data.action_categories || [];

    tbody.innerHTML = list.map(cat => {
      let badgeClass = 'badge-cat-a';
      if (cat.code === 'B' || cat.code === 'C') badgeClass = 'badge-cat-b';
      else if (cat.code === 'D') badgeClass = 'badge-cat-d';
      else if (cat.code === 'E' || cat.code === 'F') badgeClass = 'badge-cat-e';
      else if (cat.code === 'G') badgeClass = 'badge-cat-g';
      else if (cat.code === 'H') badgeClass = 'badge-cat-h';
      else if (cat.code === 'I') badgeClass = 'badge-cat-i';

      const countStr = cat.count_display || cat.count.toLocaleString();

      return `
        <tr>
          <td><span class="badge ${badgeClass}">${cat.code}</span></td>
          <td><strong>${cat.name}</strong></td>
          <td style="text-align: left; font-weight: 700;">${countStr}</td>
          <td style="text-align: left; font-weight: 700; color: var(--text-secondary);">${cat.pct}%</td>
          <td>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${cat.pct}%;"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderPrioritiesTable() {
    const tbody = document.getElementById('tbodyPriorities');
    const list = data.cleansing_priorities || [];

    tbody.innerHTML = list.map(pri => `
      <tr>
        <td><strong>${pri.priority}</strong></td>
        <td><span class="badge ${pri.priority.includes('1') || pri.priority.includes('2') ? 'badge-cat-d' : pri.priority.includes('3') || pri.priority.includes('4') ? 'badge-cat-b' : 'badge-cat-a'}">${pri.name}</span></td>
        <td>${pri.desc}</td>
        <td style="text-align: left; font-weight: 700;">${pri.count.toLocaleString()}</td>
        <td style="text-align: left; font-weight: 700; color: var(--text-secondary);">${pri.pct}%</td>
      </tr>
    `).join('');
  }

  function renderIssuesTable() {
    const tbody = document.getElementById('tbodyIssues');
    const list = data.top_issues || [];

    tbody.innerHTML = list.map(iss => `
      <tr>
        <td><strong style="color: var(--brand-accent); font-size: 1.1rem;">#${iss.rank}</strong></td>
        <td><strong>${iss.issue}</strong></td>
        <td style="text-align: left; font-weight: 700; color: var(--color-danger);">${iss.count.toLocaleString()}</td>
        <td style="text-align: left; font-weight: 700;">${iss.pct}%</td>
        <td><small style="color: var(--text-secondary);">${iss.impact}</small></td>
      </tr>
    `).join('');
  }

  function renderAuthoritiesTable() {
    const tbody = document.getElementById('tbodyAuthorities');
    const list = data.authorities_distribution || [];

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.authority}</strong></td>
        <td style="text-align: left; font-weight: 700;">${item.count_display}</td>
        <td style="text-align: left; font-weight: 700; color: var(--text-secondary);">${item.pct}%</td>
        <td>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${Math.min(item.pct * 4, 100)}%;"></div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderRolesTable() {
    const tbody = document.getElementById('tbodyRoles');
    const list = data.roles_distribution || [];

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>${item.role}</strong></td>
        <td style="text-align: left; font-weight: 700;">${item.count_display}</td>
        <td style="text-align: left; font-weight: 700; color: var(--text-secondary);">${item.pct}%</td>
        <td>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${Math.min(item.pct * 4, 100)}%;"></div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function setupEventListeners() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = document.getElementById(btn.dataset.tab);
        if (targetTab) targetTab.classList.add('active');
      });
    });

    document.querySelectorAll('.kpi-card, .affil-card').forEach(card => {
      card.addEventListener('click', () => {
        const statType = card.dataset.stat;
        openStatModal(statType);
      });
    });

    modalBackdrop.addEventListener('click', closeModal);
    btnModalClose.addEventListener('click', closeModal);
    btnModalOk.addEventListener('click', closeModal);

    btnExportXlsx.addEventListener('click', exportAggregatedXlsx);
    btnExportCsv.addEventListener('click', exportAggregatedCsv);
  }

  function openStatModal(statType) {
    let title = 'ניתוח סטטיסטי מצרפי';
    let contentHtml = '';

    if (statType === 'ready') {
      title = 'סטטיסטיקת רשומות באיכות גבוהה (Data Ready)';
      contentHtml = `
        <p style="margin-bottom: 12px;"><strong>1,175 רשומות (58.7%)</strong> עומדות בסטנדרט האיכות הגבוה ביותר של האיגוד.</p>
        <ul style="padding-right: 20px; line-height: 1.8;">
          <li>זהות ברורה ומאומתת.</li>
          <li>שיוך מוניציפלי מזוהה ותקני.</li>
          <li>תפקיד ניהולי מסווג לאשכול סטנדרטי.</li>
          <li>לפחות אמצעי קשר אחד תקין (טלפון נייד או דוא"ל).</li>
        </ul>
      `;
    } else if (statType === 'comm_allowed') {
      title = 'סטטיסטיקת הרשאות דיוור (Communication Allowed)';
      contentHtml = `
        <p style="margin-bottom: 12px;"><strong>1,402 רשומות (70.0%)</strong> מורשות לדיוור חוקי על בסיס נתוני ההסכמה המקוריים.</p>
        <p style="color: var(--text-secondary);">במאגר זה הופרדה לחלוטין הרשאת הדיוור משאלת איכות הנתונים, בהתאם לכלל <em>Explicit Unsubscribe > Positive Consent > Unknown</em>.</p>
      `;
    } else if (statType === 'comm_blocked') {
      title = 'סטטיסטיקת חסומים לדיוור (Unsubscribed)';
      contentHtml = `
        <p style="margin-bottom: 12px;"><strong>601 רשומות (30.0%)</strong> כוללות בקשת הסרה או סירוב דיוור מפורש.</p>
        <p style="color: var(--text-secondary);">כל הרשומות הללו הוחרגו מתור הטיוב האופרטיבי, ומוגנות משליחת הודעות דיוור עתידיות.</p>
      `;
    } else if (statType === 'unresolved') {
      title = 'סטטיסטיקת רשומות UNRESOLVED';
      contentHtml = `
        <p style="margin-bottom: 12px;"><strong>22 רשומות (1.1%)</strong> שמורות במאגר בסטטוס UNRESOLVED לבירור עתידי.</p>
        <p style="color: var(--text-secondary);">רשומות אלה כוללות בדיקות מערכת טכניות ישנות או רשומות ללא שם מזוהה. הן נשמרות במלואן ללא שינוי וללא דריסה.</p>
      `;
    } else if (statType === 'affil_edu') {
      title = 'שיוך מקצועי: בעלי תפקידי חינוך רלוונטיים';
      contentHtml = `
        <p style="margin-bottom: 12px;"><strong>1,178 אנשי קשר (58.8%)</strong> מזוהים כבעלי תפקיד ניהול חינוכי מוניציפלי (מנהלי אגפים, מחלקות, יסודי, על-יסודי, גיל רך ושפ"ח).</p>
        <p style="color: var(--text-muted); font-size: 0.88rem;">הערה: שיוך מקצועי אינו מעיד אוטומטית על מעמד חברות רשמי באיגוד בהיעדר פנקס חברים מקורי.</p>
      `;
    } else if (statType === 'affil_ext') {
      title = 'שיוך מקצועי: גורמים חיצוניים';
      contentHtml = `
        <p style="margin-bottom: 12px;"><strong>קבוצה מצומצמת (&lt;5 רשומות, 0.1%)</strong> של גופים שאינם רשות מקומית (כגון משכ"ל, ספקים או תקשורת).</p>
        <p style="color: var(--text-muted); font-size: 0.88rem;">הערה: בהתאם לכלל הפרטיות k &ge; 5, המספר המדויק מוסווה לשמירה על סודיות.</p>
      `;
    } else {
      title = 'תמונת מצב כללית של המאגר';
      contentHtml = `
        <p>המאגר כולל <strong>2,003 רשומות מטויבות</strong> שנוצרו בתהליך טיוב והאחדה מבוקר ללא אובדן מידע.</p>
      `;
    }

    statModalTitle.textContent = title;
    statModalBody.innerHTML = contentHtml;
    statModal.classList.add('active');
  }

  function closeModal() {
    statModal.classList.remove('active');
  }

  function exportAggregatedXlsx() {
    if (typeof XLSX === 'undefined') {
      alert('ספריית SheetJS אינה נגישה.');
      return;
    }

    const wb = XLSX.utils.book_new();

    const kpiRows = [
      { "מדד מרכזי": "סה\"כ רשומות במאגר", "כמות": 2003, "אחוז": "100.0%" },
      { "מדד מרכזי": "רשומות באיכות גבוהה (Data Ready)", "כמות": data.overview.data_ready, "אחוז": `${data.overview.data_ready_pct}%` },
      { "מדד מרכזי": "מורשים לדיוור (Communication Allowed)", "כמות": data.overview.communication_allowed, "אחוז": `${data.overview.communication_allowed_pct}%` },
      { "מדד מרכזי": "חסומים לדיוור (Unsubscribed)", "כמות": data.overview.communication_blocked, "אחוז": `${data.overview.communication_blocked_pct}%` },
      { "מדד מרכזי": "בעלי טלפון נייד תקין", "כמות": data.overview.valid_mobile, "אחוז": `${data.overview.valid_mobile_pct}%` },
      { "מדד מרכזי": "בעלי דוא\"ל תקין", "כמות": data.overview.valid_email, "אחוז": `${data.overview.valid_email_pct}%` },
      { "מדד מרכזי": "ללא שום אמצעי קשר", "כמות": data.overview.missing_all_contacts, "אחוז": "0.4%" },
      { "מדד מרכזי": "רשומות UNRESOLVED", "כמות": data.overview.unresolved, "אחוז": "1.1%" }
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
    wsKpi['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, wsKpi, "מדדים מרכזיים");

    const wsCat = XLSX.utils.json_to_sheet(data.action_categories.map(c => ({
      "קוד": c.code, "קטגוריה": c.name, "כמות": c.count_display || c.count, "אחוז": `${c.pct}%`
    })));
    wsCat['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, wsCat, "קטגוריות פעולה");

    const wsPri = XLSX.utils.json_to_sheet(data.cleansing_priorities.map(p => ({
      "רמת עדיפות": p.priority, "הגדרה": p.name, "משמעות": p.desc, "כמות": p.count, "אחוז": `${p.pct}%`
    })));
    wsPri['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, wsPri, "סדרי עדיפויות");

    const wsIss = XLSX.utils.json_to_sheet(data.top_issues.map(i => ({
      "דירוג": i.rank, "בעיה": i.issue, "כמות מושפעת": i.count, "אחוז": `${i.pct}%`, "השפעה": i.impact
    })));
    wsIss['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, wsIss, "חמש הבעיות המרכזיות");

    const wsAuth = XLSX.utils.json_to_sheet(data.authorities_distribution.map(a => ({
      "רשות מקומית": a.authority, "כמות": a.count_display, "אחוז": `${a.pct}%`
    })));
    wsAuth['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, wsAuth, "התפלגות רשויות");

    XLSX.writeFile(wb, `איגוד_דוח_מצרפי_איכות_נתונים_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportAggregatedCsv() {
    const list = data.action_categories || [];
    const rows = [["קוד קטגוריה", "שם קטגוריה", "כמות רשומות", "אחוז מהמאגר"]];

    list.forEach(c => {
      rows.push([c.code, c.name, c.count_display || c.count, `${c.pct}%`]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `איגוד_דוח_מצרפי_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }
});
