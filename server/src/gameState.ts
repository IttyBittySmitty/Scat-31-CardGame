import { Game, Player, Card } from './types';
import { calculateHandScore } from './game';

export function initializeGame(): Game {
  return {
    players: new Map(),
    deck: [],
    discardPile: [],
    currentPlayer: null,
    status: 'lobby',
    firstTurn: false,
    firstPlayerId: null,
    knockerId: null,
    knockActive: false,
    drawnThisTurn: false,
    gamePhase: 'firstTurn',
    hostId: null,
  };
}

export function startGame(game: Game): void {
  game.status = 'playing';
  initializeDeck(game);
  dealCards(game);
  // Randomly select starting player for the first round
  const playerIds = Array.from(game.players.keys());
  const randomIndex = Math.floor(Math.random() * playerIds.length);
  game.currentPlayer = playerIds[randomIndex];
  game.firstTurn = true;
  game.firstPlayerId = game.currentPlayer;
  game.knockerId = null;
  game.knockActive = false;
  game.drawnThisTurn = false;
  game.gamePhase = 'firstTurn';
  // Set canKnock/canDraw for the first player
  for (const [id, p] of game.players.entries()) {
    p.turnCount = 0;
    p.isReady = false;
    if (id === game.currentPlayer) {
      p.canKnock = true;
      p.canDraw = false;
      p.canDiscard = false;
    } else {
      p.canKnock = false;
      p.canDraw = false;
      p.canDiscard = false;
    }
    p.isKnockee = false;
  }
}

export function initializeDeck(game: Game): void {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
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

export function dealCards(game: Game): void {
  for (const player of game.players.values()) {
    player.cards = game.deck.splice(0, 3);
  }
  updateAllPlayerScores(game);
  game.discardPile = []; // Start with an empty discard pile
}

export function updateAllPlayerScores(game: Game): void {
  for (const player of game.players.values()) {
    player.score = calculateHandScore(player.cards);
  }
}

export function handleAutomaticWin(game: Game, winnerId: string): void {
  const winner = game.players.get(winnerId);
  if (!winner) return;

  // All other players lose a life
  for (const [playerId, player] of game.players.entries()) {
    if (playerId !== winnerId) {
      player.lives--;
      if (player.lives <= 0) {
        game.players.delete(playerId);
      }
    }
  }
}

export function startNewRound(game: Game): void {
  initializeDeck(game);
  dealCards(game);
  // Rotate starting player to the next in line
  const playerIds = Array.from(game.players.keys());
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
}

export function logGameState(game: Game): void {
  console.log('[GAME STATE]', JSON.stringify({
    players: Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      lives: p.lives,
      turnCount: p.turnCount,
      canDraw: p.canDraw,
      canKnock: p.canKnock,
      canDiscard: p.canDiscard,
      isKnockee: p.isKnockee,
      cards: p.cards.length // Only show card count for privacy
    })),
    currentPlayer: game.currentPlayer,
    gamePhase: game.gamePhase,
    discardPileTop: game.discardPile[game.discardPile.length - 1],
  }, null, 2));
} 