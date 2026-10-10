import React, { useMemo, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { HexType } from '../../shared/types.js';

const TEXTURE_PATHS: Partial<Record<HexType, string>> = {
  wood: '/textures/forest.jpg',
  brick: '/textures/brick.jpg',
  wheat: '/textures/wheat.jpg',
  sheep: '/textures/sheep.jpg',
  ore: '/textures/ore.jpg',
  desert: '/textures/desert.jpg',
};

// Planar Hexagon BufferGeometry with orthographic planar UV mapping
// Prevents polar pinch distortion and maps square textures cleanly onto the hexagon
function createHexagonPlaneGeometry(radius: number): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [0, 0, 0];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];

  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    positions.push(x, 0, z);
    const u = x / (2 * radius) + 0.5;
    const v = 1 - (z / (2 * radius) + 0.5);
    uvs.push(u, v);
  }

  // Winding order ensuring normal points straight up +Y
  for (let i = 1; i <= 6; i++) {
    const next = i === 6 ? 1 : i + 1;
    indices.push(0, next, i);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

const HEX_PLANE_GEOM = createHexagonPlaneGeometry(2.05);

const TexturedTileFace: React.FC<{ url: string }> = ({ url }) => {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh geometry={HEX_PLANE_GEOM} position={[0, 0.235, 0]} receiveShadow>
      <meshStandardMaterial map={texture} roughness={0.65} metalness={0.05} />
    </mesh>
  );
};

// Number Chit Token
const NumberChitToken: React.FC<{ number: number }> = ({ number }) => {
  const isRedNumber = number === 6 || number === 8;
  const pips = getPipCount(number);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Outer wood / parchment disc
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Inner rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    // Number
    ctx.fillStyle = isRedNumber ? '#dc2626' : '#1e293b';
    ctx.font = 'bold 96px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 128, 110);

    // Dots representing probability
    ctx.fillStyle = isRedNumber ? '#dc2626' : '#475569';
    for (let i = 0; i < pips; i++) {
      const dotX = 128 + (i - (pips - 1) / 2) * 22;
      ctx.beginPath();
      ctx.arc(dotX, 185, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }, [number, isRedNumber, pips]);

  return (
    <group position={[0, 0.35, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.12, 24]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
};

// Harbor Sign
const HarborSign: React.FC<{ harborType: string }> = ({ harborType }) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(0, 0, 128, 64);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 60);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = harborType === 'threeToOne' ? '3:1' : harborType.slice(0, 3).toUpperCase();
    ctx.fillText(text, 64, 32);

    return new THREE.CanvasTexture(canvas);
  }, [harborType]);

  return (
    <group position={[0, 0.25, 0]}>
      <mesh position={[0, 0.1, 1.8]} castShadow>
        <boxGeometry args={[0.7, 0.15, 0.5]} />
        <meshStandardMaterial color="#854d0e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 1.8]} rotation={[-Math.PI / 4, 0, 0]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
};

interface HexTileProps {
  id: string;
  x: number;
  z: number;
  type: HexType;
  number?: number;
  hasRobber: boolean;
  harborType?: string;
  harborRotation?: number;
  isHoveredForRobber?: boolean;
  onClickForRobber?: () => void;
}

const TERRAIN_CONFIG: Record<HexType, { baseColor: string; rimColor: string; name: string }> = {
  wood: { baseColor: '#2d6a4f', rimColor: '#1b4332', name: 'Forest' },
  brick: { baseColor: '#b7532a', rimColor: '#8a3818', name: 'Hills' },
  wheat: { baseColor: '#e0a926', rimColor: '#b88114', name: 'Fields' },
  sheep: { baseColor: '#70a430', rimColor: '#4f7522', name: 'Pasture' },
  ore: { baseColor: '#6c757d', rimColor: '#495057', name: 'Mountains' },
  desert: { baseColor: '#d4a373', rimColor: '#bc6c25', name: 'Desert' },
  water: { baseColor: '#1e3d59', rimColor: '#17252a', name: 'Sea' },
};

function getPipCount(num?: number): number {
  if (!num) return 0;
  switch (num) {
    case 2:
    case 12:
      return 1;
    case 3:
    case 11:
      return 2;
    case 4:
    case 10:
      return 3;
    case 5:
    case 9:
      return 4;
    case 6:
    case 8:
      return 5;
    default:
      return 0;
  }
}

export const HexTile: React.FC<HexTileProps> = ({
  x,
  z,
  type,
  number,
  hasRobber,
  harborType,
  isHoveredForRobber,
  onClickForRobber,
}) => {
  const config = TERRAIN_CONFIG[type] || TERRAIN_CONFIG.desert;

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        if (onClickForRobber) {
          e.stopPropagation();
          onClickForRobber();
        }
      }}
    >
      {/* Hexagonal Base Tile */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.18, 2.18, 0.45, 6]} />
        <meshStandardMaterial
          color={isHoveredForRobber ? '#f43f5e' : config.baseColor}
          roughness={0.7}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Hex Stone/Grass Top Border */}
      <mesh position={[0, 0.23, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[2.08, 2.15, 0.08, 6]} />
        <meshStandardMaterial color={config.rimColor} roughness={0.8} flatShading />
      </mesh>

      {/* Planar Undistorted Textured Tile Surface */}
      {TEXTURE_PATHS[type] && (
        <Suspense fallback={null}>
          <TexturedTileFace url={TEXTURE_PATHS[type]!} />
        </Suspense>
      )}

      {/* Robber hover indicator ring */}
      {isHoveredForRobber && (
        <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.9, 32]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Harbor Marker if present */}
      {harborType && <HarborSign harborType={harborType} />}

      {/* Number Chit Token */}
      {number && !hasRobber && <NumberChitToken number={number} />}
    </group>
  );
};
