/**
 * Master Data Operations Dashboard - Application Logic (V1.0 Refined)
 * Version: UNION_MASTER_OPERATIONAL_V1.0
 * איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות
 */

document.addEventListener('DOMContentLoaded', () => {
  const allData = window.MASTER_DATA || [];
  let filteredData = [...allData];
  let currentPage = 1;
  let pageSize = 50;

  // Affiliation DOM
  const affilMember = document.getElementById('affilMemberCount');
  const affilContact = document.getElementById('affilContactCount');
  const affilExternal = document.getElementById('affilExternalCount');
  const affilUnknown = document.getElementById('affilUnknownCount');

  // KPI DOM
  const kpiTotal = document.getElementById('kpiTotalRecords');
  const kpiReady = document.getElementById('kpiReadyRecords');
  const kpiReadyPct = document.getElementById('kpiReadyPct');
  const kpiCommAllowed = document.getElementById('kpiCommAllowed');
  const kpiCommAllowedPct = document.getElementById('kpiCommAllowedPct');
  const kpiMobile = document.getElementById('kpiMobileRecords');
  const kpiMobilePct = document.getElementById('kpiMobilePct');
  const kpiEmail = document.getElementById('kpiEmailRecords');
  const kpiEmailPct = document.getElementById('kpiEmailPct');
  const kpiNoContact = document.getElementById('kpiNoContactRecords');
  const kpiUnresolved = document.getElementById('kpiUnresolvedRecords');
  const kpiUnsub = document.getElementById('kpiUnsubRecords');

  const topIssuesContainer = document.getElementById('topIssuesContainer');
  const priorityQueueContainer = document.getElementById('priorityQueueContainer');

  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const filterAuthority = document.getElementById('filterAuthority');
  const filterRole = document.getElementById('filterRole');
  const filterAffiliation = document.getElementById('filterAffiliation');
  const filterQuality = document.getElementById('filterQuality');
  const filterComm = document.getElementById('filterComm');
  const filterPriority = document.getElementById('filterPriority');

  const chkOnlyMobile = document.getElementById('chkOnlyMobile');
  const chkOnlyEmail = document.getElementById('chkOnlyEmail');
  const chkMissingMobile = document.getElementById('chkMissingMobile');
  const chkMissingEmail = document.getElementById('chkMissingEmail');
  const chkCanMail = document.getElementById('chkCanMail');
  const chkUnsub = document.getElementById('chkUnsub');
  const btnResetFilters = document.getElementById('btnResetFilters');

  const tableBody = document.getElementById('tableBody');
  const lblFilteredCount = document.getElementById('lblFilteredCount');
  const lblTotalCount = document.getElementById('lblTotalCount');
  const selPageSize = document.getElementById('selPageSize');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const lblPageInfo = document.getElementById('lblPageInfo');

  const btnExportFilteredXlsx = document.getElementById('btnExportFilteredXlsx');
  const btnExportCurrentCsv = document.getElementById('btnExportCurrentCsv');

  const recordModal = document.getElementById('recordModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalOk = document.getElementById('btnModalOk');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  initDashboard();

  function initDashboard() {
    calculateAndRenderMetrics();
    populateFilterDropdowns();
    renderTopIssuesAndPriorities();
    setupEventListeners();
    applyFilters();
  }

  function calculateAndRenderMetrics() {
    const total = allData.length;
    lblTotalCount.textContent = total.toLocaleString();
    kpiTotal.textContent = total.toLocaleString();

    // Professional Affiliation
    const memCount = allData.filter(r => r['שיוך מקצועי'] === 'מנהל/ת או בעל/ת תפקיד חינוך רלוונטי/ת').length;
    const conCount = allData.filter(r => r['שיוך מקצועי'] === 'איש קשר מקצועי אחר').length;
    const extCount = allData.filter(r => r['שיוך מקצועי'] === 'גורם חיצוני').length;
    const unkCount = allData.filter(r => r['שיוך מקצועי'] === 'לא ידוע').length;

    affilMember.textContent = memCount.toLocaleString();
    affilContact.textContent = conCount.toLocaleString();
    affilExternal.textContent = extCount.toLocaleString();
    affilUnknown.textContent = unkCount.toLocaleString();

    // Data Quality & Communication
    const highQuality = allData.filter(r => r['איכות נתונים'] === 'איכות גבוהה').length;
    const commAllowed = allData.filter(r => r['הרשאת דיוור'] === 'מורשה לדיוור').length;
    const commBlocked = allData.filter(r => r['הרשאת דיוור'] !== 'מורשה לדיוור').length;

    const hasMobile = allData.filter(r => r['חסר טלפון נייד'] === 'לא').length;
    const hasEmail = allData.filter(r => r['חסר דוא"ל'] === 'לא').length;
    const noContact = allData.filter(r => r['חסר טלפון נייד'] === 'כן' && r['חסר דוא"ל'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    const unresolved = allData.filter(r => r['לא מוכרע (Unresolved)'] === 'כן').length;

    kpiReady.textContent = highQuality.toLocaleString();
    kpiReadyPct.textContent = `${((highQuality / total) * 100).toFixed(1)}% מהמאגר`;

    kpiCommAllowed.textContent = commAllowed.toLocaleString();
    kpiCommAllowedPct.textContent = `${((commAllowed / total) * 100).toFixed(1)}%`;

    kpiUnsub.textContent = commBlocked.toLocaleString();

    kpiMobile.textContent = hasMobile.toLocaleString();
    kpiMobilePct.textContent = `${((hasMobile / total) * 100).toFixed(1)}%`;

    kpiEmail.textContent = hasEmail.toLocaleString();
    kpiEmailPct.textContent = `${((hasEmail / total) * 100).toFixed(1)}%`;

    kpiNoContact.textContent = noContact.toLocaleString();
    kpiUnresolved.textContent = unresolved.toLocaleString();

    // Chip counts
    document.getElementById('chipCountHQ').textContent = highQuality;
    document.getElementById('chipCountMember').textContent = memCount;
    document.getElementById('chipCountB').textContent = allData.filter(r => r['חסר טלפון נייד'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    document.getElementById('chipCountC').textContent = allData.filter(r => r['חסר דוא"ל'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    document.getElementById('chipCountD').textContent = noContact;
    document.getElementById('chipCountE').textContent = allData.filter(r => r['תפקיד לא ממופה'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    document.getElementById('chipCountF').textContent = allData.filter(r => r['רשות לא מזוהה'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    document.getElementById('chipCountG').textContent = unresolved;
    document.getElementById('chipCountH').textContent = commBlocked;
  }

  function renderTopIssuesAndPriorities() {
    const missingMobileActive = allData.filter(r => r['חסר טלפון נייד'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    const missingRoleActive = allData.filter(r => r['תפקיד לא ממופה'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    const missingEmailActive = allData.filter(r => r['חסר דוא"ל'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;
    const unresolvedCount = allData.filter(r => r['לא מוכרע (Unresolved)'] === 'כן').length;
    const missingAuthActive = allData.filter(r => r['רשות לא מזוהה'] === 'כן' && r['הוסר מדיוור'] === 'לא').length;

    const issues = [
      { title: '1. חסרי טלפון נייד (ברשומות פעילות)', count: missingMobileActive, filter: 'MISSING_MOBILE_ACTIVE', badgeClass: 'badge-cat-b' },
      { title: '2. תפקידים הדורשים מיפוי (ברשומות פעילות)', count: missingRoleActive, filter: 'MISSING_ROLE_ACTIVE', badgeClass: 'badge-cat-e' },
      { title: '3. חסרי כתובת דוא"ל (ברשומות פעילות)', count: missingEmailActive, filter: 'MISSING_EMAIL_ACTIVE', badgeClass: 'badge-cat-c' },
      { title: '4. רשומות UNRESOLVED הדורשות בירור עתידי', count: unresolvedCount, filter: 'CAT_G', badgeClass: 'badge-cat-g' },
      { title: '5. שיוך רשות מקומית לבירור', count: missingAuthActive, filter: 'MISSING_AUTH_ACTIVE', badgeClass: 'badge-cat-f' }
    ];

    topIssuesContainer.innerHTML = issues.map(iss => `
      <div class="issue-item" data-filter="${iss.filter}">
        <span class="issue-title">${iss.title}</span>
        <span class="issue-badge ${iss.badgeClass}">${iss.count.toLocaleString()} רשומות</span>
      </div>
    `).join('');

    const pri1 = allData.filter(r => r['עדיפות טיוב נתונים']?.startsWith('Priority 1')).length;
    const pri2 = allData.filter(r => r['עדיפות טיוב נתונים']?.startsWith('Priority 2')).length;
    const pri3 = allData.filter(r => r['עדיפות טיוב נתונים']?.startsWith('Priority 3')).length;
    const pri4 = allData.filter(r => r['עדיפות טיוב נתונים']?.startsWith('Priority 4')).length;
    const pri5 = allData.filter(r => r['עדיפות טיוב נתונים']?.startsWith('Priority 5')).length;
    const blockedCount = allData.filter(r => r['עדיפות טיוב נתונים']?.includes('חסום לדיוור')).length;

    const priorities = [
      { p: 'Priority 1 (דחיפות עליונה)', desc: 'בירור זהות רשומות UNRESOLVED', count: pri1, filter: 'PRI_1' },
      { p: 'Priority 2 (דחיפות גבוהה)', desc: 'השלמת פרטי קשר לחסרי טלפון ומייל', count: pri2, filter: 'PRI_2' },
      { p: 'Priority 3 (דחיפות בינונית)', desc: 'השלמת טלפונים ניידים / רשות', count: pri3, filter: 'PRI_3' },
      { p: 'Priority 4 (דחיפות מתונה)', desc: 'מיפוי תפקידים והשלמת דוא"ל', count: pri4, filter: 'PRI_4' },
      { p: 'Priority 5 (איכות גבוהה)', desc: 'רשומות שלמות – אין צורך בטיוב', count: pri5, filter: 'PRI_5' },
      { p: 'חסומים לדיוור (הוחרגו)', desc: 'הוסרו מדיוור – אין פעולת טיוב נדרשת', count: blockedCount, filter: 'COMM_BLOCKED' }
    ];

    priorityQueueContainer.innerHTML = priorities.map(pri => `
      <div class="priority-item" data-filter="${pri.filter}">
        <div class="priority-details">
          <span class="priority-title">${pri.p}: ${pri.desc}</span>
        </div>
        <span class="priority-badge">${pri.count.toLocaleString()}</span>
      </div>
    `).join('');

    document.querySelectorAll('.issue-item, .priority-item').forEach(item => {
      item.addEventListener('click', () => {
        applyQuickFilter(item.dataset.filter);
      });
    });
  }

  function populateFilterDropdowns() {
    const authSet = new Set();
    const roleSet = new Set();

    allData.forEach(r => {
      if (r['רשות מקומית תקנית'] && r['רשות מקומית תקנית'] !== 'לא מוגדר') {
        authSet.add(r['רשות מקומית תקנית']);
      }
      if (r['תפקיד תקני'] && r['תפקיד תקני'] !== 'תפקיד לא מזוהה') {
        roleSet.add(r['תפקיד תקני']);
      }
    });

    const sortedAuths = Array.from(authSet).sort((a, b) => a.localeCompare(b, 'he'));
    sortedAuths.forEach(auth => {
      const opt = document.createElement('option');
      opt.value = auth;
      opt.textContent = auth;
      filterAuthority.appendChild(opt);
    });

    const sortedRoles = Array.from(roleSet).sort((a, b) => a.localeCompare(b, 'he'));
    sortedRoles.forEach(role => {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = role;
      filterRole.appendChild(opt);
    });
  }

  function setupEventListeners() {
    document.querySelectorAll('.quick-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.quick-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyQuickFilter(chip.dataset.filter);
      });
    });

    document.querySelectorAll('.affil-card').forEach(card => {
      card.addEventListener('click', () => {
        applyQuickFilter(card.dataset.action);
      });
    });

    document.querySelectorAll('.kpi-card').forEach(card => {
      card.addEventListener('click', () => {
        applyQuickFilter(card.dataset.action);
      });
    });

    searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
    btnClearSearch.addEventListener('click', () => { searchInput.value = ''; currentPage = 1; applyFilters(); });

    filterAuthority.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterRole.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterAffiliation.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterQuality.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterComm.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    filterPriority.addEventListener('change', () => { currentPage = 1; applyFilters(); });

    chkOnlyMobile.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    chkOnlyEmail.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    chkMissingMobile.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    chkMissingEmail.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    chkCanMail.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    chkUnsub.addEventListener('change', () => { currentPage = 1; applyFilters(); });

    btnResetFilters.addEventListener('click', resetAllFilters);

    selPageSize.addEventListener('change', () => {
      pageSize = selPageSize.value === 'ALL' ? 999999 : parseInt(selPageSize.value, 10);
      currentPage = 1;
      renderTable();
    });

    btnPrevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });

    btnNextPage.addEventListener('click', () => {
      const maxPages = Math.ceil(filteredData.length / pageSize) || 1;
      if (currentPage < maxPages) {
        currentPage++;
        renderTable();
      }
    });

    btnExportFilteredXlsx.addEventListener('click', exportFilteredToExcel);
    btnExportCurrentCsv.addEventListener('click', exportFilteredToCsv);

    modalBackdrop.addEventListener('click', closeModal);
    btnModalClose.addEventListener('click', closeModal);
    btnModalOk.addEventListener('click', closeModal);
  }

  function applyQuickFilter(type) {
    resetAllFilters(false);

    if (type === 'HIGH_QUALITY') filterQuality.value = 'איכות גבוהה';
    else if (type === 'AFFIL_MEMBER') filterAffiliation.value = 'מנהל/ת או בעל/ת תפקיד חינוך רלוונטי/ת';
    else if (type === 'AFFIL_CONTACT') filterAffiliation.value = 'איש קשר מקצועי אחר';
    else if (type === 'AFFIL_EXTERNAL') filterAffiliation.value = 'גורם חיצוני';
    else if (type === 'AFFIL_UNKNOWN') filterAffiliation.value = 'לא ידוע';
    else if (type === 'COMM_ALLOWED') filterComm.value = 'מורשה לדיוור';
    else if (type === 'COMM_BLOCKED') filterComm.value = 'חסום לדיוור (הסרה/סירוב)';
    else if (type === 'CAT_B' || type === 'MISSING_MOBILE_ACTIVE') { chkMissingMobile.checked = true; chkUnsub.checked = false; }
    else if (type === 'CAT_C' || type === 'MISSING_EMAIL_ACTIVE') { chkMissingEmail.checked = true; chkUnsub.checked = false; }
    else if (type === 'CAT_D') { chkMissingMobile.checked = true; chkMissingEmail.checked = true; }
    else if (type === 'CAT_E' || type === 'MISSING_ROLE_ACTIVE') { filterPriority.value = 'Priority 4'; }
    else if (type === 'CAT_F' || type === 'MISSING_AUTH_ACTIVE') { filterPriority.value = 'Priority 3'; }
    else if (type === 'CAT_G' || type === 'PRI_1') filterPriority.value = 'Priority 1';
    else if (type === 'PRI_2') filterPriority.value = 'Priority 2';
    else if (type === 'PRI_3') filterPriority.value = 'Priority 3';
    else if (type === 'PRI_4') filterPriority.value = 'Priority 4';
    else if (type === 'PRI_5') filterPriority.value = 'Priority 5';
    else if (type === 'HAS_MOBILE') chkOnlyMobile.checked = true;
    else if (type === 'HAS_EMAIL') chkOnlyEmail.checked = true;

    document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });

    currentPage = 1;
    applyFilters();
  }

  function resetAllFilters(reApply = true) {
    searchInput.value = '';
    filterAuthority.value = '';
    filterRole.value = '';
    filterAffiliation.value = '';
    filterQuality.value = '';
    filterComm.value = '';
    filterPriority.value = '';
    chkOnlyMobile.checked = false;
    chkOnlyEmail.checked = false;
    chkMissingMobile.checked = false;
    chkMissingEmail.checked = false;
    chkCanMail.checked = false;
    chkUnsub.checked = false;

    document.querySelectorAll('.quick-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.quick-chips .chip[data-filter="ALL"]')?.classList.add('active');

    if (reApply) {
      currentPage = 1;
      applyFilters();
    }
  }

  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const selAuth = filterAuthority.value;
    const selRole = filterRole.value;
    const selAffil = filterAffiliation.value;
    const selQual = filterQuality.value;
    const selComm = filterComm.value;
    const selPri = filterPriority.value;

    const onlyMobile = chkOnlyMobile.checked;
    const onlyEmail = chkOnlyEmail.checked;
    const missMobile = chkMissingMobile.checked;
    const missEmail = chkMissingEmail.checked;
    const canMail = chkCanMail.checked;
    const unsub = chkUnsub.checked;

    filteredData = allData.filter(row => {
      if (q) {
        const textToSearch = [
          row['מזהה Master'],
          row['שם מלא'],
          row['רשות מקומית תקנית'],
          row['תפקיד תקני'],
          row['תפקיד מקורי'],
          row['טלפון נייד'],
          row['דוא"ל ראשי'],
          row['שיוך מקצועי'],
          row['אגף / יחידה']
        ].join(' ').toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }

      if (selAuth && row['רשות מקומית תקנית'] !== selAuth) return false;
      if (selRole && row['תפקיד תקני'] !== selRole) return false;
      if (selAffil && row['שיוך מקצועי'] !== selAffil) return false;
      if (selQual && row['איכות נתונים'] !== selQual) return false;
      if (selComm && row['הרשאת דיוור'] !== selComm) return false;
      if (selPri && !row['עדיפות טיוב נתונים']?.startsWith(selPri)) return false;

      if (onlyMobile && row['חסר טלפון נייד'] === 'כן') return false;
      if (onlyEmail && row['חסר דוא"ל'] === 'כן') return false;
      if (missMobile && row['חסר טלפון נייד'] !== 'כן') return false;
      if (missEmail && row['חסר דוא"ל'] !== 'כן') return false;
      if (canMail && row['ניתן לשלוח דוא"ל'] !== 'כן') return false;
      if (unsub && row['הוסר מדיוור'] !== 'כן') return false;

      return true;
    });

    lblFilteredCount.textContent = filteredData.length.toLocaleString();
    renderTable();
  }

  function renderTable() {
    const totalRecords = filteredData.length;
    const maxPages = Math.ceil(totalRecords / pageSize) || 1;
    if (currentPage > maxPages) currentPage = maxPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = pageSize >= 999999 ? totalRecords : Math.min(startIdx + pageSize, totalRecords);
    const pageRows = filteredData.slice(startIdx, endIdx);

    lblPageInfo.textContent = `עמוד ${currentPage} מתוך ${maxPages}`;
    btnPrevPage.disabled = currentPage <= 1;
    btnNextPage.disabled = currentPage >= maxPages;

    if (pageRows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align:center; padding: 40px; color: var(--text-muted);">
            לא נמצאו רשומות התואמות את החיפוש והסינון.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = pageRows.map(row => {
      const qStatus = row['איכות נתונים'] || '';
      let qBadgeClass = 'badge-cat-d';
      if (qStatus === 'איכות גבוהה') qBadgeClass = 'badge-cat-a';
      else if (qStatus === 'איכות טובה') qBadgeClass = 'badge-cat-b';

      const commStatus = row['הרשאת דיוור'] || '';
      const commBadgeClass = commStatus === 'מורשה לדיוור' ? 'badge-cat-a' : 'badge-cat-h';

      const affil = row['שיוך מקצועי'] || 'לא ידוע';
      let affilBadgeClass = 'badge-cat-h';
      if (affil.includes('מנהל/ת') || affil.includes('חינוך')) affilBadgeClass = 'badge-cat-a';
      else if (affil.includes('איש קשר')) affilBadgeClass = 'badge-cat-e';
      else if (affil.includes('חיצוני')) affilBadgeClass = 'badge-cat-i';

      const phoneDisplay = row['טלפון נייד'] ? `<strong style="direction:ltr; display:inline-block;">${row['טלפון נייד']}</strong>` : '<span style="color:var(--text-muted);">חסר</span>';
      const emailDisplay = row['דוא"ל ראשי'] ? `<span style="direction:ltr; display:inline-block;">${row['דוא"ל ראשי']}</span>` : '<span style="color:var(--text-muted);">חסר</span>';

      return `
        <tr>
          <td><span style="font-family: monospace; font-weight: 700; color: var(--brand-primary);">${row['מזהה Master']}</span></td>
          <td><strong>${row['שם מלא'] || '<span style="color:var(--text-muted);">(ללא שם)</span>'}</strong></td>
          <td><span class="badge ${affilBadgeClass}">${affil}</span></td>
          <td>${row['רשות מקומית תקנית'] || row['רשות מקורית'] || '-'}</td>
          <td><small style="color:var(--text-secondary);">${row['סוג רשות'] ? row['סוג רשות'] + ' • ' + row['מחוז'] : '-'}</small></td>
          <td>${row['תפקיד תקני'] || row['תפקיד מקורי'] || '-'}</td>
          <td>${phoneDisplay}</td>
          <td>${emailDisplay}</td>
          <td><span class="badge ${qBadgeClass}">${qStatus}</span></td>
          <td><span class="badge ${commBadgeClass}">${commStatus === 'מורשה לדיוור' ? 'מורשה' : 'חסום'}</span></td>
          <td>
            <button class="btn btn-sm btn-outline btn-view-detail" data-id="${row['מזהה Master']}">פרטים</button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openRecordModal(id);
      });
    });
  }

  function openRecordModal(masterId) {
    const record = allData.find(r => r['מזהה Master'] === masterId);
    if (!record) return;

    modalTitle.textContent = `רשומת Master: ${record['שם מלא'] || record['מזהה Master']} (${record['מזהה Master']})`;

    const keys = Object.keys(record);
    modalBody.innerHTML = `
      <div class="modal-grid">
        ${keys.map(k => `
          <div class="modal-item ${k === 'הערות אישור אנושי' || k === 'מזהי רשומות מקור' || k === 'רשימות תפוצה' ? 'full-width' : ''}">
            <span class="modal-label">${k}</span>
            <span class="modal-val">${record[k] || '<em style="color:var(--text-muted);">ריק</em>'}</span>
          </div>
        `).join('')}
      </div>
    `;

    recordModal.classList.add('active');
  }

  function closeModal() {
    recordModal.classList.remove('active');
  }

  function exportFilteredToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('ספריית SheetJS אינה נגישה כעת.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filteredData);
    ws['!dir'] = 'rtl';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "רשימה מסוננת");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `איגוד_רשימת_מאסטר_מסוננת_${dateStr}.xlsx`);
  }

  function exportFilteredToCsv() {
    if (filteredData.length === 0) {
      alert('אין רשומות לייצוא בתצוגה הנוכחית.');
      return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    filteredData.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] === undefined || row[h] === null ? '' : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `איגוד_מאגר_מסונן_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }
});
