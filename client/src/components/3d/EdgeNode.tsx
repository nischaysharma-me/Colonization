import React, { useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { PLAYER_COLORS_PALETTE, PlayerColor } from '../../shared/types.js';

interface EdgeNodeProps {
  id: string;
  x: number;
  z: number;
  rotation: number;
  ownerId?: string;
  ownerColor?: PlayerColor;
  isInteractable?: boolean;
  activePlayerColor?: PlayerColor;
  onClick: (id: string) => void;
}

const GhostRoad: React.FC<{ color: string }> = ({ color }) => {
  const { nodes } = useGLTF('/models/road.glb') as any;
  return (
    <group>
      <mesh geometry={nodes.RoadBody.geometry}>
        <meshStandardMaterial color={color} transparent opacity={0.65} roughness={0.5} />
      </mesh>
      <mesh geometry={nodes.RoadAccents.geometry}>
        <meshStandardMaterial color="#334155" transparent opacity={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
};

export const EdgeNode: React.FC<EdgeNodeProps> = ({
  id,
  x,
  z,
  rotation,
  ownerId,
  isInteractable,
  activePlayerColor = 'red',
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  const previewHex = PLAYER_COLORS_PALETTE[activePlayerColor]?.hex || '#ef4444';
  const canClick = isInteractable && !ownerId;

  if (!canClick && !hovered) {
    return null; // When not interactable and not hovered, instanced mesh handles built visual
  }

  return (
    <group
      position={[x, 0.24, z]}
      rotation={[0, -rotation, 0]}
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
      {/* Click target hitbox */}
      {canClick && (
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[1.7, 0.35, 0.45]} />
          <meshBasicMaterial
            color={previewHex}
            transparent
            opacity={hovered ? 0.5 : 0.12}
            wireframe={!hovered}
          />
        </mesh>
      )}

      {/* Hover Preview Ghost using matching GLB road geometry */}
      {hovered && canClick && <GhostRoad color={previewHex} />}
    </group>
  );
};
