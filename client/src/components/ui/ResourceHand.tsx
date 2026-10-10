import React from 'react';
import { ResourceType } from '../../shared/types.js';
import { Trees, Box, Wheat, Sprout, Mountain, Award } from 'lucide-react';

interface ResourceHandProps {
  resources: {
    wood: number;
    brick: number;
    wheat: number;
    sheep: number;
    ore: number;
  };
  devCardsTotal: number;
  onOpenDevCards: () => void;
}

const RESOURCE_CARDS: { type: ResourceType; label: string; icon: React.ReactNode; color: string; bg: string; image: string }[] = [
  {
    type: 'wood',
    label: 'Lumber',
    icon: <Trees className="w-5 h-5 text-emerald-400" />,
    color: 'border-emerald-500/40 text-emerald-300',
    bg: 'bg-emerald-950/60 hover:bg-emerald-900/60',
    image: '/textures/forest.jpg',
  },
  {
    type: 'brick',
    label: 'Brick',
    icon: <Box className="w-5 h-5 text-orange-400" />,
    color: 'border-orange-500/40 text-orange-300',
    bg: 'bg-orange-950/60 hover:bg-orange-900/60',
    image: '/textures/brick.jpg',
  },
  {
    type: 'wheat',
    label: 'Wheat',
    icon: <Wheat className="w-5 h-5 text-amber-400" />,
    color: 'border-amber-500/40 text-amber-300',
    bg: 'bg-amber-950/60 hover:bg-amber-900/60',
    image: '/textures/wheat.jpg',
  },
  {
    type: 'sheep',
    label: 'Wool',
    icon: <Sprout className="w-5 h-5 text-lime-400" />,
    color: 'border-lime-500/40 text-lime-300',
    bg: 'bg-lime-950/60 hover:bg-lime-900/60',
    image: '/textures/sheep.jpg',
  },
  {
    type: 'ore',
    label: 'Ore',
    icon: <Mountain className="w-5 h-5 text-slate-300" />,
    color: 'border-slate-500/40 text-slate-200',
    bg: 'bg-slate-900/80 hover:bg-slate-850/80',
    image: '/textures/ore.jpg',
  },
];

export const ResourceHand: React.FC<ResourceHandProps> = ({
  resources,
  devCardsTotal,
  onOpenDevCards,
}) => {
  const total = 
    (resources.wood || 0) + 
    (resources.brick || 0) + 
    (resources.wheat || 0) + 
    (resources.sheep || 0) + 
    (resources.ore || 0);

  return (
    <div className="flex items-end gap-2 pointer-events-auto">
      {/* Resource Cards Hand */}
      <div className="glass-panel p-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-2xl">
        {RESOURCE_CARDS.map((res) => {
          const count = resources[res.type] || 0;
          return (
            <div
              key={res.type}
              style={{
                backgroundImage: `linear-gradient(rgba(10, 15, 29, 0.72), rgba(10, 15, 29, 0.88)), url(${res.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              className={`flex flex-col items-center justify-between w-20 h-28 rounded-xl border p-2 transition-all cursor-default select-none shadow-md ${res.color} ${
                count > 0 ? 'ring-2 ring-white/20 scale-100 hover:scale-105' : 'opacity-40'
              }`}
            >
              <div className="w-full flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider">{res.label.slice(0, 3)}</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-slate-950/90 text-white shadow">
                  {count}
                </span>
              </div>
              <div className="my-auto drop-shadow-md">{res.icon}</div>
              <div className="text-[11px] font-bold text-center w-full truncate drop-shadow">{res.label}</div>
            </div>
          );
        })}

        {/* Development Cards Deck Trigger */}
        <button
          type="button"
          onClick={onOpenDevCards}
          className="flex flex-col items-center justify-between w-16 h-24 rounded-xl border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 p-2 transition-all cursor-pointer relative"
        >
          <div className="w-full flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase">DEV</span>
            <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-slate-950/80 text-purple-300">
              {devCardsTotal}
            </span>
          </div>
          <Award className="w-6 h-6 text-purple-400 my-auto" />
          <div className="text-[10px] font-bold">Cards</div>
        </button>
      </div>
    </div>
  );
};
