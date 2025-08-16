// server.js

const http = require('http');
const WebSocket = require('ws');
const { MasterPredictor } = require('./thuatoan.js');

const PORT = process.env.PORT || 10000;

// ==================================================================
//               CÁC BIẾN LƯU TRỮ TRẠNG THÁI
// ==================================================================
const predictor = new MasterPredictor();

let latestResult = {
  id: "@tranbinh012 - @ghetvietcode - @Phucdzvl2222 ",
  Phien: 0,
  Xuc_xac_1: 0,
  Xuc_xac_2: 0,
  Xuc_xac_3: 0,
  Tong: 0,
  Ket_qua: "Chưa có kết quả"
};
let lichSuPhien = [];

// --- Biến quản lý logic dự đoán ---
let lastPrediction = "Chờ phiên mới..."; 
let nextPrediction = "Chờ dữ liệu...";   
let nextConfidence = "0%";               

// --- Biến kết quả và thống kê ---
let predictionStatus = "Chưa xác định";
let tongDung = 0;
let tongSai = 0;

// <<< THÊM BIẾN CHO CHẾ ĐỘ "LẬT KÈO" >>>
let consecutiveLosses = 0;
let isReversedMode = false;


// ==================================================================
//                      CẤU HÌNH WEBSOCKET
// ==================================================================
const WS_URL = "wss://websocket.atpman.net/websocket";
const HEADERS = { "Host": "websocket.atpman.net", "Origin": "https://play.789club.sx", "User-Agent": "Mozilla/5.0" };
let lastEventId = 19;
const LOGIN_MESSAGE = [1,"MiniGame","nayfeenhaaa","0000000",{"info":"{\"ipAddress\":\"2402:800:62cd:89d4:376f:3070:4802:64d\",\"wsToken\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJmcmVlZWVkY21tbSIsImJvdCI6MCwiaXNNZXJjaGFudCI6ZmFsc2UsInZlcmlmaWVkQmFua0FjY291bnQiOmZhbHNlLCJwbGF5RXZlbnRMb2JieSI6ZmFsc2UsImN1c3RvbWVySWQiOjYxMzI4ODkwLCJhZmZJZCI6Ijc4OSIsImJhbm5lZCI6ZmFsc2UsImJyYW5kIjoiNzg5LmNsdWIiLCJ0aW1lc3RhbXAiOjE3NTUxMjMwODg3NTUsImxvY2tHYW1lcyI6W10sImFtb3VudCI6MCwibG9ja0NoYXQiOmZhbHNlLCJwaG9uZVZlcmlmaWVkIjpmYWxzZSwiaXBBZGRyZXNzIjoiMjQwMjo4MDA6NjJjZDo4OWQ0OjM3NmY6MzA3MDo0ODAyOjY0ZCIsIm11dGUiOmZhbHNlLCJhdmF0YXIiOiJodHRwczovL2FwaS54ZXVpLmlvL2ltYWdlcy9hdmF0YXIvYXZhdGFyXzE1LnBuZyIsInBsYXRmb3JtSWQiOjUsInVzZXJJZCI6IjcyYmYxN2MzLTZiNmMtNDFiYS05NDZkLTE0NzM2MDc1YmUzOSIsInJlZ1RpbWUiOjE3NTUxMjMwMTY4MzQsInBob25lIjoiIiwiZGVwb3NpdCI6ZmFsc2UsInVzZXJuYW1lIjoiUzhfbmF5ZmVlbmhhYWEifQ.G87s0hd6LbjnhnVCkE-rLhwp99yAwZz3bFFLQRBAa00\",\"locale\":\"vi\",\"userId\":\"72bf17c3-6b6c-41ba-946d-14736075be39\",\"username\":\"S8_nayfeenhaaa\",\"timestamp\":1755123088755,\"refreshToken\":\"261eff9b6a054297bb89a8b611c0a30d.8f57c6cbaf2747d1ad43c54adda4c7a3\"}","signature":"2C5D7D15933E5702E3C9820DCBC4879C393F7B84FB1C2B456ECAF2F4E0E5625399ECD7953336C39B5BB09A9655A79C3E45819D1A6818C5ED8A99E9F7EA7FD619B271792D7D619AA701BFC62BB8DA3F67354CAC3B9E7A9C7C4E42EE86812849780FE855FD10FE680D8593478B9C47AC0B78B81124BA2DBCEC1282CB34ACF85DE8"}];
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

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      if (!Array.isArray(data)) return;

      if (data[0] === 7 && data[1] === "Simms" && Number.isInteger(data[2])) {
        lastEventId = data[2];
      }

      if (data[1]?.cmd === 2006) {
        const { sid, d1, d2, d3 } = data[1];
        const tong = d1 + d2 + d3;
        const ketQuaThucTe = tong >= 11 ? "Tài" : "Xỉu";

        // <<< SỬA LỖI & THÊM LOGIC MỚI BẮT ĐẦU TỪ ĐÂY >>>

        // 1. So sánh kết quả phiên vừa rồi VỚI dự đoán đã đưa ra trước đó
        const coDuDoanTruocDo = lastPrediction !== "Chờ phiên mới..." && lastPrediction !== "Chờ dữ liệu...";
        
        if (coDuDoanTruocDo) {
          if (ketQuaThucTe === lastPrediction) {
            predictionStatus = "Đúng";
            tongDung++;
            consecutiveLosses = 0; // Reset khi thắng
            isReversedMode = false; // Tắt lật kèo khi thắng
          } else {
            predictionStatus = "Sai";
            tongSai++;
            consecutiveLosses++; // Tăng bộ đếm khi thua
          }
          console.log(`--- Phiên #${sid}: ${ketQuaThucTe} (${tong}) | Dự đoán: ${lastPrediction} => KẾT QUẢ: ${predictionStatus}`);
          console.log(`--- Thống kê: ${tongDung} Đúng - ${tongSai} Sai | Chuỗi thua: ${consecutiveLosses}`);

          // Kiểm tra và cập nhật chế độ "Lật Kèo"
          if (consecutiveLosses === 2 && !isReversedMode) {
            isReversedMode = true;
            console.log("🔥🔥🔥 Gãy 2 tay! Bật chế độ LẬT KÈO.");
          } else if (consecutiveLosses === 3 && isReversedMode) {
            isReversedMode = false;
            consecutiveLosses = 0; // Reset sau khi gãy 3
            console.log("💣💣💣 Gãy 3 tay! Tắt LẬT KÈO, quay về chế độ thường.");
          }

        } else {
          predictionStatus = "Bắt đầu"; // Trạng thái cho phiên đầu tiên
          console.log(`--- Phiên #${sid}: ${ketQuaThucTe} (${tong}) | Bắt đầu chuỗi dự đoán...`);
        }

        // 2. Cập nhật trạng thái và lịch sử
        latestResult = { id: "@tranbinh012 - @ghetvietcode - @Phucdzvl2222 ", Phien: sid, Xuc_xac_1: d1, Xuc_xac_2: d2, Xuc_xac_3: d3, Tong: tong, Ket_qua: ketQuaThucTe };
        lichSuPhien.unshift(ketQuaThucTe);
        if (lichSuPhien.length > 1000) { lichSuPhien.pop(); }

        // 3. Cập nhật thuật toán và lấy dự đoán GỐC
        await predictor.updateData([ketQuaThucTe]);
        const predictionResult = await predictor.predict();

        let originalPrediction;
        if (predictionResult && predictionResult.prediction) {
          originalPrediction = predictionResult.prediction;
          nextConfidence = `${(predictionResult.confidence * 100).toFixed(0)}%`;
        } else {
          originalPrediction = predictionResult.reason || "Chờ đủ dữ liệu...";
          nextConfidence = "0%";
        }

        // 4. Áp dụng logic "Lật Kèo" nếu cần và chốt dự đoán cuối cùng
        if (isReversedMode) {
            nextPrediction = originalPrediction === 'Tài' ? 'Xỉu' : 'Tài';
            console.log(`   🎲 Lật kèo: Thuật toán đoán '${originalPrediction}' => Chốt hạ '${nextPrediction}'`);
        } else {
            nextPrediction = originalPrediction;
        }
        
        // 5. Lưu lại dự đoán cuối cùng để so sánh ở phiên tiếp theo
        lastPrediction = nextPrediction;

        // <<< KẾT THÚC PHẦN SỬA LỖI & LOGIC MỚI >>>

        console.log(`==> DỰ ĐOÁN PHIÊN TỚI: ${nextPrediction} (Độ tin cậy: ${nextConfidence})\n--------------------`);
      }
    } catch (err) { /* Bỏ qua lỗi */ }
  });

  ws.on('close', () => { console.log("🔌 WebSocket đóng. Kết nối lại sau 5s..."); setTimeout(connectWebSocket, 5000); });
  ws.on('error', (err) => { /* Bỏ qua lỗi */ });
}


