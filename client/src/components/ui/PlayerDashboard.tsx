import React from 'react';
import { PLAYER_COLORS_PALETTE, PlayerColor } from '../../shared/types.js';
import { Trophy, Layers, Award, Shield, Crown } from 'lucide-react';

interface PlayerDashboardProps {
  players: any[];
  activePlayerId: string;
  specialBuildIndex: number;
  mySessionId: string;
  gamePhase: string;
  turnOrder: string[];
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  players,
  activePlayerId,
  specialBuildIndex,
  mySessionId,
  gamePhase,
  turnOrder,
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col gap-2">
      {/* Player Cards Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto max-w-full justify-start md:justify-center">
        {players.map((p) => {
          const isActive = p.id === activePlayerId;
          const isMe = p.id === mySessionId;
          const palette = PLAYER_COLORS_PALETTE[p.color as PlayerColor] || PLAYER_COLORS_PALETTE.red;
          const totalCards = 
            (p.resources?.wood || 0) + 
            (p.resources?.brick || 0) + 
            (p.resources?.wheat || 0) + 
            (p.resources?.sheep || 0) + 
            (p.resources?.ore || 0);

          const devCardTotal = 
            (p.devCards?.knight || 0) + 
            (p.devCards?.victoryPoint || 0) + 
            (p.devCards?.roadBuilding || 0) + 
            (p.devCards?.yearOfPlenty || 0) + 
            (p.devCards?.monopoly || 0);

          return (
            <div
              key={p.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 min-w-[170px] ${
                isActive
                  ? 'glass-panel ring-2 ring-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 scale-105'
                  : 'glass-panel-subtle bg-slate-900/70 opacity-90'
              }`}
            >
              {/* Color Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md border-2 border-white/20 relative"
                style={{ backgroundColor: palette.hex }}
              >
                {p.name.slice(0, 2).toUpperCase()}
                {p.hasLargestArmy && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow" title="Largest Army">
                    <Shield className="w-2.5 h-2.5" />
                  </span>
                )}
                {p.hasLongestRoad && (
                  <span className="absolute -bottom-1 -right-1 bg-emerald-400 text-slate-950 p-0.5 rounded-full shadow" title="Longest Road">
                    <Crown className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Name & VP */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                    {p.name}
                    {isMe && <span className="text-[9px] text-amber-400 font-normal">(You)</span>}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <Trophy className="w-3 h-3" /> {p.victoryPoints || 0}
                  </span>
                </div>

                {/* Hand Stats */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                  <span className="flex items-center gap-0.5" title="Resource Cards">
                    <Layers className="w-2.5 h-2.5 text-blue-400" /> {totalCards}
                  </span>
                  <span className="flex items-center gap-0.5" title="Development Cards">
                    <Award className="w-2.5 h-2.5 text-purple-400" /> {devCardTotal}
                  </span>
                  <span className="text-slate-500 text-[9px] ml-auto">
                    {p.roadCount || 0}R/{p.settlementCount || 0}S
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Turn & Phase Banner */}
      <div className="self-center glass-panel px-6 py-2 rounded-full flex items-center gap-3 border border-white/10 shadow-lg pointer-events-auto">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          {gamePhase === 'SETUP_1' && 'Round 1 Setup: Place Settlement & Road'}
          {gamePhase === 'SETUP_2' && 'Round 2 Setup: Place 2nd Settlement & Road (Collect Resources)'}
          {gamePhase === 'ROLL' && 'Turn Action: Roll the Dice'}
          {gamePhase === 'ROBBER_DISCARD' && 'Robber: Discard Excess Cards (> 7 cards)'}
          {gamePhase === 'ROBBER_MOVE' && 'Robber: Move Bandit Figurine'}
          {gamePhase === 'ROBBER_STEAL' && 'Robber: Steal a Resource'}
          {gamePhase === 'MAIN' && 'Main Turn: Trade, Build, or End Turn'}
          {gamePhase === 'SPECIAL_BUILD' && '5-8P Special Building Phase: Players may build!'}
          {gamePhase === 'GAME_OVER' && 'Victory! Island Colonized'}
        </span>
      </div>
    </div>
  );
};
