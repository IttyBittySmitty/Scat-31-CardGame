export interface Player {
  id: string;
  name: string;
  cards: Card[];
  score: number;
  lives: number;
  turnCount: number;
  canKnock: boolean;
  canDraw: boolean;
  canDiscard: boolean;
  isKnockee?: boolean;
  isReady?: boolean;
  isSpectator?: boolean;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  face: string;
}

export interface Game {
  players: Map<string, Player>;
  deck: Card[];
  discardPile: Card[];
  currentPlayer: string | null;
  status: 'waiting' | 'lobby' | 'playing' | 'ended';
  firstTurn: boolean;
  firstPlayerId: string | null;
  knockerId: string | null;
  knockActive: boolean;
  drawnThisTurn: boolean;
  gamePhase: 'firstTurn' | 'preKnock' | 'knockActive';
  hostId?: string | null;
}

export interface LobbyState {
  players: { id: string; name: string; isReady: boolean }[];
  hostId: string | null;
  maxPlayers: number;
} 