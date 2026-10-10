import React, { useState } from 'react';
import { DevCardType, ResourceType } from '../../shared/types.js';
import { X, Shield, Award, Sparkles, Navigation, Coins } from 'lucide-react';

interface DevCardsModalProps {
  devCards: {
    knight: number;
    victoryPoint: number;
    roadBuilding: number;
    yearOfPlenty: number;
    monopoly: number;
  };
  isMyTurn: boolean;
  gamePhase: string;
  onClose: () => void;
  onPlayDevCard: (card: DevCardType, params?: any) => void;
}

const RESOURCES: ResourceType[] = ['wood', 'brick', 'wheat', 'sheep', 'ore'];

export const DevCardsModal: React.FC<DevCardsModalProps> = ({
  devCards,
  isMyTurn,
  gamePhase,
  onClose,
  onPlayDevCard,
}) => {
  const [selectedCard, setSelectedCard] = useState<DevCardType | null>(null);
  const [yopRes1, setYopRes1] = useState<ResourceType>('wood');
  const [yopRes2, setYopRes2] = useState<ResourceType>('ore');
  const [monopolyRes, setMonopolyRes] = useState<ResourceType>('ore');

  const canPlay = isMyTurn && gamePhase === 'MAIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-400" /> Development Cards
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Powerful tactical assets acquired during your expedition.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Knight */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" /> Knight
                </span>
                <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  x{devCards.knight}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Move the robber and steal 1 resource card. Counts toward Largest Army (3+ needed).
              </p>
            </div>
            {devCards.knight > 0 && canPlay && (
              <button
                type="button"
                onClick={() => {
                  onPlayDevCard('knight');
                  onClose();
                }}
                className="mt-3 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Play Knight
              </button>
            )}
          </div>

          {/* Victory Point */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> Victory Point
                </span>
                <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  x{devCards.victoryPoint}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grants +1 Victory Point toward your win threshold (automatically active).
              </p>
            </div>
            <div className="mt-3 text-[10px] text-emerald-400 font-semibold uppercase text-center bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-500/20">
              Active in score
            </div>
          </div>

          {/* Year of Plenty */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" /> Year of Plenty
                </span>
                <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  x{devCards.yearOfPlenty}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Take any 2 resource cards from the bank into your hand.
              </p>
            </div>
            {devCards.yearOfPlenty > 0 && canPlay && (
              <div className="mt-3 space-y-1.5">
                <div className="flex gap-1">
                  <select
                    value={yopRes1}
                    onChange={(e) => setYopRes1(e.target.value as ResourceType)}
                    className="flex-1 bg-slate-800 text-[10px] rounded p-1 text-slate-200"
                  >
                    {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    value={yopRes2}
                    onChange={(e) => setYopRes2(e.target.value as ResourceType)}
                    className="flex-1 bg-slate-800 text-[10px] rounded p-1 text-slate-200"
                  >
                    {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onPlayDevCard('yearOfPlenty', { res1: yopRes1, res2: yopRes2 });
                    onClose();
                  }}
                  className="w-full py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Claim 2 Resources
                </button>
              </div>
            )}
          </div>

          {/* Monopoly */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-cyan-400" /> Monopoly
                </span>
                <span className="text-xs font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  x{devCards.monopoly}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Declare 1 resource. All opponents must forfeit all cards of that type to you!
              </p>
            </div>
            {devCards.monopoly > 0 && canPlay && (
              <div className="mt-3 space-y-1.5">
                <select
                  value={monopolyRes}
                  onChange={(e) => setMonopolyRes(e.target.value as ResourceType)}
                  className="w-full bg-slate-800 text-[10px] rounded p-1 text-slate-200"
                >
                  {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    onPlayDevCard('monopoly', { resource: monopolyRes });
                    onClose();
                  }}
                  className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Declare Monopoly
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
