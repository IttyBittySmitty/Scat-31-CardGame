import React from 'react';
import { Player } from '../types';

interface RoundSummaryModalProps {
  summary: any;
  countdown: number;
}

interface EndGameModalProps {
  data: any;
  onClose: () => void;
  onNewGame: () => void;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({ summary, countdown }) => {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Round Summary</h2>
        <div className="space-y-2">
          {summary.players.map((player: any) => (
            <div key={player.id} className="flex justify-between">
              <span>{player.name}</span>
              <span>Score: {player.score}</span>
              <span>Lives: {player.lives}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p>Next round in {countdown} seconds...</p>
        </div>
      </div>
    </div>
  );
};

export const EndGameModal: React.FC<EndGameModalProps> = ({ data, onClose, onNewGame }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-4">{data.winner} has won the game!</p>
        <div className="space-y-2 mb-4">
          {data.players.map((player: any) => (
            <div key={player.id} className="flex justify-between">
              <span>{player.name}</span>
              <span>Lives: {player.lives}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
          <button
            onClick={onNewGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}; 