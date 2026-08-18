const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// O'yin holati (Game State)
let gameState = {
    timerSeconds: 172800, // 48 soat
    timerRunning: false,
    evidences: [],
    terminalCommands: {
        'ping 192.168.1.45': 'LOCAL_IP: Connection established. Device: OFIS_SERVER_MAIN',
        'help': 'Mavjud buyruqlar: status, ping, logs, decrypt',
        'status': 'Tergov holati: FAOLLASHGAN. Vaqt orqaga hisoblanmoqda.'
    }
};

// WebSocket Ulanishi
io.on('connection', (socket) => {
    console.log('Yangi o\'yinchi ulandi:', socket.id);

    // Dastlabki holatni yuborish
    socket.emit('init_state', gameState);

    // Chat xabarlarini qabul qilish
    socket.on('send_message', (data) => {
        io.emit('new_message', {
            user: data.user || 'Anonim Detektiv',
            text: data.text,
            time: new Date().toLocaleTimeString(),
            role: data.role || 'player'
        });
    });

    // Terminal buyruqlarini tekshirish
    socket.on('run_command', (cmd) => {
        const response = gameState.terminalCommands[cmd.toLowerCase().trim()] || "BUYRUQ TANIQSIZ. 'help' yozib ko'ring.";
        socket.emit('command_response', { cmd, response });
    });

    // ADMIN: Yangi dalil chiqarish
    socket.on('admin_release_evidence', (evidence) => {
        gameState.evidences.push(evidence);
        io.emit('new_evidence', evidence);
    });

    // ADMIN: Taymerni boshqarish
    socket.on('admin_toggle_timer', (status) => {
        gameState.timerRunning = status;
        io.emit('timer_status', status);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Tenebris ARG Server http://localhost:${PORT} da ishga tushdi`);
});