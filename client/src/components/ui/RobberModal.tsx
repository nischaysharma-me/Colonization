import React, { useState } from 'react';
import { ResourceType, PLAYER_COLORS_PALETTE, PlayerColor } from '../../shared/types.js';
import { Skull, AlertTriangle, Users } from 'lucide-react';

interface DiscardModalProps {
  resources: Record<ResourceType, number>;
  onDiscard: (discard: Partial<Record<ResourceType, number>>) => void;
}

const RESOURCES: ResourceType[] = ['wood', 'brick', 'wheat', 'sheep', 'ore'];

export const DiscardModal: React.FC<DiscardModalProps> = ({
  resources,
  onDiscard,
}) => {
  const totalCards = 
    (resources.wood || 0) + 
    (resources.brick || 0) + 
    (resources.wheat || 0) + 
    (resources.sheep || 0) + 
    (resources.ore || 0);

  const targetDiscard = Math.floor(totalCards / 2);

  const [selected, setSelected] = useState<Record<ResourceType, number>>({
    wood: 0,
    brick: 0,
    wheat: 0,
    sheep: 0,
    ore: 0,
  });

  const currentSelectedCount = Object.values(selected).reduce((a, b) => a + b, 0);

  const handleAdjust = (res: ResourceType, delta: number) => {
    const current = selected[res];
    const available = resources[res] || 0;
    const next = current + delta;
    if (next >= 0 && next <= available && (delta < 0 || currentSelectedCount < targetDiscard)) {
      setSelected(prev => ({ ...prev, [res]: next }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl">
        <div className="flex items-center gap-3 text-rose-400 mb-2">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
          <h3 className="text-xl font-bold font-cinzel text-white">Robber Attack!</h3>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          A 7 was rolled! You have {totalCards} cards in hand. You must discard half ({targetDiscard} cards).
        </p>

        <div className="space-y-2 mb-6">
          {RESOURCES.map((r) => {
            const count = resources[r] || 0;
            const chosen = selected[r];
            if (count === 0) return null;
            return (
              <div key={r} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold capitalize text-slate-200">
                  {r} (Have: {count})
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjust(r, -1)}
                    disabled={chosen === 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center text-rose-400">{chosen}</span>
                  <button
                    type="button"
                    onClick={() => handleAdjust(r, 1)}
                    disabled={chosen === count || currentSelectedCount >= targetDiscard}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentSelectedCount !== targetDiscard}
          onClick={() => onDiscard(selected)}
          className={`w-full py-3 rounded-xl font-bold font-cinzel text-sm tracking-wider transition-all ${
            currentSelectedCount === targetDiscard
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          Confirm Discard ({currentSelectedCount}/{targetDiscard})
        </button>
      </div>
    </div>
  );
};

interface StealModalProps {
  victimIds: string[];
  playersMap: Map<string, any>;
  onSteal: (victimId: string) => void;
}

export const StealModal: React.FC<StealModalProps> = ({
  victimIds,
  playersMap,
  onSteal,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-amber-500/30 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <Skull className="w-5 h-5" />
          <h3 className="text-xl font-bold font-cinzel text-white">Steal a Resource</h3>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Choose a rival settler adjacent to the newly placed Robber to steal a random card from:
        </p>

        <div className="space-y-2 mb-4">
          {victimIds.map((id) => {
            const p = playersMap.get(id);
            if (!p) return null;
            const palette = PLAYER_COLORS_PALETTE[p.color as PlayerColor] || PLAYER_COLORS_PALETTE.red;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSteal(id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500 hover:bg-amber-500/10 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: palette.hex }}
                  />
                  <span className="font-semibold text-sm text-slate-100">{p.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {p.resources?.wood + p.resources?.brick + p.resources?.wheat + p.resources?.sheep + p.resources?.ore} cards
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
