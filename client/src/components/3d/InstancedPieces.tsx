import React, { useMemo } from 'react';
import { useGLTF, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

// Preload all 3D assets immediately
useGLTF.preload('/models/settlement.glb');
useGLTF.preload('/models/city.glb');
useGLTF.preload('/models/road.glb');
useGLTF.preload('/models/robber.glb');
useGLTF.preload('/models/tree.glb');
useGLTF.preload('/models/mountain.glb');
useGLTF.preload('/models/wheat.glb');
useGLTF.preload('/models/sheep.glb');

export interface BuiltRoadData {
  id: string;
  x: number;
  z: number;
  rotation: number;
  color: string;
}

export interface BuiltBuildingData {
  id: string;
  x: number;
  z: number;
  color: string;
}

// -------------------------------------------------------------
// INSTANCED ROADS (Single draw-call batch for all built roads)
// -------------------------------------------------------------
export const InstancedRoads: React.FC<{ roads: BuiltRoadData[] }> = ({ roads }) => {
  const { nodes, materials } = useGLTF('/models/road.glb') as any;

  if (roads.length === 0) return null;

  return (
    <group>
      {/* Player-colored Timber Deck */}
      <Instances
        limit={150}
        geometry={nodes.RoadBody.geometry}
        material={materials.RoadBodyMat}
      >
        {roads.map((road) => (
          <Instance
            key={road.id}
            position={[road.x, 0.24, road.z]}
            rotation={[0, -road.rotation, 0]}
            color={road.color}
          />
        ))}
      </Instances>

      {/* Stone Foundation Sleeper & Iron Endcaps */}
      <Instances
        limit={150}
        geometry={nodes.RoadAccents.geometry}
        material={materials.RoadAccentsMat}
      >
        {roads.map((road) => (
          <Instance
            key={`accents-${road.id}`}
            position={[road.x, 0.24, road.z]}
            rotation={[0, -road.rotation, 0]}
          />
        ))}
      </Instances>
    </group>
  );
};

// -------------------------------------------------------------
// INSTANCED SETTLEMENTS (Batched draw-calls for cottages)
// -------------------------------------------------------------
export const InstancedSettlements: React.FC<{ settlements: BuiltBuildingData[] }> = ({
  settlements,
}) => {
  const { nodes, materials } = useGLTF('/models/settlement.glb') as any;

  if (settlements.length === 0) return null;

  return (
    <group>
      {/* Cottage Walls & Framing (Player color) */}
      <Instances
        limit={60}
        geometry={nodes.SettlementBody.geometry}
        material={materials.SettlementBodyMat}
      >
        {settlements.map((s) => (
          <Instance
            key={s.id}
            position={[s.x, 0.24, s.z]}
            color={s.color}
          />
        ))}
      </Instances>

      {/* Terracotta Gabled Roof & Chimney */}
      <Instances
        limit={60}
        geometry={nodes.SettlementRoof.geometry}
        material={materials.SettlementRoofMat}
      >
        {settlements.map((s) => (
          <Instance
            key={`roof-${s.id}`}
            position={[s.x, 0.24, s.z]}
          />
        ))}
      </Instances>
    </group>
  );
};

// -------------------------------------------------------------
// INSTANCED CITIES (Batched draw-calls for fortified keeps)
// -------------------------------------------------------------
export const InstancedCities: React.FC<{ cities: BuiltBuildingData[] }> = ({ cities }) => {
  const { nodes, materials } = useGLTF('/models/city.glb') as any;

  if (cities.length === 0) return null;

  return (
    <group>
      {/* Citadel Keep & Watchtower (Player color) */}
      <Instances
        limit={50}
        geometry={nodes.CityBody.geometry}
        material={materials.CityBodyMat}
      >
        {cities.map((c) => (
          <Instance
            key={c.id}
            position={[c.x, 0.24, c.z]}
            color={c.color}
          />
        ))}
      </Instances>

      {/* Slate Battlements & Watchtower Spire */}
      <Instances
        limit={50}
        geometry={nodes.CityRoof.geometry}
        material={materials.CityRoofMat}
      >
        {cities.map((c) => (
          <Instance
            key={`roof-${c.id}`}
            position={[c.x, 0.24, c.z]}
          />
        ))}
      </Instances>
    </group>
  );
};

// -------------------------------------------------------------
// ROBBER PIECE (Detailed 3D Figurine Meeple)
// -------------------------------------------------------------
export const RobberPiece: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { nodes, materials } = useGLTF('/models/robber.glb') as any;

  return (
    <group position={position}>
      {/* Wooden pedestal meeple base */}
      <mesh geometry={nodes.RobberBase.geometry} material={materials.RobberBaseMat} castShadow />
      {/* Cloaked bandit body */}
      <mesh geometry={nodes.RobberCloak.geometry} material={materials.RobberCloakMat} castShadow />
      {/* Glowing eyes */}
      <mesh geometry={nodes.RobberEyes.geometry} material={materials.RobberEyesMat} />
    </group>
  );
};

