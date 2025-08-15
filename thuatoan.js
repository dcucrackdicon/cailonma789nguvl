function predictTaiXiuTongProMax(history) {
  /*
   * SỬA LỖI: YÊU CẦU TỐI THIỂU 5 PHIÊN
   */
  if (!history || history.length < 5) {
    // Trả về null để server biết là chưa đủ dữ liệu
    return null;
  }

  /*
   * CẤU TRÚC DỮ LIỆU NÂNG CAO
   */
  const analysisPeriods = {
    ultraShort: history.slice(0, 10), // 10 phiên gần nhất
    short: history.slice(0, 30),      // 30 phiên
    medium: history.slice(0, 100),    // 100 phiên
    long: history.length >= 500 ? history.slice(0, 500) : history // Toàn bộ nếu đủ 500 phiên
  };

  /*
   * HỆ THỐNG PHÂN TÍCH ĐA TẦNG
   */
  const analysisLayers = {
    basicStats: getWeightedStats(analysisPeriods),
    streak: getStreakAnalysis(analysisPeriods.ultraShort),
    patterns: getPatternAnalysis(analysisPeriods.medium),
    cycles: detectCycles(analysisPeriods.long),
    anomalies: detectAnomalies(history),
    trends: getTrendAnalysis(analysisPeriods)
  };

  /*
   * THUẬT TOÁN TỔNG HỢP THÔNG MINH
   */
  const finalPrediction = {
    taiXiu: synthesizePrediction('taiXiu', analysisLayers),
    tong: predictTong(analysisLayers),
    confidence: calculateConfidence(analysisLayers),
    analysisReport: generateAnalysisReport(analysisLayers)
  };

  return finalPrediction;

  /*
   * CÁC HÀM HỖ TRỢ CHUYÊN SÂU
   */

  function getWeightedStats(periods) {
    const stats = {};
    const weightProfile = {
      ultraShort: 0.4,
      short: 0.3,
      medium: 0.2,
      long: 0.1
    };

    for (const [periodName, data] of Object.entries(periods)) {
      const weight = weightProfile[periodName];
      const periodStats = {
        tai: 0,
        xiu: 0,
        tongDistribution: {}
      };

      data.forEach((item, index) => {
        const { Tong } = item;
        const isTai = Tong >= 11;
        const itemWeight = weight * (0.5 + 0.5 * (index / data.length));

        if (isTai) periodStats.tai += itemWeight;
        else periodStats.xiu += itemWeight;
        
        periodStats.tongDistribution[Tong] = (periodStats.tongDistribution[Tong] || 0) + itemWeight;
      });

      for (const key of ['tai', 'xiu']) {
        stats[key] = (stats[key] || 0) + periodStats[key];
      }
      
      for (const [tong, count] of Object.entries(periodStats.tongDistribution)) {
        stats.tongDistribution = stats.tongDistribution || {};
        stats.tongDistribution[tong] = (stats.tongDistribution[tong] || 0) + count;
      }
    }

    return stats;
  }

  function getStreakAnalysis(data) {
    const analysis = {
      current: { tai: 0, xiu: 0 },
      max: { tai: 0, xiu: 0 },
      averages: { tai: 0, xiu: 0 }
    };

    let lastTaiXiu = null;
    let streakCounts = { tai: [], xiu: [] };

    data.forEach(item => {
      const { Tong } = item;
      const isTai = Tong >= 11;

      if (isTai === lastTaiXiu) {
        analysis.current.tai = isTai ? analysis.current.tai + 1 : 0;
        analysis.current.xiu = isTai ? 0 : analysis.current.xiu + 1;
      } else {
        if (lastTaiXiu !== null) {
          streakCounts[lastTaiXiu ? 'tai' : 'xiu'].push(analysis.current[lastTaiXiu ? 'tai' : 'xiu']);
        }
        analysis.current.tai = isTai ? 1 : 0;
        analysis.current.xiu = isTai ? 0 : 1;
        lastTaiXiu = isTai;
      }
      
      analysis.max.tai = Math.max(analysis.max.tai, analysis.current.tai);
      analysis.max.xiu = Math.max(analysis.max.xiu, analysis.current.xiu);
    });

    for (const key of ['tai', 'xiu']) {
      const streaks = streakCounts[key];
      analysis.averages[key] = streaks.length > 0 ? 
        streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
    }

    return analysis;
  }

  function getPatternAnalysis(data) {
    const patternConfigs = [
      { length: 3, minOccurrences: 2 },
      { length: 4, minOccurrences: 1 }
    ];

    const patternResults = {};

    patternConfigs.forEach(config => {
      const { length } = config;
      if (data.length < length + 1) return;

      const patterns = {};
      const currentPattern = data.slice(0, length).map(e => e.Tong >= 11 ? 'T' : 'X').join('');

      for (let i = 0; i <= data.length - length - 1; i++) {
        const pattern = data.slice(i, i + length).map(e => e.Tong >= 11 ? 'T' : 'X').join('');
        const next = data[i + length];
        const outcome = next.Tong >= 11 ? 'T' : 'X';

        if (!patterns[pattern]) {
          patterns[pattern] = { T: 0, X: 0, occurrences: 0 };
        }
        patterns[pattern][outcome]++;
        patterns[pattern].occurrences++;
      }

      const validPatterns = Object.entries(patterns)
        .filter(([_, stats]) => stats.occurrences >= config.minOccurrences);

      let bestMatch = null;
      let bestScore = 0;

      validPatterns.forEach(([pattern, stats]) => {
        const similarity = calculatePatternSimilarity(currentPattern, pattern);
        const score = similarity * Math.log(stats.occurrences + 1);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = { pattern, stats };
        }
      });

      if (bestMatch) {
        patternResults[`length${length}`] = {
          currentPattern,
          bestMatch,
          confidence: bestScore,
          prediction: bestMatch.stats.T >= bestMatch.stats.X ? 'Tài' : 'Xỉu',
          probability: bestMatch.stats.T / (bestMatch.stats.T + bestMatch.stats.X)
        };
      }
    });

    return patternResults;
  }

  function detectCycles(data) {
    return {
      detected: false,
      cycleLength: null,
      confidence: 0
    };
  }

  function detectAnomalies(data) {
    const tongValues = data.map(item => item.Tong);
    const mean = tongValues.reduce((a, b) => a + b, 0) / tongValues.length;
    const stdDev = Math.sqrt(
      tongValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / tongValues.length
    );

    const anomalies = [];
    const zScoreThreshold = 2.5;

    data.forEach((item, index) => {
      const zScore = Math.abs((item.Tong - mean) / stdDev);
      if (zScore > zScoreThreshold) {
        anomalies.push({
          index,
          tong: item.Tong,
          zScore,
          isRecent: index < 10
        });
      }
    });

    return {
      count: anomalies.length,
      recentAnomalies: anomalies.filter(a => a.isRecent),
      mean,
      stdDev
    };
  }

  function getTrendAnalysis(periods) {
    const trends = {
      taiXiu: {
        shortTerm: 0,
        mediumTerm: 0,
        direction: 'neutral'
      }
    };

    if (periods.ultraShort.length > 0 && periods.short.length > 0) {
      const ultraShortStats = getBasicStats(periods.ultraShort);
      const shortStats = getBasicStats(periods.short.slice(periods.ultraShort.length));
      
      trends.taiXiu.shortTerm = ultraShortStats.taiRatio - shortStats.taiRatio;
    }

    if (periods.short.length > 0 && periods.medium.length > 0) {
      const shortStats = getBasicStats(periods.short);
      const mediumStats = getBasicStats(periods.medium.slice(periods.short.length));
      
      trends.taiXiu.mediumTerm = shortStats.taiRatio - mediumStats.taiRatio;
    }

    const trendStrength = trends.taiXiu.shortTerm * 0.6 + trends.taiXiu.mediumTerm * 0.4;
    if (Math.abs(trendStrength) > 0.15) {
      trends.taiXiu.direction = trendStrength > 0 ? 'up' : 'down';
    }

    return trends;
  }

  function synthesizePrediction(type, analysis) {
    const weights = {
      basicStats: 0.3,
      streak: 0.25,
      patterns: 0.2,
      trends: 0.15,
      cycles: 0.05,
      anomalies: 0.05
    };

    let taiScore = 0;
    let xiuScore = 0;

    if (type !== 'taiXiu') return null;

    taiScore += analysis.basicStats.tai * weights.basicStats;
    xiuScore += analysis.basicStats.xiu * weights.basicStats;

    const { current, max, averages } = analysis.streak;
    const streakWeight = 0.7 * (current.tai / (max.tai || 1)) + 0.3 * (current.tai / (averages.tai || 1));
    taiScore += streakWeight * weights.streak;
    
    const xiuStreakWeight = 0.7 * (current.xiu / (max.xiu || 1)) + 0.3 * (current.xiu / (averages.xiu || 1));
    xiuScore += xiuStreakWeight * weights.streak;

    for (const [_, pattern] of Object.entries(analysis.patterns)) {
      if (pattern.prediction === 'Tài') {
        taiScore += pattern.confidence * weights.patterns;
      } else {
        xiuScore += pattern.confidence * weights.patterns;
      }
    }

    if (analysis.trends[type].direction === 'up') {
      taiScore += weights.trends;
    } else if (analysis.trends[type].direction === 'down') {
      xiuScore += weights.trends;
    }

    return taiScore > xiuScore ? 'Tài' : 'Xỉu';
  }

  function calculatePatternSimilarity(pattern1, pattern2) {
    let match = 0;
    const minLength = Math.min(pattern1.length, pattern2.length);
    for (let i = 0; i < minLength; i++) {
      if (pattern1[i] === pattern2[i]) match++;
    }
    return match / minLength;
  }

  function getBasicStats(data) {
    let tai = 0, xiu = 0;
    data.forEach(item => {
      if (item.Tong >= 11) tai++; else xiu++;
    });
    
    return {
      taiRatio: data.length > 0 ? tai / data.length : 0,
      xiuRatio: data.length > 0 ? xiu / data.length : 0,
    };
  }

  function predictTong(analysis) {
    const tongDistribution = {};
    
    for (const [tong, count] of Object.entries(analysis.basicStats.tongDistribution)) {
      tongDistribution[tong] = (tongDistribution[tong] || 0) + count * 0.5;
    }
    
    analysis.anomalies.recentAnomalies.forEach(anomaly => {
      tongDistribution[anomaly.tong] = (tongDistribution[anomaly.tong] || 0) - 0.3;
    });
    
    return Object.entries(tongDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tong]) => parseInt(tong));
  }

  function calculateConfidence(analysis) {
    const taiXiuConfidence = 
      (Math.abs(analysis.basicStats.tai - analysis.basicStats.xiu) * 0.4 +
       Math.max(analysis.streak.current.tai / (analysis.streak.max.tai || 1), analysis.streak.current.xiu / (analysis.streak.max.xiu || 1)) * 0.3 +
       Object.values(analysis.patterns).reduce((sum, p) => sum + p.confidence, 0) * 0.2 +
       (analysis.trends.taiXiu.direction !== 'neutral' ? 0.1 : 0));
    
    return {
      taiXiu: Math.min(95, Math.round(taiXiuConfidence * 150))
    };
  }

  function generateAnalysisReport(analysis) {
    return {
      summary: `Phân tích đa tầng trên ${history.length} kết quả lịch sử`,
      keyFindings: [
        `Xu hướng Tài/Xỉu: ${analysis.trends.taiXiu.direction === 'neutral' ? 'Không rõ ràng' : (analysis.trends.taiXiu.direction === 'up' ? 'Thiên về Tài' : 'Thiên về Xỉu')}`,
        `Chuỗi hiện tại: ${Math.max(analysis.streak.current.tai, analysis.streak.current.xiu)} phiên ${analysis.streak.current.tai > analysis.streak.current.xiu ? 'Tài' : 'Xỉu'}`,
        `Pattern mạnh nhất: ${Object.values(analysis.patterns)[0]?.bestMatch.pattern || 'Không xác định'}`
      ],
      recommendations: [
        "Ưu tiên dự đoán theo xu hướng ngắn hạn và chuỗi hiện tại.",
        analysis.anomalies.recentAnomalies.length > 0 ? 
          "Cảnh giác với các tổng bất thường gần đây, có thể gây nhiễu loạn cầu." : 
          "Thị trường ổn định, không có dấu hiệu bất thường đáng kể."
      ]
    };
  }
}

module.exports = predictTaiXiuTongProMax;
