import React, { useState } from 'react';
import { 
  COLOR_ORDER, 
  PLAYER_COLORS_PALETTE, 
  PlayerColor 
} from '../../shared/types.js';
import { Users, Crown, Shield, Play, CheckCircle2, Circle } from 'lucide-react';

interface LobbyScreenProps {
  players: any[];
  mySessionId: string;
  onJoin: (name: string, color: PlayerColor, maxPlayers: number, roomId?: string) => void;
  onToggleReady: () => void;
  onChangeColor: (color: PlayerColor) => void;
  onStartGame: () => void;
  isConnected: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  players,
  mySessionId,
  onJoin,
  onToggleReady,
  onChangeColor,
  onStartGame,
  isConnected,
}) => {
  const [name, setName] = useState(`Settler ${Math.floor(Math.random() * 900 + 100)}`);
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [roomIdInput, setRoomIdInput] = useState('');

  const me = players.find(p => p.id === mySessionId);
  const isHost = players.length > 0 && players[0].id === mySessionId;
  const canStart = isHost && players.length >= 1;

  const takenColors = players.map(p => p.color);

  if (!isConnected) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
        {/* Background ambient pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-lg glass-panel rounded-2xl p-8 relative z-10 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <span className="text-amber-500 font-cinzel text-xs uppercase tracking-widest font-bold">3D Multiplayer Strategy</span>
            <h1 className="text-4xl font-extrabold font-cinzel tracking-wider text-slate-100 mt-1">
              COLONIZATION
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Rule the island with 4 to 8 players. Build settlements, trade resources, and conquer!
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoin(name, selectedColor, maxPlayers, roomIdInput.trim() || undefined);
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Settler Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Player Capacity & Island Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 4, label: '4 Players', desc: '19 Hexes (Standard)' },
                  { count: 6, label: '6 Players', desc: '30 Hexes (Extended)' },
                  { count: 8, label: '8 Players', desc: '44 Hexes (Grand)' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setMaxPlayers(item.count)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      maxPlayers === item.count
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-200">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Player Color Banner
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {COLOR_ORDER.map((c) => {
                  const palette = PLAYER_COLORS_PALETTE[c];
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-white bg-white/10 ring-2 ring-white/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-md"
                        style={{ backgroundColor: palette.hex }}
                      />
                      <span className="text-xs font-medium text-slate-300 truncate">
                        {palette.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Room ID (Optional)
              </label>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                placeholder="Leave blank to create or join public room"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-cinzel text-base tracking-wider shadow-lg shadow-amber-600/25 transition-all transform hover:-translate-y-0.5"
            >
              Enter Game Lobby
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Inside Room Lobby
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="w-full max-w-2xl glass-panel rounded-2xl p-8 relative z-10 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
          <div>
            <span className="text-amber-500 font-cinzel text-xs uppercase tracking-widest font-bold">Multiplayer Gathering</span>
            <h2 className="text-3xl font-extrabold font-cinzel text-slate-100 tracking-wide">
              EXPEDITION LOBBY
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">
              {players.length} / {players[0]?.maxPlayers || 8} Settlers
            </span>
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-3 mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
            Voyagers in Room
          </div>
          <div className="grid gap-2.5">
            {players.map((p, index) => {
              const palette = PLAYER_COLORS_PALETTE[p.color as PlayerColor] || PLAYER_COLORS_PALETTE.red;
              const isMe = p.id === mySessionId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow"
                      style={{ backgroundColor: palette.hex }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                        {p.name}
                        {index === 0 && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 inline" />
                        )}
                        {isMe && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: palette.hex }} />
                        {palette.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.isReady ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
                        <Circle className="w-3.5 h-3.5 text-slate-500" /> Waiting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Color Bar if in room */}
        {me && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Pick your color
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_ORDER.map((c) => {
                const palette = PLAYER_COLORS_PALETTE[c];
                const isTaken = takenColors.includes(c) && me.color !== c;
                const isSelected = me.color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isTaken}
                    onClick={() => onChangeColor(c)}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                      isSelected
                        ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg'
                        : isTaken
                        ? 'opacity-20 cursor-not-allowed'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.hex }}
                    title={palette.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleReady}
            className={`flex-1 py-3.5 px-6 rounded-xl font-bold font-cinzel text-sm tracking-wider transition-all border ${
              me?.isReady
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
            }`}
          >
            {me?.isReady ? 'Unready' : 'Ready Up'}
          </button>

          {isHost && (
            <button
              type="button"
              disabled={!canStart}
              onClick={onStartGame}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold font-cinzel text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${
                canStart
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game ({players.length} Players)
            </button>
          )}
        </div>

        {isHost && players.length < 2 && (
          <p className="text-center text-xs text-amber-400/80 mt-3">
            Tip: You can start now to explore the map solo, or open another tab to test multiplayer!
          </p>
        )}
      </div>
    </div>
  );
};
