/**
 * @file thuatoan.js
 * @description Tập hợp 3 thuật toán dự đoán Tài/Xỉu vào một hệ thống duy nhất.
 * - AdvancedTaiXiuPredictor (Thuật toán 1): Một framework AI phức tạp với nhiều mô hình con.
 * - TaiXiuPredictor (Thuật toán 2): Một hệ thống phân tích đa tầng với các mô hình thống kê.
 * - HeuristicPredictor (Thuật toán 3): Một hệ thống dựa trên heuristic, phân tích cầu và các mẫu ngắn hạn.
 * - MasterPredictor: Lớp tổng hợp, điều phối cả 3 thuật toán để đưa ra quyết định cuối cùng.
 */

// ===================================================================================
// THUẬT TOÁN 1: ADVANCED AI PREDICTOR (ĐÃ GIẢ LẬP CÁC LỚP PHỤ THUỘC)
// ===================================================================================

// --- Giả lập các lớp phụ thuộc cho Thuật toán 1 để code có thể chạy ---
class MockModel {
    async train(data, options) { return { success: true }; }
    async analyze(data) {
        const pred = Math.random() > 0.5 ? 'T' : 'X';
        const conf = 0.5 + Math.random() * 0.2;
        return { prediction: pred, confidence: conf, modelType: this.constructor.name };
    }
}
class DeepSequencePredictor extends MockModel {}
class HybridAttentionPredictor extends MockModel {}
class QuantumInspiredNetwork extends MockModel {}
class TemporalFusionPredictor extends MockModel {}
class AdvancedProbabilisticModel extends MockModel {}
class AnomalyDetectionEngine { analyze(data, history) { return { count: 0, details: [] }; } }
class RealTimePatternEngine { extract(data, history) { return data.slice(-5); } }
class WeightOptimizationEngine { calculateNewWeights(metrics, weights) { return weights; } }
class CrossModelCorrelation { analyze(analysis) { return { correlation: 0.1 }; } }
class AdvancedTrendEngine { analyze(h, r, p) { return { trend: 'NEUTRAL' }; } }
class SmartEnsembleEngine {
    combinePredictions(analysis, trend, weights, threshold) {
        let taiScore = 0;
        let xiuScore = 0;
        for (const modelName in analysis) {
            if (analysis[modelName] && analysis[modelName].prediction) {
                if (analysis[modelName].prediction === 'T') {
                    taiScore += analysis[modelName].confidence * (weights[modelName] || 0.2);
                } else {
                    xiuScore += analysis[modelName].confidence * (weights[modelName] || 0.2);
                }
            }
        }
        const total = taiScore + xiuScore;
        const finalPred = taiScore > xiuScore ? 'T' : 'X';
        const finalConf = total > 0 ? Math.max(taiScore, xiuScore) / total : 0;
        return { recommendation: finalPred, confidence: finalConf };
    }
}
class PredictionStability { assess(pred, history) { return 'STABLE'; } }
class PerformanceMetricsEngine { calculate(preds) { return { accuracy: 0.5 }; } }

