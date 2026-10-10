import React, { useState } from 'react';
import { Scroll, ChevronDown, ChevronUp } from 'lucide-react';

interface GameLogProps {
  logs: any[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute top-20 left-4 z-20 pointer-events-auto max-w-xs w-72">
      <div className="glass-panel rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full px-3.5 py-2 flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/80 transition-colors border-b border-white/5"
        >
          <span className="text-xs font-bold font-cinzel text-slate-200 flex items-center gap-1.5">
            <Scroll className="w-3.5 h-3.5 text-amber-400" /> Expedition Chronicle
          </span>
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {!collapsed && (
          <div className="p-3 max-h-48 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No events recorded yet...</div>
            ) : (
              logs.slice(-25).reverse().map((log) => (
                <div key={log.id} className="text-slate-300">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                    style={{ backgroundColor: log.color || '#cbd5e1' }}
                  />
                  {log.text}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
