import { Server, Socket } from 'socket.io';
import { Game, Player, LobbyState, Card } from './types';
import {
  calculateHandScore,
  checkForAutomaticWin,
  dealCards,
  advanceTurn,
  afterDraw,
  afterDiscard,
  afterKeep,
  afterBurn,
  afterKnock,
} from './game';

const roundAckSet = new Set<string>();

export function setupSocketHandlers(io: Server, game: Game): void {
  io.on('connection', (socket: Socket) => {
    socket.on('joinGame', (playerName: string) => {
      try {
        if (game.players.size >= 5) {
          socket.emit('error', 'Lobby is full');
          return;
        }

        const player: Player = {
          id: socket.id,
          name: playerName,
          cards: [],
          score: 0,
          lives: 3,
          turnCount: 0,
          canKnock: false,
          canDraw: false,
          canDiscard: false,
          isReady: false,
        };

        game.players.set(socket.id, player);
        if (!game.hostId) {
          game.hostId = socket.id;
        }
        game.status = 'lobby';
        emitLobbyState(io, game);
        io.emit('playerJoined', { id: socket.id, name: playerName });
      } catch (err) {
        console.error('Error in joinGame:', err);
        socket.emit('error', 'An error occurred while joining the game.');
      }
    });

    socket.on('playerReady', (isReady: boolean) => {
      const player = game.players.get(socket.id);
      if (player) {
        player.isReady = isReady;
        emitLobbyState(io, game);
      }
    });

    socket.on('startGame', () => {
      if (socket.id !== game.hostId) {
        socket.emit('error', 'Only the host can start the game');
        return;
      }

      const allReady = Array.from(game.players.values()).every(p => p.isReady);
      if (!allReady) {
        socket.emit('error', 'All players must be ready to start');
        return;
      }

      if (game.players.size < 2) {
        socket.emit('error', 'Need at least 2 players to start');
        return;
      }

      game.status = 'playing';
      dealCards(game);

      // Check for automatic win after initial deal
      for (const player of game.players.values()) {
        if (checkForAutomaticWin(player)) {
          handleAutomaticWin(io, game, player.id);
          return;
        }
      }

      // Set first player
      const playerIds = Array.from(game.players.keys());
      game.currentPlayer = playerIds[0];
      game.firstPlayerId = game.currentPlayer;
      game.firstTurn = true;
      game.gamePhase = 'firstTurn';

      const firstPlayer = game.players.get(game.currentPlayer);
      if (firstPlayer) {
        firstPlayer.canDraw = true;
        firstPlayer.canDiscard = false;
        firstPlayer.canKnock = false;
      }

      io.emit('gameStarted', {
        players: Array.from(game.players.values()),
        currentPlayer: game.currentPlayer,
        firstTurn: game.firstTurn,
        topDeckCard: game.deck[game.deck.length - 1],
        gamePhase: game.gamePhase,
      });
    });

    socket.on('drawCard', (fromDeck: boolean) => {
      const player = game.players.get(socket.id);
      if (!player || !player.canDraw || game.currentPlayer !== socket.id) {
        socket.emit('error', 'Cannot draw card at this time');
        return;
      }
      // If discard pile is empty, only allow drawing from deck
      if (!fromDeck && game.discardPile.length === 0) {
        socket.emit('error', 'Cannot draw from discard pile when it is empty');
        return;
      }
      let card: Card | undefined;
      if (fromDeck) {
        card = game.deck.pop();
      } else if (game.discardPile.length > 0) {
        card = game.discardPile.pop();
      }
      if (!card) {
        socket.emit('error', 'No cards available to draw');
        return;
      }
      player.cards.push(card);
      player.score = calculateHandScore(player.cards);
      afterDraw(game, player);
      io.emit('cardDrawn', {
        playerId: socket.id,
        card,
        fromDeck,
      });
      if (checkForAutomaticWin(player)) {
        handleAutomaticWin(io, game, socket.id);
      } else {
        emitGameState(io, game);
      }
    });

    socket.on('discardCard', (cardIndex: number) => {
      const player = game.players.get(socket.id);
      if (!player || !player.canDiscard || game.currentPlayer !== socket.id) {
        socket.emit('error', 'Cannot discard card at this time');
        return;
      }

      const card = player.cards.splice(cardIndex, 1)[0];
      game.discardPile.push(card);
      player.score = calculateHandScore(player.cards);

      // Check for automatic win after discard
      if (checkForAutomaticWin(player)) {
        handleAutomaticWin(io, game, player.id);
        return;
      }

      // Log gamePhase before possible change
      console.log(`[SERVER] Before discard: gamePhase=${game.gamePhase}`);
      // If firstTurn, change to preKnock
      if (game.gamePhase === 'firstTurn') {
        game.gamePhase = 'preKnock';
        console.log(`[SERVER] gamePhase changed to preKnock after first discard`);
      }

      afterDiscard(game);
      // Log gamePhase after turn advance
      console.log(`[SERVER] After discard/advanceTurn: gamePhase=${game.gamePhase}, currentPlayer=${game.currentPlayer}`);

      io.emit('cardDiscarded', {
        playerId: socket.id,
        card,
        nextPlayer: game.currentPlayer,
        players: Array.from(game.players.values()),
        discardPileTop: card,
      });

      // Check for round end after knock
      if (game.gamePhase === 'knockActive' && game.currentPlayer === game.knockerId) {
        // End round
        const scores = Array.from(game.players.values())
          .filter(p => p.lives > 0)
          .map(p => ({ id: p.id, name: p.name, score: p.score, lives: p.lives }));
        let lowestScore = Infinity;
        let loserId: string | null = null;
        for (const p of scores) {
          if (p.score < lowestScore) {
            lowestScore = p.score;
            loserId = p.id;
          }
        }
        let loserName = '';
        if (loserId) {
          const loser = game.players.get(loserId);
          if (loser) {
            loser.lives--;
            loserName = loser.name;
            if (loser.lives <= 0) {
              // Mark as spectator (do not delete, just set a flag)
              loser.isSpectator = true;
            }
          }
        }
        // Prepare round summary
        io.emit('roundSummary', {
          players: Array.from(game.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            lives: p.lives,
            isSpectator: !!p.isSpectator,
          })),
          loserId,
          loserName,
          lowestScore
        });
        roundAckSet.clear();
        return; // Do not advance turn further
      }

      emitGameState(io, game);
    });

    socket.on('keepTopCard', () => {
      const player = game.players.get(socket.id);
      if (!player || game.currentPlayer !== socket.id || !game.firstTurn) {
        socket.emit('error', 'Cannot keep card at this time');
        return;
      }

      const card = game.deck.pop();
      if (!card) {
        socket.emit('error', 'No card available to keep');
        return;
      }

      player.cards.push(card);
      player.score = calculateHandScore(player.cards);
      afterKeep(game, player);

      io.emit('topCardKept', {
        playerId: socket.id,
        card,
        players: Array.from(game.players.values()),
        nextPlayer: game.currentPlayer,
      });

      if (checkForAutomaticWin(player)) {
        handleAutomaticWin(io, game, socket.id);
      } else {
        emitGameState(io, game);
      }
    });

    socket.on('burnTopCard', () => {
      const player = game.players.get(socket.id);
      if (!player || game.currentPlayer !== socket.id || !game.firstTurn) {
        socket.emit('error', 'Cannot burn card at this time');
        return;
      }

      // 1. Burn the top card
      const card = game.deck.pop();
      if (!card) {
        socket.emit('error', 'No card available to burn');
        return;
      }

      afterBurn(game, player);

      // 2. Immediately draw a card for the player
      const drawnCard = game.deck.pop();
      if (!drawnCard) {
        socket.emit('error', 'No card available to draw after burn');
        return;
      }
      player.cards.push(drawnCard);

      // 3. Update permissions: can only discard now
      player.canDraw = false;
      player.canKnock = false;
      player.canDiscard = true;
      game.drawnThisTurn = true;

      io.emit('topCardBurned', {
        playerId: socket.id,
        players: Array.from(game.players.values()),
        nextPlayer: game.currentPlayer,
      });

      emitGameState(io, game);
    });

    socket.on('knock', () => {
      const player = game.players.get(socket.id);
      if (!player || game.currentPlayer !== socket.id || game.drawnThisTurn) {
        socket.emit('error', 'Cannot knock at this time');
        return;
      }
      // If it's the opening turn, burn the peeked card automatically
      if (game.firstTurn) {
        game.deck.pop(); // Remove the peeked card from play
        game.firstTurn = false;
      }
      afterKnock(game, socket.id);
      advanceTurn(game);
      io.emit('playerKnocked', {
        knockerId: socket.id,
      });
      emitGameState(io, game);
    });

    socket.on('disconnect', () => {
      game.players.delete(socket.id);
      if (game.hostId === socket.id) {
        game.hostId = Array.from(game.players.keys())[0] || null;
      }
      io.emit('playerLeft', socket.id);
      emitLobbyState(io, game);
    });

    // Handle round summary acknowledgement
    socket.on('ackRoundSummary', () => {
      roundAckSet.add(socket.id);
      // Only active players must acknowledge
      const activePlayers = Array.from(game.players.values()).filter(p => !p.isSpectator && p.lives > 0);
      if (roundAckSet.size >= activePlayers.length) {
        // Start next round or end game
        const remaining = activePlayers.filter(p => p.lives > 0);
        if (remaining.length <= 1) {
          // Game over
          io.emit('gameEnded', {
            winner: remaining[0]?.name,
            players: Array.from(game.players.values()).map(p => ({
              id: p.id,
              name: p.name,
              score: p.score,
              lives: p.lives,
              isSpectator: !!p.isSpectator,
            }))
          });
          roundAckSet.clear();
          return; // Prevent roundStarted from being emitted after game over
        }
        // Start new round
        dealCards(game);
        // Check for automatic win after new round deal
        for (const player of game.players.values()) {
          if (checkForAutomaticWin(player)) {
            handleAutomaticWin(io, game, player.id);
            return;
          }
        }
        // Rotate starting player
        const playerIds = Array.from(game.players.keys()).filter(id => {
          const p = game.players.get(id);
          return p && !p.isSpectator && p.lives > 0;
        });
        let nextFirstIndex = 0;
        if (game.firstPlayerId) {
          const prevIndex = playerIds.indexOf(game.firstPlayerId);
          nextFirstIndex = (prevIndex + 1) % playerIds.length;
        }
        game.currentPlayer = playerIds[nextFirstIndex];
        game.firstTurn = true;
        game.firstPlayerId = game.currentPlayer;
        game.knockerId = null;
        game.knockActive = false;
        game.gamePhase = 'firstTurn';
        for (const p of game.players.values()) {
          p.canKnock = false;
          p.canDraw = false;
          p.canDiscard = false;
          p.isKnockee = false;
        }
        io.emit('roundStarted', {
          players: Array.from(game.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            lives: p.lives,
            isSpectator: !!p.isSpectator,
            cards: p.cards,
          })),
          currentPlayer: game.currentPlayer,
          firstTurn: game.firstTurn,
          topDeckCard: game.deck[game.deck.length - 1],
          gamePhase: game.gamePhase,
        });
        roundAckSet.clear();
      }
    });
  });
}

