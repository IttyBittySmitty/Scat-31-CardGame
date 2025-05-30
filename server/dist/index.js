"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
// Security middleware
app.use((0, helmet_1.default)());
// CORS and JSON parsing
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../../client/build/index.html'));
    });
}
app.get('/', (req, res) => res.send('Backend is running!'));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err.stack || err);
    res.status(500).send('Something broke!');
});
const game = {
    players: new Map(),
    deck: [],
    discardPile: [],
    currentPlayer: null,
    status: 'waiting',
    firstTurn: false,
    firstPlayerId: null,
    knockerId: null,
    knockActive: false,
    drawnThisTurn: false,
    gamePhase: 'firstTurn',
};
function calculateHandScore(cards) {
    if (cards.length !== 3)
        return 0;
    // Check for three of a kind
    if (cards[0].face === cards[1].face && cards[1].face === cards[2].face) {
        return 30.5;
    }
    // Group by suit and sum
    const suitSums = {};
    for (const card of cards) {
        suitSums[card.suit] = (suitSums[card.suit] || 0) + card.value;
    }
    return Math.max(...Object.values(suitSums));
}
function checkForAutomaticWin(player) {
    return calculateHandScore(player.cards) === 31;
}
function handleAutomaticWin(winnerId) {
    const winner = game.players.get(winnerId);
    if (!winner)
        return;
    // All other players lose a life
    for (const [playerId, player] of game.players.entries()) {
        if (playerId !== winnerId) {
            player.lives--;
            if (player.lives <= 0) {
                game.players.delete(playerId);
            }
        }
    }
    // Check if game should end (only one player remaining)
    if (game.players.size <= 1) {
        game.status = 'ended';
        io.emit('gameEnded', {
            winner: winner.name,
            players: Array.from(game.players.values())
        });
    }
    else {
        // Start a new round
        initializeDeck();
        dealCards();
        game.currentPlayer = Array.from(game.players.keys())[0];
        io.emit('roundStarted', {
            players: Array.from(game.players.values()),
            currentPlayer: game.currentPlayer
        });
    }
}
function updateAllPlayerScores() {
    for (const player of game.players.values()) {
        player.score = calculateHandScore(player.cards);
    }
}
// Helper to log game state
function logGameState() {
    console.log('[GAME STATE]', JSON.stringify({
        players: Array.from(game.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            lives: p.lives,
            turnCount: p.turnCount,
            canDraw: p.canDraw,
            canKnock: p.canKnock,
            isKnockee: p.isKnockee,
            cards: p.cards.length // Only show card count for privacy
        })),
        currentPlayer: game.currentPlayer,
        gamePhase: game.gamePhase,
        discardPileTop: game.discardPile[game.discardPile.length - 1],
    }, null, 2));
}
// Socket.IO connection handling
io.on('connection', (socket) => {
    socket.onAny((event, ...args) => {
        console.log(`[SERVER] Event: ${event}`, ...args);
    });
    console.log('Player connected:', socket.id);
    socket.on('joinGame', (playerName) => {
        try {
            if (game.players.size >= 10) {
                socket.emit('error', 'Game is full');
                return;
            }
            const player = {
                id: socket.id,
                name: playerName,
                cards: [],
                score: 0,
                lives: 3,
                turnCount: 0,
                canKnock: false,
                canDraw: false,
            };
            game.players.set(socket.id, player);
            io.emit('playerJoined', { id: socket.id, name: playerName });
            if (game.players.size >= 2 && game.status === 'waiting') {
                startGame();
            }
        }
        catch (err) {
            console.error('Error in joinGame:', err);
            socket.emit('error', 'An error occurred while joining the game.');
        }
    });
    socket.on('drawCard', (fromDeck) => {
        try {
            const player = game.players.get(socket.id);
            if (!player || game.currentPlayer !== socket.id || game.status !== 'playing') {
                socket.emit('error', 'Not your turn or game not in progress.');
                return;
            }
            if (game.gamePhase === 'knockActive' && socket.id === game.knockerId) {
                socket.emit('error', 'You have already knocked and cannot draw.');
                return;
            }
            if (!player.canDraw) {
                socket.emit('error', 'You cannot draw at this time.');
                return;
            }
            const drawnCard = fromDeck ? game.deck.pop() : game.discardPile.pop();
            if (!drawnCard) {
                socket.emit('error', 'No card to draw.');
                return;
            }
            player.cards.push(drawnCard);
            updateAllPlayerScores();
            game.drawnThisTurn = true;
            // After drawing, disallow further draw/knock this turn
            player.canDraw = false;
            player.canKnock = false;
            // Check for automatic win
            if (checkForAutomaticWin(player)) {
                handleAutomaticWin(socket.id);
                return;
            }
            io.emit('cardDrawn', {
                playerId: socket.id,
                card: drawnCard,
                fromDeck
            });
            // Emit full state after draw
            io.emit('gameState', {
                players: Array.from(game.players.values()),
                currentPlayer: game.currentPlayer,
                gamePhase: game.gamePhase,
                discardPileTop: game.discardPile[game.discardPile.length - 1],
            });
            logGameState();
        }
        catch (err) {
            console.error('Error in drawCard:', err);
            socket.emit('error', 'An error occurred while drawing a card.');
        }
    });
    socket.on('discardCard', (cardIndex) => {
        var _a;
        try {
            const player = game.players.get(socket.id);
            if (!player || game.currentPlayer !== socket.id || game.status !== 'playing') {
                socket.emit('error', 'Not your turn or game not in progress.');
                return;
            }
            if (game.gamePhase === 'knockActive' && socket.id === game.knockerId) {
                socket.emit('error', 'You have already knocked and cannot discard.');
                return;
            }
            if (cardIndex < 0 || cardIndex >= player.cards.length) {
                socket.emit('error', 'Invalid card index.');
                return;
            }
            const discardedCard = player.cards.splice(cardIndex, 1)[0];
            game.discardPile.push(discardedCard);
            updateAllPlayerScores();
            // Move to next player
            if (game.gamePhase === 'firstTurn') {
                game.gamePhase = 'preKnock';
            }
            advanceTurn();
            // If knock is active and it's the knocker's turn again, end the round
            if (game.gamePhase === 'knockActive' && game.currentPlayer === game.knockerId) {
                // End round logic: find lowest score, lose a life, start new round
                let lowestScore = Infinity;
                let loserId = null;
                for (const [pid, p] of game.players.entries()) {
                    const score = calculateHandScore(p.cards);
                    if (score < lowestScore) {
                        lowestScore = score;
                        loserId = pid;
                    }
                }
                if (loserId) {
                    const loser = game.players.get(loserId);
                    if (loser) {
                        loser.lives--;
                        if (loser.lives <= 0) {
                            game.players.delete(loserId);
                        }
                    }
                }
                // Start new round or end game
                if (game.players.size <= 1) {
                    game.status = 'ended';
                    io.emit('gameEnded', {
                        winner: (_a = Array.from(game.players.values())[0]) === null || _a === void 0 ? void 0 : _a.name,
                        players: Array.from(game.players.values())
                    });
                }
                else {
                    initializeDeck();
                    dealCards();
                    game.currentPlayer = Array.from(game.players.keys())[0];
                    game.firstTurn = true;
                    game.firstPlayerId = game.currentPlayer;
                    game.knockerId = null;
                    game.knockActive = false;
                    game.gamePhase = 'firstTurn';
                    for (const p of game.players.values()) {
                        p.canKnock = false;
                        p.canDraw = false;
                        p.isKnockee = false;
                    }
                    io.emit('roundStarted', {
                        players: Array.from(game.players.values()),
                        currentPlayer: game.currentPlayer,
                        firstTurn: game.firstTurn,
                        topDeckCard: game.deck[game.deck.length - 1],
                        gamePhase: game.gamePhase,
                    });
                }
                return;
            }
            io.emit('cardDiscarded', {
                playerId: socket.id,
                card: discardedCard,
                nextPlayer: game.currentPlayer,
                players: Array.from(game.players.values()),
                discardPileTop: game.discardPile[game.discardPile.length - 1],
                gamePhase: game.gamePhase,
            });
            // Emit full state after discard
            io.emit('gameState', {
                players: Array.from(game.players.values()),
                currentPlayer: game.currentPlayer,
                gamePhase: game.gamePhase,
                discardPileTop: game.discardPile[game.discardPile.length - 1],
            });
            logGameState();
        }
        catch (err) {
            console.error('Error in discardCard:', err);
            socket.emit('error', 'An error occurred while discarding a card.');
        }
    });
    socket.on('peekTopCard', () => {
        if (game.firstTurn && game.currentPlayer === socket.id) {
            socket.emit('peekTopCard', { card: game.deck[game.deck.length - 1] });
        }
    });
    socket.on('keepTopCard', () => {
        if (game.firstTurn && game.currentPlayer === socket.id) {
            const player = game.players.get(socket.id);
            const topCard = game.deck.pop();
            if (player && topCard) {
                player.cards.push(topCard);
                updateAllPlayerScores();
                game.firstTurn = false;
                game.drawnThisTurn = true;
                // After keeping, disallow further knock/draw this turn
                player.canDraw = false;
                player.canKnock = false;
                io.emit('topCardKept', {
                    playerId: socket.id,
                    card: topCard,
                    players: Array.from(game.players.values()),
                });
                // Emit full state after keep
                io.emit('gameState', {
                    players: Array.from(game.players.values()),
                    currentPlayer: game.currentPlayer,
                    gamePhase: game.gamePhase,
                    discardPileTop: game.discardPile[game.discardPile.length - 1],
                });
                logGameState();
            }
        }
    });
    socket.on('burnTopCard', () => {
        if (game.firstTurn && game.currentPlayer === socket.id) {
            game.deck.pop(); // Remove the top card from the game
            game.firstTurn = false;
            game.drawnThisTurn = false;
            updateAllPlayerScores();
            // After burning, disallow further knock/draw this turn
            const player = game.players.get(socket.id);
            if (player) {
                player.canDraw = true; // Allow player to draw from the deck after burning
                player.canKnock = false;
            }
            io.emit('topCardBurned', {
                playerId: socket.id,
                players: Array.from(game.players.values()),
                canDraw: true // Emit flag indicating player can draw
            });
            // Emit full state after burn
            io.emit('gameState', {
                players: Array.from(game.players.values()),
                currentPlayer: game.currentPlayer,
                gamePhase: game.gamePhase,
                discardPileTop: game.discardPile[game.discardPile.length - 1],
            });
            logGameState();
        }
    });
    socket.on('knock', () => {
        console.log('[SERVER] Knock received from', socket.id);
        const knocker = game.players.get(socket.id);
        if (game.gamePhase === 'preKnock' && game.currentPlayer === socket.id && !game.drawnThisTurn && knocker && knocker.canKnock) {
            game.knockerId = socket.id;
            game.knockActive = true;
            game.gamePhase = 'knockActive';
            // Set flags for the knocker and knockees
            for (const [id, p] of game.players.entries()) {
                if (id === socket.id) {
                    p.isKnockee = false;
                    p.canKnock = false;
                    p.canDraw = false;
                }
                else {
                    p.isKnockee = true;
                    p.canKnock = false;
                    p.canDraw = false; // will be set to true in advanceTurn for the next player
                }
            }
            io.emit('playerKnocked', { knockerId: socket.id, gamePhase: game.gamePhase });
            advanceTurn();
            io.emit('turnAdvanced', {
                currentPlayer: game.currentPlayer,
                players: Array.from(game.players.values()),
                knockActive: game.knockActive,
                knockerId: game.knockerId,
                gamePhase: game.gamePhase,
            });
            // Emit full state after knock
            io.emit('gameState', {
                players: Array.from(game.players.values()),
                currentPlayer: game.currentPlayer,
                gamePhase: game.gamePhase,
                discardPileTop: game.discardPile[game.discardPile.length - 1],
            });
            logGameState();
        }
    });
    socket.on('disconnect', () => {
        try {
            game.players.delete(socket.id);
            io.emit('playerLeft', socket.id);
        }
        catch (err) {
            console.error('Error in disconnect:', err);
        }
    });
});
function startGame() {
    game.status = 'playing';
    initializeDeck();
    dealCards();
    game.currentPlayer = Array.from(game.players.keys())[0];
    game.firstTurn = true;
    game.firstPlayerId = game.currentPlayer;
    game.knockerId = null;
    game.knockActive = false;
    game.drawnThisTurn = false;
    game.gamePhase = 'firstTurn';
    // Set canKnock/canDraw for the first player
    for (const [id, p] of game.players.entries()) {
        p.turnCount = 0;
        if (id === game.currentPlayer) {
            p.canKnock = true;
            p.canDraw = false;
        }
        else {
            p.canKnock = false;
            p.canDraw = false;
        }
        p.isKnockee = false;
    }
    io.emit('gameStarted', {
        players: Array.from(game.players.values()),
        currentPlayer: game.currentPlayer,
        firstTurn: game.firstTurn,
        topDeckCard: game.deck[game.deck.length - 1],
        gamePhase: game.gamePhase,
    });
    // Emit full state after round start
    io.emit('gameState', {
        players: Array.from(game.players.values()),
        currentPlayer: game.currentPlayer,
        gamePhase: game.gamePhase,
        discardPileTop: game.discardPile[game.discardPile.length - 1],
    });
    logGameState();
}
function initializeDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    game.deck = [];
    for (const suit of suits) {
        for (const value of values) {
            game.deck.push({
                suit,
                value: value === 'A' ? 11 : value === 'K' || value === 'Q' || value === 'J' ? 10 : parseInt(value),
                face: value
            });
        }
    }
    // Shuffle deck
    for (let i = game.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
    }
}
function dealCards() {
    for (const player of game.players.values()) {
        player.cards = game.deck.splice(0, 3);
    }
    updateAllPlayerScores();
    game.discardPile = [game.deck.splice(0, 1)[0]];
}
function advanceTurn() {
    const playerIds = Array.from(game.players.keys());
    const currentIndex = playerIds.indexOf(game.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    game.currentPlayer = playerIds[nextIndex];
    game.drawnThisTurn = false;
    for (const [id, p] of game.players.entries()) {
        if (id === game.currentPlayer) {
            p.turnCount = (p.turnCount || 0) + 1;
            if (game.gamePhase === 'knockActive') {
                if (id === game.knockerId) {
                    // The knocker is not a knockee
                    p.isKnockee = false;
                    p.canDraw = false;
                    p.canKnock = false;
                }
                else {
                    // Knockees: can only draw/discard, never peek/keep/burn or knock
                    p.isKnockee = true;
                    p.canDraw = true;
                    p.canKnock = false;
                }
            }
            else if (game.gamePhase === 'preKnock') {
                // All normal turns after firstTurn, before knock
                p.canDraw = true;
                p.canKnock = true;
                p.isKnockee = false;
            }
            else if (game.gamePhase === 'firstTurn') {
                // Only allow peek/keep/burn/knock on turn 0
                p.canDraw = false;
                p.canKnock = true;
                p.isKnockee = false;
            }
        }
        else {
            // Not the current player
            if (game.gamePhase === 'knockActive') {
                if (id === game.knockerId) {
                    p.isKnockee = false;
                }
                else {
                    p.isKnockee = true;
                }
            }
            else {
                p.isKnockee = false;
            }
            p.canDraw = false;
            p.canKnock = false;
        }
    }
    // Do NOT reset isKnockee for all players here; only do so at round start.
}
const PORT = 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
