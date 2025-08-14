// thuatoan.js

/**
 * =================================================================
 * === CẤU HÌNH THUẬT TOÁN (TT) ===
 * Dễ dàng tinh chỉnh các thông số tại đây
 * =================================================================
 */
const CONFIG = {
    // Ngưỡng quyết định
    BREAK_PROB_THRESHOLD: 0.55, // Ngưỡng xác suất để quyết định bẻ cầu
    BAD_PATTERN_SWITCHES: 7,    // Số lần chuyển đổi trong 15 phiên để coi là cầu xấu
    BAD_PATTERN_STREAK: 6,      // Độ dài cầu bệt để coi là cầu xấu

    // Trọng số các mô hình (Tổng nên gần bằng 1.0)
    WEIGHTS: {
        AI_HTDD: 0.40,          // Trọng số cho mô hình AI logic cứng
        SMART_BRIDGE: 0.35,     // Trọng số cho mô hình bẻ/theo cầu thông minh
        TREND: 0.15,            // Trọng số cho mô hình xu hướng dài hạn
        SHORT_PATTERN: 0.10,    // Trọng số cho mô hình cầu ngắn
    },

    // Hệ số điều chỉnh
    PERFORMANCE_BOOST: 0.2,     // Mức tăng/giảm trọng số dựa trên hiệu suất
    STREAK_FOLLOW_BOOST: 0.15,  // Mức thưởng thêm khi theo cầu bệt (streak >= 3)
    BAD_PATTERN_PENALTY: 0.6,   // Mức phạt (nhân với) khi phát hiện cầu xấu
};

// =================================================================
// === CÁC MÔ HÌNH DỰ ĐOÁN PHỤ TRỢ (HELPERS) ===
// =================================================================

// --- Phân tích Lịch sử & Cầu (Streak) ---
function analyzeHistory(history) {
    if (!history || history.length === 0) {
        return { streak: 0, currentResult: null, taiCount: 0, xiuCount: 0 };
    }
    const currentResult = history[history.length - 1].result;
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].result === currentResult) {
            streak++;
        } else {
            break;
        }
    }
    const taiCount = history.filter(h => h.result === 'Tài').length;
    const xiuCount = history.length - taiCount;

    return { streak, currentResult, taiCount, xiuCount };
}


// --- Mô hình 1: AI HTDD (Logic cứng) ---
function model_aiHtdd(history, analysis) {
    const { streak, currentResult } = analysis;
    const historyLen = history.length;
    const recentHistory = history.slice(-5).map(h => h.result);
    
    // Ưu tiên các quy tắc cầu rõ ràng
    if (streak >= 2 && streak <= 4) {
        return { prediction: currentResult, reason: `AI phát hiện cầu bệt ngắn (${streak}), ưu tiên theo cầu.` };
    }
    if (historyLen >= 4) {
        const last4 = history.slice(-4).map(h => h.result).join(',');
        if (last4 === 'Tài,Tài,Xỉu,Xỉu') return { prediction: 'Tài', reason: 'AI nhận diện cầu 2-2, dự đoán lặp lại.' };
        if (last4 === 'Xỉu,Xỉu,Tài,Tài') return { prediction: 'Xỉu', reason: 'AI nhận diện cầu 2-2, dự đoán lặp lại.' };
    }
    if (historyLen >= 3) {
        const last3 = history.slice(-3).map(h => h.result).join(',');
        if (last3 === 'Tài,Xỉu,Tài') return { prediction: 'Xỉu', reason: 'AI nhận diện cầu 1-1, dự đoán xen kẽ.' };
        if (last3 === 'Xỉu,Tài,Xỉu') return { prediction: 'Tài', reason: 'AI nhận diện cầu 1-1, dự đoán xen kẽ.' };
    }

    // Quy tắc bẻ cầu khi quá dài
    if (streak >= 7) {
        const opposite = currentResult === 'Tài' ? 'Xỉu' : 'Tài';
        return { prediction: opposite, reason: `AI nhận thấy cầu bệt quá dài (${streak}), ưu tiên bẻ cầu.` };
    }
    
    // Quy tắc cuối cùng: Dựa trên chênh lệch tổng thể
    const { taiCount, xiuCount } = analysis;
    if (taiCount > xiuCount) {
        return { prediction: 'Xỉu', reason: 'AI phân tích tổng thể Tài đang nhiều hơn, dự đoán Xỉu để cân bằng.' };
    } else {
        return { prediction: 'Tài', reason: 'AI phân tích tổng thể Xỉu đang nhiều hơn, dự đoán Tài để cân bằng.' };
    }
}


// --- Mô hình 2: Bẻ/Theo Cầu Thông Minh ---
function model_smartBridge(history, analysis) {
    const { streak, currentResult } = analysis;
    let breakProb = 0.5; // Xác suất cơ bản

    if (streak >= 6) {
        breakProb = 0.85;
    } else if (streak >= 4) {
        breakProb = 0.65;
    } else if (streak <= 2) {
        breakProb = 0.35; // Cầu ngắn thì ít bẻ hơn
    }
    
    const prediction = breakProb > CONFIG.BREAK_PROB_THRESHOLD ? (currentResult === 'Tài' ? 'Xỉu' : 'Tài') : currentResult;
    const action = breakProb > CONFIG.BREAK_PROB_THRESHOLD ? 'Bẻ cầu' : 'Theo cầu';
    const reason = `Cầu thông minh: Chuỗi ${streak} -> ${action} (xác suất bẻ: ${(breakProb * 100).toFixed(0)}%).`;

    return { prediction, reason };
}

