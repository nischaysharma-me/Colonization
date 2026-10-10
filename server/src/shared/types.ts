export type ResourceType = 'wood' | 'brick' | 'wheat' | 'sheep' | 'ore';
export type HexType = ResourceType | 'desert' | 'water';

export type HarborType = 'threeToOne' | ResourceType;

export type DevCardType = 'knight' | 'victoryPoint' | 'roadBuilding' | 'yearOfPlenty' | 'monopoly';

export type PlayerColor = 
  | 'red' 
  | 'blue' 
  | 'orange' 
  | 'white' 
  | 'green' 
  | 'brown' 
  | 'purple' 
  | 'cyan';

export const PLAYER_COLORS_PALETTE: Record<PlayerColor, { hex: string; name: string }> = {
  red: { hex: '#ef4444', name: 'Crimson Red' },
  blue: { hex: '#3b82f6', name: 'Royal Blue' },
  orange: { hex: '#f97316', name: 'Solar Orange' },
  white: { hex: '#f8fafc', name: 'Pure White' },
  green: { hex: '#22c55e', name: 'Emerald Green' },
  brown: { hex: '#854d0e', name: 'Timber Brown' },
  purple: { hex: '#a855f7', name: 'Mystic Purple' },
  cyan: { hex: '#06b6d4', name: 'Arctic Cyan' },
};

export const COLOR_ORDER: PlayerColor[] = [
  'red', 'blue', 'orange', 'white', 'green', 'brown', 'purple', 'cyan'
];

export type GamePhase = 
  | 'LOBBY'
  | 'SETUP_1'
  | 'SETUP_2'
  | 'ROLL'
  | 'ROBBER_DISCARD'
  | 'ROBBER_MOVE'
  | 'ROBBER_STEAL'
  | 'MAIN'
  | 'SPECIAL_BUILD'
  | 'GAME_OVER';

export interface HexCoordinate {
  q: number;
  r: number;
  s: number;
}

export interface HexTileData {
  id: string;
  q: number;
  r: number;
  type: HexType;
  number?: number;
  hasRobber: boolean;
  x: number;
  z: number;
  harbor?: {
    type: HarborType;
    vertexA: string;
    vertexB: string;
    rotation: number;
  };
}

export interface VertexData {
  id: string;
  x: number;
  z: number;
  hexIds: string[];
  adjacentVertexIds: string[];
  adjacentEdgeIds: string[];
  ownerId?: string;
  buildingType?: 'settlement' | 'city';
}

export interface EdgeData {
  id: string;
  vertexA: string;
  vertexB: string;
  x: number;
  z: number;
  rotation: number;
  hexIds: string[];
  ownerId?: string;
}

export interface PlayerResources {
  wood: number;
  brick: number;
  wheat: number;
  sheep: number;
  ore: number;
}

export interface PlayerDevCards {
  knight: number;
  victoryPoint: number;
  roadBuilding: number;
  yearOfPlenty: number;
  monopoly: number;
}

export interface TradeOffer {
  senderId: string;
  giving: Partial<PlayerResources>;
  wanting: Partial<PlayerResources>;
  acceptedBy: string[];
}

export interface BoardConfig {
  maxPlayers: number; // 4, 6, or 8
  gridRadius: number;
  hexes: HexTileData[];
  vertices: Record<string, VertexData>;
  edges: Record<string, EdgeData>;
}

export const BUILDING_COSTS: Record<'road' | 'settlement' | 'city' | 'devCard', Partial<PlayerResources>> = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, wheat: 1, sheep: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { wheat: 1, sheep: 1, ore: 1 },
};
