// ==================================================================
//               TÍCH HỢP THUẬT TOÁN DỰ ĐOÁN PRO MAX
//                (Sao chép và dán để sử dụng)
// ==================================================================
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

// ==================================================================
// KHAI BÁO THUẬT TOÁN predictTaiXiuChanLeTongProMax
// ==================================================================
function predictTaiXiuChanLeTongProMax(history) {
  /* * KIỂM TRA DỮ LIỆU ĐẦU VÀO 
   */
  if (!history || history.length < 50) {
    throw new Error(`Hệ thống yêu cầu tối thiểu 50 kết quả lịch sử để phân tích chuyên sâu`);
  }

  /*
   * CẤU TRÚC DỮ LIỆU NÂNG CAO
   */
  const analysisPeriods = {
    ultraShort: history.slice(-10),    // 10 phiên gần nhất
    short: history.slice(-30),         // 30 phiên
    medium: history.slice(-100),       // 100 phiên
    long: history.length >= 500 ? history.slice(-500) : history // Toàn bộ nếu đủ 500 phiên
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
    chanLe: synthesizePrediction('chanLe', analysisLayers),
    tong: predictTong(analysisLayers),
    confidence: calculateConfidence(analysisLayers),
    analysisReport: generateAnalysisReport(analysisLayers)
  };

  return finalPrediction;

  /* * CÁC HÀM HỖ TRỢ CHUYÊN SÂU 
   */
  
  function getWeightedStats(periods) {
    const stats = {};
    const weightProfile = {
      ultraShort: 0.4,
      short: 0.3,
      medium: 0.2,
      long: 0.1
    };
    stats.tongDistribution = {};

    for (const [periodName, data] of Object.entries(periods)) {
      if (!data) continue;
      const weight = weightProfile[periodName];
      const periodStats = { tai: 0, xiu: 0, chan: 0, le: 0, tongDistribution: {} };

      data.forEach((item, index) => {
        const { Tong } = item;
        const isTai = Tong >= 11;
        const isChan = Tong % 2 === 0;
        const itemWeight = weight * (0.5 + 0.5 * (index / data.length));

        if (isTai) periodStats.tai += itemWeight; else periodStats.xiu += itemWeight;
        if (isChan) periodStats.chan += itemWeight; else periodStats.le += itemWeight;
        periodStats.tongDistribution[Tong] = (periodStats.tongDistribution[Tong] || 0) + itemWeight;
      });
      
      for (const key of ['tai', 'xiu', 'chan', 'le']) {
        stats[key] = (stats[key] || 0) + periodStats[key];
      }
      for (const [tong, count] of Object.entries(periodStats.tongDistribution)) {
        stats.tongDistribution[tong] = (stats.tongDistribution[tong] || 0) + count;
      }
    }
    return stats;
  }

  function getStreakAnalysis(data) {
    const analysis = { current: { tai: 0, xiu: 0, chan: 0, le: 0 }, max: { tai: 0, xiu: 0, chan: 0, le: 0 }, averages: { tai: 0, xiu: 0, chan: 0, le: 0 }};
    let lastTaiXiu = null, lastChanLe = null;
    let streakCounts = { tai: [], xiu: [], chan: [], le: [] };
    let currentStreaks = { tai: 0, xiu: 0, chan: 0, le: 0 };
    
    data.forEach(item => {
        const { Tong } = item;
        const isTai = Tong >= 11;
        const isChan = Tong % 2 === 0;

        if (lastTaiXiu !== null && isTai !== lastTaiXiu) {
            streakCounts[lastTaiXiu ? 'tai' : 'xiu'].push(currentStreaks[lastTaiXiu ? 'tai' : 'xiu']);
            currentStreaks.tai = 0; currentStreaks.xiu = 0;
        }
        currentStreaks[isTai ? 'tai' : 'xiu']++;
        lastTaiXiu = isTai;

        if (lastChanLe !== null && isChan !== lastChanLe) {
            streakCounts[lastChanLe ? 'chan' : 'le'].push(currentStreaks[lastChanLe ? 'chan' : 'le']);
            currentStreaks.chan = 0; currentStreaks.le = 0;
        }
        currentStreaks[isChan ? 'chan' : 'le']++;
        lastChanLe = isChan;
    });

    analysis.current = currentStreaks;
    for(const key of ['tai', 'xiu', 'chan', 'le']) {
        const streaks = streakCounts[key];
        analysis.max[key] = streaks.length > 0 ? Math.max(...streaks, analysis.current[key]) : analysis.current[key];
        analysis.averages[key] = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
    }
    return analysis;
  }

  function getPatternAnalysis(data) {
    const patternConfigs = [ { length: 3, minOccurrences: 5 }, { length: 5, minOccurrences: 3 }, { length: 7, minOccurrences: 2 }];
    const patternResults = {};
    patternConfigs.forEach(config => {
      const { length } = config;
      if (data.length < length * 2) return;
      const patterns = {};
      const currentPattern = data.slice(-length).map(e => (e.Tong >= 11 ? 'T' : 'X')).join('');
      for (let i = 0; i <= data.length - length - 1; i++) {
        const pattern = data.slice(i, i + length).map(e => (e.Tong >= 11 ? 'T' : 'X')).join('');
        const outcome = data[i + length].Tong >= 11 ? 'T' : 'X';
        if (!patterns[pattern]) patterns[pattern] = { T: 0, X: 0, occurrences: 0 };
        patterns[pattern][outcome]++;
        patterns[pattern].occurrences++;
      }
      const validPatterns = Object.entries(patterns).filter(([_, stats]) => stats.occurrences >= config.minOccurrences);
      let bestMatch = null, bestScore = 0;
      validPatterns.forEach(([pattern, stats]) => {
        const similarity = calculatePatternSimilarity(currentPattern, pattern);
        const score = similarity * Math.log(stats.occurrences + 1);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { pattern, stats };
        }
      });
      if (bestMatch) {
        patternResults[`length${length}`] = { currentPattern, bestMatch, confidence: bestScore, prediction: bestMatch.stats.T >= bestMatch.stats.X ? 'Tài' : 'Xỉu', probability: bestMatch.stats.T / (bestMatch.stats.T + bestMatch.stats.X) };
      }
    });
    return patternResults;
  }
  
  function detectCycles(data) { return { detected: false, cycleLength: null, confidence: 0 }; }

  function detectAnomalies(data) {
    const tongValues = data.map(item => item.Tong);
    const mean = tongValues.reduce((a, b) => a + b, 0) / tongValues.length;
    const stdDev = Math.sqrt(tongValues.map(n => Math.pow(n - mean, 2)).reduce((a, b) => a + b) / tongValues.length);
    const anomalies = [];
    const zScoreThreshold = 2.5;
    data.forEach((item, index) => {
      if (stdDev > 0) {
          const zScore = Math.abs((item.Tong - mean) / stdDev);
          if (zScore > zScoreThreshold) {
            anomalies.push({ index, tong: item.Tong, zScore, isRecent: index >= data.length - 10 });
          }
      }
    });
    return { count: anomalies.length, recentAnomalies: anomalies.filter(a => a.isRecent), mean, stdDev };
  }

  function getTrendAnalysis(periods) {
      const trends = { taiXiu: { shortTerm: 0, mediumTerm: 0, direction: 'neutral' }, chanLe: { shortTerm: 0, mediumTerm: 0, direction: 'neutral' }};
      const getRatios = (data) => {
          if (!data || data.length === 0) return { taiRatio: 0.5, chanRatio: 0.5 };
          let tai = 0, chan = 0;
          data.forEach(item => {
              if (item.Tong >= 11) tai++;
              if (item.Tong % 2 === 0) chan++;
          });
          return { taiRatio: tai / data.length, chanRatio: chan / data.length };
      };

      const ultraShortStats = getRatios(periods.ultraShort);
      const shortStats = getRatios(periods.short);
      const mediumStats = getRatios(periods.medium);
      
      trends.taiXiu.shortTerm = ultraShortStats.taiRatio - getRatios(periods.short.slice(0, -10)).taiRatio;
      trends.taiXiu.mediumTerm = shortStats.taiRatio - getRatios(periods.medium.slice(0, -30)).taiRatio;

      const trendStrengthTX = (trends.taiXiu.shortTerm || 0) * 0.6 + (trends.taiXiu.mediumTerm || 0) * 0.4;
      if (Math.abs(trendStrengthTX) > 0.05) trends.taiXiu.direction = trendStrengthTX > 0 ? 'up' : 'down';
      
      trends.chanLe.shortTerm = ultraShortStats.chanRatio - getRatios(periods.short.slice(0, -10)).chanRatio;
      trends.chanLe.mediumTerm = shortStats.chanRatio - getRatios(periods.medium.slice(0, -30)).chanRatio;
      
      const trendStrengthCL = (trends.chanLe.shortTerm || 0) * 0.6 + (trends.chanLe.mediumTerm || 0) * 0.4;
      if (Math.abs(trendStrengthCL) > 0.05) trends.chanLe.direction = trendStrengthCL > 0 ? 'up' : 'down';

      return trends;
  }
  
  function synthesizePrediction(type, analysis) {
    const weights = { basicStats: 0.3, streak: 0.25, patterns: 0.2, trends: 0.15, cycles: 0.05, anomalies: 0.05 };
    let score1 = 0, score2 = 0;
    
    if (type === 'taiXiu') {
        score1 += analysis.basicStats.tai * weights.basicStats;
        score2 += analysis.basicStats.xiu * weights.basicStats;
        
        const { current, max, averages } = analysis.streak;
        if(max.tai > 0 && averages.tai > 0) score2 += (0.7 * (current.tai / max.tai) + 0.3 * (current.tai / averages.tai)) * weights.streak;
        if(max.xiu > 0 && averages.xiu > 0) score1 += (0.7 * (current.xiu / max.xiu) + 0.3 * (current.xiu / averages.xiu)) * weights.streak;

        for (const [_, pattern] of Object.entries(analysis.patterns)) {
            if (pattern.prediction === 'Tài') score1 += (pattern.confidence || 0) * weights.patterns;
            else score2 += (pattern.confidence || 0) * weights.patterns;
        }

        if (analysis.trends.taiXiu.direction === 'up') score1 += weights.trends;
        else if (analysis.trends.taiXiu.direction === 'down') score2 += weights.trends;

        return score1 > score2 ? 'Tài' : 'Xỉu';
    } else {
        score1 += analysis.basicStats.chan * weights.basicStats;
        score2 += analysis.basicStats.le * weights.basicStats;
        
        // Tương tự cho Chẵn/Lẻ
        if (analysis.trends.chanLe.direction === 'up') score1 += weights.trends;
        else if (analysis.trends.chanLe.direction === 'down') score2 += weights.trends;
        
        return score1 > score2 ? 'Chẵn' : 'Lẻ';
    }
  }

  function calculatePatternSimilarity(p1, p2) { let m = 0; for (let i = 0; i < p1.length; i++) if (p1[i] === p2[i]) m++; return m / p1.length; }
  
  function predictTong(analysis) {
      const tongDistribution = {};
      for (const [tong, count] of Object.entries(analysis.basicStats.tongDistribution || {})) {
          tongDistribution[tong] = (tongDistribution[tong] || 0) + count * 0.6;
      }
      analysis.anomalies.recentAnomalies.forEach(anomaly => {
          if(tongDistribution[anomaly.tong]) tongDistribution[anomaly.tong] *= 0.5;
      });
      return Object.entries(tongDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tong]) => parseInt(tong));
  }
  
  function calculateConfidence(analysis) {
      let taiXiuConfidence = 0;
      taiXiuConfidence += Math.abs(analysis.basicStats.tai - analysis.basicStats.xiu) / (analysis.basicStats.tai + analysis.basicStats.xiu) * 40;
      const streakRatio = analysis.streak.current.tai > analysis.streak.current.xiu ? analysis.streak.current.tai / (analysis.streak.max.tai || 1) : analysis.streak.current.xiu / (analysis.streak.max.xiu || 1);
      taiXiuConfidence += Math.min(streakRatio, 1) * 25;
      const patternConf = Object.values(analysis.patterns).reduce((sum, p) => sum + (p.confidence || 0), 0);
      taiXiuConfidence += Math.min(patternConf, 1) * 20;
      if (analysis.trends.taiXiu.direction !== 'neutral') taiXiuConfidence += 15;
      
      // Tạm tính confidence Chẵn/Lẻ đơn giản hơn
      const chanLeConfidence = Math.abs(analysis.basicStats.chan - analysis.basicStats.le) / (analysis.basicStats.chan + analysis.basicStats.le) * 70;

      return {
          taiXiu: Math.min(98, Math.round(50 + taiXiuConfidence / 2)),
          chanLe: Math.min(95, Math.round(50 + chanLeConfidence / 2))
      };
  }

  function generateAnalysisReport(analysis) {
      const bestPattern = Object.values(analysis.patterns).sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
      return {
          summary: `Phân tích đa tầng trên ${history.length} phiên.`,
          keyFindings: [
              `Xu hướng Tài/Xỉu: ${analysis.trends.taiXiu.direction}.`,
              `Chuỗi hiện tại: ${analysis.streak.current.tai > analysis.streak.current.xiu ? `Tài ${analysis.streak.current.tai}` : `Xỉu ${analysis.streak.current.xiu}`}.`,
              `Mẫu hình mạnh nhất: ${bestPattern ? `${bestPattern.bestMatch.pattern} -> ${bestPattern.prediction}` : 'Không rõ ràng'}.`,
              analysis.anomalies.recentAnomalies.length > 0 ? 'Có dấu hiệu bất thường gần đây.' : 'Không có bất thường.'
          ],
          recommendations: ["Kết hợp nhiều yếu tố để ra quyết định."]
      };
  }
}