class AdvancedTaiXiuPredictor {
    constructor() {
        this.historicalData = [];
        this.realTimeData = [];
        this.metaData = { lastUpdate: null, dataQuality: 1.0, anomalyCount: 0 };
        this.models = this.initializeAdvancedModels();
        this.performanceMetrics = { accuracy: 0, precision: 0, recall: 0, last10Predictions: [] };
        this.config = {
            dataWindow: 500,
            predictionThreshold: 0.72,
            adaptiveLearningRate: 0.01,
            ensembleWeights: this.calculateInitialWeights()
        };
    }
    initializeAdvancedModels() {
        return {
            deepSequenceModel: new DeepSequencePredictor(),
            hybridAttentionModel: new HybridAttentionPredictor(),
            quantumInspiredNetwork: new QuantumInspiredNetwork(),
            temporalFusionModel: new TemporalFusionPredictor(),
            probabilisticGraphicalModel: new AdvancedProbabilisticModel()
        };
    }
    calculateInitialWeights() {
        return {
            deepSequenceModel: 0.28,
            hybridAttentionModel: 0.25,
            quantumInspiredNetwork: 0.22,
            temporalFusionModel: 0.15,
            probabilisticGraphicalModel: 0.10
        };
    }
    async updateData(newData) {
        try {
            const processedData = this.preprocessData(newData);
            const anomalyReport = this.detectAnomalies(processedData);
            this.metaData.anomalyCount += anomalyReport.count;
            this.updateDataQuality(anomalyReport);
            this.historicalData = [...this.historicalData, ...processedData].slice(-this.config.dataWindow);
            this.realTimeData = this.extractRealTimePatterns(processedData);
            await this.adaptiveModelTraining();
            this.metaData.lastUpdate = new Date();
            return { success: true };
        } catch (error) {
            console.error("Algo1 Data update failed:", error);
            return { success: false, error: error.message };
        }
    }
    preprocessData(data) {
        return data.map(item => {
            const upper = String(item).toUpperCase();
            if (upper === 'TAI' || upper === 'TÀI' || upper === 'T') return 'T';
            if (upper === 'XIU' || upper === 'XỈU' || upper === 'X') return 'X';
            return null;
        }).filter(Boolean);
    }
    detectAnomalies(data) {
        if (this.historicalData.length < 15) return { count: 0, details: [] }; // THAY ĐỔI: 50 -> 15
        return new AnomalyDetectionEngine().analyze(data, this.historicalData);
    }
    updateDataQuality(anomalyReport) {
        if (this.historicalData.length === 0) return;
        const anomalyRatio = anomalyReport.count / this.historicalData.length;
        this.metaData.dataQuality = Math.max(0.1, 1 - (anomalyRatio * 2));
    }
    extractRealTimePatterns(data) {
        return new RealTimePatternEngine().extract(data, this.historicalData);
    }
    async adaptiveModelTraining() {
        const trainingData = { historical: this.historicalData, realTime: this.realTimeData, meta: this.metaData };
        const trainingPromises = Object.values(this.models).map(model =>
            model.train(trainingData, this.config.adaptiveLearningRate)
        );
        await Promise.all(trainingPromises);
        this.adjustModelWeights();
    }
    adjustModelWeights() {
        this.config.ensembleWeights = new WeightOptimizationEngine().calculateNewWeights(
            this.performanceMetrics, this.config.ensembleWeights
        );
    }
    async predict() {
        try {
            // THAY ĐỔI: Giảm ngưỡng dữ liệu yêu cầu từ 50 xuống 15
            if (this.historicalData.length < 15) {
                return { recommendation: null, confidence: 0, error: "Insufficient data" };
            }
            const analysisResults = await this.multilayerAnalysis();
            const trendAnalysis = this.advancedTrendAnalysis();
            const finalPrediction = this.ensemblePrediction(analysisResults, trendAnalysis);
            this.recordPredictionPerformance(finalPrediction);
            return {
                ...finalPrediction,
                stability: this.checkPredictionStability(finalPrediction),
            };
        } catch (error) {
            return { recommendation: null, confidence: 0, error: error.message };
        }
    }
    async multilayerAnalysis() {
        const analysis = {};
        const analysisPromises = Object.entries(this.models).map(async ([name, model]) => {
            analysis[name] = await model.analyze({ historical: this.historicalData, realTime: this.realTimeData });
        });
        await Promise.all(analysisPromises);
        analysis.crossModel = new CrossModelCorrelation().analyze(analysis);
        return analysis;
    }
    advancedTrendAnalysis() {
        return new AdvancedTrendEngine().analyze(this.historicalData, this.realTimeData, this.performanceMetrics);
    }
    ensemblePrediction(analysis, trend) {
        return new SmartEnsembleEngine().combinePredictions(analysis, trend, this.config.ensembleWeights, this.config.predictionThreshold);
    }
    checkPredictionStability(prediction) {
        if (this.performanceMetrics.last10Predictions.length < 5) return 'initializing';
        return new PredictionStability().assess(prediction, this.performanceMetrics.last10Predictions);
    }
    recordPredictionPerformance(prediction) {
        this.performanceMetrics.last10Predictions = [...this.performanceMetrics.last10Predictions.slice(-9), prediction];
    }
}

