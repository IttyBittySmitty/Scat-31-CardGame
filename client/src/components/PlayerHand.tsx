import React from 'react';
import { Card } from '../types';

interface PlayerHandProps {
  cards: Card[];
  isMyTurn: boolean;
  onDiscardCard: (cardIndex: number) => void;
  score: number;
  lives: number;
  socket: any;
  canDiscard?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isMyTurn,
  onDiscardCard,
  score,
  lives,
  socket,
  canDiscard,
}) => {
  const canClickToDiscard = isMyTurn && canDiscard && cards.length === 4;
  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-bold mb-2">Your Hand</h2>
      <div className="flex space-x-2 mb-2">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center border border-gray-300 ${canClickToDiscard ? 'bg-blue-200 cursor-pointer hover:bg-blue-300' : 'bg-blue-100'}`}
            onClick={canClickToDiscard ? () => onDiscardCard(idx) : undefined}
            title={canClickToDiscard ? 'Click to discard this card' : ''}
          >
            <span className="text-xl font-bold">{card.face}</span>
            <span className="text-sm text-gray-500">{card.suit}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-2">
        <span>Score: <b>{score}</b></span>
        <span>Lives: <b>{lives}</b></span>
      </div>
      <button
        onClick={() => socket && socket.emit('leaveGame')}
        className="mt-2 px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        style={{ alignSelf: 'flex-start', minWidth: 'unset', width: 'auto' }}
      >
        Leave
      </button>
    </div>
  );
}; 