// ==================================================================
//               CÁC BIẾN LƯU TRỮ TRẠNG THÁI
// ==================================================================

// Cấu trúc lưu trữ kết quả mới nhất để hiển thị
let latestResult = {
  id: "@tranbinh012 - @ghetvietcode - @Phucdzvl2222 ",
  Phien: 0,
  Xuc_xac_1: 0,
  Xuc_xac_2: 0,
  Xuc_xac_3: 0,
  Tong: 0,
  Ket_qua: "Chưa có kết quả"
};

// **THAY THẾ**: Lưu lịch sử đầy đủ cho thuật toán Pro Max
let lichSuPhien = []; // Mảng chứa các object { Tong: ... }

let duDoanHienTai = "Chờ phiên mới..."; // Lưu dự đoán cho phiên SẮP TỚI
let ketQuaDuDoan = "Chưa xác định"; // Kết quả của dự đoán TRƯỚC ĐÓ (Đúng/Sai)
let tongDung = 0;
let tongSai = 0;

// ==================================================================
//                      CẤU HÌNH WEBSOCKET
// ==================================================================
const WS_URL = "wss://websocket.atpman.net/websocket";
const HEADERS = {
  "Host": "websocket.atpman.net",
  "Origin": "https://play.789club.sx",
  "User-Agent": "Mozilla/5.0",
};
let lastEventId = 19;
const LOGIN_MESSAGE = [ 1, "MiniGame", "hahaha123123pp", "123123pp", { info: JSON.stringify({ ipAddress: "2402:800:62cd:cb7c:e7d1:59ea:15c1:bc9d", wsToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJhcGk3ODljbHViYmJiIiwiYm90IjowLCJpc01lcmNoYW50IjpmYWxzZSwidmVyaWZpZWRCYW5rQWNjb3VudCI6ZmFsc2UsInBsYXlFdmVudExvYmJ5IjpmYWxzZSwiY3VzdG9tZXJJZCI6NjEyMTc1OTIsImFmZklkIjoiNzg5IiwiYmFubmVkIjpmYWxzZSwiYnJhbmQiOiI3ODkuY2x1YiIsInRpbWVzdGFtcCI6MTc1NDg0NzM4NjMyNywibG9ja0dhbWVzIjpbXSwiYW1vdW50IjowLCJsb2NrQ2hhdCI6ZmFsc2UsInBob25lVmVyaWZpZWQiOmZhbHNlLCJpcEFkZHJlc3MiOiIyNDAyOjgwMDo2MmNkOmNiN2M6ZTdkMTo1OWVhOjE1YzE6YmM5ZCIsIm11dGUiOmZhbHNlLCJhdmF0YXIiOiJodHRwczovL2FwaS54ZXVpLmlvL2ltYWdlcy9hdmF0YXIvYXZhdGFyXzE2LnBuZyIsInBsYXRmb3JtSWQiOjUsInVzZXJJZCI6IjljOTVmMjM2LTg0YzUtNDNjZi1iMmM3LWRhMGVjNmZjMjAyNiIsInJlZ1RpbWUiOjE3NTQ4NDcxMDM3NjMsInBob25lIjoiIiwiZGVwb3NpdCI6ZmFsc2UsInVzZXJuYW1lIjoiUzhfaGFoYWhhMTIzMTIzcHAifQ.D2QzuvfrzW9fDL5IwG_Mn_4iZ788p9FArJaijmAAAU0", locale: "vi", userId: "9c95f236-84c5-43cf-b2c7-da0ec6fc2026", username: "S8_hahaha123123pp", timestamp: 1754847386327, refreshToken: "5002f3a9294a458b8d108ca2ffdbf39a.a8b00ed9aaef411cae936df92997175e" }), signature: "17C76EDBE5DBB274523F28482BBA2591519DFAF671E9134A3BC2F7BA66E452C3D341D4D2278A4399690BEBD2E4BD6714B3BB9AECD96CE133A86F6F77EF4DFD0087311CCAF20520C0F211AF4D1AF51A0F812122B147BC76FF5878D39E6F50142D13D0495284B641027391A4229D15327D3E67403050EE1D4A061B928AA1C693E9" }];
const SUBSCRIBE_TX_RESULT = [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }];
const SUBSCRIBE_LOBBY = [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }];

function connectWebSocket() {
  const ws = new WebSocket(WS_URL, { headers: HEADERS });

  ws.on('open', () => {
    console.log("✅ Đã kết nối WebSocket");
    ws.send(JSON.stringify(LOGIN_MESSAGE));
    setTimeout(() => {
      ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT));
      ws.send(JSON.stringify(SUBSCRIBE_LOBBY));
    }, 1000);
    setInterval(() => ws.send("2"), 10000);
    setInterval(() => ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT)), 30000);
    setInterval(() => ws.send(JSON.stringify([7, "Simms", lastEventId, 0, { id: 0 }])), 15000);
  });

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (Array.isArray(data)) {
        if (data[0] === 7 && data[1] === "Simms" && Number.isInteger(data[2])) {
          lastEventId = data[2];
        }
        
        if (data[1]?.cmd === 2006) {
          const { sid, d1, d2, d3 } = data[1];
          const tong = d1 + d2 + d3;
          const ketquaThucTe = tong >= 11 ? "Tài" : "Xỉu";
          const duDoanTruocDo = duDoanHienTai.split(" ")[0]; // Lấy "Tài" hoặc "Xỉu" từ dự đoán

          // BƯỚC 1: So sánh kết quả thực tế với dự đoán đã lưu
          if (duDoanTruocDo === "Tài" || duDoanTruocDo === "Xỉu") {
            if (ketquaThucTe === duDoanTruocDo) {
              ketQuaDuDoan = "Đúng";
              tongDung++;
            } else {
              ketQuaDuDoan = "Sai";
              tongSai++;
            }
          }
          
          // BƯỚC 2: Cập nhật kết quả mới nhất để hiển thị
          latestResult = {
            id: "@tranbinh012 - @ghetvietcode - @Phucdzvl2222 ",
            Phien: sid,
            Xuc_xac_1: d1,
            Xuc_xac_2: d2,
            Xuc_xac_3: d3,
            Tong: tong,
            Ket_qua: ketquaThucTe
          };

          // BƯỚC 3: Cập nhật LỊCH SỬ PHIÊN cho thuật toán Pro Max
          lichSuPhien.push({ Tong: tong });
          // Giới hạn lịch sử ở 1000 phiên gần nhất để tránh dùng quá nhiều bộ nhớ
          if (lichSuPhien.length > 1000) {
            lichSuPhien.shift(); // Xóa phần tử cũ nhất
          }
          
          // BƯỚC 4: TẠO DỰ ĐOÁN MỚI BẰNG THUẬT TOÁN PRO MAX
          try {
            // Gọi thuật toán để phân tích
            const predictionResult = predictTaiXiuChanLeTongProMax(lichSuPhien);
            // Cập nhật dự đoán mới kèm độ tin cậy
            duDoanHienTai = `${predictionResult.taiXiu} (Độ tin cậy: ${predictionResult.confidence.taiXiu}%)`;
            
            // In báo cáo phân tích chi tiết ra console
            console.log("== Báo cáo Phân tích ==");
            console.log(predictionResult.analysisReport.summary);
            console.log("Phát hiện chính:", predictionResult.analysisReport.keyFindings.join(' | '));
            console.log("=======================");

          } catch (error) {
            // Lỗi này thường xảy ra khi chưa đủ 50 phiên để phân tích
            duDoanHienTai = `Chờ đủ dữ liệu... (${lichSuPhien.length}/50)`;
            console.log("Chưa thể dự đoán:", error.message);
          }

          // Log ra console để theo dõi
          console.log(`--- Phiên #${sid} ---`);
          console.log(`Kết quả: ${ketquaThucTe} (${tong}) - Dự đoán TRƯỚC ĐÓ là: ${ketQuaDuDoan}`);
          console.log(`Thống kê: Đúng ${tongDung} - Sai ${tongSai}`);
          console.log(`==> DỰ ĐOÁN MỚI cho phiên tiếp theo: ${duDoanHienTai}`);
          console.log(`--------------------\n`);
        }
      }
    } catch (err) {
      // Bỏ qua lỗi
    }
  });

  ws.on('close', () => {
    console.log("🔌 WebSocket đóng. Kết nối lại sau 5s...");
    setTimeout(connectWebSocket, 5000);
  });

  ws.on('error', (err) => {
    // Bỏ qua lỗi
  });
}

// HTTP SERVER: Trả về JSON với các thông tin đã được xử lý
const server = http.createServer((req, res) => {
  if (req.url === "/taixiu") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });

    const responsePayload = {
        id: latestResult.id,
        Phien_moi_nhat: latestResult.Phien,
        Ket_qua_phien_moi_nhat: `${latestResult.Ket_qua} (${latestResult.Tong})`,
        Ket_qua_du_doan_truoc: ketQuaDuDoan, 
        So_phien_da_phan_tich: lichSuPhien.length,
        Du_doan_phien_tiep_theo: duDoanHienTai,
        Thong_ke_dung: tongDung,
        Thong_ke_sai: tongSai,
    };
    
    res.end(JSON.stringify(responsePayload, null, 2)); 
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Không tìm thấy - Vui lòng truy cập /taixiu");
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Truy cập http://localhost:${PORT}/taixiu để xem kết quả.`);
  connectWebSocket();
});
