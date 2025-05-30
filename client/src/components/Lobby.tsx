import React, { useState } from 'react';
import { LobbyState } from '../types';

interface LobbyProps {
  lobbyState: LobbyState | null;
  socket: any;
  onJoinGame: (playerName: string) => void;
  onReadyToggle: () => void;
  onStartGame: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  lobbyState,
  socket,
  onJoinGame,
  onReadyToggle,
  onStartGame,
}) => {
  const [playerName, setPlayerName] = useState('');

  const handleJoinGame = () => {
    if (playerName.trim()) {
      onJoinGame(playerName.trim());
    }
  };

  const isHost = lobbyState?.hostId === socket?.id;
  const allPlayersReady = lobbyState?.players.every(p => p.isReady) ?? false;
  const canStartGame = isHost && allPlayersReady && (lobbyState?.players.length ?? 0) >= 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900">Scat Game</h1>
        
        {!lobbyState?.players.some(p => p.id === socket?.id) ? (
          <div className="space-y-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoinGame}
              className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Join Game
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Players ({lobbyState?.players.length ?? 0}/5)</h2>
              <div className="space-y-2">
                {lobbyState?.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{player.name}</span>
                    <span className={`px-2 py-1 text-sm rounded ${
                      player.isReady ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={onReadyToggle}
                className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {lobbyState?.players.find(p => p.id === socket.id)?.isReady ? 'Not Ready' : 'Ready'}
              </button>

              {isHost && (
                <button
                  onClick={onStartGame}
                  disabled={!canStartGame}
                  className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    canStartGame
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Start Game
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 