// --- Mô hình 3: Xu Hướng Dài Hạn ---
function model_trend(history) {
    const last15 = history.slice(-15).map(h => h.result);
    if (last15.length < 15) return { prediction: null };

    const taiCount = last15.filter(r => r === 'Tài').length;
    const prediction = taiCount > 7 ? 'Tài' : 'Xỉu';
    return { prediction, reason: `Xu hướng 15 phiên gần nhất nghiêng về ${prediction}.` };
}

// --- Mô hình 4: Cầu Ngắn ---
function model_shortPattern(history) {
    const last5 = history.slice(-5).map(h => h.result);
    if (last5.length < 5) return { prediction: null };
    // Mẫu 1-2-1-2...
    if (last5[0] === last5[2] && last5[1] === last5[3] && last5[0] !== last5[1]) {
        return { prediction: last5[2], reason: `Cầu ngắn: Phát hiện cầu xen kẽ 1-2.` };
    }
    // Mẫu 2-2...
    if (last5[0] === last5[1] && last5[2] === last5[3] && last5[1] !== last5[2]) {
        return { prediction: last5[3], reason: `Cầu ngắn: Phát hiện cầu 2-2.` };
    }
    return { prediction: null };
}

// --- Kiểm tra cầu xấu ---
function isBadPattern(history, analysis) {
    const { streak } = analysis;
    if (streak >= CONFIG.BAD_PATTERN_STREAK) return true;

    const last15 = history.slice(-15).map(h => h.result);
    if (last15.length < 15) return false;
    
    const switches = last15.slice(1).reduce((count, curr, idx) => count + (curr !== last15[idx] ? 1 : 0), 0);
    return switches >= CONFIG.BAD_PATTERN_SWITCHES;
}


/**
 * =================================================================
 * === HÀM CHÍNH ĐỂ DỰ ĐOÁN ===
 * Hàm này sẽ được gọi bởi server.js
 * =================================================================
 */
function analyzeAndPredict(fullGameHistory) {
    // Sử dụng mảng history từ server.js
    const history = fullGameHistory;

    // --- Bước 1: Kiểm tra điều kiện đầu vào ---
    if (!history || history.length < 5) {
        return {
            du_doan: "?",
            ty_le_thanh_cong: "0%",
            giai_thich: "Chưa đủ dữ liệu (cần > 5 phiên) để phân tích."
        };
    }

    // --- Bước 2: Phân tích lịch sử cơ bản ---
    const analysis = analyzeHistory(history);

    // --- Bước 3: Chạy các mô hình dự đoán ---
    const predAI = model_aiHtdd(history, analysis);
    const predBridge = model_smartBridge(history, analysis);
    const predTrend = model_trend(history);
    const predShort = model_shortPattern(history);

    // --- Bước 4: Tính điểm cho Tài và Xỉu dựa trên trọng số ---
    let taiScore = 0;
    let xiuScore = 0;
    
    const models = [
        { name: 'AI_HTDD', pred: predAI.prediction, weight: CONFIG.WEIGHTS.AI_HTDD },
        { name: 'SMART_BRIDGE', pred: predBridge.prediction, weight: CONFIG.WEIGHTS.SMART_BRIDGE },
        { name: 'TREND', pred: predTrend.prediction, weight: CONFIG.WEIGHTS.TREND },
        { name: 'SHORT_PATTERN', pred: predShort.prediction, weight: CONFIG.WEIGHTS.SHORT_PATTERN },
    ];

    models.forEach(model => {
        if (model.pred === 'Tài') {
            taiScore += model.weight;
        } else if (model.pred === 'Xỉu') {
            xiuScore += model.weight;
        }
    });

    // --- Bước 5: Áp dụng các hệ số điều chỉnh ---
    // Thưởng điểm khi theo cầu bệt ổn định
    if (analysis.streak >= 3 && predBridge.prediction === analysis.currentResult) {
        if (analysis.currentResult === 'Tài') {
            taiScore += CONFIG.STREAK_FOLLOW_BOOST;
        } else {
            xiuScore += CONFIG.STREAK_FOLLOW_BOOST;
        }
    }
    
    // Phạt điểm nếu phát hiện cầu xấu
    if (isBadPattern(history, analysis)) {
        taiScore *= CONFIG.BAD_PATTERN_PENALTY;
        xiuScore *= CONFIG.BAD_PATTERN_PENALTY;
    }

    // --- Bước 6: Đưa ra quyết định cuối cùng ---
    const finalPrediction = taiScore > xiuScore ? 'Tài' : 'Xỉu';
    const totalScore = taiScore + xiuScore;
    const confidence = totalScore > 0 ? (Math.max(taiScore, xiuScore) / totalScore) * 100 : 50;

    // Chọn lý do giải thích từ mô hình có ảnh hưởng nhất
    const mainReason = taiScore > xiuScore ? predAI.reason : predBridge.reason;

    return {
        du_doan: finalPrediction,
        ty_le_thanh_cong: `${confidence.toFixed(0)}%`,
        giai_thich: mainReason,
    };
}

// Export hàm chính để server.js có thể sử dụng
module.exports = analyzeAndPredict;

