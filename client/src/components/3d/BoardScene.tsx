import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { HexTile } from './HexTile.js';
import { VertexNode } from './VertexNode.js';
import { EdgeNode } from './EdgeNode.js';
import {
  InstancedRoads,
  InstancedSettlements,
  InstancedCities,
  InstancedBiomeProps,
  RobberPiece,
} from './InstancedPieces.js';
import { PLAYER_COLORS_PALETTE, PlayerColor } from '../../shared/types.js';

interface BoardSceneProps {
  hexes: any[];
  vertices: any[];
  edges: any[];
  playersMap: Map<string, any>;
  activePlayerColor?: PlayerColor;
  isMyTurn: boolean;
  gamePhase: string;
  placementMode: 'settlement' | 'city' | 'road' | 'robber' | null;
  onSelectVertex: (vertexId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onSelectHex: (hexId: string) => void;
}

export const BoardScene: React.FC<BoardSceneProps> = ({
  hexes,
  vertices,
  edges,
  playersMap,
  activePlayerColor,
  isMyTurn,
  gamePhase,
  placementMode,
  onSelectVertex,
  onSelectEdge,
  onSelectHex,
}) => {
  // Determine if vertices or edges can be clicked right now
  const isSettlementTurn =
    (gamePhase === 'SETUP_1' || gamePhase === 'SETUP_2') && isMyTurn;

  const canPlaceSettlement =
    isSettlementTurn || (isMyTurn && placementMode === 'settlement');

  const canPlaceCity = isMyTurn && placementMode === 'city';

  const canPlaceRoad =
    (isSettlementTurn && isMyTurn) || (isMyTurn && placementMode === 'road');

  const canPlaceRobber =
    isMyTurn && (gamePhase === 'ROBBER_MOVE' || placementMode === 'robber');

  // Built roads array for single draw-call instanced rendering
  const builtRoads = useMemo(() => {
    return edges
      .filter((e) => !!e.ownerId)
      .map((e) => {
        const owner = playersMap.get(e.ownerId);
        const color = owner?.color
          ? PLAYER_COLORS_PALETTE[owner.color as PlayerColor]?.hex || '#ef4444'
          : '#ef4444';
        return {
          id: e.id,
          x: e.x,
          z: e.z,
          rotation: e.rotation,
          color,
        };
      });
  }, [edges, playersMap]);

  // Built settlements array for instanced rendering
  const builtSettlements = useMemo(() => {
    return vertices
      .filter((v) => !!v.ownerId && v.buildingType === 'settlement')
      .map((v) => {
        const owner = playersMap.get(v.ownerId);
        const color = owner?.color
          ? PLAYER_COLORS_PALETTE[owner.color as PlayerColor]?.hex || '#ef4444'
          : '#ef4444';
        return {
          id: v.id,
          x: v.x,
          z: v.z,
          color,
        };
      });
  }, [vertices, playersMap]);

  // Built cities array for instanced rendering
  const builtCities = useMemo(() => {
    return vertices
      .filter((v) => !!v.ownerId && v.buildingType === 'city')
      .map((v) => {
        const owner = playersMap.get(v.ownerId);
        const color = owner?.color
          ? PLAYER_COLORS_PALETTE[owner.color as PlayerColor]?.hex || '#ef4444'
          : '#ef4444';
        return {
          id: v.id,
          x: v.x,
          z: v.z,
          color,
        };
      });
  }, [vertices, playersMap]);

  // Active hex tile where the robber is stationed
  const robberHex = useMemo(() => {
    return hexes.find((h) => h.hasRobber);
  }, [hexes]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 24, 22], fov: 45 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight
          position={[25, 40, 20]}
          intensity={1.7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={100}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        <directionalLight position={[-20, 20, -20]} intensity={0.4} color="#93c5fd" />

        {/* Sky atmosphere */}
        <Sky sunPosition={[100, 40, 100]} turbidity={8} rayleigh={4} mieCoefficient={0.005} />

        {/* Stylized Ocean Base */}
        <group position={[0, -0.28, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[45, 64]} />
            <meshStandardMaterial
              color="#0284c7"
              roughness={0.15}
              metalness={0.3}
              transparent
              opacity={0.88}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[14, 14.4, 64]} />
            <meshBasicMaterial color="#bae6fd" transparent opacity={0.4} />
          </mesh>
        </group>

        <Suspense fallback={null}>
          {/* Hexagonal Tiles (Base & Undistorted Planar Textures & Number Chits) */}
          <group>
            {hexes.map((hex) => (
              <HexTile
                key={hex.id}
                id={hex.id}
                x={hex.x}
                z={hex.z}
                type={hex.type}
                number={hex.number}
                hasRobber={hex.hasRobber}
                harborType={hex.harborType}
                harborRotation={hex.harborRotation}
                isHoveredForRobber={canPlaceRobber && !hex.hasRobber}
                onClickForRobber={canPlaceRobber ? () => onSelectHex(hex.id) : undefined}
              />
            ))}
          </group>

          {/* High Performance Instanced Biome Props (Trees, Mountains, Wheat, Sheep) */}
          <InstancedBiomeProps hexes={hexes} />

          {/* Active Robber Figurine GLB */}
          {robberHex && (
            <RobberPiece position={[robberHex.x, 0.24, robberHex.z]} />
          )}

          {/* High Performance Instanced Built Roads */}
          <InstancedRoads roads={builtRoads} />

          {/* High Performance Instanced Built Settlements & Cities */}
          <InstancedSettlements settlements={builtSettlements} />
          <InstancedCities cities={builtCities} />

          {/* Interactive Edge Placement Nodes (Hitboxes & Ghost Previews) */}
          <group>
            {edges.map((edge) => (
              <EdgeNode
                key={edge.id}
                id={edge.id}
                x={edge.x}
                z={edge.z}
                rotation={edge.rotation}
                ownerId={edge.ownerId}
                isInteractable={canPlaceRoad}
                activePlayerColor={activePlayerColor}
                onClick={onSelectEdge}
              />
            ))}
          </group>

          {/* Interactive Vertex Placement Nodes (Hitboxes & Ghost Previews) */}
          <group>
            {vertices.map((v) => (
              <VertexNode
                key={v.id}
                id={v.id}
                x={v.x}
                z={v.z}
                ownerId={v.ownerId}
                buildingType={v.buildingType}
                isInteractable={canPlaceSettlement || canPlaceCity}
                highlightMode={
                  canPlaceCity ? 'city' : canPlaceSettlement ? 'settlement' : null
                }
                activePlayerColor={activePlayerColor}
                onClick={onSelectVertex}
              />
            ))}
          </group>
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={10}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};