// ===================================================================================
// THUẬT TOÁN 2: MULTI-LAYER ANALYSIS PREDICTOR
// ===================================================================================

class StatisticalModel {
    constructor() { this.taiProb = 0.5; }
    train(data) { this.taiProb = data.filter(x => x === 'T').length / data.length; }
    analyze(data) {
        const last10 = data.slice(-10);
        const shortTermProb = last10.length > 0 ? last10.filter(x => x === 'T').length / last10.length : 0.5;
        const combinedProb = (this.taiProb * 0.6) + (shortTermProb * 0.4);
        return {
            prediction: combinedProb > 0.5 ? 'T' : 'X',
            confidence: Math.abs(combinedProb - 0.5) * 2,
        };
    }
}
class TimeSeriesModel {
    constructor() { this.patterns = {}; }
    train(data) {
        const patterns = {};
        const len = 3;
        for (let i = 0; i < data.length - len; i++) {
            const p = data.slice(i, i + len).join('');
            const next = data[i + len];
            if (!patterns[p]) patterns[p] = { T: 0, X: 0 };
            patterns[p][next]++;
        }
        for (const p in patterns) {
            const total = patterns[p].T + patterns[p].X;
            patterns[p].T /= total;
            patterns[p].X /= total;
        }
        this.patterns = patterns;
    }
    analyze(data) {
        const len = 3;
        if (data.length < len) return { prediction: null, confidence: 0 };
        const lastPattern = data.slice(-len).join('');
        const pData = this.patterns[lastPattern];
        if (!pData) return { prediction: null, confidence: 0 };
        return {
            prediction: pData.T > pData.X ? 'T' : 'X',
            confidence: Math.max(pData.T, pData.X),
        };
    }
}
class NeuralNetwork { // Mock-up
    analyze(data) {
        const recentData = data.slice(-20);
        if (recentData.length === 0) return { prediction: null, confidence: 0 };
        const ratio = recentData.filter(x => x === 'T').length / recentData.length;
        const score = 0.5 - ratio; // Mean reversion
        const prob = 0.5 + score * 0.5;
        return {
            prediction: prob > 0.5 ? 'T' : 'X',
            confidence: Math.abs(score),
        };
    }
    train(data) {}
}
class BayesianModel {
    constructor() { this.priorTai = 0.5; this.conditionalProbs = {}; }
    train(data) {
        this.priorTai = data.filter(x => x === 'T').length / data.length;
    }
    analyze(data) {
        if (data.length < 2) return { prediction: null, confidence: 0 };
        const last = data[data.length - 1];
        const probT = last === 'T' ? 0.48 : 0.52;
        return {
            prediction: probT > 0.5 ? 'T' : 'X',
            confidence: Math.abs(probT - 0.5) * 2,
        };
    }
}

