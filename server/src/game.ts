import { Game, Player, Card } from './types';

export function calculateHandScore(cards: Card[]): number {
  if (cards.length !== 3) return 0;
  // Check for three of a kind
  if (cards[0].face === cards[1].face && cards[1].face === cards[2].face) {
    return 30.5;
  }
  // Group by suit and sum
  const suitSums: { [suit: string]: number } = {};
  for (const card of cards) {
    suitSums[card.suit] = (suitSums[card.suit] || 0) + card.value;
  }
  return Math.max(...Object.values(suitSums));
}

export function checkForAutomaticWin(player: Player): boolean {
  return calculateHandScore(player.cards) === 31;
}

export function initializeDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const faces = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const face of faces) {
      let value: number;
      if (face === 'A') value = 11;
      else if (face === 'K' || face === 'Q' || face === 'J') value = 10;
      else value = parseInt(face);
      deck.push({
        suit,
        value,
        face,
      });
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function dealCards(game: Game): void {
  game.deck = initializeDeck();
  game.discardPile = [];

  // Deal 3 cards to each player
  for (const player of game.players.values()) {
    player.cards = [];
    for (let i = 0; i < 3; i++) {
      const card = game.deck.pop();
      if (card) {
        player.cards.push(card);
      }
    }
    player.score = calculateHandScore(player.cards);
  }

  // Do NOT place a card in the discard pile at round start
}

export function advanceTurn(game: Game): void {
  // Only consider players who are not spectators and have lives > 0
  const eligiblePlayerIds = Array.from(game.players.values())
    .filter(p => !p.isSpectator && p.lives > 0)
    .map(p => p.id);
  if (eligiblePlayerIds.length === 0) return;

  const currentIndex = game.currentPlayer ? eligiblePlayerIds.indexOf(game.currentPlayer) : -1;
  const nextIndex = (currentIndex + 1) % eligiblePlayerIds.length;
  game.currentPlayer = eligiblePlayerIds[nextIndex];

  const nextPlayer = game.players.get(game.currentPlayer);
  if (nextPlayer) {
    nextPlayer.turnCount++;
    nextPlayer.canDraw = true;
    nextPlayer.canDiscard = false;
    // Allow knocking in preKnock phase
    nextPlayer.canKnock = (game.gamePhase === 'preKnock');
    nextPlayer.isKnockee = false;
  }

  game.drawnThisTurn = false;
}

export function afterDraw(game: Game, player: Player): void {
  player.canDraw = false;
  player.canDiscard = true;
  game.drawnThisTurn = true;
  if (game.firstTurn) game.firstTurn = false;
}

export function afterDiscard(game: Game): void {
  const currentPlayer = game.players.get(game.currentPlayer!);
  if (currentPlayer) {
    currentPlayer.canDiscard = false;
  }
  advanceTurn(game);
}

export function afterKeep(game: Game, player: Player): void {
  player.canDraw = false;
  player.canDiscard = true;
  game.drawnThisTurn = true;
  if (game.firstTurn) game.firstTurn = false;
}

export function afterBurn(game: Game, player: Player): void {
  player.canDraw = true;
  player.canDiscard = false;
  game.drawnThisTurn = false;
  if (game.firstTurn) game.firstTurn = false;
}

export function afterKnock(game: Game, knockerId: string): void {
  game.knockerId = knockerId;
  game.knockActive = true;
  game.gamePhase = 'knockActive';

  // Mark all other players as knockees
  for (const [playerId, player] of game.players.entries()) {
    if (playerId !== knockerId) {
      player.isKnockee = true;
    }
  }
} 