import React from 'react';
import { Card } from '../types';

interface GameControlsProps {
  isMyTurn: boolean;
  firstTurn: boolean;
  gamePhase: 'firstTurn' | 'preKnock' | 'knockActive' | null;
  topDeckCard: Card | null;
  handSize: number;
  onDrawCard: (fromDeck: boolean) => void;
  onKeepTopCard: () => void;
  onBurnTopCard: () => void;
  onKnock: () => void;
  discardPileTop: Card | null;
  canDraw?: boolean;
  canKnock?: boolean;
  canDiscard?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isMyTurn,
  firstTurn,
  gamePhase,
  topDeckCard,
  handSize,
  onDrawCard,
  onKeepTopCard,
  onBurnTopCard,
  onKnock,
  discardPileTop,
  canDraw,
  canKnock,
  canDiscard,
}) => {
  if (!isMyTurn) {
    return (
      <div className="p-4 bg-white shadow-lg">
        <div className="text-center text-gray-500">Waiting for your turn...</div>
      </div>
    );
  }

  if (firstTurn && topDeckCard) {
    return (
      <div className="p-4 bg-white shadow-lg">
        <div className="flex justify-center space-x-4">
          <button
            onClick={onKeepTopCard}
            className="px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Keep Card
          </button>
          <button
            onClick={onBurnTopCard}
            className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Burn Card
          </button>
          {gamePhase !== 'knockActive' && (
            <button
              onClick={onKnock}
              className="px-6 py-2 text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Knock
            </button>
          )}
        </div>
      </div>
    );
  }

  // Only show controls if handSize is 3
  if (handSize !== 3) {
    return null;
  }

  return (
    <div className="p-4 bg-white shadow-lg">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onDrawCard(true)}
          className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!canDraw}
        >
          Draw from Deck
        </button>
        <button
          onClick={() => onDrawCard(false)}
          className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!canDraw || !discardPileTop}
        >
          Draw from Discard
        </button>
        {gamePhase !== 'knockActive' && (
          <button
            onClick={onKnock}
            className="px-6 py-2 text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            disabled={!canKnock}
          >
            Knock
          </button>
        )}
      </div>
    </div>
  );
}; 