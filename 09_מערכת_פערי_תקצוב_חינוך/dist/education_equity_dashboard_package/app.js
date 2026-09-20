// ==============================================================================
// app.js - Main Dashboard Controller for Education Equity System (Stage 6)
// ==============================================================================

(function () {
  'use strict';

  // Application State
  const state = {
    allData: [],
    filteredData: [],
    selectedAuthority: null,
    nationalWeightedAvg: 26.85,
    nationalUnweightedAvg: 24.10,
    activeTab: 'tab-explorer',
    scatterXKey: 'own_revenue_share_pct',
    scatterXLabel: 'שיעור הכנסות עצמיות מתוך התקציב (%)',
    excludeTamar: false,
    excludeWar: false,
    sortCol: 'municipal_education_self_funding_rate',
    sortAsc: false,
    lastSimResults: null
  };

  // DOM Elements
  const el = {
    // National KPIs
    kpiTotal1486: document.getElementById('kpiTotal1486'),
    kpiTotal1384: document.getElementById('kpiTotal1384'),
    kpiTotalNet: document.getElementById('kpiTotalNet'),
    kpiWeightedRate: document.getElementById('kpiWeightedRate'),
    kpiDisparityGap: document.getElementById('kpiDisparityGap'),
    kpiTotalPop: document.getElementById('kpiTotalPop'),

    // Filters
    filterSearch: document.getElementById('filterSearch'),
    filterDistrict: document.getElementById('filterDistrict'),
    filterType: document.getElementById('filterType'),
    filterSocio: document.getElementById('filterSocio'),
    filterAnomaly: document.getElementById('filterAnomaly'),
    btnResetFilters: document.getElementById('btnResetFilters'),

    // Explorer Tab
    explorerCountBadge: document.getElementById('explorerCountBadge'),
    selectXAxis: document.getElementById('selectXAxis'),
    chkExcludeTamar: document.getElementById('chkExcludeTamar'),
    chkExcludeWar: document.getElementById('chkExcludeWar'),
    canvasScatterExplorer: document.getElementById('canvasScatterExplorer'),
    canvasClusterStep: document.getElementById('canvasClusterStep'),
    statN: document.getElementById('statN'),
    statR: document.getElementById('statR'),
    statR2: document.getElementById('statR2'),
    statEq: document.getElementById('statEq'),

    // Profile Tab
    profName: document.getElementById('profName'),
    profSub: document.getElementById('profSub'),
    profAuditBadge: document.getElementById('profAuditBadge'),
    profPop: document.getElementById('profPop'),
    profSocio: document.getElementById('profSocio'),
    profPeri: document.getElementById('profPeri'),
    profOwnRevShare: document.getElementById('profOwnRevShare'),
    profSelfFundingRate: document.getElementById('profSelfFundingRate'),
    profNetEduDiff: document.getElementById('profNetEduDiff'),
    profNetEduPerCapita: document.getElementById('profNetEduPerCapita'),
    profExp1486: document.getElementById('profExp1486'),
    profExp1486PerCapita: document.getElementById('profExp1486PerCapita'),
    profRev1384: document.getElementById('profRev1384'),
    profRev1384PerCapita: document.getElementById('profRev1384PerCapita'),
    profOwnRev1805: document.getElementById('profOwnRev1805'),
    profOwnRevPerCapita: document.getElementById('profOwnRevPerCapita'),
    profArnonaOther: document.getElementById('profArnonaOther'),
    profArnonaOtherPerCapita: document.getElementById('profArnonaOtherPerCapita'),
    profArnonaTotal: document.getElementById('profArnonaTotal'),
    profArnonaTotalPerCapita: document.getElementById('profArnonaTotalPerCapita'),
    profBalancingGrant: document.getElementById('profBalancingGrant'),
    canvasDonutBreakdown: document.getElementById('canvasDonutBreakdown'),
    canvasPeerBenchmark: document.getElementById('canvasPeerBenchmark'),
    profDonutGovVal: document.getElementById('profDonutGovVal'),
    profDonutMuniVal: document.getElementById('profDonutMuniVal'),

    // Research Tab
    canvasBalancingAll: document.getElementById('canvasBalancingAll'),
    canvasBalancingLow: document.getElementById('canvasBalancingLow'),

    // Simulator Tab
    sliderPoolM: document.getElementById('sliderPoolM'),
    sliderWSocio: document.getElementById('sliderWSocio'),
    sliderWPeri: document.getElementById('sliderWPeri'),
    sliderWFiscal: document.getElementById('sliderWFiscal'),
    valPoolM: document.getElementById('valPoolM'),
    valWSocio: document.getElementById('valWSocio'),
    valWPeri: document.getElementById('valWPeri'),
    valWFiscal: document.getElementById('valWFiscal'),
    simGiniDrop: document.getElementById('simGiniDrop'),
    simGapDrop: document.getElementById('simGapDrop'),
    simGainersBody: document.getElementById('simGainersBody'),
    btnRunSim: document.getElementById('btnRunSim'),

    // Advocacy & Table
    advocacyPaperContainer: document.getElementById('advocacyPaperContainer'),
    fullDataBody: document.getElementById('fullDataBody'),
    fullDataTable: document.getElementById('fullDataTable'),

    // Action Buttons
    btnQuickSim: document.getElementById('btnQuickSim'),
    btnQuickReport: document.getElementById('btnQuickReport'),
    btnExportExcel: document.getElementById('btnExportExcel'),
    btnTableExport: document.getElementById('btnTableExport')
  };

  // Label Map for X-Axis selector
  const axisLabelMap = {
    'own_revenue_share_pct': 'שיעור הכנסות עצמיות מתוך התקציב (%)',
    'own_revenues_per_capita_nis': 'הכנסות עצמיות לנפש (₪)',
    'arnona_other_per_capita_nis': 'ארנונה אחרת (עסקית/תעשייתית) לנפש (₪)',
    'arnona_total_per_capita_nis': 'סך הכנסות מארנונה לנפש (₪)',
    'socio_value_2021': 'מדד חברתי-כלכלי רציף (למ"ס)',
    'socio_cluster_2021': 'אשכול חברתי-כלכלי (1–10)',
    'balancing_grant_per_capita_nis': 'מענק איזון לנפש (₪)',
    'periphery_value_2020': 'מדד פריפריאליות רציף (למ"ס)'
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

    // Compute Overall Verified 2024 Stats
    let total1486 = 0, total1384 = 0, totalNet = 0, totalPop = 0;
    state.allData.forEach(d => {
      total1486 += (d.education_expense_1486_tk || 0);
      total1384 += (d.education_revenue_1384_tk || 0);
      totalNet += (d.education_net_difference_tk || 0);
      totalPop += (d.population || 0);
    });

    state.nationalWeightedAvg = (totalNet / total1486) * 100;

    // Update KPI Card UI
    if (el.kpiTotal1486) el.kpiTotal1486.textContent = '₪' + (total1486 / 1000000).toFixed(1) + ' מיליארד';
    if (el.kpiTotal1384) el.kpiTotal1384.textContent = '₪' + (total1384 / 1000000).toFixed(1) + ' מיליארד';
    if (el.kpiTotalNet) el.kpiTotalNet.textContent = '₪' + (totalNet / 1000000).toFixed(2) + ' מיליארד';
    if (el.kpiWeightedRate) el.kpiWeightedRate.textContent = state.nationalWeightedAvg.toFixed(1) + '%';
    if (el.kpiTotalPop) el.kpiTotalPop.textContent = (totalPop / 1000000).toFixed(1) + 'M';

    // Default Selection: Tel Aviv (5000)
    const defaultAuth = state.allData.find(a => a.code === '5000') || state.allData[0];
    selectAuthority(defaultAuth);

    // Setup Event Listeners
    setupEventListeners();

    // Render Initial Views
    applyFilters();
    runSimulator();
  }

  function setupEventListeners() {
    // Filter controls
    if (el.filterSearch) el.filterSearch.addEventListener('input', applyFilters);
    if (el.filterDistrict) el.filterDistrict.addEventListener('change', applyFilters);
    if (el.filterType) el.filterType.addEventListener('change', applyFilters);
    if (el.filterSocio) el.filterSocio.addEventListener('change', applyFilters);
    if (el.filterAnomaly) el.filterAnomaly.addEventListener('change', applyFilters);
    if (el.btnResetFilters) el.btnResetFilters.addEventListener('click', resetFilters);

    // Explorer controls
    if (el.selectXAxis) {
      el.selectXAxis.addEventListener('change', () => {
        state.scatterXKey = el.selectXAxis.value;
        state.scatterXLabel = axisLabelMap[state.scatterXKey] || state.scatterXKey;
        renderExplorer();
      });
    }

    if (el.chkExcludeTamar) {
      el.chkExcludeTamar.addEventListener('change', () => {
        state.excludeTamar = el.chkExcludeTamar.checked;
        applyFilters();
      });
    }

    if (el.chkExcludeWar) {
      el.chkExcludeWar.addEventListener('change', () => {
        state.excludeWar = el.chkExcludeWar.checked;
        applyFilters();
      });
    }

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // Quick Action Buttons
    if (el.btnQuickSim) el.btnQuickSim.addEventListener('click', () => switchTab('tab-simulator'));
    if (el.btnQuickReport) el.btnQuickReport.addEventListener('click', () => switchTab('tab-advocacy'));
    if (el.btnExportExcel) el.btnExportExcel.addEventListener('click', exportToExcel);
    if (el.btnTableExport) el.btnTableExport.addEventListener('click', exportToExcel);
    if (el.btnRunSim) el.btnRunSim.addEventListener('click', runSimulator);

    // Table Sorting
    if (el.fullDataTable) {
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
    }

    // Simulator Sliders
    [el.sliderPoolM, el.sliderWSocio, el.sliderWPeri, el.sliderWFiscal].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => {
        if (el.valPoolM) el.valPoolM.textContent = Number(el.sliderPoolM.value).toLocaleString() + ' מיליון ₪';
        if (el.valWSocio) el.valWSocio.textContent = el.sliderWSocio.value + '%';
        if (el.valWPeri) el.valWPeri.textContent = el.sliderWPeri.value + '%';
        if (el.valWFiscal) el.valWFiscal.textContent = el.sliderWFiscal.value + '%';
        runSimulator();
      });
    });

    // Window Resize
    window.addEventListener('resize', () => {
      if (state.activeTab === 'tab-explorer') renderExplorer();
      if (state.activeTab === 'tab-profile' && state.selectedAuthority) renderProfileCharts(state.selectedAuthority);
      if (state.activeTab === 'tab-research') renderResearch();
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

    // Trigger re-render of canvases
    setTimeout(() => {
      if (tabId === 'tab-explorer') renderExplorer();
      if (tabId === 'tab-profile' && state.selectedAuthority) renderProfileCharts(state.selectedAuthority);
      if (tabId === 'tab-research') renderResearch();
      if (tabId === 'tab-advocacy' && state.selectedAuthority) renderAdvocacy(state.selectedAuthority);
    }, 50);
  }

  function resetFilters() {
    if (el.filterSearch) el.filterSearch.value = '';
    if (el.filterDistrict) el.filterDistrict.value = '';
    if (el.filterType) el.filterType.value = '';
    if (el.filterSocio) el.filterSocio.value = '';
    if (el.filterAnomaly) el.filterAnomaly.value = '';
    if (el.chkExcludeTamar) el.chkExcludeTamar.checked = false;
    if (el.chkExcludeWar) el.chkExcludeWar.checked = false;
    state.excludeTamar = false;
    state.excludeWar = false;
    applyFilters();
  }

  function applyFilters() {
    const search = el.filterSearch ? el.filterSearch.value.trim().toLowerCase() : '';
    const district = el.filterDistrict ? el.filterDistrict.value : '';
    const type = el.filterType ? el.filterType.value : '';
    const socio = el.filterSocio ? el.filterSocio.value : '';
    const anomaly = el.filterAnomaly ? el.filterAnomaly.value : '';

    state.filteredData = state.allData.filter(item => {
      if (state.excludeTamar && item.is_tamar_outlier) return false;
      if (state.excludeWar && item.is_war_evacuated_2024) return false;

      if (search && !item.name.toLowerCase().includes(search) && !item.code.includes(search)) {
        return false;
      }
      if (district && item.district !== district) return false;
      if (type && item.type !== type) return false;

      if (socio) {
        const s = item.cbs_socio_cluster;
        if (socio === '1-3' && (s < 1 || s > 3)) return false;
        if (socio === '4-6' && (s < 4 || s > 6)) return false;
        if (socio === '7-10' && (s < 7 || s > 10)) return false;
      }

      if (anomaly) {
        if (anomaly === 'STANDARD' && item.anomaly_classification !== 'STANDARD') return false;
        if (anomaly === 'WAR' && !item.is_war_evacuated_2024) return false;
        if (anomaly === 'TAMAR' && !item.is_tamar_outlier) return false;
      }

      return true;
    });

    if (el.explorerCountBadge) {
      el.explorerCountBadge.textContent = `מציג ${state.filteredData.length} מתוך ${state.allData.length} רשויות`;
    }

    renderExplorer();
    renderTable();
  }

  function renderExplorer() {
    if (!el.canvasScatterExplorer) return;

    const stats = EducationCharts.renderScatterExplorer(
      el.canvasScatterExplorer,
      state.filteredData,
      {
        xKey: state.scatterXKey,
        xLabel: state.scatterXLabel,
        selectedCode: state.selectedAuthority ? state.selectedAuthority.code : null,
        excludeTamar: state.excludeTamar,
        excludeWar: state.excludeWar,
        onSelectCallback: (selected) => {
          selectAuthority(selected);
          switchTab('tab-profile');
        }
      }
    );

    if (stats) {
      if (el.statN) el.statN.textContent = stats.n;
      if (el.statR) el.statR.textContent = (stats.r >= 0 ? '+' : '') + stats.r.toFixed(4);
      if (el.statR2) el.statR2.textContent = stats.r2.toFixed(4);
      if (el.statEq) el.statEq.textContent = `y = ${stats.slope}x + ${stats.intercept}`;
    }

    if (el.canvasClusterStep) {
      EducationCharts.renderClusterStepChart(el.canvasClusterStep, state.filteredData);
    }
  }

  function selectAuthority(auth) {
    if (!auth) return;
    state.selectedAuthority = auth;

    // Update Profile Metadata
    if (el.profName) el.profName.textContent = auth.name;
    if (el.profSub) el.profSub.textContent = `${auth.type} • מחוז ${auth.district} • סמל למ"ס ${auth.code}`;

    // Audit Badge
    if (el.profAuditBadge) {
      if (auth.is_war_evacuated_2024) {
        el.profAuditBadge.className = 'badge badge-war';
        el.profAuditBadge.textContent = '⚠️ יישוב קו עימות / מפונה (2024)';
      } else if (auth.is_tamar_outlier) {
        el.profAuditBadge.className = 'badge badge-tamar';
        el.profAuditBadge.textContent = '⚠️ חריג מבני (מ.א. תמר)';
      } else {
        el.profAuditBadge.className = 'badge badge-accent';
        el.profAuditBadge.textContent = 'רשות סטנדרטית';
      }
    }

    // Profile KPIs
    if (el.profPop) el.profPop.textContent = (auth.population || 0).toLocaleString();
    if (el.profSocio) el.profSocio.textContent = `${auth.cbs_socio_cluster} (${(auth.socio_value_2021 !== null ? Number(auth.socio_value_2021).toFixed(3) : '-')})`;
    if (el.profPeri) el.profPeri.textContent = `${auth.cbs_periphery_cluster || '-'} (${(auth.periphery_value_2020 !== null ? Number(auth.periphery_value_2020).toFixed(3) : '-')})`;
    if (el.profOwnRevShare) el.profOwnRevShare.textContent = `${auth.own_revenue_share_pct || 0}%`;

    // Highlight Box
    if (el.profSelfFundingRate) el.profSelfFundingRate.textContent = `${auth.municipal_education_self_funding_rate || 0}%`;
    if (el.profNetEduDiff) el.profNetEduDiff.textContent = `₪${(auth.education_net_difference_tk || 0).toLocaleString()} אלפי ש"ח`;
    const netPerCap = auth.population ? Math.round(((auth.education_net_difference_tk || 0) * 1000) / auth.population) : 0;
    if (el.profNetEduPerCapita) el.profNetEduPerCapita.textContent = `₪${netPerCap.toLocaleString()} לנפש`;

    // Table of accounts
    const pop = auth.population || 1;
    if (el.profExp1486) el.profExp1486.textContent = `₪${(auth.education_expense_1486_tk || 0).toLocaleString()}K`;
    if (el.profExp1486PerCapita) el.profExp1486PerCapita.textContent = `₪${Math.round(((auth.education_expense_1486_tk || 0) * 1000) / pop).toLocaleString()} לנפש`;

    if (el.profRev1384) el.profRev1384.textContent = `₪${(auth.education_revenue_1384_tk || 0).toLocaleString()}K`;
    if (el.profRev1384PerCapita) el.profRev1384PerCapita.textContent = `₪${Math.round(((auth.education_revenue_1384_tk || 0) * 1000) / pop).toLocaleString()} לנפש`;

    if (el.profOwnRev1805) el.profOwnRev1805.textContent = `₪${(auth.own_revenue_1805_tk || 0).toLocaleString()}K`;
    if (el.profOwnRevPerCapita) el.profOwnRevPerCapita.textContent = `₪${(auth.own_revenues_per_capita_nis || 0).toLocaleString()} לנפש`;

    if (el.profArnonaOther) el.profArnonaOther.textContent = `₪${(auth.arnona_other_4146_tk || 0).toLocaleString()}K`;
    if (el.profArnonaOtherPerCapita) el.profArnonaOtherPerCapita.textContent = `₪${(auth.arnona_other_per_capita_nis || 0).toLocaleString()} לנפש`;

    if (el.profArnonaTotal) el.profArnonaTotal.textContent = `₪${(auth.arnona_total_4162_tk || 0).toLocaleString()}K`;
    if (el.profArnonaTotalPerCapita) el.profArnonaTotalPerCapita.textContent = `₪${(auth.arnona_total_per_capita_nis || 0).toLocaleString()} לנפש`;

    if (el.profBalancingGrant) {
      if (auth.balancing_grant_1819_tk > 0) {
        el.profBalancingGrant.textContent = `₪${auth.balancing_grant_1819_tk.toLocaleString()}K (₪${auth.balancing_grant_per_capita_nis.toLocaleString()} לנפש)`;
      } else {
        el.profBalancingGrant.textContent = '₪0 (אין זכאות)';
      }
    }

    // Donut percentages
    const exp1486 = auth.education_expense_1486_tk || 1;
    const rev1384 = auth.education_revenue_1384_tk || 0;
    const netMuni = Math.max(0, auth.education_net_difference_tk || 0);
    if (el.profDonutGovVal) el.profDonutGovVal.textContent = ((rev1384 / exp1486) * 100).toFixed(1) + '%';
    if (el.profDonutMuniVal) el.profDonutMuniVal.textContent = ((netMuni / exp1486) * 100).toFixed(1) + '%';

    // Render Charts
    renderProfileCharts(auth);

    // Update Advocacy Paper
    renderAdvocacy(auth);
  }

  function renderProfileCharts(auth) {
    if (el.canvasDonutBreakdown) {
      EducationCharts.renderDonutBreakdown(el.canvasDonutBreakdown, auth);
    }
    if (el.canvasPeerBenchmark) {
      EducationCharts.renderPeerBenchmark(el.canvasPeerBenchmark, auth, state.allData);
    }
  }

  function renderResearch() {
    if (el.canvasBalancingAll && el.canvasBalancingLow) {
      EducationCharts.renderBalancingGrantResearch(el.canvasBalancingAll, el.canvasBalancingLow, state.allData);
    }
  }

  function runSimulator() {
    if (!window.EducationSimulator) return;

    const poolM = Number(el.sliderPoolM ? el.sliderPoolM.value : 1000);
    const wSocio = Number(el.sliderWSocio ? el.sliderWSocio.value : 50);
    const wPeri = Number(el.sliderWPeri ? el.sliderWPeri.value : 30);
    const wFiscal = Number(el.sliderWFiscal ? el.sliderWFiscal.value : 20);

    const simResults = EducationSimulator.runSimulation(state.allData, {
      totalPoolM: poolM,
      weightSocio: wSocio,
      weightPeri: wPeri,
      weightFiscal: wFiscal
    });

    state.lastSimResults = simResults;

    if (el.simGiniDrop) el.simGiniDrop.textContent = `${simResults.gini_drop_pct}%`;
    if (el.simGapDrop) el.simGapDrop.textContent = `מפי ${simResults.orig_gap} ל-${simResults.sim_gap}`;

    // Render Top Gainers Table
    if (el.simGainersBody) {
      el.simGainersBody.innerHTML = '';
      simResults.top_gainers.slice(0, 10).forEach(g => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${g.name}</strong> (${g.type})</td>
          <td>אשכול ${g.socio_cluster}</td>
          <td>${g.population.toLocaleString()}</td>
          <td class="font-mono text-left" style="color: var(--success); font-weight:700;">+₪${g.grant_per_capita_nis.toLocaleString()}</td>
          <td class="font-mono text-left">₪${g.allocated_grant_k_nis.toLocaleString()}K</td>
          <td class="font-mono text-left">+${g.gain_pct}%</td>
        `;
        tr.style.cursor = 'pointer';
        tr.onclick = () => {
          const found = state.allData.find(a => a.code === g.code);
          if (found) {
            selectAuthority(found);
            switchTab('tab-profile');
          }
        };
        el.simGainersBody.appendChild(tr);
      });
    }

    if (state.selectedAuthority) {
      renderAdvocacy(state.selectedAuthority);
    }
  }

  function renderAdvocacy(auth) {
    if (!el.advocacyPaperContainer || !window.EducationAdvocacy) return;

    let simAuthData = null;
    if (state.lastSimResults && state.lastSimResults.authority_allocations) {
      simAuthData = state.lastSimResults.authority_allocations.find(a => a.code === auth.code);
    }

    el.advocacyPaperContainer.innerHTML = EducationAdvocacy.generateReport(
      auth,
      state.nationalUnweightedAvg,
      simAuthData
    );
  }

  function renderTable() {
    if (!el.fullDataBody) return;
    el.fullDataBody.innerHTML = '';

    // Sort
    const sorted = [...state.filteredData].sort((a, b) => {
      let va = a[state.sortCol];
      let vb = b[state.sortCol];
      if (typeof va === 'string') {
        return state.sortAsc ? va.localeCompare(vb, 'he') : vb.localeCompare(va, 'he');
      }
      va = (va === null || isNaN(va)) ? -Infinity : va;
      vb = (vb === null || isNaN(vb)) ? -Infinity : vb;
      return state.sortAsc ? va - vb : vb - va;
    });

    sorted.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.code}</td>
        <td><strong>${row.name}</strong></td>
        <td>${row.district}</td>
        <td>${row.type}</td>
        <td>${(row.population || 0).toLocaleString()}</td>
        <td>${row.cbs_socio_cluster}</td>
        <td class="text-left">₪${(row.education_expense_1486_tk || 0).toLocaleString()}</td>
        <td class="text-left">₪${(row.education_revenue_1384_tk || 0).toLocaleString()}</td>
        <td class="text-left" style="color: ${row.education_net_difference_tk < 0 ? 'var(--danger)' : 'var(--text-main)'}">₪${(row.education_net_difference_tk || 0).toLocaleString()}</td>
        <td class="text-left" style="font-weight: 700; color: ${row.municipal_education_self_funding_rate < 15 ? 'var(--danger)' : 'var(--primary)'}">${row.municipal_education_self_funding_rate}%</td>
        <td class="text-left">${row.own_revenue_share_pct}%</td>
        <td class="text-left">₪${(row.arnona_other_per_capita_nis || 0).toLocaleString()}</td>
        <td class="text-left">₪${(row.balancing_grant_per_capita_nis || 0).toLocaleString()}</td>
        <td><span class="badge ${row.is_war_evacuated_2024 ? 'badge-war' : (row.is_tamar_outlier ? 'badge-tamar' : 'badge-accent')}">${row.anomaly_classification}</span></td>
      `;
      tr.style.cursor = 'pointer';
      tr.onclick = () => {
        selectAuthority(row);
        switchTab('tab-profile');
      };
      el.fullDataBody.appendChild(tr);
    });
  }

  function exportToExcel() {
    const headers = [
      'סמל למ"ס', 'שם רשות', 'מחוז', 'סוג רשות', 'אוכלוסייה 2024',
      'אשכול חברתי-כלכלי', 'הוצאות חינוך 1486 (אלפי ₪)', 'תקבולי חינוך 1384 (אלפי ₪)',
      'הפרש נטו 1486-1384 (אלפי ₪)', 'שיעור השתתפות עצמית בחינוך (%)',
      'סך תקציב רגיל 40811 (אלפי ₪)', 'סך הכנסות עצמיות 1805 (אלפי ₪)',
      'שיעור הכנסות עצמיות (%)', 'הכנסות עצמיות לנפש (₪)',
      'ארנונה אחרת 4146 (אלפי ₪)', 'ארנונה אחרת לנפש (₪)',
      'סך ארנונה 4162 (אלפי ₪)', 'מענק איזון 1819 (אלפי ₪)',
      'מענק איזון לנפש (₪)', 'סיווג אנומליה ובקרה'
    ];

    const rows = state.filteredData.map(d => [
      d.code,
      `"${d.name}"`,
      `"${d.district}"`,
      `"${d.type}"`,
      d.population,
      d.cbs_socio_cluster,
      d.education_expense_1486_tk,
      d.education_revenue_1384_tk,
      d.education_net_difference_tk,
      d.municipal_education_self_funding_rate,
      d.regular_budget_expense_40811_tk,
      d.own_revenue_1805_tk,
      d.own_revenue_share_pct,
      d.own_revenues_per_capita_nis,
      d.arnona_other_4146_tk,
      d.arnona_other_per_capita_nis,
      d.arnona_total_4162_tk,
      d.balancing_grant_1819_tk,
      d.balancing_grant_per_capita_nis,
      `"${d.anomaly_classification}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `education_budget_equity_2024_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Global helper for profile selection from outside / console
  window.selectAuthorityByCode = function (code) {
    const found = state.allData.find(a => a.code === String(code) || a.cbs_code === String(code));
    if (found) {
      selectAuthority(found);
      switchTab('tab-profile');
    }
  };

  window.switchTab = switchTab;

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();