const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static('public'));

// ADMIN EMAIL SOZLAMASI
const ADMIN_EMAIL = "javohirjon0508@gmail.com";

// JINOYATLAR BAZASI (Dastlab bo'sh turadi, Admin panel orqali to'ldiriladi)
let cases = [];
let players = {};

io.on('connection', (socket) => {
  console.log('⚡ Detektiv ulandi ID:', socket.id);

  // Foydalanuvchi Google orqali kirganda
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
      xp: userData.xp || 0,
      isAdmin: isAdmin
    };

    // Foydalanuvchiga mavjud jinoyatlarni yuborish
    socket.emit('auth-success', {
      user: players[socket.id],
      cases: cases.filter(c => c.level <= players[socket.id].level)
    });

    io.emit('update-players', Object.values(players));
  });

  // ADMIN PANEL: Yangi Jinoyat Ishi qo'shish (Formadan kelgan obyekt)
  socket.on('admin-create-case', (newCaseData) => {
    const player = players[socket.id];
    if (player && player.isAdmin) {
      newCaseData.id = cases.length + 1;
      cases.push(newCaseData); // Baza elementiga saqlash

      // Barcha o'yinchilar ekranini real-vaqtda yangilash
      Object.keys(players).forEach(sId => {
        io.to(sId).emit('cases-updated', cases.filter(c => c.level <= players[sId].level));
      });
      
      socket.emit('admin-action-result', { success: true, message: "Yangi jinoyat ishi muvaffaqiyatli chop etildi!" });
    }
  });

  // Tergov xulosasini tekshirish
  socket.on('submit-final-verdict', ({ caseId, guiltySuspectId, selectedEvidences }) => {
    const player = players[socket.id];
    const targetCase = cases.find(c => c.id === parseInt(caseId));

    if (!targetCase || !player) return;

    const isGuiltyCorrect = targetCase.finalVerdict?.guiltySuspectId === guiltySuspectId;

    if (isGuiltyCorrect) {
      player.level += 1;
      player.xp += 500;
      socket.emit('verdict-result', { success: true, newLevel: player.level });
      io.emit('update-players', Object.values(players));
    } else {
      socket.emit('verdict-result', { success: false, message: "Noto'g me'moriy xulosa! Gumondor yoki dalillar xato." });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('update-players', Object.values(players));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`DETEKTIV SERVER ISHLAMOQDA: PORT ${PORT}`));
