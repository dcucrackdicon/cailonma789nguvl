const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

// Cấu trúc lưu trữ kết quả mới nhất
let latestResult = {
  id: "@tranbinh012 - @ghetvietcode - @Phucdzvl2222 ",
  Phien: 0,
  Xuc_xac_1: 0,
  Xuc_xac_2: 0,
  Xuc_xac_3: 0,
  Tong: 0,
  Ket_qua: "Chưa có kết quả"
};

// Lưu lịch sử kết quả T/X tối đa 20 lần
let patternHistory = "";

// ==================================================================
// THÊM MỚI: CÁC BIẾN ĐỂ LƯU TRỮ TRẠNG THÁI DỰ ĐOÁN VÀ THỐNG KÊ
// ==================================================================
let duDoanHienTai = "Chờ phiên mới..."; // Lưu dự đoán cho phiên SẮP TỚI
let ketQuaDuDoan = "Chưa xác định"; // Kết quả của dự đoán TRƯỚC ĐÓ (Đúng/Sai)
let tongDung = 0;
let tongSai = 0;
// ==================================================================


// Cập nhật patternHistory
function updatePatternHistory(result) {
  if (patternHistory.length >= 20) {
    patternHistory = patternHistory.slice(1);
  }
  patternHistory += result;
}

// PHẦN DỰ ĐOÁN (Giữ nguyên logic của bạn)
function predictNextFromPattern(history) {
  if (history.length < 3) return "Chờ đủ dữ liệu...";
  const randomBase = new Date().getMilliseconds() % 2 === 0;
  const isNextTai = !randomBase;
  return isNextTai ? "Tài" : "Xỉu";
}


const WS_URL = "wss://websocket.atpman.net/websocket";
const HEADERS = {
  "Host": "websocket.atpman.net",
  "Origin": "https://play.789club.sx",
  "User-Agent": "Mozilla/5.0",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "vi-VN,vi;q=0.9",
  "Pragma": "no-cache",
  "Cache-Control": "no-cache"
};

let lastEventId = 19;

