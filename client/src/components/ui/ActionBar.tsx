import React from 'react';
import { BUILDING_COSTS, ResourceType } from '../../shared/types.js';
import { 
  Dices, 
  Hammer, 
  ArrowRight, 
  Repeat, 
  X, 
  Home, 
  Building2, 
  GitCommit, 
  Sparkles, 
  Check 
} from 'lucide-react';

interface ActionBarProps {
  gamePhase: string;
  isMyTurn: boolean;
  isMySpecialBuildTurn: boolean;
  dice1: number;
  dice2: number;
  resources: Record<ResourceType, number>;
  placementMode: 'settlement' | 'city' | 'road' | 'robber' | null;
  onSetPlacementMode: (mode: 'settlement' | 'city' | 'road' | 'robber' | null) => void;
  onRollDice: () => void;
  onBuyDevCard: () => void;
  onOpenBankTrade: () => void;
  onEndTurn: () => void;
  onPassSpecialBuild: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  gamePhase,
  isMyTurn,
  isMySpecialBuildTurn,
  dice1,
  dice2,
  resources,
  placementMode,
  onSetPlacementMode,
  onRollDice,
  onBuyDevCard,
  onOpenBankTrade,
  onEndTurn,
  onPassSpecialBuild,
}) => {
  const canAfford = (cost: Partial<Record<ResourceType, number>>) => {
    return Object.entries(cost).every(([res, count]) => (resources[res as ResourceType] || 0) >= (count || 0));
  };

  const canBuildRoad = canAfford(BUILDING_COSTS.road);
  const canBuildSettlement = canAfford(BUILDING_COSTS.settlement);
  const canBuildCity = canAfford(BUILDING_COSTS.city);
  const canBuyDevCard = canAfford(BUILDING_COSTS.devCard);

  const isSetup = gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2';
  const isMainActionTime = (isMyTurn && gamePhase === 'MAIN') || isMySpecialBuildTurn;

  return (
    <div className="flex items-center gap-3 pointer-events-auto">
      {/* Dice Roller Display & Trigger */}
      <div className="glass-panel p-2.5 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
        {/* Dice Faces */}
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-lg flex items-center justify-center shadow border border-slate-300">
            {dice1}
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-lg flex items-center justify-center shadow border border-slate-300">
            {dice2}
          </div>
          <div className="text-xs font-black text-amber-400 px-1">
            = {dice1 + dice2}
          </div>
        </div>

        {/* Roll Button */}
        {gamePhase === 'ROLL' && isMyTurn && (
          <button
            type="button"
            onClick={onRollDice}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-cinzel text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105"
          >
            <Dices className="w-5 h-5" /> Roll Dice
          </button>
        )}
      </div>

      {/* Building Actions during Main or Special Build */}
      {isMainActionTime && (
        <div className="glass-panel p-2 rounded-2xl flex items-center gap-1.5 border border-white/10 shadow-2xl">
          {/* Road */}
          <button
            type="button"
            disabled={!canBuildRoad && placementMode !== 'road'}
            onClick={() => onSetPlacementMode(placementMode === 'road' ? null : 'road')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              placementMode === 'road'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-white'
                : canBuildRoad
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-900/60 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Cost: 1 Wood, 1 Brick"
          >
            <GitCommit className="w-4 h-4" /> Road
          </button>

          {/* Settlement */}
          <button
            type="button"
            disabled={!canBuildSettlement && placementMode !== 'settlement'}
            onClick={() => onSetPlacementMode(placementMode === 'settlement' ? null : 'settlement')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              placementMode === 'settlement'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-white'
                : canBuildSettlement
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-900/60 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Cost: 1 Wood, 1 Brick, 1 Wheat, 1 Wool"
          >
            <Home className="w-4 h-4" /> Settlement
          </button>

          {/* City */}
          <button
            type="button"
            disabled={!canBuildCity && placementMode !== 'city'}
            onClick={() => onSetPlacementMode(placementMode === 'city' ? null : 'city')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              placementMode === 'city'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-white'
                : canBuildCity
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-900/60 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Cost: 2 Wheat, 3 Ore"
          >
            <Building2 className="w-4 h-4" /> City
          </button>

          {/* Dev Card */}
          <button
            type="button"
            disabled={!canBuyDevCard}
            onClick={onBuyDevCard}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              canBuyDevCard
                ? 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700'
                : 'bg-slate-900/60 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Cost: 1 Wheat, 1 Wool, 1 Ore"
          >
            <Sparkles className="w-4 h-4 text-purple-400" /> Buy Dev Card
          </button>

          {/* Trade Button */}
          <button
            type="button"
            onClick={onOpenBankTrade}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Repeat className="w-4 h-4 text-cyan-400" /> Trade
          </button>
        </div>
      )}

      {/* Placement Mode Active Indicator Banner */}
      {placementMode && (
        <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 border border-amber-500/50 bg-amber-500/10">
          <span className="text-xs text-amber-300 font-semibold">
            Click map to place {placementMode.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => onSetPlacementMode(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* End Turn / Pass Special Build */}
      {isMyTurn && gamePhase === 'MAIN' && (
        <button
          type="button"
          onClick={onEndTurn}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold font-cinzel text-xs tracking-wider border border-white/10 shadow-xl transition-all"
        >
          End Turn <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* Pass Special Build */}
      {isMySpecialBuildTurn && (
        <button
          type="button"
          onClick={onPassSpecialBuild}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold font-cinzel text-xs tracking-wider border border-white/10 shadow-xl transition-all"
        >
          Pass Special Build <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
