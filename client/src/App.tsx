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

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {gameMessage && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {gameMessage}
          <button
            onClick={() => setGameMessage(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {!gameState.currentPlayer ? (
        <Lobby
          lobbyState={lobbyState}
          socket={socket}
          onJoinGame={handleJoinGame}
          onReadyToggle={handleReadyToggle}
          onStartGame={handleStartGame}
        />
      ) : (
        <GameBoard
          players={gameState.players || []}
          currentPlayer={gameState.currentPlayer}
          discardPileTop={gameState.discardPileTop}
          firstTurn={gameState.firstTurn}
          gamePhase={gameState.gamePhase}
          topDeckCard={gameState.topDeckCard}
          socket={socket}
          isMyTurn={isMyTurn && !isSpectator}
          onDrawCard={handleDrawCard}
          onDiscardCard={handleDiscardCard}
          onKeepTopCard={handleKeepTopCard}
          onBurnTopCard={handleBurnTopCard}
          onKnock={handleKnock}
          isSpectator={isSpectator}
        />
      )}

      {/* <WaitingModal show={showWaitingModal} /> */}
      
      <RoundSummaryModal
        show={!!roundSummary}
        summary={roundSummary}
        countdown={roundCountdown}
        isSpectator={isSpectator}
        socket={socket}
      />

      <EndGameModal
        show={showEndGameModal}
        data={endGameData}
        onClose={() => setShowEndGameModal(false)}
        socket={socket}
      />
    </div>
  );
}

export default App; 