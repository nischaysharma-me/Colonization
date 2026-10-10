import React, { useState, useEffect } from 'react';
import { gameClient } from './services/gameClient.js';
import { PlayerColor, ResourceType, DevCardType } from './shared/types.js';
import { BoardScene } from './components/3d/BoardScene.js';
import { LobbyScreen } from './components/ui/LobbyScreen.js';
import { PlayerDashboard } from './components/ui/PlayerDashboard.js';
import { ResourceHand } from './components/ui/ResourceHand.js';
import { ActionBar } from './components/ui/ActionBar.js';
import { GameLog } from './components/ui/GameLog.js';
import { BankTradeModal } from './components/ui/BankTradeModal.js';
import { DevCardsModal } from './components/ui/DevCardsModal.js';
import { DiscardModal, StealModal } from './components/ui/RobberModal.js';
import { VictoryModal } from './components/ui/VictoryModal.js';
import { AlertCircle } from 'lucide-react';

import { generateBoard } from './shared/boardGenerator.js';
import { BoardConfig } from './shared/types.js';

export const App: React.FC = () => {
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(() => generateBoard(4));
  const [gameState, setGameState] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<'settlement' | 'city' | 'road' | 'robber' | null>(null);
  const [showBankTrade, setShowBankTrade] = useState(false);
  const [showDevCards, setShowDevCards] = useState(false);
  const [victimIds, setVictimIds] = useState<string[] | null>(null);

  useEffect(() => {
    gameClient.onInitBoardCallback = (config) => {
      if (config) setBoardConfig(config);
    };

    gameClient.onGameStateCallback = (state) => {
      if (state) setGameState(state);
    };

    gameClient.onStateChangeCallback = (state) => {
      if (state && !gameState) {
        setGameState(state);
      }
    };

    gameClient.onErrorCallback = (err) => {
      setErrorMessage(err);
      setTimeout(() => setErrorMessage(null), 4000);
    };

    gameClient.onVictimSelectCallback = (ids) => {
      setVictimIds(ids);
    };

    return () => {
      gameClient.leave();
    };
  }, []);

  const handleJoin = async (name: string, color: PlayerColor, maxPlayers: number, roomId?: string) => {
    try {
      await gameClient.joinOrCreateRoom({ name, color, maxPlayers, roomId });
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to connect to game server');
    }
  };

  const mySessionId = gameClient.room?.sessionId || '';
  const isConnected = !!gameClient.room;

  // Process players
  const playersList: any[] = React.useMemo(() => {
    if (!gameState?.players) return [];
    if (Array.isArray(gameState.players)) return gameState.players;
    if (typeof gameState.players.forEach === 'function') {
      const list: any[] = [];
      gameState.players.forEach((p: any) => list.push(p));
      return list;
    }
    return Object.values(gameState.players);
  }, [gameState?.players]);

  const playersMap = React.useMemo(() => {
    const map = new Map<string, any>();
    playersList.forEach((p: any) => map.set(p.id, p));
    return map;
  }, [playersList]);

  const me = playersMap.get(mySessionId);
  const activePlayer = playersMap.get(gameState?.activePlayerId);
  const isMyTurn = gameState?.activePlayerId === mySessionId;

  const turnOrderList: string[] = React.useMemo(() => {
    if (!gameState?.turnOrder) return [];
    if (Array.isArray(gameState.turnOrder)) return gameState.turnOrder;
    return Array.from(gameState.turnOrder);
  }, [gameState?.turnOrder]);

  const isMySpecialBuildTurn = 
    gameState?.phase === 'SPECIAL_BUILD' && 
    turnOrderList[(turnOrderList.indexOf(gameState.activePlayerId) + 1 + (gameState.specialBuildIndex || 0)) % turnOrderList.length] === mySessionId;

  // Process map entities directly from boardConfig + gameState
  const hexesList = React.useMemo(() => {
    return (boardConfig?.hexes || []).map(h => ({
      ...h,
      hasRobber: gameState?.robberHexId ? h.id === gameState.robberHexId : h.hasRobber
    }));
  }, [boardConfig, gameState?.robberHexId]);

  const verticesList = React.useMemo(() => {
    return Object.values(boardConfig?.vertices || {}).map(v => {
      const b = gameState?.buildings?.[v.id];
      return {
        ...v,
        ownerId: b?.ownerId || v.ownerId || '',
        buildingType: b?.buildingType || v.buildingType || ''
      };
    });
  }, [boardConfig, gameState?.buildings]);

  const edgesList = React.useMemo(() => {
    return Object.values(boardConfig?.edges || {}).map(e => {
      const roadOwner = gameState?.roads?.[e.id] || e.ownerId || '';
      return {
        ...e,
        ownerId: roadOwner
      };
    });
  }, [boardConfig, gameState?.roads]);

  const logsList: any[] = React.useMemo(() => {
    if (!gameState?.logs) return [];
    if (Array.isArray(gameState.logs)) return gameState.logs;
    return Array.from(gameState.logs);
  }, [gameState?.logs]);

  const isInLobby = !gameState || gameState.phase === 'LOBBY';

  // Handle Board Node Clicks
  const handleSelectVertex = (vertexId: string) => {
    if (gameState.phase === 'SETUP_1' || gameState.phase === 'SETUP_2') {
      gameClient.buildSettlement(vertexId);
    } else if (placementMode === 'settlement') {
      gameClient.buildSettlement(vertexId);
      setPlacementMode(null);
    } else if (placementMode === 'city') {
      gameClient.buildCity(vertexId);
      setPlacementMode(null);
    }
  };

  const handleSelectEdge = (edgeId: string) => {
    if (gameState.phase === 'SETUP_1' || gameState.phase === 'SETUP_2') {
      gameClient.buildRoad(edgeId);
    } else if (placementMode === 'road') {
      gameClient.buildRoad(edgeId);
      setPlacementMode(null);
    }
  };

  const handleSelectHex = (hexId: string) => {
    if (gameState.phase === 'ROBBER_MOVE' || placementMode === 'robber') {
      gameClient.moveRobber(hexId);
      setPlacementMode(null);
    }
  };

  // If in Lobby
  if (isInLobby) {
    return (
      <LobbyScreen
        players={playersList}
        mySessionId={mySessionId}
        onJoin={handleJoin}
        onToggleReady={() => gameClient.toggleReady()}
        onChangeColor={(c) => gameClient.changeColor(c)}
        onStartGame={() => gameClient.startGame()}
        isConnected={isConnected}
      />
    );
  }

  const myResources: Record<ResourceType, number> = {
    wood: me?.resources?.wood || 0,
    brick: me?.resources?.brick || 0,
    wheat: me?.resources?.wheat || 0,
    sheep: me?.resources?.sheep || 0,
    ore: me?.resources?.ore || 0,
  };

  const myDevCards = {
    knight: me?.devCards?.knight || 0,
    victoryPoint: me?.devCards?.victoryPoint || 0,
    roadBuilding: me?.devCards?.roadBuilding || 0,
    yearOfPlenty: me?.devCards?.yearOfPlenty || 0,
    monopoly: me?.devCards?.monopoly || 0,
  };

  const totalDevCards = Object.values(myDevCards).reduce((a, b) => a + b, 0);

  const needsToDiscard = 
    gameState.phase === 'ROBBER_DISCARD' && 
    Object.values(myResources).reduce((a, b) => a + b, 0) > 7;

  const winner = gameState.winnerId ? playersMap.get(gameState.winnerId) : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 3D R3F Canvas Board */}
      <BoardScene
        hexes={hexesList}
        vertices={verticesList}
        edges={edgesList}
        playersMap={playersMap}
        activePlayerColor={activePlayer?.color}
        isMyTurn={isMyTurn}
        gamePhase={gameState.phase}
        placementMode={placementMode}
        onSelectVertex={handleSelectVertex}
        onSelectEdge={handleSelectEdge}
        onSelectHex={handleSelectHex}
      />

      {/* Top Players Ribbon & Phase Banner */}
      <PlayerDashboard
        players={playersList}
        activePlayerId={gameState.activePlayerId}
        specialBuildIndex={gameState.specialBuildIndex}
        mySessionId={mySessionId}
        gamePhase={gameState.phase}
        turnOrder={gameState.turnOrder ? Array.from(gameState.turnOrder) : []}
      />

      {/* Side Game Chronicle Log */}
      <GameLog logs={logsList} />

      {/* Error / Alert Toast */}
      {errorMessage && (
        <div className="absolute top-20 right-4 z-40 glass-panel px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-950/80 text-rose-200 flex items-center gap-2.5 shadow-xl animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end justify-between pointer-events-none">
        {/* Left: Player Hand */}
        <ResourceHand
          resources={myResources}
          devCardsTotal={totalDevCards}
          onOpenDevCards={() => setShowDevCards(true)}
        />

        {/* Right: Actions, Dice, Building */}
        <ActionBar
          gamePhase={gameState.phase}
          isMyTurn={isMyTurn}
          isMySpecialBuildTurn={isMySpecialBuildTurn}
          dice1={gameState.dice1 || 1}
          dice2={gameState.dice2 || 1}
          resources={myResources}
          placementMode={placementMode}
          onSetPlacementMode={setPlacementMode}
          onRollDice={() => gameClient.rollDice()}
          onBuyDevCard={() => gameClient.buyDevCard()}
          onOpenBankTrade={() => setShowBankTrade(true)}
          onEndTurn={() => gameClient.endTurn()}
          onPassSpecialBuild={() => gameClient.passSpecialBuild()}
        />
      </div>

      {/* Bank & Port Trade Modal */}
      {showBankTrade && (
        <BankTradeModal
          resources={myResources}
          onClose={() => setShowBankTrade(false)}
          onTrade={(give, rec) => gameClient.bankTrade(give, rec)}
        />
      )}

      {/* Dev Cards Modal */}
      {showDevCards && (
        <DevCardsModal
          devCards={myDevCards}
          isMyTurn={isMyTurn}
          gamePhase={gameState.phase}
          onClose={() => setShowDevCards(false)}
          onPlayDevCard={(card, params) => gameClient.playDevCard(card, params)}
        />
      )}

      {/* Robber Discard Modal */}
      {needsToDiscard && (
        <DiscardModal
          resources={myResources}
          onDiscard={(discard) => gameClient.discardCards(discard)}
        />
      )}

      {/* Robber Steal Victim Modal */}
      {victimIds && victimIds.length > 0 && (
        <StealModal
          victimIds={victimIds}
          playersMap={playersMap}
          onSteal={(victimId) => {
            gameClient.stealCard(victimId);
            setVictimIds(null);
          }}
        />
      )}

      {/* Victory Modal */}
      {gameState.phase === 'GAME_OVER' && winner && (
        <VictoryModal
          winner={winner}
          players={playersList}
          onPlayAgain={() => {
            gameClient.leave();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
