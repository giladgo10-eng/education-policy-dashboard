// ==============================================================================
// app.js - Main Dashboard Controller for Education Equity System
// ==============================================================================

(function () {
  'use strict';

  // Application State
  const state = {
    allData: [],
    filteredData: [],
    selectedAuthority: null,
    nationalAvg: 29225,
    activeTab: 'tab-matrix',
    sortCol: 'total_spending_per_pupil_nis',
    sortAsc: false,
    lastSimResults: null
  };

  // DOM Elements
  const el = {
    kpiNationalAvg: document.getElementById('kpiNationalAvg'),
    kpiTotalPupils: document.getElementById('kpiTotalPupils'),
    kpiMaxGap: document.getElementById('kpiMaxGap'),
    kpiLostMatching: document.getElementById('kpiLostMatching'),
    kpiSpecialEdBurden: document.getElementById('kpiSpecialEdBurden'),

    filterSearch: document.getElementById('filterSearch'),
    filterDistrict: document.getElementById('filterDistrict'),
    filterType: document.getElementById('filterType'),
    filterSocio: document.getElementById('filterSocio'),
    filterCategory: document.getElementById('filterCategory'),
    btnResetFilters: document.getElementById('btnResetFilters'),

    matrixCountBadge: document.getElementById('matrixCountBadge'),
    canvasScatterMatrix: document.getElementById('canvasScatterMatrix'),

    // Profile Elements
    profName: document.getElementById('profName'),
    profSub: document.getElementById('profSub'),
    profCategoryBadge: document.getElementById('profCategoryBadge'),
    profPop: document.getElementById('profPop'),
    profPupils: document.getElementById('profPupils'),
    profSocio: document.getElementById('profSocio'),
    profPeri: document.getElementById('profPeri'),
    profArnonaPerPupil: document.getElementById('profArnonaPerPupil'),
    profMatchingScore: document.getElementById('profMatchingScore'),
    profLostMatching: document.getElementById('profLostMatching'),
    profTotalSpend: document.getElementById('profTotalSpend'),
    profGovStd: document.getElementById('profGovStd'),
    profGovDiff: document.getElementById('profGovDiff'),
    profMuniSpend: document.getElementById('profMuniSpend'),
    profParentsPay: document.getElementById('profParentsPay'),
    canvasDonutBreakdown: document.getElementById('canvasDonutBreakdown'),
    canvasPeerBenchmark: document.getElementById('canvasPeerBenchmark'),

    // Special Ed & Transport Elements
    specialEdAuthBadge: document.getElementById('specialEdAuthBadge'),
    sePupilCount: document.getElementById('sePupilCount'),
    sePupilPct: document.getElementById('sePupilPct'),
    seMuniBurden: document.getElementById('seMuniBurden'),
    seTransportDeficit: document.getElementById('seTransportDeficit'),
    seClassroomShortage: document.getElementById('seClassroomShortage'),
    seTotalTransport: document.getElementById('seTotalTransport'),
    seInformalSpend: document.getElementById('seInformalSpend'),
    seGafenBasket: document.getElementById('seGafenBasket'),

    // Simulator Elements
    sliderPoolM: document.getElementById('sliderPoolM'),
    sliderWSocio: document.getElementById('sliderWSocio'),
    sliderWPeri: document.getElementById('sliderWPeri'),
    sliderWArnona: document.getElementById('sliderWArnona'),
    sliderWSpecialEd: document.getElementById('sliderWSpecialEd'),
    valPoolM: document.getElementById('valPoolM'),
    valWSocio: document.getElementById('valWSocio'),
    valWPeri: document.getElementById('valWPeri'),
    valWArnona: document.getElementById('valWArnona'),
    valWSpecialEd: document.getElementById('valWSpecialEd'),
    chkExemptMatching: document.getElementById('chkExemptMatching'),
    simGiniDrop: document.getElementById('simGiniDrop'),
    simGapDrop: document.getElementById('simGapDrop'),
    simGainersBody: document.getElementById('simGainersBody'),

    // Advocacy & Table
    advocacyPaperContainer: document.getElementById('advocacyPaperContainer'),
    fullDataBody: document.getElementById('fullDataBody'),
    fullDataTable: document.getElementById('fullDataTable'),

    // Buttons
    btnQuickSim: document.getElementById('btnQuickSim'),
    btnQuickReport: document.getElementById('btnQuickReport'),
    btnExportExcel: document.getElementById('btnExportExcel'),
    btnTableExport: document.getElementById('btnTableExport')
  };

  // Initialize App
  function init() {
    if (window.EDUCATION_EQUITY_DATA && Array.isArray(window.EDUCATION_EQUITY_DATA)) {
      state.allData = window.EDUCATION_EQUITY_DATA;
      finishInit();
    } else {
      fetch('data/education_equity_master.json')
        .then(res => res.json())
        .then(data => {
          state.allData = data;
          finishInit();
        })
        .catch(err => {
          console.error('Failed to load dataset:', err);
        });
    }
  }

  function finishInit() {
    state.filteredData = [...state.allData];

    // Compute Overall Stats
    let totalSpending = 0, totalPupils = 0, totalLostMatching = 0, totalSpecialEdBurden = 0;
    state.allData.forEach(d => {
      totalSpending += (d.total_spending_per_pupil_nis * d.total_pupils);
      totalPupils += d.total_pupils;
      totalLostMatching += (d.lost_matching_per_pupil_nis * d.total_pupils);
      totalSpecialEdBurden += ((d.special_ed_muni_burden_nis || 12000) * (d.pupils_special_ed || (d.total_pupils * 0.08))) + ((d.transport_deficit_per_pupil_nis || 800) * d.total_pupils);
    });

    state.nationalAvg = Math.round(totalSpending / Math.max(1, totalPupils));

    // Update KPI Card UI
    el.kpiNationalAvg.textContent = '₪' + state.nationalAvg.toLocaleString();
    el.kpiTotalPupils.textContent = (Math.round(totalPupils / 100000) / 10).toFixed(1) + 'M';
    el.kpiLostMatching.textContent = '₪' + (Math.round(totalLostMatching / 10000000) / 100).toFixed(2) + ' מיליארד';
    el.kpiSpecialEdBurden.textContent = '₪' + (Math.round(totalSpecialEdBurden / 10000000) / 100).toFixed(2) + ' מיליארד';

    // Default Selection: Bnei Brak (6100) or first
    const defaultAuth = state.allData.find(a => a.code === '6100') || state.allData[0];
    selectAuthority(defaultAuth);

    // Setup Event Listeners
    setupEventListeners();

    // Render Initial Views
    applyFilters();
    runSimulator();
  }

  function setupEventListeners() {
    // Filter controls
    el.filterSearch.addEventListener('input', applyFilters);
    el.filterDistrict.addEventListener('change', applyFilters);
    el.filterType.addEventListener('change', applyFilters);
    el.filterSocio.addEventListener('change', applyFilters);
    el.filterCategory.addEventListener('change', applyFilters);
    el.btnResetFilters.addEventListener('click', resetFilters);

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // Quick Action Buttons
    el.btnQuickSim.addEventListener('click', () => switchTab('tab-simulator'));
    el.btnQuickReport.addEventListener('click', () => switchTab('tab-advocacy'));
    el.btnExportExcel.addEventListener('click', exportToExcel);
    el.btnTableExport.addEventListener('click', exportToExcel);

    // Table Sorting
    el.fullDataTable.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (state.sortCol === col) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortCol = col;
          state.sortAsc = false;
        }
        renderTable();
      });
    });

    // Simulator Sliders
    [el.sliderPoolM, el.sliderWSocio, el.sliderWPeri, el.sliderWArnona, el.sliderWSpecialEd, el.chkExemptMatching].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => {
        el.valPoolM.textContent = Number(el.sliderPoolM.value).toLocaleString() + ' מיליון ₪';
        el.valWSocio.textContent = el.sliderWSocio.value + '%';
        el.valWPeri.textContent = el.sliderWPeri.value + '%';
        el.valWArnona.textContent = el.sliderWArnona.value + '%';
        if (el.valWSpecialEd) el.valWSpecialEd.textContent = el.sliderWSpecialEd.value + '%';
        runSimulator();
      });
    });

    // Window Resize -> Redraw Charts
    window.addEventListener('resize', () => {
      if (state.activeTab === 'tab-matrix') renderMatrix();
      if (state.activeTab === 'tab-profile' && state.selectedAuthority) {
        renderProfileCharts(state.selectedAuthority);
      }
    });
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const panel = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (panel) panel.classList.add('active');

    // Trigger re-render of charts if tab becomes visible
    if (tabId === 'tab-matrix') {
      setTimeout(renderMatrix, 50);
    } else if (tabId === 'tab-profile' && state.selectedAuthority) {
      setTimeout(() => renderProfileCharts(state.selectedAuthority), 50);
    }
  }

  function resetFilters() {
    el.filterSearch.value = '';
    el.filterDistrict.value = '';
    el.filterType.value = '';
    el.filterSocio.value = '';
    el.filterCategory.value = '';
    applyFilters();
  }

  function applyFilters() {
    const search = el.filterSearch.value.trim().toLowerCase();
    const district = el.filterDistrict.value;
    const type = el.filterType.value;
    const socio = el.filterSocio.value;
    const category = el.filterCategory.value;

    state.filteredData = state.allData.filter(item => {
      if (search && !item.name.toLowerCase().includes(search) && !item.code.includes(search)) {
        return false;
      }
      if (district && item.district !== district) return false;
      if (type && item.type !== type) return false;
      if (category && item.equity_category_code !== category) return false;

      if (socio) {
        const s = item.cbs_socio_cluster;
        if (socio === '1-3' && (s < 1 || s > 3)) return false;
        if (socio === '4-6' && (s < 4 || s > 6)) return false;
        if (socio === '7-10' && (s < 7 || s > 10)) return false;
      }
      return true;
    });

    el.matrixCountBadge.textContent = `מציג ${state.filteredData.length} מתוך ${state.allData.length} רשויות`;

    renderMatrix();
    renderTable();
  }

  function renderMatrix() {
    EducationCharts.renderScatterMatrix(
      el.canvasScatterMatrix,
      state.filteredData,
      state.selectedAuthority ? state.selectedAuthority.code : null,
      (selected) => {
        selectAuthority(selected);
        switchTab('tab-profile');
      }
    );
  }

  function selectAuthority(auth) {
    if (!auth) return;
    state.selectedAuthority = auth;

    // Update Profile Metadata
    el.profName.textContent = auth.name;
    el.profSub.textContent = `${auth.type} • מחוז ${auth.district} • סמל ${auth.code}`;

    // Badge styling
    el.profCategoryBadge.className = 'badge ' + getBadgeClass(auth.equity_category_code);
    el.profCategoryBadge.textContent = auth.equity_category;

    el.profPop.textContent = auth.population.toLocaleString();
    el.profPupils.textContent = auth.total_pupils.toLocaleString();
    el.profSocio.textContent = `אשכול ${auth.cbs_socio_cluster}`;
    el.profPeri.textContent = `אשכול ${auth.cbs_periphery_cluster}`;
    el.profArnonaPerPupil.textContent = '₪' + auth.arnona_per_pupil_nis.toLocaleString();
    el.profMatchingScore.textContent = auth.matching_capacity_score + ' / 100';
    el.profLostMatching.textContent = '₪' + auth.lost_matching_per_pupil_nis.toLocaleString() + ' לתלמיד';

    el.profTotalSpend.textContent = '₪' + auth.total_spending_per_pupil_nis.toLocaleString();
    el.profGovStd.textContent = '₪' + auth.gov_standard_per_pupil_nis.toLocaleString();
    el.profGovDiff.textContent = '₪' + auth.gov_differential_per_pupil_nis.toLocaleString();
    el.profMuniSpend.textContent = '₪' + auth.muni_self_spend_per_pupil_nis.toLocaleString();
    el.profParentsPay.textContent = '₪' + auth.parents_co_pay_per_pupil_nis.toLocaleString();

    // Update Special Ed & Transport Tab elements
    if (el.specialEdAuthBadge) el.specialEdAuthBadge.textContent = `רשות נבחרת: ${auth.name}`;
    if (el.sePupilCount) el.sePupilCount.textContent = (auth.pupils_special_ed || Math.round(auth.total_pupils * 0.08)).toLocaleString();
    if (el.sePupilPct) el.sePupilPct.textContent = (auth.special_ed_pct || 8.0) + '%';
    if (el.seMuniBurden) el.seMuniBurden.textContent = '₪' + (auth.special_ed_muni_burden_nis || 12000).toLocaleString();
    if (el.seTransportDeficit) el.seTransportDeficit.textContent = '₪' + (auth.transport_deficit_per_pupil_nis || 800).toLocaleString();
    if (el.seClassroomShortage) el.seClassroomShortage.textContent = (auth.classroom_shortage_units || 0) + ' כיתות';
    if (el.seTotalTransport) el.seTotalTransport.textContent = '₪' + (auth.transport_expense_k_nis || 25000).toLocaleString() + ' אלף';
    if (el.seInformalSpend) el.seInformalSpend.textContent = '₪' + (auth.informal_edu_per_pupil_nis || 1500).toLocaleString() + ' לתלמיד';
    if (el.seGafenBasket) el.seGafenBasket.textContent = '₪' + (auth.gafen_basket_per_pupil_nis || 2000).toLocaleString() + ' לתלמיד';

    renderProfileCharts(auth);
    updateAdvocacyReport();
  }

  function renderProfileCharts(auth) {
    // 1. Donut Chart
    EducationCharts.renderPerPupilDonut(el.canvasDonutBreakdown, auth);

    // 2. Peer Benchmarks (3 similar authorities)
    const peers = state.allData
      .filter(a => a.code !== auth.code && (a.cbs_socio_cluster === auth.cbs_socio_cluster || a.district === auth.district))
      .slice(0, 3);

    EducationCharts.renderPeerComparison(el.canvasPeerBenchmark, auth, peers, state.nationalAvg);
  }

  function getBadgeClass(code) {
    switch (code) {
      case 'AFFLUENT_HIGH': return 'badge-affluent';
      case 'PARADOX_LOW_SOCIO_HIGH_ARNONA': return 'badge-paradox';
      case 'MIDDLE_TRAP': return 'badge-trap';
      case 'VULNERABLE_LOCKED': return 'badge-vulnerable';
      default: return 'badge-affluent';
    }
  }

  function runSimulator() {
    const poolM = Number(el.sliderPoolM.value);
    const wSocio = Number(el.sliderWSocio.value);
    const wPeri = Number(el.sliderWPeri.value);
    const wArnona = Number(el.sliderWArnona.value);
    const wSpecialEd = el.sliderWSpecialEd ? Number(el.sliderWSpecialEd.value) : 15;
    const exemptMatching = el.chkExemptMatching.checked;

    const sim = EducationSimulator.runSimulation(state.allData, {
      budgetPoolM: poolM,
      wSocio: wSocio,
      wPeri: wPeri,
      wArnona: wArnona,
      wSpecialEd: wSpecialEd,
      exemptMatching: exemptMatching
    });

    state.lastSimResults = sim;

    // Update Simulator KPIs
    el.simGiniDrop.textContent = `-${sim.giniReductionPct}%`;
    el.simGapDrop.textContent = `פי ${sim.simDisparityRatio}`;

    // Render Top Gainers Table
    el.simGainersBody.innerHTML = '';
    sim.topGainers.forEach(g => {
      const tr = document.createElement('tr');
      tr.className = 'clickable';
      tr.innerHTML = `
        <td><strong>${g.name}</strong></td>
        <td><span class="badge badge-trap">אשכול ${g.cbs_socio_cluster}</span></td>
        <td class="text-positive">+₪${g.gain_nis_per_pupil.toLocaleString()}</td>
        <td style="font-weight: 700;">₪${g.allocated_grant_k_nis.toLocaleString()} אלף</td>
        <td class="text-positive">+${g.gain_pct}%</td>
      `;
      tr.addEventListener('click', () => {
        const found = state.allData.find(a => a.code === g.code);
        if (found) {
          selectAuthority(found);
          switchTab('tab-profile');
        }
      });
      el.simGainersBody.appendChild(tr);
    });

    updateAdvocacyReport();
  }

  function updateAdvocacyReport() {
    if (!state.selectedAuthority) return;

    let simMatch = null;
    if (state.lastSimResults && state.lastSimResults.results) {
      simMatch = state.lastSimResults.results.find(r => r.code === state.selectedAuthority.code);
    }

    el.advocacyPaperContainer.innerHTML = EducationAdvocacy.generateReport(
      state.selectedAuthority,
      state.nationalAvg,
      simMatch
    );
  }

  function renderTable() {
    // Sort filtered data
    const sorted = [...state.filteredData].sort((a, b) => {
      let vA = a[state.sortCol];
      let vB = b[state.sortCol];
      if (typeof vA === 'string') {
        return state.sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return state.sortAsc ? (vA - vB) : (vB - vA);
    });

    el.fullDataBody.innerHTML = '';
    sorted.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'clickable';
      if (state.selectedAuthority && state.selectedAuthority.code === row.code) {
        tr.style.backgroundColor = '#eff6ff';
        tr.style.fontWeight = 'bold';
      }

      const diffClass = row.national_avg_diff_pct < 0 ? 'text-negative' : 'text-positive';
      const diffSign = row.national_avg_diff_pct < 0 ? '' : '+';

      tr.innerHTML = `
        <td><strong>${row.name}</strong></td>
        <td>${row.type}</td>
        <td>${row.district}</td>
        <td>${row.cbs_socio_cluster}</td>
        <td>${row.total_pupils.toLocaleString()}</td>
        <td>₪${row.arnona_per_pupil_nis.toLocaleString()}</td>
        <td>${row.special_ed_pct || 8}%</td>
        <td>₪${(row.transport_deficit_per_pupil_nis || 0).toLocaleString()}</td>
        <td>₪${row.gov_total_per_pupil_nis.toLocaleString()}</td>
        <td>₪${row.muni_self_spend_per_pupil_nis.toLocaleString()}</td>
        <td><strong>₪${row.total_spending_per_pupil_nis.toLocaleString()}</strong></td>
        <td class="${diffClass}">${diffSign}${row.national_avg_diff_pct}%</td>
        <td><span class="badge ${getBadgeClass(row.equity_category_code)}">${row.equity_category}</span></td>
      `;

      tr.addEventListener('click', () => {
        selectAuthority(row);
        switchTab('tab-profile');
      });

      el.fullDataBody.appendChild(tr);
    });
  }

  function exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('ספריית הייצוא אינה זמינה.');
      return;
    }

    const exportRows = state.filteredData.map(d => ({
      'סמל רשות': d.code,
      'שם רשות': d.name,
      'סוג רשות': d.type,
      'מחוז': d.district,
      'אוכלוסייה': d.population,
      'אשכול למ"ס': d.cbs_socio_cluster,
      'מדד פריפריאליות': d.cbs_periphery_cluster,
      'סה"כ תלמידים': d.total_pupils,
      'תלמידי חנ"מ': d.pupils_special_ed,
      'שיעור חנ"מ (%)': d.special_ed_pct,
      'נטל עירוני עודף לחנ"מ (₪)': d.special_ed_muni_burden_nis,
      'גירעון הסעות לתלמיד (₪)': d.transport_deficit_per_pupil_nis,
      'תקציב חינוך בלתי פורמלי לתלמיד (₪)': d.informal_edu_per_pupil_nis,
      'מחסור בכיתות לימוד': d.classroom_shortage_units,
      'ארנונה עסקית לתלמיד (₪)': d.arnona_per_pupil_nis,
      'השקעה עצמית של הרשות לתלמיד (₪)': d.muni_self_spend_per_pupil_nis,
      'תקצוב משרד החינוך בסיס לתלמיד (₪)': d.gov_standard_per_pupil_nis,
      'תוספת טיפוח דיפרנציאלי לתלמיד (₪)': d.gov_differential_per_pupil_nis,
      'סה"כ תקצוב משרד החינוך לתלמיד (₪)': d.gov_total_per_pupil_nis,
      'תשלומי הורים לתלמיד (₪)': d.parents_co_pay_per_pupil_nis,
      'תקציבי מאצ\'ינג אבודים לתלמיד (₪)': d.lost_matching_per_pupil_nis,
      'סל השקעה כולל לתלמיד (₪)': d.total_spending_per_pupil_nis,
      'פער מהממוצע הארצי (%)': d.national_avg_diff_pct,
      'סיווג עיוות תקציבי': d.equity_category
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'פערי_תקצוב_חינוך');
    XLSX.writeFile(wb, 'פערי_תקצוב_וצדק_חלוקתי_בחינוך_איגוד_מנהלי_חינוך.xlsx');
  }

  // Auto boot
  window.addEventListener('DOMContentLoaded', init);

})();