class TaiXiuPredictor {
    constructor() {
        this.history = [];
        this.trendWindow = 10;
        this.models = {
            statistical: new StatisticalModel(),
            timeSeries: new TimeSeriesModel(),
            neural: new NeuralNetwork(),
            bayesian: new BayesianModel()
        };
    }
    preprocessData(data) {
        return data.map(item => {
            const upper = String(item).toUpperCase();
            if (upper === 'TAI' || upper === 'TÀI' || upper === 'T') return 'T';
            if (upper === 'XIU' || upper === 'XỈU' || upper === 'X') return 'X';
            return null;
        }).filter(Boolean);
    }
    updateData(newResults) {
        const processed = this.preprocessData(newResults);
        this.history = [...this.history, ...processed].slice(-1000);
        this.trainModels();
    }
    trainModels() {
        if (this.history.length < 15) return; // THAY ĐỔI: 50 -> 15
        Object.values(this.models).forEach(model => model.train(this.history));
    }
    multilayerAnalysis() {
        const results = {};
        for (const name in this.models) {
            results[name] = this.models[name].analyze(this.history);
        }
        return results;
    }
    predict() {
        if (this.history.length < 15) return { prediction: null, confidence: 0 }; // THAY ĐỔI: 50 -> 15
        const analysis = this.multilayerAnalysis();
        const predictions = Object.values(analysis);

        let taiWeight = 0, xiuWeight = 0, totalConfidence = 0;
        predictions.forEach(p => {
            if (p.prediction) {
                const weight = p.confidence;
                totalConfidence += weight;
                if (p.prediction === 'T') taiWeight += weight;
                else xiuWeight += weight;
            }
        });

        if (totalConfidence === 0) return { prediction: null, confidence: 0 };
        const taiProb = taiWeight / totalConfidence;
        const xiuProb = xiuWeight / totalConfidence;
        return {
            prediction: taiProb > xiuProb ? 'T' : 'X',
            confidence: Math.max(taiProb, xiuProb),
        };
    }
}

// ===================================================================================
// THUẬT TOÁN 3: HEURISTIC & PATTERN PREDICTOR (CẤU TRÚC LẠI THÀNH CLASS)
// ===================================================================================

class HeuristicPredictor {
    constructor() {
        this.history = []; // Lưu trữ { result: 'Tài'/'Xỉu', session: number, totalScore: number }
        this.modelPredictions = {};
    }
    
    updateData(newResults) {
        const formatted = newResults.map((res, i) => ({
            result: ['T', 'TÀI', 'TAI'].includes(String(res).toUpperCase()) ? 'Tài' : 'Xỉu',
            session: this.history.length + i + 1,
            totalScore: Math.floor(Math.random() * 18) + 3
        }));
        this.history = [...this.history, ...formatted];
    }

    detectStreakAndBreak(history) {
        if (!history.length) return { streak: 0, currentResult: null, breakProb: 0.0 };
        let streak = 1;
        const currentResult = history[history.length - 1].result;
        for (let i = history.length - 2; i >= 0; i--) {
            if (history[i].result === currentResult) streak++;
            else break;
        }
        let breakProb = streak >= 6 ? 0.8 : (streak >= 4 ? 0.5 : 0.2);
        return { streak, currentResult, breakProb };
    }

    smartBridgeBreak(history) {
        if (history.length < 5) return { prediction: 0, breakProb: 0.0 };
        const { streak, currentResult, breakProb } = this.detectStreakAndBreak(history);
        let prediction = breakProb > 0.5 ? (currentResult === 'Tài' ? 2 : 1) : (currentResult === 'Tài' ? 1 : 2);
        return { prediction, breakProb };
    }
    
    aiHtddLogic(history) {
        if(history.length === 0) return { prediction: 'Tài' };
        const { streak, currentResult } = this.detectStreakAndBreak(history);
        if (streak >= 2 && streak <= 4) return { prediction: currentResult };
        if (history.length >= 3) {
            const last3 = history.slice(-3).map(h => h.result);
            if (last3.join(',') === 'Tài,Xỉu,Tài') return { prediction: 'Xỉu' };
            if (last3.join(',') === 'Xỉu,Tài,Xỉu') return { prediction: 'Tài' };
        }
        return { prediction: history[history.length - 1].result === 'Tài' ? 'Xỉu' : 'Tài' };
    }

