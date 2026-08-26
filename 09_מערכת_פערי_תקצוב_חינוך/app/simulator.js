// ==============================================================================
// simulator.js - Enhanced Corrective Budget Allocation Simulation Engine
// ==============================================================================

window.EducationSimulator = {
  // Calculates Gini inequality coefficient across all pupils
  calculateGini: function(dataset, spendKey) {
    let pupilsTotal = 0;
    let values = [];

    dataset.forEach(d => {
      const p = d.total_pupils;
      const val = d[spendKey];
      pupilsTotal += p;
      values.push({ p, val });
    });

    values.sort((a, b) => a.val - b.val);

    let cumulativePupils = 0;
    let cumulativeWealth = 0;
    let totalWealth = values.reduce((sum, v) => sum + (v.val * v.p), 0);
    let areaUnderLorenz = 0;

    values.forEach(v => {
      const pRatio = v.p / pupilsTotal;
      const wRatio = (v.val * v.p) / totalWealth;
      areaUnderLorenz += (cumulativeWealth + (cumulativeWealth + wRatio)) / 2 * pRatio;
      cumulativeWealth += wRatio;
      cumulativePupils += pRatio;
    });

    const gini = 1 - (2 * areaUnderLorenz);
    return Math.max(0, Math.min(1, Math.round(gini * 1000) / 1000));
  },

  // Runs the corrective allocation model simulation with Special Ed & Transport
  runSimulation: function(dataset, options) {
    const poolNIS = (options.budgetPoolM || 1000) * 1000000;
    const wSocio = (options.wSocio || 35) / 100;
    const wPeri = (options.wPeri || 20) / 100;
    const wArnona = (options.wArnona || 30) / 100;
    const wSpecialEd = (options.wSpecialEd || 15) / 100;
    const exemptMatching = !!options.exemptMatching;

    // Benchmark average arnona per pupil across country
    const targetArnonaPerPupil = 6000;
    const targetTransportDeficit = 1500;

    // 1. Calculate weights for all authorities
    let totalWeightedScore = 0;
    const rawScores = dataset.map(auth => {
      const p = auth.total_pupils;

      // Factors:
      const socioScore = (11 - auth.cbs_socio_cluster) / 10;
      const periScore = (11 - auth.cbs_periphery_cluster) / 10;
      const arnonaDeficit = Math.max(0, targetArnonaPerPupil - auth.arnona_per_pupil_nis) / targetArnonaPerPupil;
      
      // Special Ed & Transportation burden factor
      const transportBurden = Math.min(1, (auth.transport_deficit_per_pupil_nis || 800) / targetTransportDeficit);
      const specialEdRatio = (auth.special_ed_pct || 8) / 12;
      const seScore = (transportBurden * 0.6) + (specialEdRatio * 0.4);

      // Combined composite need index
      const compositeNeed = (wSocio * socioScore) + (wPeri * periScore) + (wArnona * arnonaDeficit) + (wSpecialEd * seScore);
      const authorityScore = p * Math.pow(compositeNeed, 1.3);

      totalWeightedScore += authorityScore;
      return { code: auth.code, authorityScore, compositeNeed };
    });

    const scoreMap = {};
    rawScores.forEach(s => { scoreMap[s.code] = s; });

    // 2. Distribute pool & compute new indicators
    let totalRecoveredMatching = 0;
    const simulatedResults = dataset.map(auth => {
      const s = scoreMap[auth.code];
      const allocRatio = totalWeightedScore > 0 ? (s.authorityScore / totalWeightedScore) : 0;
      const allocatedGrantNIS = poolNIS * allocRatio;
      const grantPerPupilNIS = Math.round(allocatedGrantNIS / Math.max(1, auth.total_pupils));

      // Matching exemption benefit: recover lost funds if exemptMatching is enabled
      let recoveredMatchingNIS = 0;
      if (exemptMatching && (auth.cbs_socio_cluster <= 5 || auth.arnona_per_pupil_nis < 3000)) {
        recoveredMatchingNIS = auth.lost_matching_per_pupil_nis;
        totalRecoveredMatching += (recoveredMatchingNIS * auth.total_pupils);
      }

      const originalTotalSpend = auth.total_spending_per_pupil_nis;
      const newTotalSpend = originalTotalSpend + grantPerPupilNIS + recoveredMatchingNIS;
      const gainNIS = newTotalSpend - originalTotalSpend;
      const gainPct = Math.round(((newTotalSpend - originalTotalSpend) / originalTotalSpend) * 1000) / 10;

      return {
        ...auth,
        allocated_grant_k_nis: Math.round(allocatedGrantNIS / 1000),
        grant_per_pupil_nis: grantPerPupilNIS,
        recovered_matching_per_pupil_nis: recoveredMatchingNIS,
        original_spending_per_pupil: originalTotalSpend,
        simulated_spending_per_pupil: newTotalSpend,
        gain_nis_per_pupil: gainNIS,
        gain_pct: gainPct
      };
    });

    // 3. Compute Summary Statistics
    const originalGini = EducationSimulator.calculateGini(dataset, 'total_spending_per_pupil_nis');
    const simulatedGini = EducationSimulator.calculateGini(simulatedResults, 'simulated_spending_per_pupil');

    // Min & Max calculations
    const origSpends = dataset.map(d => d.total_spending_per_pupil_nis);
    const simSpends = simulatedResults.map(d => d.simulated_spending_per_pupil);

    const origMin = Math.min(...origSpends), origMax = Math.max(...origSpends);
    const simMin = Math.min(...simSpends), simMax = Math.max(...simSpends);

    const origDisparityRatio = Math.round((origMax / Math.max(1, origMin)) * 10) / 10;
    const simDisparityRatio = Math.round((simMax / Math.max(1, simMin)) * 10) / 10;

    // Top Gainers
    const topGainers = [...simulatedResults].sort((a, b) => b.gain_pct - a.gain_pct).slice(0, 10);

    return {
      results: simulatedResults,
      originalGini,
      simulatedGini,
      giniReductionPct: Math.round(((originalGini - simulatedGini) / originalGini) * 1000) / 10,
      origDisparityRatio,
      simDisparityRatio,
      totalRecoveredMatchingM: Math.round(totalRecoveredMatching / 1000000),
      topGainers
    };
  }
};
