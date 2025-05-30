import React from 'react';
import { Card, Player } from '../types';
import { PlayerHand } from './PlayerHand';
import { GameControls } from './GameControls';

interface GameBoardProps {
  players: Player[];
  currentPlayer: string | null;
  discardPileTop: Card | null;
  firstTurn: boolean;
  gamePhase: 'firstTurn' | 'preKnock' | 'knockActive' | null;
  topDeckCard: Card | null;
  socket: any;
  isMyTurn: boolean;
  onDrawCard: (fromDeck: boolean) => void;
  onDiscardCard: (cardIndex: number) => void;
  onKeepTopCard: () => void;
  onBurnTopCard: () => void;
  onKnock: () => void;
  isSpectator: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayer,
  discardPileTop,
  firstTurn,
  gamePhase,
  topDeckCard,
  socket,
  isMyTurn,
  onDrawCard,
  onDiscardCard,
  onKeepTopCard,
  onBurnTopCard,
  onKnock,
  isSpectator,
}) => {
  console.log('GameBoard players:', players);
  const currentPlayerObj = players.find(p => p.id === currentPlayer);
  const myPlayer = players.find(p => p.id === socket?.id);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Other Players */}
      <div className="flex flex-row justify-center items-start gap-4 w-full max-w-[600px] mx-auto p-4">
        {(players || [])
          .filter(p => p.id !== socket?.id)
          .map(player => (
            <div key={player.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-32 min-w-[120px]">
              <span className="font-medium mb-2">{player.name}</span>
              <div className="flex space-x-2">
                {(player.cards || []).map((card, index) => (
                  <div
                    key={index}
                    className="w-10 h-16 bg-blue-100 rounded-lg border-2 border-blue-300 flex items-center justify-center"
                  >
                    {isSpectator && (
                      <span className="text-xs font-bold">{card.face}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Game Center */}
      <div className="flex items-center justify-center p-4 space-x-8 bg-white shadow-lg">
        {/* Deck */}
        <div className="relative">
          <div className="w-24 h-36 bg-blue-500 rounded-lg shadow-lg" />
          {isMyTurn && topDeckCard && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-36 bg-white rounded-lg shadow-lg border-2 border-blue-300">
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-xl font-bold">{topDeckCard.face}</span>
                  <span className="text-sm text-gray-500">{topDeckCard.suit}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Discard Pile */}
        <div className="relative">
          {discardPileTop ? (
            <div className="w-24 h-36 bg-white rounded-lg shadow-lg border-2 border-blue-300">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-xl font-bold">{discardPileTop.face}</span>
                <span className="text-sm text-gray-500">{discardPileTop.suit}</span>
              </div>
            </div>
          ) : (
            <div className="w-24 h-36 bg-gray-200 rounded-lg" />
          )}
        </div>
      </div>

      {/* Game Controls */}
      {!isSpectator && (
        <GameControls
          isMyTurn={isMyTurn}
          firstTurn={firstTurn}
          gamePhase={gamePhase}
          topDeckCard={topDeckCard}
          handSize={myPlayer?.cards?.length ?? 0}
          onDrawCard={onDrawCard}
          onKeepTopCard={onKeepTopCard}
          onBurnTopCard={onBurnTopCard}
          onKnock={onKnock}
          discardPileTop={discardPileTop}
          canDraw={myPlayer?.canDraw}
          canKnock={myPlayer?.canKnock}
          canDiscard={myPlayer?.canDiscard}
        />
      )}

      {/* My Hand or All Hands for Spectator */}
      {isSpectator ? (
        <div className="p-4 bg-white shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Hands (Spectator)</h2>
          <div className="flex flex-wrap gap-8">
            {(players || []).map(player => (
              <div key={player.id} className="flex flex-col items-center">
                <span className="font-medium mb-1">{player.name}</span>
                <div className="flex space-x-2">
                  {(player.cards || []).map((card, idx) => (
                    <div key={idx} className="w-24 h-36 bg-white rounded-lg shadow-lg border-2 border-blue-500 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold">{card.face}</span>
                      <span className="text-sm text-gray-500">{card.suit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : myPlayer && (
        <div className="p-4 bg-white shadow-lg">
          <PlayerHand
            cards={myPlayer.cards || []}
            isMyTurn={isMyTurn}
            onDiscardCard={onDiscardCard}
            score={myPlayer.score}
            lives={myPlayer.lives}
          />
        </div>
      )}
    </div>
  );
}; 