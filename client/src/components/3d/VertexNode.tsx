import React, { useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { PLAYER_COLORS_PALETTE, PlayerColor } from '../../shared/types.js';

interface VertexNodeProps {
  id: string;
  x: number;
  z: number;
  ownerId?: string;
  ownerColor?: PlayerColor;
  buildingType?: 'settlement' | 'city';
  isInteractable?: boolean;
  highlightMode?: 'settlement' | 'city' | null;
  activePlayerColor?: PlayerColor;
  onClick: (id: string) => void;
}

const GhostSettlement: React.FC<{ color: string }> = ({ color }) => {
  const { nodes } = useGLTF('/models/settlement.glb') as any;
  return (
    <group>
      <mesh geometry={nodes.SettlementBody.geometry}>
        <meshStandardMaterial color={color} transparent opacity={0.65} roughness={0.4} />
      </mesh>
      <mesh geometry={nodes.SettlementRoof.geometry}>
        <meshStandardMaterial color="#993d28" transparent opacity={0.5} roughness={0.6} />
      </mesh>
    </group>
  );
};

const GhostCity: React.FC<{ color: string }> = ({ color }) => {
  const { nodes } = useGLTF('/models/city.glb') as any;
  return (
    <group>
      <mesh geometry={nodes.CityBody.geometry}>
        <meshStandardMaterial color={color} transparent opacity={0.65} roughness={0.35} />
      </mesh>
      <mesh geometry={nodes.CityRoof.geometry}>
        <meshStandardMaterial color="#334155" transparent opacity={0.5} roughness={0.65} />
      </mesh>
    </group>
  );
};

export const VertexNode: React.FC<VertexNodeProps> = ({
  id,
  x,
  z,
  ownerId,
  buildingType,
  isInteractable,
  highlightMode,
  activePlayerColor = 'red',
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  const previewHex = PLAYER_COLORS_PALETTE[activePlayerColor]?.hex || '#ef4444';
  const canClick = isInteractable && (!ownerId || (buildingType === 'settlement' && highlightMode === 'city'));

  if (!canClick && !hovered) {
    return null; // When not interactable and not hovered, instanced mesh handles built visual
  }

  return (
    <group
      position={[x, 0.24, z]}
      onPointerOver={(e) => {
        if (canClick) {
          e.stopPropagation();
          setHovered(true);
        }
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        if (canClick) {
          e.stopPropagation();
          onClick(id);
        }
      }}
    >
      {/* Click target cylinder */}
      {canClick && (
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.5, 12]} />
          <meshBasicMaterial
            color={previewHex}
            transparent
            opacity={hovered ? 0.45 : 0.15}
            wireframe={!hovered}
          />
        </mesh>
      )}

      {/* Hover Preview Ghost using matching GLB geometry */}
      {hovered && canClick && (
        <group>
          {highlightMode === 'city' ? (
            <GhostCity color={previewHex} />
          ) : (
            <GhostSettlement color={previewHex} />
          )}
        </group>
      )}
    </group>
  );
};
