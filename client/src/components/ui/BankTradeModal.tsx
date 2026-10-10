import React, { useState } from 'react';
import { ResourceType } from '../../shared/types.js';
import { X, ArrowRightLeft } from 'lucide-react';

interface BankTradeModalProps {
  resources: Record<ResourceType, number>;
  onClose: () => void;
  onTrade: (give: ResourceType, receive: ResourceType) => void;
}

const RESOURCES: ResourceType[] = ['wood', 'brick', 'wheat', 'sheep', 'ore'];

export const BankTradeModal: React.FC<BankTradeModalProps> = ({
  resources,
  onClose,
  onTrade,
}) => {
  const [give, setGive] = useState<ResourceType>('wood');
  const [receive, setReceive] = useState<ResourceType>('wheat');

  const available = resources[give] || 0;
  // Standard bank trade is 4:1 (harbor discounts handled on server)
  const canTrade = available >= 4 && give !== receive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2 mb-1">
          <ArrowRightLeft className="w-5 h-5 text-amber-400" /> Maritime & Bank Trade
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Trade surplus resources with the bank (4:1) or via your coastal harbor docks (3:1 or 2:1).
        </p>

        {/* Give Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Give (You have {available} {give})
          </label>
          <div className="grid grid-cols-5 gap-2">
            {RESOURCES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setGive(r)}
                className={`py-2 px-1 rounded-xl border text-center transition-all ${
                  give === r
                    ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs capitalize">{r}</div>
                <div className="text-[10px] text-slate-400">{resources[r] || 0}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Receive Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Receive (1 resource)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {RESOURCES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReceive(r)}
                disabled={r === give}
                className={`py-2 px-1 rounded-xl border text-center transition-all ${
                  receive === r
                    ? 'border-emerald-400 bg-emerald-400/20 text-white font-bold'
                    : r === give
                    ? 'border-slate-800 bg-slate-950/40 text-slate-600 opacity-40 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs capitalize">{r}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canTrade}
          onClick={() => {
            onTrade(give, receive);
            onClose();
          }}
          className={`w-full py-3 rounded-xl font-bold font-cinzel text-sm tracking-wider transition-all ${
            canTrade
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          Execute Trade
        </button>
      </div>
    </div>
  );
};
