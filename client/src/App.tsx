import React, { useState } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { RoundSummaryModal, EndGameModal } from './components/Modals';

function App() {
  const {
    socket,
    gameState,
    lobbyState,
    error,
    gameMessage,
    roundSummary,
    endGameData,
    roundCountdown,
    isMyTurn,
    isLoading,
    setError,
    setGameMessage,
  } = useGameSocket();

  const [showEndGameModal, setShowEndGameModal] = useState(false);

  const handleJoinGame = (playerName: string) => {
    if (socket) {
      socket.emit('joinGame', playerName);
    }
  };

  const handleReadyToggle = () => {
    if (socket) {
      socket.emit('playerReady', !lobbyState?.players.find(p => p.id === socket.id)?.isReady);
    }
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  const handleDrawCard = (fromDeck: boolean) => {
    if (socket && isMyTurn) {
      socket.emit('drawCard', fromDeck);
    }
  };

  const handleDiscardCard = (cardIndex: number) => {
    if (socket && isMyTurn) {
      socket.emit('discardCard', cardIndex);
    }
  };

  const handleKeepTopCard = () => {
    if (socket) {
      socket.emit('keepTopCard');
    }
  };

  const handleBurnTopCard = () => {
    if (socket) {
      socket.emit('burnTopCard');
    }
  };

  const handleKnock = () => {
    if (socket && isMyTurn) {
      socket.emit('knock');
    }
  };

  const showWaitingModal = gameState.players.length === 1 && !gameState.currentPlayer;
  const myPlayer = (gameState.players || []).find(p => p.id === socket?.id);
  const isSpectator = !!myPlayer?.isSpectator;

  if (isLoading && gameState.status === 'playing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="fixed top-0 left-0 right-0 p-4 bg-red-500 text-white text-center">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 px-2 py-1 bg-red-600 rounded hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {gameMessage && (
        <div className="fixed top-0 left-0 right-0 p-4 bg-blue-500 text-white text-center">
          {gameMessage}
          <button
            onClick={() => setGameMessage(null)}
            className="ml-4 px-2 py-1 bg-blue-600 rounded hover:bg-blue-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {showWaitingModal ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl font-semibold text-gray-700">Waiting for other players...</div>
        </div>
      ) : gameState.status === 'playing' ? (
        <GameBoard
          players={gameState.players}
          currentPlayer={gameState.currentPlayer}
          discardPileTop={gameState.discardPileTop}
          firstTurn={gameState.firstTurn}
          gamePhase={gameState.gamePhase}
          topDeckCard={gameState.topDeckCard}
          socket={socket}
          isMyTurn={isMyTurn}
          onDrawCard={handleDrawCard}
          onDiscardCard={handleDiscardCard}
          onKeepTopCard={handleKeepTopCard}
          onBurnTopCard={handleBurnTopCard}
          onKnock={handleKnock}
          isSpectator={isSpectator}
        />
      ) : (
        <Lobby
          lobbyState={lobbyState}
          socket={socket}
          onJoinGame={handleJoinGame}
          onReadyToggle={handleReadyToggle}
          onStartGame={handleStartGame}
        />
      )}

      {roundSummary && (
        <RoundSummaryModal
          summary={roundSummary}
          countdown={roundCountdown}
        />
      )}

      {endGameData && (
        <EndGameModal
          data={endGameData}
          onClose={() => setShowEndGameModal(false)}
          onNewGame={() => {
            if (socket) {
              socket.emit('startNewGame');
            }
          }}
        />
      )}
    </div>
  );
}

export default App; 