const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Rasm fayllarini (Base64) qabul qilish uchun hajmni 50MB ga oshiramiz
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 // Large file buffer
});

let gameState = {
    title: 'JINOIY ISH #001: TUNGI SOYALAR',
    timerSeconds: 7200,
    isTimerRunning: true,
    dangerLevel: 15,
    evidences: [],
    messages: [],
    terminalCommands: {
        'ping 192.168.1.45': 'LOCAL_IP: Ulanish o\'rnatildi.',
        'help': 'Mavjud buyruqlar: status, ping, logs, scan'
    }
};

// Onlayn o'yinchilar bazasi { socketId: nickname }
let activePlayers = {};

setInterval(() => {
    if (gameState.isTimerRunning && gameState.timerSeconds > 0) {
        gameState.timerSeconds--;
        io.emit('timer_update', { seconds: gameState.timerSeconds, isRunning: gameState.isTimerRunning });
    }
}, 1000);

io.on('connection', (socket) => {
    // 1. O'yinchi Nickname bilan ro'yxatdan o'tishi
    socket.on('register_player', (nickname) => {
        const cleanNick = nickname ? nickname.trim() : 'Anonim_' + socket.id.substr(0,4);
        activePlayers[socket.id] = cleanNick;
        
        // O'yinchiga xush kelibsiz ma'lumoti
        socket.emit('init_state', gameState);
        
        // Admin pultiga onlayn o'yinchilar ro'yxatini yangilab yuborish
        io.emit('update_online_players', activePlayers);
    });

    // 2. Chat
    socket.on('send_message', (data) => {
        const msg = {
            user: activePlayers[socket.id] || data.user || 'Anonim',
            text: data.text,
            time: new Date().toLocaleTimeString(),
            role: data.role || 'player'
        };
        gameState.messages.push(msg);
        io.emit('new_message', msg);
    });

    // 3. Admin: Shaxsiy Xabar Yuborish (Private DM)
    socket.on('admin_send_private_msg', (data) => {
        // targetSocketId bo'yicha faqat bitta o'yinchiga yuborish
        io.to(data.targetSocketId).emit('private_message', {
            from: data.from || 'ADMIN (MAXFIY BIRIKTIRMA)',
            text: data.text
        });
    });

    // 4. Admin: Rasm / Media Dalil Yuborish
    socket.on('admin_release_evidence', (evidence) => {
        gameState.evidences.push(evidence);
        io.emit('new_evidence', evidence);
    });

    // 5. Terminal
    socket.on('run_command', (cmd) => {
        const cleanCmd = cmd.toLowerCase().trim();
        const response = gameState.terminalCommands[cleanCmd] || "BUYRUQ TANIQSIZ. 'help' deb yozing.";
        socket.emit('command_response', { cmd, response });
        io.emit('admin_terminal_log', { user: activePlayers[socket.id], cmd });
    });

    // 6. Admin Taymer & Danger
    socket.on('admin_control_timer', (data) => {
        if (data.action === 'toggle') gameState.isTimerRunning = !gameState.isTimerRunning;
        if (data.action === 'add') gameState.timerSeconds += data.seconds;
        io.emit('timer_update', { seconds: gameState.timerSeconds, isRunning: gameState.isTimerRunning });
    });

    socket.on('admin_set_danger', (level) => {
        gameState.dangerLevel = level;
        io.emit('danger_update', level);
    });

    socket.on('admin_start_new_case', (data) => {
        gameState.title = data.title;
        gameState.timerSeconds = data.seconds || 7200;
        gameState.evidences = [];
        gameState.messages = [];
        io.emit('reset_game', gameState);
    });

    // O'yinchi chiqqanda
    socket.on('disconnect', () => {
        delete activePlayers[socket.id];
        io.emit('update_online_players', activePlayers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
