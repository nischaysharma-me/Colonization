import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw } from 'lucide-react';
import { PLAYER_COLORS_PALETTE, PlayerColor } from '../../shared/types.js';

interface VictoryModalProps {
  winner: any;
  players: any[];
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  players,
  onPlayAgain,
}) => {
  useEffect(() => {
    // Fire celebratory confetti!
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const palette = winner ? PLAYER_COLORS_PALETTE[winner.color as PlayerColor] || PLAYER_COLORS_PALETTE.red : PLAYER_COLORS_PALETTE.red;

  // Sort players by Victory Points descending
  const sortedPlayers = [...players].sort((a, b) => (b.victoryPoints || 0) - (a.victoryPoints || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-amber-500/40 shadow-2xl text-center relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/40 mb-4 animate-bounce">
          <Trophy className="w-10 h-10 text-slate-950" />
        </div>

        <span className="text-amber-400 font-cinzel text-xs uppercase tracking-widest font-black">
          The Island Has Been Conquered
        </span>
        <h2 className="text-4xl font-extrabold font-cinzel text-white mt-1 mb-2">
          {winner?.name}
        </h2>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-semibold border border-amber-500/30 mb-6">
          <Crown className="w-4 h-4 text-amber-400" />
          Ruler of Colonization ({winner?.victoryPoints || 10} VP)
        </div>

        {/* Final Standings */}
        <div className="space-y-2 mb-8 text-left">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400 px-2">
            Final Standings
          </div>
          <div className="space-y-1.5">
            {sortedPlayers.map((p, rank) => {
              const pPalette = PLAYER_COLORS_PALETTE[p.color as PlayerColor] || PLAYER_COLORS_PALETTE.red;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    rank === 0
                      ? 'bg-amber-500/15 border-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-400 w-4">#{rank + 1}</span>
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pPalette.hex }}
                    />
                    <span className="font-semibold text-sm text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-amber-400">{p.victoryPoints || 0} VP</span>
                    <span className="text-slate-500 font-normal text-[11px]">
                      {p.cityCount || 0}C / {p.settlementCount || 0}S / {p.roadCount || 0}R
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-cinzel text-base tracking-wider shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> Play New Expedition
        </button>
      </div>
    </div>
  );
};