// ==================================================================
//            HTTP SERVER - TRẢ VỀ JSON (KHÔNG THAY ĐỔI)
// ==================================================================
const server = http.createServer((req, res) => {
  if (req.url === "/scam") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });

    const patternString = lichSuPhien.slice(0, 20).map(p => p.startsWith('T') ? 'T' : 'X').join('');

    const newPayload = {
      "id": "@tranbinh012 - @ghetvietcode - @Phucdzvl2222 ",
      "Phien": latestResult.Phien,
      "Xuc_xac_1": latestResult.Xuc_xac_1,
      "Xuc_xac_2": latestResult.Xuc_xac_2,
      "Xuc_xac_3": latestResult.Xuc_xac_3,
      "Tong": latestResult.Tong,
      "Ket_qua": latestResult.Ket_qua,
      "Pattern": patternString,
      "Du_doan": nextPrediction,
      "Do_tin_cay": nextConfidence, 
      "ket_qua_du_doan": predictionStatus,
      "tong_dung": tongDung,
      "tong_sai": tongSai
    };

    res.end(JSON.stringify(newPayload, null, 2));

  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Không tìm thấy - Vui lòng truy cập /scam");
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Truy cập http://localhost:${PORT}/scam để xem kết quả.`);
  connectWebSocket();
});