// -------------------------------------------------------------
// INSTANCED BIOME PROPS (Trees, Mountains, Wheat, Sheep)
// -------------------------------------------------------------
export const InstancedBiomeProps: React.FC<{ hexes: any[] }> = ({ hexes }) => {
  const treeGLTF = useGLTF('/models/tree.glb') as any;
  const mountainGLTF = useGLTF('/models/mountain.glb') as any;
  const wheatGLTF = useGLTF('/models/wheat.glb') as any;
  const sheepGLTF = useGLTF('/models/sheep.glb') as any;

  // Pre-calculate fixed prop positions per hex type
  const { trees, mountains, wheats, sheeps } = useMemo(() => {
    const treesList: Array<{ id: string; x: number; y: number; z: number; scale: number }> = [];
    const mountainList: Array<{ id: string; x: number; y: number; z: number; scale: number; rotY: number }> = [];
    const wheatList: Array<{ id: string; x: number; y: number; z: number; scale: number; rotY: number }> = [];
    const sheepList: Array<{ id: string; x: number; y: number; z: number; scale: number; rotY: number }> = [];

    hexes.forEach((hex) => {
      if (hex.type === 'wood') {
        const offsets = [
          { dx: -0.7, dz: -0.6, s: 0.95 },
          { dx: 0.7, dz: -0.5, s: 1.1 },
          { dx: -0.6, dz: 0.7, s: 0.85 },
          { dx: 0.6, dz: 0.6, s: 1.0 },
        ];
        offsets.forEach((off, i) => {
          treesList.push({
            id: `tree-${hex.id}-${i}`,
            x: hex.x + off.dx,
            y: 0.24,
            z: hex.z + off.dz,
            scale: off.s,
          });
        });
      } else if (hex.type === 'ore') {
        mountainList.push({
          id: `mtn-${hex.id}-1`,
          x: hex.x - 0.2,
          y: 0.24,
          z: hex.z - 0.2,
          scale: 0.95,
          rotY: 0.2,
        });
      } else if (hex.type === 'wheat') {
        const offsets = [
          { dx: -0.55, dz: -0.4, s: 0.9, rot: 0.3 },
          { dx: 0.55, dz: 0.35, s: 1.0, rot: -0.4 },
          { dx: 0.1, dz: 0.6, s: 0.85, rot: 1.1 },
        ];
        offsets.forEach((off, i) => {
          wheatList.push({
            id: `wheat-${hex.id}-${i}`,
            x: hex.x + off.dx,
            y: 0.24,
            z: hex.z + off.dz,
            scale: off.s,
            rotY: off.rot,
          });
        });
      } else if (hex.type === 'sheep') {
        const offsets = [
          { dx: -0.65, dz: -0.45, s: 0.9, rot: 0.5 },
          { dx: 0.6, dz: 0.45, s: 0.8, rot: 2.2 },
        ];
        offsets.forEach((off, i) => {
          sheepList.push({
            id: `sheep-${hex.id}-${i}`,
            x: hex.x + off.dx,
            y: 0.24,
            z: hex.z + off.dz,
            scale: off.s,
            rotY: off.rot,
          });
        });
      }
    });

    return { trees: treesList, mountains: mountainList, wheats: wheatList, sheeps: sheepList };
  }, [hexes]);

  return (
    <group>
      {/* Instanced Pine Trees (Forest hexes) */}
      {trees.length > 0 && (
        <group>
          <Instances
            limit={200}
            geometry={treeGLTF.nodes.TreeTrunk.geometry}
            material={treeGLTF.materials.TreeTrunkMat}
          >
            {trees.map((t) => (
              <Instance key={`trunk-${t.id}`} position={[t.x, t.y, t.z]} scale={t.scale} />
            ))}
          </Instances>
          <Instances
            limit={200}
            geometry={treeGLTF.nodes.TreeFoliage.geometry}
            material={treeGLTF.materials.TreeFoliageMat}
          >
            {trees.map((t) => (
              <Instance key={`foliage-${t.id}`} position={[t.x, t.y, t.z]} scale={t.scale} />
            ))}
          </Instances>
        </group>
      )}

      {/* Instanced Mountain Peaks (Ore hexes) */}
      {mountains.length > 0 && (
        <group>
          <Instances
            limit={50}
            geometry={mountainGLTF.nodes.MountainRock.geometry}
            material={mountainGLTF.materials.MountainRockMat}
          >
            {mountains.map((m) => (
              <Instance
                key={`rock-${m.id}`}
                position={[m.x, m.y, m.z]}
                rotation={[0, m.rotY, 0]}
                scale={m.scale}
              />
            ))}
          </Instances>
          <Instances
            limit={50}
            geometry={mountainGLTF.nodes.MountainSnow.geometry}
            material={mountainGLTF.materials.MountainSnowMat}
          >
            {mountains.map((m) => (
              <Instance
                key={`snow-${m.id}`}
                position={[m.x, m.y, m.z]}
                rotation={[0, m.rotY, 0]}
                scale={m.scale}
              />
            ))}
          </Instances>
        </group>
      )}

      {/* Instanced Wheat Sheaves (Fields hexes) */}
      {wheats.length > 0 && (
        <Instances
          limit={100}
          geometry={wheatGLTF.nodes.WheatMesh.geometry}
          material={wheatGLTF.materials.WheatMat}
        >
          {wheats.map((w) => (
            <Instance
              key={w.id}
              position={[w.x, w.y, w.z]}
              rotation={[0, w.rotY, 0]}
              scale={w.scale}
            />
          ))}
        </Instances>
      )}

      {/* Instanced Sheep (Pasture hexes) */}
      {sheeps.length > 0 && (
        <group>
          <Instances
            limit={60}
            geometry={sheepGLTF.nodes.SheepWool.geometry}
            material={sheepGLTF.materials.SheepWoolMat}
          >
            {sheeps.map((s) => (
              <Instance
                key={`wool-${s.id}`}
                position={[s.x, s.y, s.z]}
                rotation={[0, s.rotY, 0]}
                scale={s.scale}
              />
            ))}
          </Instances>
          <Instances
            limit={60}
            geometry={sheepGLTF.nodes.SheepDetails.geometry}
            material={sheepGLTF.materials.SheepDarkMat}
          >
            {sheeps.map((s) => (
              <Instance
                key={`details-${s.id}`}
                position={[s.x, s.y, s.z]}
                rotation={[0, s.rotY, 0]}
                scale={s.scale}
              />
            ))}
          </Instances>
        </group>
      )}
    </group>
  );
};
