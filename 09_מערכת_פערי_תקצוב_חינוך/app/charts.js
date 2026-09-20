// ==============================================================================
// charts.js - Standalone Canvas Charting Engine for Municipal Education Equity
// ==============================================================================

window.EducationCharts = {
  // Socio-Economic Cluster Color Palette (1 = Red -> 10 = Deep Blue/Purple)
  clusterColors: {
    1: '#dc2626', // Red
    2: '#ea580c', // Orange-Red
    3: '#f97316', // Orange
    4: '#d97706', // Amber
    5: '#ca8a04', // Yellow-Gold
    6: '#0284c7', // Sky Blue
    7: '#2563eb', // Blue
    8: '#1d4ed8', // Royal Blue
    9: '#4f46e5', // Indigo
    10: '#7c3aed' // Violet
  },

  // Municipal Type Colors
  typeColors: {
    'עירייה': '#2563eb',
    'מועצה מקומית': '#0d9488',
    'מועצה אזורית': '#8b5cf6'
  },

  // Renders the Interactive Scatter Explorer with Linear Regression and Tooltip
  renderScatterExplorer: function(canvas, data, options = {}) {
    if (!canvas || !data || data.length === 0) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement ? (canvas.parentElement.clientWidth || 800) : 800;
    const height = (canvas.parentElement && canvas.parentElement.clientHeight > 150) ? canvas.parentElement.clientHeight : (options.height || 420);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const xKey = options.xKey || 'own_revenue_share_pct';
    const xLabel = options.xLabel || 'שיעור הכנסות עצמיות מתוך התקציב (%)';
    const yKey = 'municipal_education_self_funding_rate';
    const yLabel = 'שיעור ההשתתפות העצמית במימון החינוך (%)';
    const selectedCode = options.selectedCode;
    const tooltipEl = options.tooltipEl || document.getElementById('chartTooltip');

    // Filter valid numerical points
    let points = data.filter(d => {
      if (options.excludeTamar && d.is_tamar_outlier) return false;
      if (options.excludeWar && d.is_war_evacuated_2024) return false;
      const xVal = d[xKey];
      const yVal = d[yKey];
      return (typeof xVal === 'number' && !isNaN(xVal) && typeof yVal === 'number' && !isNaN(yVal));
    });

    const N = points.length;
    if (N === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Assistant, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('אין נתונים להצגה בחתך זה', width / 2, height / 2);
      return null;
    }

    // Compute Min / Max for scales
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      const x = p[xKey];
      const y = p[yKey];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Add padding to scales
    const xPad = (maxX - minX) * 0.08 || 1;
    const yPad = (maxY - minY) * 0.08 || 1;
    minX = Math.floor(minX - xPad);
    maxX = Math.ceil(maxX + xPad);
    minY = Math.floor(minY - yPad);
    maxY = Math.ceil(maxY + yPad);

    const padLeft = 65;
    const padRight = 25;
    const padTop = 25;
    const padBottom = 55;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    function scaleX(val) {
      return padLeft + ((val - minX) / (maxX - minX)) * plotWidth;
    }

    function scaleY(val) {
      return height - padBottom - ((val - minY) / (maxY - minY)) * plotHeight;
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Gridlines & Axis Values
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Assistant, sans-serif';
    ctx.textAlign = 'right';

    // Y ticks
    const ySteps = 6;
    for (let i = 0; i <= ySteps; i++) {
      const val = minY + (i / ySteps) * (maxY - minY);
      const y = scaleY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(1) + '%', padLeft - 8, y + 4);
    }

    // X ticks
    ctx.textAlign = 'center';
    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      const val = minX + (i / xSteps) * (maxX - minX);
      const x = scaleX(val);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();
      ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val.toFixed(0), x, height - padBottom + 16);
    }

    // Axis Labels
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12.5px Assistant, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, padLeft + plotWidth / 2, height - 12);

    ctx.save();
    ctx.translate(16, padTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // Compute Linear Regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    points.forEach(p => {
      const x = p[xKey];
      const y = p[yKey];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    });

    const meanX = sumX / N;
    const meanY = sumY / N;
    const num = sumXY - N * meanX * meanY;
    const denX = sumX2 - N * meanX * meanX;
    const denY = sumY2 - N * meanY * meanY;

    const slope = denX !== 0 ? num / denX : 0;
    const intercept = meanY - slope * meanX;
    const r = (denX > 0 && denY > 0) ? num / Math.sqrt(denX * denY) : 0;
    const r2 = r * r;

    // Draw Regression Line
    const regX1 = minX;
    const regY1 = slope * regX1 + intercept;
    const regX2 = maxX;
    const regY2 = slope * regX2 + intercept;

    ctx.save();
    ctx.beginPath();
    ctx.rect(padLeft, padTop, plotWidth, plotHeight);
    ctx.clip();

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(scaleX(regX1), scaleY(regY1));
    ctx.lineTo(scaleX(regX2), scaleY(regY2));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw Data Points
    const drawnPoints = [];
    points.forEach(p => {
      const cx = scaleX(p[xKey]);
      const cy = scaleY(p[yKey]);
      const cluster = p.cbs_socio_cluster || 5;
      const color = window.EducationCharts.clusterColors[cluster] || '#64748b';
      const isSelected = selectedCode && (p.code === selectedCode || p.cbs_code === selectedCode);

      ctx.beginPath();
      ctx.arc(cx, cy, isSelected ? 8.5 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#fbbf24' : color;
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.strokeStyle = isSelected ? '#0f172a' : '#ffffff';
      ctx.stroke();

      if (p.is_war_evacuated_2024) {
        ctx.beginPath();
        ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      drawnPoints.push({ x: cx, y: cy, radius: isSelected ? 9 : 6, data: p });
    });

    canvas._drawnPoints = drawnPoints;

    // Helper: Find closest point to coordinates
    function findPoint(px, py, maxDist = 14) {
      let closest = null;
      let closestDist = Infinity;
      for (let i = drawnPoints.length - 1; i >= 0; i--) {
        const dp = drawnPoints[i];
        const dist = Math.hypot(dp.x - px, dp.y - py);
        if (dist <= maxDist && dist < closestDist) {
          closest = dp;
          closestDist = dist;
        }
      }
      return closest;
    }

    // Helper: Show Tooltip
    function showTooltip(auth, clientX, clientY) {
      if (!tooltipEl || !auth) return;

      const balancingStr = (typeof auth.balancing_grant_per_capita_nis === 'number' && auth.balancing_grant_per_capita_nis > 0)
        ? `₪${auth.balancing_grant_per_capita_nis.toLocaleString()} לנפש`
        : '₪0 (אין זכאות)';
      
      const rateStr = (typeof auth.municipal_education_self_funding_rate === 'number')
        ? `${auth.municipal_education_self_funding_rate}%`
        : '-';

      tooltipEl.innerHTML = `
        <div class="chart-tooltip-title">
          <span>${auth.name}</span>
          <span style="font-size: 11px; font-weight: 500; color: #94a3b8;">${auth.type}</span>
        </div>
        <div class="chart-tooltip-row"><span>סמל למ"ס:</span> <strong>${auth.code}</strong></div>
        <div class="chart-tooltip-row"><span>מחוז / אשכול:</span> <strong>${auth.district} | אשכול ${auth.cbs_socio_cluster}</strong></div>
        <div class="chart-tooltip-row"><span>מענק איזון לנפש:</span> <strong style="color: #60a5fa;">${balancingStr}</strong></div>
        <div class="chart-tooltip-row"><span>שיעור השתתפות עצמית:</span> <strong style="color: #34d399;">${rateStr}</strong></div>
        ${xKey !== 'balancing_grant_per_capita_nis' ? `<div class="chart-tooltip-row"><span>${xLabel}:</span> <strong>${auth[xKey]}</strong></div>` : ''}
        <div class="chart-tooltip-row"><span>אוכלוסייה 2024:</span> <strong>${(auth.population || 0).toLocaleString()}</strong></div>
        ${auth.is_war_evacuated_2024 ? '<div class="tt-badge" style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;margin-top:4px;font-size:11px;font-weight:700;">⚠️ יישוב קו עימות / מפונה (2024)</div>' : ''}
        ${auth.is_tamar_outlier ? '<div class="tt-badge" style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;margin-top:4px;font-size:11px;font-weight:700;">⚠️ חריג מבני (מ.א. תמר)</div>' : ''}
        <button type="button" class="chart-tooltip-btn" onclick="window.selectAuthorityByCode('${auth.code}')">
          🔍 פתח כרטיס רשות 360°
        </button>
      `;

      tooltipEl.style.display = 'block';

      // Smart viewport boundary adjustment
      const ttW = tooltipEl.offsetWidth || 250;
      const ttH = tooltipEl.offsetHeight || 200;
      let left = clientX + 16;
      let top = clientY - 20;

      if (left + ttW > window.innerWidth - 12) {
        left = clientX - ttW - 16;
      }
      if (left < 10) left = 10;

      if (top + ttH > window.innerHeight - 12) {
        top = clientY - ttH - 10;
      }
      if (top < 10) top = 10;

      tooltipEl.style.left = left + 'px';
      tooltipEl.style.top = top + 'px';
    }

    // Mouse events
    canvas.onmousemove = function(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = findPoint(mouseX, mouseY, 12);
      if (hit) {
        showTooltip(hit.data, e.clientX, e.clientY);
        canvas.style.cursor = 'pointer';
      } else {
        if (!canvas._pinnedAuth && tooltipEl) {
          tooltipEl.style.display = 'none';
        }
        canvas.style.cursor = 'default';
      }
    };

    canvas.onmouseleave = function() {
      if (!canvas._pinnedAuth && tooltipEl) {
        tooltipEl.style.display = 'none';
      }
    };

    canvas.onclick = function(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = findPoint(mouseX, mouseY, 14);
      if (hit) {
        canvas._pinnedAuth = hit.data;
        showTooltip(hit.data, e.clientX, e.clientY);
        if (options.onSelectCallback) options.onSelectCallback(hit.data);
      } else {
        canvas._pinnedAuth = null;
        if (tooltipEl) tooltipEl.style.display = 'none';
      }
    };

    // Touch support for mobile
    canvas.ontouchstart = function(e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        const hit = findPoint(touchX, touchY, 18);
        if (hit) {
          e.preventDefault();
          canvas._pinnedAuth = hit.data;
          showTooltip(hit.data, touch.clientX, touch.clientY);
          if (options.onSelectCallback) options.onSelectCallback(hit.data);
        }
      }
    };

    return {
      n: N,
      r: r,
      r2: r2,
      slope: slope.toFixed(3),
      intercept: intercept.toFixed(1)
    };
  },

  // Renders the Cluster Step / Bar Chart (Socio-Economic Gradient 1-10)
  renderClusterStepChart: function(canvas, data) {
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 800;
    const height = 340;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Group by cluster 1..10
    const clusterStats = [];
    for (let c = 1; c <= 10; c++) {
      const clusterItems = data.filter(d => d.cbs_socio_cluster === c && typeof d.municipal_education_self_funding_rate === 'number');
      if (clusterItems.length === 0) {
        clusterStats.push({ cluster: c, count: 0, mean: 0, median: 0 });
        continue;
      }
      const rates = clusterItems.map(d => d.municipal_education_self_funding_rate).sort((a, b) => a - b);
      const sum = rates.reduce((acc, v) => acc + v, 0);
      const mean = sum / rates.length;
      const mid = Math.floor(rates.length / 2);
      const median = rates.length % 2 !== 0 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;

      clusterStats.push({
        cluster: c,
        count: clusterItems.length,
        mean: mean,
        median: median
      });
    }

    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 50;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    // Max rate for Y scale
    const maxVal = 45;

    function scaleY(val) {
      return height - padBottom - (val / maxVal) * plotHeight;
    }

    // Gridlines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11.5px Assistant, sans-serif';
    ctx.textAlign = 'right';

    for (let v = 0; v <= 40; v += 10) {
      const y = scaleY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(v + '%', padLeft - 10, y + 4);
    }

    const colWidth = plotWidth / 10;
    const barWidth = colWidth * 0.55;

    clusterStats.forEach((cs, idx) => {
      const xCenter = padLeft + (idx + 0.5) * colWidth;
      const xLeft = xCenter - barWidth / 2;
      const yBar = scaleY(cs.mean);
      const barHeight = (height - padBottom) - yBar;
      const color = window.EducationCharts.clusterColors[cs.cluster] || '#2563eb';

      // Bar
      ctx.fillStyle = color;
      ctx.fillRect(xLeft, yBar, barWidth, barHeight);

      // Mean Label on Top
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px Assistant, sans-serif';
      ctx.textAlign = 'center';
      if (cs.count > 0) {
        ctx.fillText(cs.mean.toFixed(1) + '%', xCenter, yBar - 6);
      }

      // X Label
      ctx.fillStyle = '#475569';
      ctx.font = '12px Assistant, sans-serif';
      ctx.fillText(`אשכול ${cs.cluster}`, xCenter, height - padBottom + 16);
      ctx.font = '10px Assistant, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`(N=${cs.count})`, xCenter, height - padBottom + 30);
    });

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12.5px Assistant, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ממוצע שיעור ההשתתפות העצמית בחינוך לפי אשכול למ"ס (1–10)', padLeft, 18);
  },

  // Renders the Donut Breakdown (Government 1384 vs Municipality Net Difference)
  renderDonutBreakdown: function(canvas, authority) {
    if (!canvas || !authority) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 300;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const exp1486 = authority.education_expense_1486_tk || 1;
    const rev1384 = authority.education_revenue_1384_tk || 0;
    const netMuni = Math.max(0, authority.education_net_difference_tk || 0);

    const govPct = (rev1384 / exp1486);
    const muniPct = (netMuni / exp1486);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;
    const innerRadius = radius * 0.62;

    const govAngle = govPct * Math.PI * 2;

    // Gov slice (Blue)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, govAngle);
    ctx.arc(centerX, centerY, innerRadius, govAngle, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // Muni slice (Emerald Green)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, govAngle, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, govAngle, true);
    ctx.closePath();
    ctx.fillStyle = '#10b981';
    ctx.fill();

    // Center Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Assistant, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((authority.municipal_education_self_funding_rate || 0).toFixed(1) + '%', centerX, centerY + 4);
    ctx.font = '11px Assistant, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('מימון עצמי', centerX, centerY + 20);
  },

  // Renders the Peer Benchmark (Authority vs Cluster vs Type vs National)
  renderPeerBenchmark: function(canvas, authority, allData) {
    if (!canvas || !authority || !allData) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 300;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Compute averages
    const authRate = authority.municipal_education_self_funding_rate || 0;

    const clusterItems = allData.filter(d => d.cbs_socio_cluster === authority.cbs_socio_cluster);
    const clusterAvg = clusterItems.reduce((acc, d) => acc + (d.municipal_education_self_funding_rate || 0), 0) / (clusterItems.length || 1);

    const typeItems = allData.filter(d => d.type === authority.type);
    const typeAvg = typeItems.reduce((acc, d) => acc + (d.municipal_education_self_funding_rate || 0), 0) / (typeItems.length || 1);

    const nationalAvg = 24.10;

    const bars = [
      { label: authority.name, value: authRate, color: '#2563eb', isAuth: true },
      { label: `אשכול ${authority.cbs_socio_cluster}`, value: clusterAvg, color: '#0d9488', isAuth: false },
      { label: authority.type, value: typeAvg, color: '#8b5cf6', isAuth: false },
      { label: 'ממוצע ארצי', value: nationalAvg, color: '#64748b', isAuth: false }
    ];

    const padLeft = 90;
    const padRight = 50;
    const padTop = 20;
    const padBottom = 20;
    const plotWidth = width - padLeft - padRight;
    const rowHeight = (height - padTop - padBottom) / bars.length;

    const maxVal = Math.max(50, ...bars.map(b => b.value * 1.2));

    bars.forEach((b, idx) => {
      const y = padTop + idx * rowHeight;
      const barH = rowHeight * 0.55;
      const barW = Math.max(0, (b.value / maxVal) * plotWidth);

      // Label
      ctx.fillStyle = b.isAuth ? '#0f172a' : '#475569';
      ctx.font = b.isAuth ? 'bold 12.5px Assistant, sans-serif' : '11.5px Assistant, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(b.label, padLeft - 10, y + barH / 2 + 4);

      // Bar
      ctx.fillStyle = b.color;
      ctx.fillRect(padLeft, y, barW, barH);

      // Value
      ctx.fillStyle = b.isAuth ? '#2563eb' : '#334155';
      ctx.font = 'bold 12px Assistant, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(b.value.toFixed(1) + '%', padLeft + barW + 6, y + barH / 2 + 4);
    });
  },

  // Renders the Balancing Grant Two-Panel Correlation Paradox (Research Tab)
  renderBalancingGrantResearch: function(canvasAll, canvasLow, allData, options = {}) {
    if (!canvasAll || !canvasLow || !allData) return;

    const tooltipEl = options.tooltipEl || document.getElementById('chartTooltip');

    // Panel A: All 257 Authorities
    window.EducationCharts.renderScatterExplorer(canvasAll, allData, {
      xKey: 'balancing_grant_per_capita_nis',
      xLabel: 'מענק איזון לנפש (₪)',
      tooltipEl: tooltipEl,
      selectedCode: options.selectedCode,
      onSelectCallback: options.onSelectCallback
    });

    // Panel B: Low Socio Clusters 1-3 (N=76)
    const lowData = allData.filter(d => d.cbs_socio_cluster >= 1 && d.cbs_socio_cluster <= 3);
    window.EducationCharts.renderScatterExplorer(canvasLow, lowData, {
      xKey: 'balancing_grant_per_capita_nis',
      xLabel: 'מענק איזון לנפש (₪) [אשכולות 1–3 בלבד]',
      tooltipEl: tooltipEl,
      selectedCode: options.selectedCode,
      onSelectCallback: options.onSelectCallback
    });
  }
};