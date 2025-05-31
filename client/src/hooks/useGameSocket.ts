import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, Card, GameState, LobbyState } from '../types';

export const useGameSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayer: null,
    discardPileTop: null,
    firstTurn: false,
    gamePhase: null,
    topDeckCard: null,
  });
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [roundSummary, setRoundSummary] = useState<any | null>(null);
  const [endGameData, setEndGameData] = useState<any | null>(null);
  const [roundCountdown, setRoundCountdown] = useState(8);

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.on('playerJoined', (player: Player) => {
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, player]
      }));
    });

    newSocket.on('playerLeft', (playerId: string) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      }));
    });

    newSocket.on('gameStarted', (data) => {
      console.log('gameStarted', data);
      setGameState({
        players: data.players,
        currentPlayer: data.currentPlayer,
        discardPileTop: null,
        firstTurn: !!data.firstTurn,
        gamePhase: 'firstTurn',
        topDeckCard: data.topDeckCard || null,
      });
      setGameMessage(null);
    });

    newSocket.on('roundStarted', (data) => {
      console.log('roundStarted', data);
      setGameState({
        players: data.players,
        currentPlayer: data.currentPlayer,
        discardPileTop: null,
        firstTurn: !!data.firstTurn,
        gamePhase: 'firstTurn',
        topDeckCard: data.topDeckCard || null,
      });
      setGameMessage(null);
      setRoundSummary(null);
      setRoundCountdown(8);
    });

    newSocket.on('peekTopCard', (data: { card: Card }) => {
      setGameState(prev => ({ ...prev, topDeckCard: data.card }));
    });

    newSocket.on('topCardKept', (data: { playerId: string, card: Card, players: Player[], nextPlayer?: string }) => {
      setGameState(prev => ({
        ...prev,
        players: data.players,
        firstTurn: false,
        topDeckCard: null,
      }));
    });

    newSocket.on('topCardBurned', (data: { playerId: string, players: Player[], nextPlayer?: string }) => {
      setGameState(prev => ({
        ...prev,
        players: data.players,
        firstTurn: false,
        topDeckCard: null,
      }));
    });

    newSocket.on('turnAdvanced', (data: { currentPlayer: string }) => {
      setGameState(prev => ({
        ...prev,
        currentPlayer: data.currentPlayer,
      }));
    });

    newSocket.on('cardDrawn', (data: { playerId: string, card: Card, fromDeck: boolean }) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.id === data.playerId 
            ? { ...p, cards: [...p.cards, data.card] }
            : p
        ),
      }));
    });

    newSocket.on('gameEnded', (data) => {
      console.log('gameEnded', data);
      setGameState(prev => ({
        ...prev,
        players: data.players,
      }));
      setGameMessage(`${data.winner} has won the game!`);
      setEndGameData(data);
    });

    newSocket.on('error', (message: string) => {
      setError(message);
    });

    newSocket.on('gameState', (data) => {
      console.log('gameState', data);
      setGameState(prev => ({
        ...prev,
        players: data.players ?? prev.players ?? [],
        currentPlayer: data.currentPlayer,
        discardPileTop: data.discardPileTop,
        firstTurn: data.firstTurn ?? prev.firstTurn,
        gamePhase: data.gamePhase ?? prev.gamePhase,
        topDeckCard: data.topDeckCard ?? null,
      }));
    });

    newSocket.on('serverRestarted', () => {
      window.location.reload();
    });

    newSocket.on('roundSummary', (data) => {
      setRoundSummary(data);
      setRoundCountdown(8);
    });

    newSocket.on('lobbyState', (data) => {
      setLobbyState(data);
    });

    newSocket.on('playerKnocked', (data: { knockerId: string }) => {
      const knocker = gameState.players.find(p => p.id === data.knockerId);
      setGameMessage(knocker ? `${knocker.name} has knocked!` : 'A player has knocked!');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Countdown effect for round summary
  useEffect(() => {
    if (roundSummary && roundCountdown > 0) {
      const timer = setTimeout(() => setRoundCountdown(roundCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [roundSummary, roundCountdown]);

  const isMyTurn = gameState.currentPlayer === socket?.id;

  return {
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
  };
}; 