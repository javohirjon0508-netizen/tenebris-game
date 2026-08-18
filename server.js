const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Baza (Tarix saqlanishi uchun)
let gameState = {
    title: 'JINOIY ISH #001: TUNGI SOYALAR',
    timerSeconds: 172800,
    evidences: [],
    messages: [],
    terminalCommands: {
        'ping 192.168.1.45': 'LOCAL_IP: Ulanish o\'rnatildi. Server: OFIS_MAIN',
        'help': 'Mavjud buyruqlar: status, ping, logs, scan',
        'status': 'Tergov holati: FAOLLASHGAN. Barcha dalillar arxivlanmoqda.'
    }
};

io.on('connection', (socket) => {
    // Qayta kirgan o'yinchiga BARCHA TARIXNI yuborish
    socket.emit('init_state', gameState);

    // Chat xabari
    socket.on('send_message', (data) => {
        const msg = {
            user: data.user || 'Anonim Detektiv',
            text: data.text,
            time: new Date().toLocaleTimeString(),
            role: data.role || 'player'
        };
        gameState.messages.push(msg); // Tarixga saqlash
        io.emit('new_message', msg);
    });

    // Terminal
    socket.on('run_command', (cmd) => {
        const response = gameState.terminalCommands[cmd.toLowerCase().trim()] || "BUYRUQ TANIQSIZ. 'help' yozing.";
        socket.emit('command_response', { cmd, response });
    });

    // ADMIN: Yangi Media Dalil (Rasm, Audio, Matn)
    socket.on('admin_release_evidence', (evidence) => {
        gameState.evidences.push(evidence); // Tarixga saqlash
        io.emit('new_evidence', evidence);
    });

    // ADMIN: Yangi Jinoyat Boshlash (Tarixni tozalash)
    socket.on('admin_start_new_case', (data) => {
        gameState.title = data.title;
        gameState.evidences = [];
        gameState.messages = [];
        io.emit('reset_game', gameState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));