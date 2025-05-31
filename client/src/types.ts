export interface Player {
  id: string;
  name: string;
  cards: Card[];
  score: number;
  lives: number;
  turnCount?: number;
  canKnock?: boolean;
  canDraw?: boolean;
  canDiscard?: boolean;
  isKnockee?: boolean;
  isReady?: boolean;
  isSpectator?: boolean;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  face: string;
}

export interface GameState {
  players: Player[];
  currentPlayer: string | null;
  discardPileTop: Card | null;
  firstTurn: boolean;
  gamePhase: 'firstTurn' | 'preKnock' | 'knockActive' | null;
  topDeckCard: Card | null;
  status: 'waiting' | 'lobby' | 'playing' | 'ended';
}

export interface LobbyState {
  players: { id: string; name: string; isReady: boolean }[];
  hostId: string | null;
  maxPlayers: number;
} 