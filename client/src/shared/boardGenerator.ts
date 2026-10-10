import { 
  BoardConfig, 
  HexTileData, 
  HexType, 
  HarborType, 
  VertexData, 
  EdgeData, 
  ResourceType 
} from './types.js';

export const HEX_RADIUS = 2.2;

interface AxialCoord {
  q: number;
  r: number;
}

function getHexGridCoords(radius: number, maxHexCount?: number): AxialCoord[] {
  const coords: AxialCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r });
    }
  }

  coords.sort((a, b) => {
    const distA = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.q + a.r));
    const distB = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
    if (distA !== distB) return distA - distB;
    return Math.atan2(a.r, a.q) - Math.atan2(b.r, b.q);
  });

  if (maxHexCount && coords.length > maxHexCount) {
    return coords.slice(0, maxHexCount);
  }
  return coords;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateBoard(maxPlayers: number = 4): BoardConfig {
  let coords: AxialCoord[];
  let tileTypes: HexType[];
  let numbers: number[];

  if (maxPlayers <= 4) {
    coords = getHexGridCoords(2, 19);
    tileTypes = shuffle([
      'wood', 'wood', 'wood', 'wood',
      'wheat', 'wheat', 'wheat', 'wheat',
      'sheep', 'sheep', 'sheep', 'sheep',
      'brick', 'brick', 'brick',
      'ore', 'ore', 'ore',
      'desert'
    ]);
    numbers = shuffle([
      2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
    ]);
  } else if (maxPlayers <= 6) {
    coords = getHexGridCoords(3, 30);
    tileTypes = shuffle([
      'wood', 'wood', 'wood', 'wood', 'wood', 'wood',
      'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat',
      'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep',
      'brick', 'brick', 'brick', 'brick', 'brick',
      'ore', 'ore', 'ore', 'ore', 'ore',
      'desert', 'desert'
    ]);
    numbers = shuffle([
      2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6,
      8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12
    ]);
  } else {
    coords = getHexGridCoords(3, 44);
    tileTypes = shuffle([
      'wood', 'wood', 'wood', 'wood', 'wood', 'wood', 'wood', 'wood', 'wood',
      'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat',
      'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep', 'sheep',
      'brick', 'brick', 'brick', 'brick', 'brick', 'brick', 'brick', 'brick',
      'ore', 'ore', 'ore', 'ore', 'ore', 'ore', 'ore',
      'desert', 'desert'
    ]);
    numbers = shuffle([
      2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6,
      8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 12, 12, 12,
      3, 4, 5, 8, 9, 10
    ]);
  }

  let numberIndex = 0;
  const hexes: HexTileData[] = [];
  const vertices: Record<string, VertexData> = {};
  const edges: Record<string, EdgeData> = {};

  const round = (n: number) => Math.round(n * 100) / 100;
  const vertexKey = (x: number, z: number) => `v_${round(x).toFixed(2)}_${round(z).toFixed(2)}`;
  const edgeKey = (v1: string, v2: string) => {
    return v1 < v2 ? `e_${v1}__${v2}` : `e_${v2}__${v1}`;
  };

  coords.forEach((coord, i) => {
    const type = tileTypes[i];
    const isDesert = type === 'desert';
    const number = isDesert ? undefined : numbers[numberIndex++];
    
    const x = HEX_RADIUS * Math.sqrt(3) * (coord.q + coord.r / 2);
    const z = HEX_RADIUS * 1.5 * coord.r;
    const hexId = `hex_${coord.q}_${coord.r}`;

    hexes.push({
      id: hexId,
      q: coord.q,
      r: coord.r,
      type,
      number,
      hasRobber: isDesert,
      x: round(x),
      z: round(z),
    });

    const hexVertexKeys: string[] = [];
    for (let corner = 0; corner < 6; corner++) {
      const angleDeg = 30 + 60 * corner;
      const angleRad = (Math.PI / 180) * angleDeg;
      const vx = x + HEX_RADIUS * Math.cos(angleRad);
      const vz = z + HEX_RADIUS * Math.sin(angleRad);
      const vKey = vertexKey(vx, vz);
      hexVertexKeys.push(vKey);

      if (!vertices[vKey]) {
        vertices[vKey] = {
          id: vKey,
          x: round(vx),
          z: round(vz),
          hexIds: [],
          adjacentVertexIds: [],
          adjacentEdgeIds: []
        };
      }
      if (!vertices[vKey].hexIds.includes(hexId)) {
        vertices[vKey].hexIds.push(hexId);
      }
    }

    for (let c = 0; c < 6; c++) {
      const v1 = hexVertexKeys[c];
      const v2 = hexVertexKeys[(c + 1) % 6];
      const eKey = edgeKey(v1, v2);

      const vx1 = vertices[v1].x;
      const vz1 = vertices[v1].z;
      const vx2 = vertices[v2].x;
      const vz2 = vertices[v2].z;
      const midX = round((vx1 + vx2) / 2);
      const midZ = round((vz1 + vz2) / 2);
      const rotation = round(Math.atan2(vz2 - vz1, vx2 - vx1));

      if (!edges[eKey]) {
        edges[eKey] = {
          id: eKey,
          vertexA: v1 < v2 ? v1 : v2,
          vertexB: v1 < v2 ? v2 : v1,
          x: midX,
          z: midZ,
          rotation,
          hexIds: []
        };
      }
      if (!edges[eKey].hexIds.includes(hexId)) {
        edges[eKey].hexIds.push(hexId);
      }

      if (!vertices[v1].adjacentVertexIds.includes(v2)) {
        vertices[v1].adjacentVertexIds.push(v2);
      }
      if (!vertices[v2].adjacentVertexIds.includes(v1)) {
        vertices[v2].adjacentVertexIds.push(v1);
      }
      if (!vertices[v1].adjacentEdgeIds.includes(eKey)) {
        vertices[v1].adjacentEdgeIds.push(eKey);
      }
      if (!vertices[v2].adjacentEdgeIds.includes(eKey)) {
        vertices[v2].adjacentEdgeIds.push(eKey);
      }
    }
  });

  const coastalEdges = Object.values(edges).filter(e => e.hexIds.length === 1);
  const harborTypes: HarborType[] = [
    'threeToOne', 'threeToOne', 'threeToOne', 'threeToOne',
    'wood', 'brick', 'wheat', 'sheep', 'ore'
  ];
  if (maxPlayers > 4) harborTypes.push('threeToOne', 'wheat');
  if (maxPlayers > 6) harborTypes.push('threeToOne', 'wood', 'ore');

  const step = Math.max(1, Math.floor(coastalEdges.length / harborTypes.length));
  harborTypes.forEach((hType, idx) => {
    const edge = coastalEdges[(idx * step) % coastalEdges.length];
    if (edge) {
      const hex = hexes.find(h => h.id === edge.hexIds[0]);
      if (hex) {
        hex.harbor = {
          type: hType,
          vertexA: edge.vertexA,
          vertexB: edge.vertexB,
          rotation: edge.rotation
        };
      }
    }
  });

  return {
    maxPlayers,
    gridRadius: maxPlayers <= 4 ? 2 : 3,
    hexes,
    vertices,
    edges,
  };
}
