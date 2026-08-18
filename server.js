const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// mmconst ADMIN_EMAIL = "javohirjon0508@gmail.com";

// Xotiradagi ma'lumotlar (Firebase / DB ga saqlash uchun tayyor struktura)
let cases = [
  {
    id: 1,
    level: 1,
    title: "1-JINOYAT ISHI: Birinchi iz",
    desc: "Shahar serverida shubhali harakatlar kuzatildi. Maxfiy kodni toping.",
    answer: "1234",
    image: ""
  }
];

let players = {};

io.on('connection', (socket) => {

  // O'yinchi kurganda (Google Auth ma'lumotlari bilan)
  socket.on('player-login', (userData) => {
    const isAdmin = (userData.email === ADMIN_EMAIL);
    players[socket.id] = {
      id: socket.id,
      uid: userData.uid,
      name: userData.displayName || "Detektiv",
      email: userData.email,
      photo: userData.photoURL,
      level: userData.level || 1,
      isAdmin: isAdmin
    };

    socket.emit('auth-success', {
      user: players[socket.id],
      cases: getAvailableCases(players[socket.id].level)
    });

    io.emit('update-players', Object.values(players));
  });

  // Level bo'yicha ochiq jinoyatlarni olish
  function getAvailableCases(playerLevel) {
    return cases.filter(c => c.level <= playerLevel);
  }

  // Javobni tekshirish
  socket.on('submit-answer', ({ caseId, answer }) => {
    const player = players[socket.id];
    const currentCase = cases.find(c => c.id === caseId);

    if (currentCase && currentCase.answer.trim().toLowerCase() === answer.trim().toLowerCase()) {
      if (player.level <= currentCase.level) {
        player.level += 1;
      }
      socket.emit('answer-result', {
        success: true,
        newLevel: player.level,
        cases: getAvailableCases(player.level)
      });
      io.emit('update-players', Object.values(players));
    } else {
      socket.emit('answer-result', { success: false, message: "Kiritilgan kod xato!" });
    }
  });

  // ADMIN: Yangi jinoyat ishini qo'shish
  socket.on('add-case', (caseData) => {
    const player = players[socket.id];
    if (player && player.isAdmin) {
      const newCase = {
        id: cases.length + 1,
        level: parseInt(caseData.level),
        title: caseData.title,
        desc: caseData.desc,
        answer: caseData.answer,
        image: caseData.image || ""
      };
      cases.push(newCase);
      io.emit('cases-updated');
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('update-players', Object.values(players));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ishlamoqda: http://localhost:${PORT}`);
});
