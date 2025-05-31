import React from 'react';
import { Card } from '../types';

interface PlayerHandProps {
  cards: Card[];
  isMyTurn: boolean;
  onDiscardCard: (cardIndex: number) => void;
  score: number;
  lives: number;
  socket: any;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isMyTurn,
  onDiscardCard,
  score,
  lives,
  socket,
}) => {
  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-bold mb-2">Your Hand</h2>
      <div className="flex space-x-2 mb-2">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="w-16 h-24 bg-blue-100 rounded-lg flex flex-col items-center justify-center border border-gray-300"
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
        className="mt-4 w-full px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Leave Game
      </button>
    </div>
  );
}; 