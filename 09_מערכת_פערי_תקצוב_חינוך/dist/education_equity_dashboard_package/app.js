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
    currentView: 'home',
    gapsSubView: 'profile',
    researchSubView: 'scatter',
    reportSubType: 'national',
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
    btnClearSearch: document.getElementById('btnClearSearch'),
    searchDropdown: document.getElementById('searchDropdown'),
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
    selectResearchPopulation: document.getElementById('selectResearchPopulation'),
    researchPopBadge: document.getElementById('researchPopBadge'),
    researchPanelBTitle: document.getElementById('researchPanelBTitle'),
    researchPanelBDesc: document.getElementById('researchPanelBDesc'),

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

    // Reports, Methodology & Table
    advocacyPaperContainer: document.getElementById('advocacyPaperContainer'),
    btnSubReportNational: document.getElementById('btnSubReportNational'),
    btnSubReportMunicipal: document.getElementById('btnSubReportMunicipal'),
    reportAuthoritySelect: document.getElementById('reportAuthoritySelect'),
    municipalSelectRow: document.getElementById('municipalSelectRow'),
    methodologyContainer: document.getElementById('methodologyContainer'),
    fullDataBody: document.getElementById('fullDataBody'),
    fullDataTable: document.getElementById('fullDataTable'),

    // Action Buttons
    btnExportExcel: document.getElementById('btnExportExcel'),
    btnGapsExportExcel: document.getElementById('btnGapsExportExcel'),
    btnTableExport: document.getElementById('btnTableExport'),
    btnSubReportPrint: document.getElementById('btnSubReportPrint')
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

    // Populate Report Select
    populateReportAuthoritySelect();

    // Render Initial Views
    applyFilters();
    runSimulator();
    renderReports();

    // Initial Route via URL Hash
    handleHashChange();
  }

  let activeDropdownIndex = -1;

  // Hebrew & String Normalization Helpers
  function normalizeHebrew(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/[\u0591-\u05C7]/g, '') // remove niqqud
      .replace(/["'״׳`”“]/g, '')       // remove quotes/geresh
      .replace(/[-–—_./\\]/g, ' ')     // replace hyphens/delimiters with space
      .replace(/\s+/g, ' ')            // collapse multiple whitespace
      .trim();
  }

  function normalizeSpelling(str) {
    // Common Hebrew spelling variations (ktiv male / haser: יי -> י, וו -> ו)
    return normalizeHebrew(str)
      .replace(/יי/g, 'י')
      .replace(/וו/g, 'ו');
  }

  function authorityMatchesSearch(item, rawQuery) {
    if (!rawQuery) return true;
    const query = rawQuery.trim();
    if (!query) return true;

    // Code matching
    if (/^\d+$/.test(query)) {
      const code = String(item.code || '');
      const cbs = String(item.cbs_code || '');
      const moinA = String(item.moin_code_col_a || '');
      const moinC = String(item.moin_code_col_c || '');
      const queryNum = parseInt(query, 10).toString();
      if (code === query || code.includes(query) ||
          cbs === query || cbs.includes(query) ||
          moinA === query || moinC === query ||
          code === queryNum || cbs === queryNum) {
        return true;
      }
    }

    const normQuery = normalizeHebrew(query);
    const spellQuery = normalizeSpelling(query);

    const queryTokens = normQuery.split(' ').filter(Boolean);
    const spellTokens = spellQuery.split(' ').filter(Boolean);

    const searchTargets = [
      item.name,
      item.authority_name,
      item.authority_name_moin,
      item.code,
      item.cbs_code
    ].filter(Boolean).map(String);

    const normTarget = searchTargets.map(normalizeHebrew).join(' ');
    const spellTarget = searchTargets.map(normalizeSpelling).join(' ');

    return queryTokens.every((token, idx) => {
      const spellToken = spellTokens[idx] || token;
      return normTarget.includes(token) ||
             spellTarget.includes(spellToken) ||
             normTarget.includes(spellToken) ||
             spellTarget.includes(token);
    });
  }

  function handleSearchInput() {
    const rawQuery = el.filterSearch ? el.filterSearch.value : '';
    const query = rawQuery.trim();

    if (el.btnClearSearch) {
      el.btnClearSearch.style.display = query ? 'block' : 'none';
    }

    if (!query) {
      hideSearchDropdown();
      applyFilters();
      return;
    }

    renderSearchDropdown(query);
    applyFilters();
  }

  function renderSearchDropdown(query) {
    if (!el.searchDropdown) return;

    const normQ = normalizeHebrew(query);
    const matches = state.allData.filter(item => authorityMatchesSearch(item, query));
    activeDropdownIndex = -1;

    if (matches.length === 0) {
      el.searchDropdown.innerHTML = '<div class="search-dropdown-empty">לא נמצאו רשויות תואמות לחיפוש</div>';
      el.searchDropdown.style.display = 'block';
      return;
    }

    // Sort by relevance (exact match first, then prefix, then population)
    matches.sort((a, b) => {
      const aNorm = normalizeHebrew(a.name);
      const bNorm = normalizeHebrew(b.name);
      const aExact = (aNorm === normQ || a.code === query);
      const bExact = (bNorm === normQ || b.code === query);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = aNorm.startsWith(normQ);
      const bStarts = bNorm.startsWith(normQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (b.population || 0) - (a.population || 0);
    });

    // Show top 8 matches
    const topMatches = matches.slice(0, 8);
    let html = '';
    topMatches.forEach((auth, idx) => {
      html += `
        <div class="search-dropdown-item" data-index="${idx}" data-code="${auth.code}">
          <div class="search-dropdown-info">
            <span class="search-dropdown-name">${auth.name}</span>
            <span class="search-dropdown-meta">${auth.type} • מחוז ${auth.district} • סמל ${auth.code} • אשכול ${auth.cbs_socio_cluster}</span>
          </div>
          <div class="search-dropdown-rate">${auth.municipal_education_self_funding_rate}%</div>
        </div>
      `;
    });

    el.searchDropdown.innerHTML = html;
    el.searchDropdown.style.display = 'block';

    el.searchDropdown.querySelectorAll('.search-dropdown-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = itemEl.getAttribute('data-code');
        const auth = state.allData.find(a => a.code === code);
        if (auth) {
          selectAuthorityFromSearch(auth);
        }
      });
    });
  }

  function hideSearchDropdown() {
    if (el.searchDropdown) {
      el.searchDropdown.style.display = 'none';
      el.searchDropdown.innerHTML = '';
      activeDropdownIndex = -1;
    }
  }

  function updateDropdownHighlight(items) {
    items.forEach((it, idx) => {
      if (idx === activeDropdownIndex) {
        it.classList.add('active');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('active');
      }
    });
  }

  function selectAuthorityFromSearch(auth) {
    if (!auth) return;
    if (el.filterSearch) {
      el.filterSearch.value = auth.name;
    }
    if (el.btnClearSearch) {
      el.btnClearSearch.style.display = 'block';
    }
    hideSearchDropdown();
    selectAuthority(auth);
    applyFilters();
  }

  function setupEventListeners() {
    // Filter controls
    if (el.filterSearch) {
      el.filterSearch.addEventListener('input', handleSearchInput);

      el.filterSearch.addEventListener('keydown', (e) => {
        const items = el.searchDropdown ? el.searchDropdown.querySelectorAll('.search-dropdown-item') : [];

        if (e.key === 'ArrowDown') {
          if (items.length > 0) {
            e.preventDefault();
            activeDropdownIndex = (activeDropdownIndex + 1) % items.length;
            updateDropdownHighlight(items);
          }
        } else if (e.key === 'ArrowUp') {
          if (items.length > 0) {
            e.preventDefault();
            activeDropdownIndex = (activeDropdownIndex - 1 + items.length) % items.length;
            updateDropdownHighlight(items);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (items.length > 0 && activeDropdownIndex >= 0 && activeDropdownIndex < items.length) {
            const code = items[activeDropdownIndex].getAttribute('data-code');
            const auth = state.allData.find(a => a.code === code);
            if (auth) selectAuthorityFromSearch(auth);
          } else if (state.filteredData.length > 0) {
            selectAuthorityFromSearch(state.filteredData[0]);
          }
        } else if (e.key === 'Escape') {
          hideSearchDropdown();
        }
      });

      el.filterSearch.addEventListener('focus', () => {
        const q = el.filterSearch.value.trim();
        if (q) renderSearchDropdown(q);
      });
    }

    if (el.btnClearSearch) {
      el.btnClearSearch.addEventListener('click', () => {
        if (el.filterSearch) el.filterSearch.value = '';
        el.btnClearSearch.style.display = 'none';
        hideSearchDropdown();
        applyFilters();
        if (el.filterSearch) el.filterSearch.focus();
      });
    }

    // Click outside closes dropdown and unpins chart tooltips
    document.addEventListener('click', (e) => {
      if (el.searchDropdown && !e.target.closest('.search-group')) {
        hideSearchDropdown();
      }
      const tooltipEl = document.getElementById('chartTooltip');
      if (tooltipEl && !e.target.closest('canvas') && !e.target.closest('#chartTooltip')) {
        tooltipEl.style.display = 'none';
        if (el.canvasScatterExplorer) el.canvasScatterExplorer._pinnedAuth = null;
        if (el.canvasBalancingAll) el.canvasBalancingAll._pinnedAuth = null;
        if (el.canvasBalancingLow) el.canvasBalancingLow._pinnedAuth = null;
      }
    });

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

    // Global Navigation Click Handler (data-nav)
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        e.preventDefault();
        const targetNav = navBtn.getAttribute('data-nav');
        navigateTo(targetNav);
        return;
      }

      const subBtn = e.target.closest('.subview-btn[data-subview]');
      if (subBtn) {
        e.preventDefault();
        const parentViewEl = subBtn.closest('.app-view');
        if (parentViewEl) {
          const parentView = parentViewEl.id.replace('view-', '');
          const targetSub = subBtn.getAttribute('data-subview');
          navigateTo(parentView, targetSub);
        }
        return;
      }
    });

    // Hash Change Event (Back/Forward browser buttons and direct links)
    window.addEventListener('hashchange', handleHashChange);

    // Export & Print Buttons
    if (el.btnExportExcel) el.btnExportExcel.addEventListener('click', exportToExcel);
    if (el.btnGapsExportExcel) el.btnGapsExportExcel.addEventListener('click', exportToExcel);
    if (el.btnTableExport) el.btnTableExport.addEventListener('click', exportToExcel);
    if (el.btnRunSim) el.btnRunSim.addEventListener('click', runSimulator);

    // Report Sub-Tab Navigation
    if (el.btnSubReportNational) {
      el.btnSubReportNational.addEventListener('click', () => {
        state.reportSubType = 'national';
        el.btnSubReportNational.classList.add('active');
        if (el.btnSubReportMunicipal) el.btnSubReportMunicipal.classList.remove('active');
        if (el.municipalSelectRow) el.municipalSelectRow.style.display = 'none';
        renderReports();
      });
    }

    if (el.btnSubReportMunicipal) {
      el.btnSubReportMunicipal.addEventListener('click', () => {
        state.reportSubType = 'municipal';
        el.btnSubReportMunicipal.classList.add('active');
        if (el.btnSubReportNational) el.btnSubReportNational.classList.remove('active');
        if (el.municipalSelectRow) el.municipalSelectRow.style.display = 'flex';
        renderReports();
      });
    }

    if (el.reportAuthoritySelect) {
      el.reportAuthoritySelect.addEventListener('change', (e) => {
        const code = e.target.value;
        const auth = state.allData.find(a => String(a.code) === String(code));
        if (auth) {
          selectAuthority(auth);
        }
      });
    }

    if (el.btnSubReportPrint) {
      el.btnSubReportPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Global Traceability ("איך חושב?") Modal Trigger
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-how-calc, [data-trace-field]');
      if (btn) {
        const field = btn.getAttribute('data-field') || btn.getAttribute('data-trace-field');
        if (field && window.DataTraceabilityEngine) {
          window.DataTraceabilityEngine.showTraceabilityModal(field);
        }
      }
    });

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

    // Research Population Filter
    if (el.selectResearchPopulation) {
      el.selectResearchPopulation.addEventListener('change', () => {
        renderResearch();
      });
    }

    // Window Resize
    window.addEventListener('resize', () => {
      if (state.currentView === 'research') {
        if (state.researchSubView === 'scatter') renderExplorer();
        if (state.researchSubView === 'balancing') renderResearch();
      }
      if (state.currentView === 'gaps' && state.gapsSubView === 'profile' && state.selectedAuthority) {
        renderProfileCharts(state.selectedAuthority);
      }
    });
  }

  function navigateTo(viewId, subViewId, updateHash = true) {
    const validViews = ['home', 'gaps', 'research', 'simulator', 'reports', 'methodology'];
    if (!validViews.includes(viewId)) {
      viewId = 'home';
    }

    state.currentView = viewId;
    if (viewId === 'gaps' && subViewId) {
      state.gapsSubView = subViewId;
    }
    if (viewId === 'research' && subViewId) {
      state.researchSubView = subViewId;
    }

    // Hide all views and activate target view
    document.querySelectorAll('.app-view').forEach(v => {
      v.classList.remove('active');
    });

    const targetViewEl = document.getElementById(`view-${viewId}`);
    if (targetViewEl) {
      targetViewEl.classList.add('active');
    }

    // Activate appropriate subview inside gaps or research
    if (viewId === 'gaps') {
      const sub = state.gapsSubView || 'profile';
      document.querySelectorAll('#view-gaps .subview-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-subview') === sub);
      });
      document.querySelectorAll('#view-gaps .subview-panel').forEach(p => {
        p.classList.toggle('active', p.id === `gaps-sub-${sub}`);
      });
    }

    if (viewId === 'research') {
      const sub = state.researchSubView || 'scatter';
      document.querySelectorAll('#view-research .subview-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-subview') === sub);
      });
      document.querySelectorAll('#view-research .subview-panel').forEach(p => {
        p.classList.toggle('active', p.id === `research-sub-${sub}`);
      });
    }

    // Hash sync
    if (updateHash) {
      let targetHash = `#${viewId}`;
      if (viewId === 'gaps' && state.gapsSubView === 'table') targetHash = '#table';
      if (viewId === 'research' && state.researchSubView === 'balancing') targetHash = '#balancing';
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger canvas/view re-renders after layout update
    setTimeout(() => {
      if (viewId === 'gaps') {
        if (state.gapsSubView === 'profile' && state.selectedAuthority) {
          renderProfileCharts(state.selectedAuthority);
        } else if (state.gapsSubView === 'table') {
          renderTable();
        }
      } else if (viewId === 'research') {
        if (state.researchSubView === 'scatter') {
          renderExplorer();
        } else if (state.researchSubView === 'balancing') {
          renderResearch();
        }
      } else if (viewId === 'simulator') {
        runSimulator();
      } else if (viewId === 'reports') {
        renderReports();
      } else if (viewId === 'methodology' && window.DataTraceabilityEngine) {
        window.DataTraceabilityEngine.renderMethodologyTab('methodologyContainer');
      }
    }, 50);
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (!hash || hash === 'home') {
      navigateTo('home', null, false);
    } else if (hash === 'gaps' || hash === 'profile') {
      navigateTo('gaps', 'profile', false);
    } else if (hash === 'table') {
      navigateTo('gaps', 'table', false);
    } else if (hash === 'research' || hash === 'scatter' || hash === 'explorer') {
      navigateTo('research', 'scatter', false);
    } else if (hash === 'balancing') {
      navigateTo('research', 'balancing', false);
    } else if (hash === 'simulator' || hash === 'sim') {
      navigateTo('simulator', null, false);
    } else if (hash === 'reports' || hash === 'advocacy') {
      navigateTo('reports', null, false);
    } else if (hash === 'methodology' || hash === 'sources') {
      navigateTo('methodology', null, false);
    } else {
      navigateTo('home', null, false);
    }
  }

  function switchTab(tabId) {
    if (tabId === 'tab-explorer') navigateTo('research', 'scatter');
    else if (tabId === 'tab-profile') navigateTo('gaps', 'profile');
    else if (tabId === 'tab-research') navigateTo('research', 'balancing');
    else if (tabId === 'tab-simulator') navigateTo('simulator');
    else if (tabId === 'tab-advocacy') navigateTo('reports');
    else if (tabId === 'tab-methodology') navigateTo('methodology');
    else if (tabId === 'tab-table') navigateTo('gaps', 'table');
    else navigateTo('home');
  }

  function resetFilters() {
    if (el.filterSearch) el.filterSearch.value = '';
    if (el.btnClearSearch) el.btnClearSearch.style.display = 'none';
    hideSearchDropdown();
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
    const rawSearch = el.filterSearch ? el.filterSearch.value : '';
    const search = rawSearch.trim();
    const district = el.filterDistrict ? el.filterDistrict.value : '';
    const type = el.filterType ? el.filterType.value : '';
    const socio = el.filterSocio ? el.filterSocio.value : '';
    const anomaly = el.filterAnomaly ? el.filterAnomaly.value : '';

    state.filteredData = state.allData.filter(item => {
      if (state.excludeTamar && item.is_tamar_outlier) return false;
      if (state.excludeWar && item.is_war_evacuated_2024) return false;

      if (search && !authorityMatchesSearch(item, search)) {
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

    // Auto-sync selected authority if filter reduces results
    if (state.filteredData.length === 1) {
      selectAuthority(state.filteredData[0]);
    } else if (state.filteredData.length > 0) {
      if (state.selectedAuthority && !state.filteredData.some(d => d.code === state.selectedAuthority.code)) {
        selectAuthority(state.filteredData[0]);
      }
    }

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
          navigateTo('gaps', 'profile');
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

    // Sync Report Selector
    if (el.reportAuthoritySelect) {
      el.reportAuthoritySelect.value = auth.code;
    }

    // Update Reports
    renderReports();
  }

  function populateReportAuthoritySelect() {
    if (!el.reportAuthoritySelect || !state.allData || state.allData.length === 0) return;
    el.reportAuthoritySelect.innerHTML = '';
    const sorted = [...state.allData].sort((a, b) => a.name.localeCompare(b.name, 'he'));
    sorted.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.code;
      opt.textContent = `${a.name} (${a.type}, אשכול ${a.cbs_socio_cluster})`;
      el.reportAuthoritySelect.appendChild(opt);
    });
    if (state.selectedAuthority) {
      el.reportAuthoritySelect.value = state.selectedAuthority.code;
    }
  }

  function renderProfileCharts(auth) {
    if (el.canvasDonutBreakdown) {
      EducationCharts.renderDonutBreakdown(el.canvasDonutBreakdown, auth);
    }
    if (el.canvasPeerBenchmark) {
      EducationCharts.renderPeerBenchmark(el.canvasPeerBenchmark, auth, state.allData);
    }
  }

  const researchPopulationMeta = {
    'ALL': {
      title: 'כלל הרשויות',
      desc: 'ברמה הארצית, מענק האיזון מרוכז ברשויות חלשות ששיעור השתתפותן נמוך עקב מצוקה כלכלית כוללת.',
      filter: (d) => true
    },
    'GROUP_1_3': {
      title: 'אשכולות 1–3 (מצוקה וזכאות מוגברת)',
      desc: 'בתוך אשכולות המצוקה (1–3), ככל שהמענק לנפש גבוה יותר — שיעור ההשתתפות העצמית עולה במובהק (r = +0.4138, p = 0.0002).',
      filter: (d) => {
        const c = (d.cbs_socio_cluster !== undefined && d.cbs_socio_cluster !== null && d.cbs_socio_cluster !== '') ? d.cbs_socio_cluster : d.socio_cluster_2021;
        return c >= 1 && c <= 3;
      }
    },
    'GROUP_4_5': {
      title: 'אשכולות 4–5 (ביניים נמוכים)',
      desc: 'באשכולות הביניים הנמוכים (4–5), הקשר בין מענק האיזון להשתתפות עצמית מתון ולא מובהק סטטיסטית.',
      filter: (d) => {
        const c = (d.cbs_socio_cluster !== undefined && d.cbs_socio_cluster !== null && d.cbs_socio_cluster !== '') ? d.cbs_socio_cluster : d.socio_cluster_2021;
        return c >= 4 && c <= 5;
      }
    },
    'GROUP_6_7': {
      title: 'אשכולות 6–7 (ביניים גבוהים)',
      desc: 'באשכולות הביניים הגבוהים (6–7), מענק האיזון מצומצם ונצפה מתאם שלילי מובהק מול רשויות ללא זכאות למענק.',
      filter: (d) => {
        const c = (d.cbs_socio_cluster !== undefined && d.cbs_socio_cluster !== null && d.cbs_socio_cluster !== '') ? d.cbs_socio_cluster : d.socio_cluster_2021;
        return c >= 6 && c <= 7;
      }
    },
    'GROUP_8_10': {
      title: 'אשכולות 8–10 (מבוססים)',
      desc: 'באשכולות המבוססים (8–10), רוב הרשויות אינן זכאיות למענק איזון (מענק 0 ₪) ולכן השונות במענק נמוכה.',
      filter: (d) => {
        const c = (d.cbs_socio_cluster !== undefined && d.cbs_socio_cluster !== null && d.cbs_socio_cluster !== '') ? d.cbs_socio_cluster : d.socio_cluster_2021;
        return c >= 8 && c <= 10;
      }
    }
  };

  // Add individual clusters 1..10 to metadata
  for (let cl = 1; cl <= 10; cl++) {
    const clNum = cl;
    researchPopulationMeta[`CLUSTER_${clNum}`] = {
      title: `אשכול ${clNum} בלבד`,
      desc: clNum <= 3
        ? `ניתוח ממוקד לאשכול ${clNum}: בחינת הקשר התוך-אשכולי בין גובה מענק האיזון לנפש להשתתפות העצמית בחינוך.`
        : `ניתוח ממוקד לאשכול ${clNum}: בחינת שיעור ההשתתפות העצמית מול מענק האיזון ברשויות האשכול.`,
      filter: (d) => {
        const c = (d.cbs_socio_cluster !== undefined && d.cbs_socio_cluster !== null && d.cbs_socio_cluster !== '') ? d.cbs_socio_cluster : d.socio_cluster_2021;
        return c === clNum;
      }
    };
  }

  function renderResearch() {
    if (!el.canvasBalancingAll || !el.canvasBalancingLow) return;

    const popKey = el.selectResearchPopulation ? el.selectResearchPopulation.value : 'GROUP_1_3';
    const meta = researchPopulationMeta[popKey] || researchPopulationMeta['GROUP_1_3'];
    const targetData = state.allData.filter(meta.filter);

    const xLabelB = `מענק איזון לנפש (₪) [${meta.title}]`;

    const res = EducationCharts.renderBalancingGrantResearch(
      el.canvasBalancingAll,
      el.canvasBalancingLow,
      state.allData,
      targetData,
      {
        xLabelB: xLabelB,
        selectedCode: state.selectedAuthority ? state.selectedAuthority.code : null,
        onSelectCallback: (selected) => {
          selectAuthority(selected);
        }
      }
    );

    // Update Panel B dynamic header and description
    if (res && res.panelB && el.researchPanelBTitle) {
      const pB = res.panelB;
      const rSign = pB.r >= 0 ? '+' : '';
      const rFormatted = `${rSign}${pB.r.toFixed(4)}`;
      const pFormatted = pB.p < 0.0001 ? '< 0.0001' : pB.p.toFixed(4);

      let statDisplay = `r = ${rFormatted} (p = ${pFormatted})`;
      if (pB.n <= 2) {
        statDisplay = `N=${pB.n} (מדגם קטן לחישוב מובהקות)`;
      }

      el.researchPanelBTitle.textContent = `פאנל ב': ${meta.title} (N=${pB.n}) — ${statDisplay}`;

      // Color coding title: green for positive significant, danger for negative significant, muted otherwise
      if (pB.r > 0.1 && pB.p <= 0.05) {
        el.researchPanelBTitle.className = 'research-panel-title text-success';
      } else if (pB.r < -0.1 && pB.p <= 0.05) {
        el.researchPanelBTitle.className = 'research-panel-title text-danger';
      } else {
        el.researchPanelBTitle.className = 'research-panel-title text-accent';
      }
    }

    if (el.researchPanelBDesc) {
      el.researchPanelBDesc.textContent = meta.desc;
    }

    if (el.researchPopBadge) {
      el.researchPopBadge.textContent = `${meta.title} — N=${targetData.length}`;
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
        const clusterVal = (g.cbs_socio_cluster !== undefined && g.cbs_socio_cluster !== null) ? g.cbs_socio_cluster : ((g.socio_cluster_2021 !== undefined && g.socio_cluster_2021 !== null) ? g.socio_cluster_2021 : g.socio_cluster);
        const clusterDisplay = (clusterVal !== undefined && clusterVal !== null && clusterVal !== '') ? `אשכול ${clusterVal}` : 'אשכול לא זמין';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${g.name}</strong> (${g.type})</td>
          <td>${clusterDisplay}</td>
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
            navigateTo('gaps', 'profile');
          }
        };
        el.simGainersBody.appendChild(tr);
      });
    }

    renderReports();
  }

  function renderReports() {
    if (!el.advocacyPaperContainer) return;

    if (state.reportSubType === 'municipal') {
      const auth = state.selectedAuthority || state.allData[0];
      let simAuthData = null;
      if (state.lastSimResults && state.lastSimResults.authority_allocations) {
        simAuthData = state.lastSimResults.authority_allocations.find(a => a.code === auth.code);
      }
      const options = {
        wSocio: Number(el.sliderWSocio ? el.sliderWSocio.value : 50),
        wPeri: Number(el.sliderWPeri ? el.sliderWPeri.value : 30),
        wFiscal: Number(el.sliderWFiscal ? el.sliderWFiscal.value : 20)
      };
      if (window.EducationAdvocacy) {
        el.advocacyPaperContainer.innerHTML = EducationAdvocacy.generateReport(
          auth,
          state.nationalUnweightedAvg,
          simAuthData,
          options
        );
      }
    } else {
      if (window.NationalReportEngine) {
        el.advocacyPaperContainer.innerHTML = NationalReportEngine.generateReportHtml(
          state.allData,
          state.lastSimResults
        );
      }
    }
  }

  function renderAdvocacy(auth) {
    renderReports();
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
        navigateTo('gaps', 'profile');
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

  window.selectAuthorityByCode = function (code) {
    const found = state.allData.find(a => a.code === String(code) || a.cbs_code === String(code));
    if (found) {
      const tooltipEl = document.getElementById('chartTooltip');
      if (tooltipEl) tooltipEl.style.display = 'none';
      if (el.canvasScatterExplorer) el.canvasScatterExplorer._pinnedAuth = null;
      if (el.canvasBalancingAll) el.canvasBalancingAll._pinnedAuth = null;
      if (el.canvasBalancingLow) el.canvasBalancingLow._pinnedAuth = null;

      selectAuthority(found);
      navigateTo('gaps', 'profile');
    }
  };

  window.navigateTo = navigateTo;
  window.switchTab = switchTab;

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();