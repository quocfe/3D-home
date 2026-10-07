import { useRef } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  Edges,
} from "@react-three/drei";
import * as THREE from "three";
import { catalog, fits, type CatalogId, type Pose, type Item } from "./core";
import { Furniture } from "./furniture";
import { useFloorDrag } from "./useFloorDrag";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { planner, usePlanner } from "./runtime";
export type Placement = Pose & { catalogId: CatalogId };
export interface SceneProps {
  top: boolean;
  walls: boolean;
  placement: Placement | null;
  setPlacement: (p: Placement | null) => void;
  onBusy: (v: boolean) => void;
  cancelToken: number;
}
function Outline({ item, color }: { item: Item | Placement; color: string }) {
  const d = catalog[item.catalogId];
  return (
    <mesh position={[0, d.h / 2, 0]} raycast={() => null}>
      <boxGeometry args={[d.w + 0.025, d.h + 0.025, d.d + 0.025]} />
      <meshBasicMaterial visible={false} />
      <Edges color={color} lineWidth={2} raycast={() => null} />
    </mesh>
  );
}
function Walls({ show }: { show: boolean }) {
  const r = usePlanner((s) => s.layout.room),
    g = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (!g.current) return;
    g.current.children.forEach((m, i) => {
      m.visible =
        show &&
        [
          camera.position.z > 0,
          camera.position.x > 0,
          camera.position.z < 0,
          camera.position.x < 0,
        ][i];
    });
  });
  return (
    <group ref={g}>
      {[
        {
          p: [0, r.height / 2, -r.width / 2 - 0.05],
          s: [r.length + 0.2, r.height, 0.1],
        },
        {
          p: [-r.length / 2 - 0.05, r.height / 2, 0],
          s: [0.1, r.height, r.width + 0.2],
        },
        {
          p: [0, r.height / 2, r.width / 2 + 0.05],
          s: [r.length + 0.2, r.height, 0.1],
        },
        {
          p: [r.length / 2 + 0.05, r.height / 2, 0],
          s: [0.1, r.height, r.width + 0.2],
        },
      ].map((v, i) => (
        <mesh
          key={i}
          position={v.p as [number, number, number]}
          receiveShadow
          raycast={() => null}
        >
          <boxGeometry args={v.s as [number, number, number]} />
          <meshStandardMaterial color={i % 2 ? "#d9d6c9" : "#e7e2d5"} />
        </mesh>
      ))}
    </group>
  );
}
function World({
  top,
  walls,
  placement,
  setPlacement,
  onBusy,
  cancelToken,
}: SceneProps) {
  const layout = usePlanner((s) => s.layout),
    selected = usePlanner((s) => s.selected),
    { size } = useThree();
  const r = layout.room;
  const controls = useRef<OrbitControlsImpl>(null);
  const { draft, start } = useFloorDrag(
    controls,
    onBusy,
    cancelToken,
    !!placement,
  );
  const scale = Math.min(
    size.width / (r.length + 2),
    size.height / (r.width + 2),
  );
  const floorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 5) return;
    if (placement) {
      if (
        planner
          .getState()
          .add(placement.catalogId, {
            x: e.point.x,
            z: e.point.z,
            angle: placement.angle,
          })
      )
        setPlacement(null);
    } else planner.getState().select(null);
  };
  return (
    <>
      {top ? (
        <OrthographicCamera
          makeDefault
          position={[0, 20, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          zoom={scale}
          near={0.1}
          far={100}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={[
            r.length * 1.25,
            Math.max(r.length, r.width) * 1.15,
            r.width * 1.5,
          ]}
          fov={42}
          near={0.1}
          far={200}
        />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        key={top ? "top" : "perspective"}
        enableRotate={!top}
        enabled={!placement}
        maxPolarAngle={Math.PI / 2 - 0.03}
        minDistance={2}
        maxDistance={70}
        minZoom={8}
        maxZoom={400}
        target={[0, 0, 0]}
      />
      <color attach="background" args={["#eeeae2"]} />
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#fff8e9", "#a5ad9b", 1.5]} />
      <directionalLight
        position={[3, 9, 6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-normalBias={0.03}
      />
      <mesh position={[0, -0.085, 0]} receiveShadow raycast={() => null}>
        <boxGeometry args={[r.length, 0.16, r.width]} />
        <meshStandardMaterial color="#c4b296" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={floorClick}
        onPointerMove={(e) => {
          if (placement) {
            e.stopPropagation();
            setPlacement({ ...placement, x: e.point.x, z: e.point.z });
          }
        }}
      >
        <planeGeometry args={[r.length, r.width]} />
        <meshStandardMaterial color="#ddcdb4" roughness={0.95} />
      </mesh>
      {Array.from(
        { length: Math.ceil(r.width / 0.25) - 1 },
        (_, i) => -0.5 * r.width + (i + 1) * 0.25,
      ).map((z) => (
        <mesh
          key={z}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.002, z]}
          raycast={() => null}
        >
          <planeGeometry args={[r.length, 0.006]} />
          <meshBasicMaterial color="#bda98b" transparent opacity={0.25} />
        </mesh>
      ))}
      <Walls show={walls && !top} />
      {layout.items.map((original) => {
        const item = draft?.id === original.id ? draft : original;
        const d = catalog[item.catalogId],
          invalid = !fits(r, d, item);
        return (
          <group
            key={item.id}
            position={[item.x, 0, item.z]}
            rotation={[0, item.angle, 0]}
            onPointerDown={(e) => start(e, original)}
            onClick={(e) => {
              e.stopPropagation();
              if (!placement) planner.getState().select(item.id);
            }}
          >
            <Furniture id={item.catalogId} />
            <mesh position={[0, d.h / 2, 0]}>
              <boxGeometry args={[d.w, d.h, d.d]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {(selected === item.id || invalid) && (
              <Outline item={item} color={invalid ? "#bd4d37" : "#168a79"} />
            )}
          </group>
        );
      })}
      {placement && (
        <group
          position={[placement.x, 0.005, placement.z]}
          rotation={[0, placement.angle, 0]}
          onUpdate={(g) =>
            g.traverse((o) => {
              o.raycast = () => {};
            })
          }
        >
          <Furniture id={placement.catalogId} ghost />
          <Outline
            item={placement}
            color={
              fits(r, catalog[placement.catalogId], placement)
                ? "#168a79"
                : "#c94836"
            }
          />
        </group>
      )}
    </>
  );
}
export default function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      fallback={
        <div className="webgl-error">
          WebGL không khả dụng. Vui lòng bật tăng tốc đồ họa.
        </div>
      }
    >
      <World {...props} />
    </Canvas>
  );
}