const LOGIN_MESSAGE = [
  1, "MiniGame", "hahaha123123pp", "123123pp",
  {
    info: JSON.stringify({
      ipAddress: "2402:800:62cd:cb7c:e7d1:59ea:15c1:bc9d",
      wsToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJhcGk3ODljbHViYmJiIiwiYm90IjowLCJpc01lcmNoYW50IjpmYWxzZSwidmVyaWZpZWRCYW5rQWNjb3VudCI6ZmFsc2UsInBsYXlFdmVudExvYmJ5IjpmYWxzZSwiY3VzdG9tZXJJZCI6NjEyMTc1OTIsImFmZklkIjoiNzg5IiwiYmFubmVkIjpmYWxzZSwiYnJhbmQiOiI3ODkuY2x1YiIsInRpbWVzdGFtcCI6MTc1NDg0NzM4NjMyNywibG9ja0dhbWVzIjpbXSwiYW1vdW50IjowLCJsb2NrQ2hhdCI6ZmFsc2UsInBob25lVmVyaWZpZWQiOmZhbHNlLCJpcEFkZHJlc3MiOiIyNDAyOjgwMDo2MmNkOmNiN2M6ZTdkMTo1OWVhOjE1YzE6YmM5ZCIsIm11dGUiOmZhbHNlLCJhdmF0YXIiOiJodHRwczovL2FwaS54ZXVpLmlvL2ltYWdlcy9hdmF0YXIvYXZhdGFyXzE2LnBuZyIsInBsYXRmb3JtSWQiOjUsInVzZXJJZCI6IjljOTVmMjM2LTg0YzUtNDNjZi1iMmM3LWRhMGVjNmZjMjAyNiIsInJlZ1RpbWUiOjE3NTQ4NDcxMDM3NjMsInBob25lIjoiIiwiZGVwb3NpdCI6ZmFsc2UsInVzZXJuYW1lIjoiUzhfaGFoYWhhMTIzMTIzcHAifQ.D2QzuvfrzW9fDL5IwG_Mn_4iZ788p9FArJaijmAAAU0",
      locale: "vi",
      userId: "9c95f236-84c5-43cf-b2c7-da0ec6fc2026",
      username: "S8_hahaha123123pp",
      timestamp: 1754847386327,
      refreshToken: "5002f3a9294a458b8d108ca2ffdbf39a.a8b00ed9aaef411cae936df92997175e"
    }),
    signature: "17C76EDBE5DBB274523F28482BBA2591519DFAF671E9134A3BC2F7BA66E452C3D341D4D2278A4399690BEBD2E4BD6714B3BB9AECD96CE133A86F6F77EF4DFD0087311CCAF20520C0F211AF4D1AF51A0F812122B147BC76FF5878D39E6F50142D13D0495284B641027391A4229D15327D3E67403050EE1D4A061B928AA1C693E9"
  }
];

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
        
        // ==================================================================
        // SỬA ĐỔI LOGIC: Xử lý dữ liệu, so sánh dự đoán và tạo dự đoán mới
        // ==================================================================
        if (data[1]?.cmd === 2006) {
          const { sid, d1, d2, d3 } = data[1];
          const tong = d1 + d2 + d3;
          const ketquaThucTe = tong >= 11 ? "Tài" : "Xỉu";

          // BƯỚC 1: So sánh kết quả thực tế với dự đoán đã lưu trước đó
          if (duDoanHienTai !== "Chờ phiên mới..." && duDoanHienTai !== "Chờ đủ dữ liệu...") {
            if (ketquaThucTe === duDoanHienTai) {
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

          // BƯỚC 3: Cập nhật chuỗi lịch sử (pattern)
          const resultTX = ketquaThucTe === "Tài" ? 't' : 'x';
          updatePatternHistory(resultTX);
          
          // BƯỚC 4: Tạo dự đoán MỚI cho phiên TIẾP THEO và lưu lại
          duDoanHienTai = predictNextFromPattern(patternHistory);

          // Log ra console để theo dõi
          console.log(`--- Phiên #${sid} ---`);
          console.log(`Kết quả: ${ketquaThucTe} (${tong}) - Dự đoán là: ${ketQuaDuDoan}`);
          console.log(`Thống kê: Đúng ${tongDung} - Sai ${tongSai}`);
          console.log(`==> Dự đoán cho phiên tiếp theo: ${duDoanHienTai}`);
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

// SỬA ĐỔI HTTP SERVER: Trả về JSON với định dạng mới
const server = http.createServer((req, res) => {
  if (req.url === "/taixiu") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });

    // Tạo đối tượng payload để trả về theo đúng định dạng yêu cầu
    const responsePayload = {
        id: latestResult.id,
        Phien: latestResult.Phien,
        Xuc_xac_1: latestResult.Xuc_xac_1,
        Xuc_xac_2: latestResult.Xuc_xac_2,
        Xuc_xac_3: latestResult.Xuc_xac_3,
        Tong: latestResult.Tong,
        Ket_qua: latestResult.Ket_qua,
        result: ketQuaDuDoan, // <-- TRƯỜNG MỚI: Kết quả của dự đoán cho phiên vừa rồi
        Pattern: patternHistory,
        Du_doan: duDoanHienTai, // Dự đoán cho phiên sắp tới
        "Đúng": tongDung, // <-- TRƯỜNG MỚI: Tổng số lần đúng
        "Sai": tongSai,   // <-- TRƯỜNG MỚI: Tổng số lần sai
    };
    
    // Dùng null, 2 để JSON trả về được định dạng đẹp, dễ đọc
    res.end(JSON.stringify(responsePayload, null, 2)); 
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Không tìm thấy");
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Truy cập http://localhost:${PORT}/taixiu để xem kết quả.`);
  connectWebSocket();
});
