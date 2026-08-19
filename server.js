const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static('public'));

// ADMIN EMAIL
const ADMIN_EMAIL = "javohirjon0508@gmail.com";

// JINOYAT ISHLARI BAZASI
let cases = [];
let players = {};

io.on('connection', (socket) => {
  console.log('⚡ Detektiv ulandi ID:', socket.id);

  // 1. O'YINCHI TIZIMGA KIRGANDA (Firebase Auth orqali)
  socket.on('player-login', (userData) => {
    if (!userData || !userData.email) return;

    const isAdmin = (userData.email === ADMIN_EMAIL);

    players[socket.id] = {
      id: socket.id,
      uid: userData.uid,
      name: userData.displayName || "Detektiv",
      email: userData.email,
      photo: userData.photoURL || "https://via.placeholder.com/40",
      level: userData.level || 1,
      isAdmin: isAdmin
    };

    // Muvaffaqiyatli avtorizatsiya va mos darajadagi jinoyatlarni yuborish
    socket.emit('auth-success', {
      user: players[socket.id],
      cases: cases.filter(c => parseInt(c.level) <= players[socket.id].level)
    });
  });

  // 2. ADMIN PANEL: JINOYAT QO'SHISH (index.html dagi addCase() uchun)
  socket.on('add-case', (newCase) => {
    const player = players[socket.id];
    
    if (player && player.isAdmin) {
      const caseItem = {
        id: Date.now(),
        level: parseInt(newCase.level) || 1,
        title: newCase.title,
        desc: newCase.desc,
        answer: newCase.answer.trim().toLowerCase()
      };

      cases.push(caseItem);

      // Barcha ulangan foydalanuvchilarga darajasiga mos ravishda tarqatish
      Object.keys(players).forEach(sId => {
        io.to(sId).emit('auth-success', {
          user: players[sId],
          cases: cases.filter(c => parseInt(c.level) <= players[sId].level)
        });
      });
    }
  });

  // 3. JAVOBNI TEKSHIRISH (index.html dagi submitAnswer() uchun)
  socket.on('submit-answer', ({ caseId, answer }) => {
    const player = players[socket.id];
    const targetCase = cases.find(c => c.id === caseId);

    if (!player || !targetCase) return;

    const userAnswer = answer.trim().toLowerCase();

    if (userAnswer === targetCase.answer) {
      player.level += 1;

      // Foydalanuvchiga muvaffaqiyatli javob va yangi darajadagi ishlarni qaytarish
      socket.emit('answer-result', {
        success: true,
        newLevel: player.level,
        cases: cases.filter(c => parseInt(c.level) <= player.level)
      });
    } else {
      socket.emit('answer-result', {
        success: false,
        message: "Noto'g'ri kod/javob! Qaytadan urinib ko'ring."
      });
    }
  });

  // ULANISH UZILGANDA
  socket.on('disconnect', () => {
    delete players[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DETEKTIV SERVER ISHLAMOQDA: PORT ${PORT}`);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Statik fayllarni ulash
app.use(express.static(path.join(__dirname, './')));
app.use('/admin', express.static(path.join(__dirname, './admin')));

// Boshlang'ich ma'lumotlar bazasi (xotirada)
let cases = [
  {
    id: "case_01",
    title: "TENEBRIS // QORA KOD",
    level: 1,
    imageUrl: "assets/images/case1.jpg",
    desc: "Bosh server xonasiga ruxsatsiz kirilgan va ma'lumotlar shifrlangan.",
    suspects: [{ name: "Alex V.", alibi: "Server xonasi kaliti faqat unda bor edi" }],
    timeline: ["22:00 - Tizim uzildi", "22:15 - Loglar o'chirildi"],
    answer: "alex"
  }
];

io.on('connection', (socket) => {
  // Foydalanuvchi ulaganda mavjud keyslarni yuborish
  socket.emit('cases-updated', cases);

  // Admin yangi case qo'shganda
  socket.on('admin-add-case', (newCase) => {
    cases.push({ id: 'case_' + Date.now(), ...newCase });
    io.emit('cases-updated', cases);
  });

  // Bitta case so'ralganda
  socket.on('get-case-detail', (id) => {
    const found = cases.find(c => c.id === id);
    socket.emit('case-detail-data', found || null);
  });
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Statik fayllarni ulash
app.use(express.static(path.join(__dirname, './')));
app.use('/admin', express.static(path.join(__dirname, './admin')));

// Boshlang'ich ma'lumotlar bazasi (xotirada)
let cases = [
  {
    id: "case_01",
    title: "TENEBRIS // QORA KOD",
    level: 1,
    imageUrl: "assets/images/case1.jpg",
    desc: "Bosh server xonasiga ruxsatsiz kirilgan va ma'lumotlar shifrlangan.",
    suspects: [{ name: "Alex V.", alibi: "Server xonasi kaliti faqat unda bor edi" }],
    timeline: ["22:00 - Tizim uzildi", "22:15 - Loglar o'chirildi"],
    answer: "alex"
  }
];

io.on('connection', (socket) => {
  // Foydalanuvchi ulaganda mavjud keyslarni yuborish
  socket.emit('cases-updated', cases);

  // Admin yangi case qo'shganda
  socket.on('admin-add-case', (newCase) => {
    cases.push({ id: 'case_' + Date.now(), ...newCase });
    io.emit('cases-updated', cases);
  });

  // Bitta case so'ralganda
  socket.on('get-case-detail', (id) => {
    const found = cases.find(c => c.id === id);
    socket.emit('case-detail-data', found || null);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Tenebris Server running on port ${PORT}`));
