import React from 'react';
import { Card } from '../types';

interface PlayerHandProps {
  cards: Card[];
  isMyTurn: boolean;
  onDiscardCard: (cardIndex: number) => void;
  score: number;
  lives: number;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isMyTurn,
  onDiscardCard,
  score,
  lives,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Hand</h2>
        <span className="text-gray-700">Score: <span className="font-bold">{score}</span></span>
        <span className="text-gray-700">Lives: <span className="font-bold">{lives}</span></span>
      </div>
      <div className="flex space-x-4">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => isMyTurn && onDiscardCard(index)}
            disabled={!isMyTurn}
            className={`w-24 h-36 bg-white rounded-lg shadow-lg border-2 ${
              isMyTurn
                ? 'border-blue-500 hover:border-blue-600 cursor-pointer'
                : 'border-gray-300 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-xl font-bold">{card.face}</span>
              <span className="text-sm text-gray-500">{card.suit}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 