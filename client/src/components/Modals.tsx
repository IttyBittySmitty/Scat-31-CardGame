import React from 'react';
import { Player } from '../types';

interface RoundSummaryModalProps {
  show: boolean;
  summary: any;
  countdown: number;
  isSpectator: boolean;
  socket: any;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({
  show,
  summary,
  countdown,
  isSpectator,
  socket,
}) => {
  if (!show || !summary) return null;

  const winner = summary.players.find((p: any) => p.lives > 0 && !p.isSpectator);
  const isWinner = socket && winner && socket.id === winner.id;
  const onlyOneAlive = summary.players.filter((p: any) => p.lives > 0 && !p.isSpectator).length === 1;

  const handleNewGame = () => {
    if (socket) {
      socket.emit('startNewGame');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg min-w-[350px]">
        <h2 className="text-2xl font-bold mb-4">Round Summary</h2>
        <div className="space-y-4">
          {summary.players.map((player: Player & { isSpectator?: boolean }) => (
            <div
              key={player.id}
              className={`flex justify-between items-center ${summary.loserId === player.id ? 'bg-red-100' : ''}`}
            >
              <span className="font-medium">
                {player.name}
                {player.isSpectator ? ' (Spectator)' : ''}
                {summary.loserId === player.id && ' (Lost a Life)'}
              </span>
              <span className="text-gray-600">Score: {player.score}</span>
              <span className="text-gray-600">Lives: {player.lives}</span>
            </div>
          ))}
        </div>
        {onlyOneAlive && isWinner ? (
          <button
            onClick={handleNewGame}
            className="mt-6 w-full px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            New Game
          </button>
        ) : (
          <button
            onClick={() => socket && socket.emit('ackRoundSummary')}
            className="mt-6 w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Next Round
          </button>
        )}
        {isSpectator && (
          <div className="mt-6 text-center text-gray-500">
            Waiting for players to start the next round...
          </div>
        )}
      </div>
    </div>
  );
};

interface EndGameModalProps {
  show: boolean;
  data: any;
  onClose: () => void;
  socket: any;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  show,
  data,
  onClose,
  socket,
}) => {
  if (!show || !data) return null;

  const handleStartNewGame = () => {
    if (socket) {
      socket.emit('startNewGame');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg min-w-[350px]">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-6">
          {data.winner} has won the game!
        </p>
        <div className="space-y-4">
          <h3 className="font-semibold">Final Scores:</h3>
          {data.players.map((player: Player & { isSpectator?: boolean }) => (
            <div key={player.id} className="flex justify-between items-center">
              <span className="font-medium">
                {player.name}
                {player.isSpectator ? ' (Spectator)' : ''}
              </span>
              <span className="text-gray-600">Score: {player.score}</span>
              <span className="text-gray-600">Lives: {player.lives}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleStartNewGame}
          className="mt-6 w-full px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Start New Game
        </button>
      </div>
    </div>
  );
}; 