function handleAutomaticWin(io: Server, game: Game, winnerId: string): void {
  const winner = game.players.get(winnerId);
  if (!winner) return;

  // All other players lose a life
  for (const [playerId, player] of game.players.entries()) {
    if (playerId !== winnerId) {
      player.lives--;
      if (player.lives <= 0) {
        player.isSpectator = true;
      }
    }
  }

  // Prepare round summary
  const summaryPlayers = Array.from(game.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    lives: p.lives,
    isSpectator: !!p.isSpectator,
  }));
  io.emit('roundSummary', {
    players: summaryPlayers,
    loserId: null, // All non-winners lose a life
    loserName: null,
    lowestScore: 31,
    winnerId,
    winnerName: winner.name,
    automaticWin: true,
  });
  roundAckSet.clear();
}

function emitGameState(io: Server, game: Game): void {
  // Prepare the shared state for all players
  const sharedState = {
    players: Array.from(game.players.values()),
    currentPlayer: game.currentPlayer,
    discardPileTop: game.discardPile[game.discardPile.length - 1],
    firstTurn: game.firstTurn,
    gamePhase: game.gamePhase,
  };

  // Only send topDeckCard to the first player on their first turn
  if (game.firstTurn && game.currentPlayer && game.firstPlayerId && game.currentPlayer === game.firstPlayerId) {
    io.to(game.currentPlayer).emit('gameState', {
      ...sharedState,
      topDeckCard: game.deck[game.deck.length - 1] || null,
    });
    // All other players get no topDeckCard
    for (const player of game.players.values()) {
      if (player.id !== game.currentPlayer) {
        io.to(player.id).emit('gameState', {
          ...sharedState,
          topDeckCard: null,
        });
      }
    }
  } else {
    // After first turn, no one sees the topDeckCard
    for (const player of game.players.values()) {
      io.to(player.id).emit('gameState', {
        ...sharedState,
        topDeckCard: null,
      });
    }
  }
}

function emitLobbyState(io: Server, game: Game): void {
  const lobbyState: LobbyState = {
    players: Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isReady: p.isReady || false,
    })),
    hostId: game.hostId ?? null,
    maxPlayers: 5,
  };
  io.emit('lobbyState', lobbyState);
} 