    predict() {
        if (this.history.length < 5) return { prediction: null, confidence: 0.5 };

        const bridgePred = this.smartBridgeBreak(this.history);
        const aiPred = this.aiHtddLogic(this.history);

        let taiScore = 0, xiuScore = 0;
        const weights = { bridge: 0.6, ai: 0.4 };

        if (bridgePred.prediction === 1) taiScore += weights.bridge;
        else if (bridgePred.prediction === 2) xiuScore += weights.bridge;
        
        if (aiPred.prediction === 'Tài') taiScore += weights.ai;
        else xiuScore += weights.ai;
        
        const finalPrediction = taiScore > xiuScore ? 'Tài' : 'Xỉu';
        const totalScore = taiScore + xiuScore;
        const confidence = totalScore > 0 ? Math.max(taiScore, xiuScore) / totalScore : 0.5;

        return {
            prediction: finalPrediction.startsWith('T') ? 'T' : 'X',
            confidence: confidence,
        };
    }
}

// ===================================================================================
// MASTER PREDICTOR: LỚP TỔNG HỢP CẢ 3 THUẬT TOÁN
// ===================================================================================
class MasterPredictor {
    constructor() {
        this.history = [];
        this.predictor1 = new AdvancedTaiXiuPredictor();
        this.predictor2 = new TaiXiuPredictor();
        this.predictor3 = new HeuristicPredictor();

        this.weights = {
            p1: 0.4, 
            p2: 0.3, 
            p3: 0.3
        };
    }
    
    async updateData(newData) {
        // Bỏ console.log để đỡ rối log
        this.history = [...this.history, ...newData];
        await Promise.all([
            this.predictor1.updateData(newData),
            this.predictor2.updateData(newData),
            this.predictor3.updateData(newData)
        ]);
    }

    normalizePrediction(pred, source) {
        if (!pred || pred.prediction === null) {
             return { prediction: null, confidence: 0, source };
        }
        let result = (pred.prediction || pred.recommendation || '').toUpperCase();
        if(result.startsWith('T')) result = 'T';
        else if(result.startsWith('X')) result = 'X';
        else return { prediction: null, confidence: 0, source };
        return { prediction: result, confidence: pred.confidence || 0.5, source };
    }

    async predict() {
        // THAY ĐỔI: Giảm ngưỡng dữ liệu yêu cầu từ 50 xuống 15
        if (this.history.length < 15) {
            const message = `Không đủ dữ liệu (${this.history.length}/15). Cần thêm dữ liệu để dự đoán.`;
            return { prediction: null, confidence: 0, reason: message };
        }

        const [res1, res2, res3] = await Promise.all([
            this.predictor1.predict(),
            this.predictor2.predict(),
            this.predictor3.predict()
        ]);
        
        const p1 = this.normalizePrediction(res1, 'AdvancedAI');
        const p2 = this.normalizePrediction(res2, 'MultiLayer');
        const p3 = this.normalizePrediction(res3, 'Heuristic');

        let taiScore = 0;
        let xiuScore = 0;
        
        if (p1.prediction === 'T') taiScore += p1.confidence * this.weights.p1;
        else if (p1.prediction === 'X') xiuScore += p1.confidence * this.weights.p1;
        
        if (p2.prediction === 'T') taiScore += p2.confidence * this.weights.p2;
        else if (p2.prediction === 'X') xiuScore += p2.confidence * this.weights.p2;
        
        if (p3.prediction === 'T') taiScore += p3.confidence * this.weights.p3;
        else if (p3.prediction === 'X') xiuScore += p3.confidence * this.weights.p3;

        const finalPrediction = taiScore > xiuScore ? 'Tài' : 'Xỉu';
        const totalScore = taiScore + xiuScore;
        const confidence = totalScore > 0 ? Math.max(taiScore, xiuScore) / totalScore : 0.5;

        const reason = `Tổng hợp điểm: Tài (${taiScore.toFixed(3)}) - Xỉu (${xiuScore.toFixed(3)}).`;
        
        return {
            prediction: finalPrediction,
            confidence: confidence,
            reason: reason,
            details: { p1, p2, p3 }
        };
    }
}

// THÊM ĐOẠN NÀY VÀO CUỐI FILE
module.exports = {
    MasterPredictor,
    AdvancedTaiXiuPredictor,
    TaiXiuPredictor,
    HeuristicPredictor
};
