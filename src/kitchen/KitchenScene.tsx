import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { layout, type Kitchen, type Placed } from "./domain";
import { functions, product } from "./catalog";
import { cabinetParts } from "./model";
function Cabinet({
  p,
  onSelect,
}: {
  p: Placed;
  onSelect: (id: string) => void;
}) {
  const d = p.depth / 1000,
    spec = product(p.module.productId)!;
  return (
    <group
      position={
        p.zone.run === "A"
          ? [(p.start + p.width / 2) / 1000, p.y / 1000, d / 2]
          : [d / 2, p.y / 1000, (p.start + p.width / 2) / 1000]
      }
      rotation={[0, p.zone.run === "B" ? Math.PI / 2 : 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(p.zone.id);
      }}
    >
      {cabinetParts(spec, spec.variants[p.module.variant], p.module.finish).map(
        (part) => (
          <mesh key={part.name} position={part.position}>
            <boxGeometry args={part.size} />
            <meshStandardMaterial color={part.color} roughness={0.72} />
          </mesh>
        ),
      )}
    </group>
  );
}
export default function KitchenScene({
  data,
  onSelect,
}: {
  data: Kitchen;
  onSelect: (id: string) => void;
}) {
  const all = layout(data).filter(
    (p) => data.shape === "L" || p.zone.run === "A",
  );
  const a = data.runs.A / 1000,
    b = data.shape === "L" ? data.runs.B / 1000 : 0.8;
  let offsets = {
    A: data.shape === "L" ? 0.65 : 0,
    B: data.shape === "L" ? 0.65 : 0,
  };
  return (
    <div className="three-view" aria-label="Phối cảnh 3D tổng thể">
      <Canvas
        orthographic
        camera={{ position: [7, 6, 8], zoom: 90, near: 0.01, far: 100 }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <color attach="background" args={["#fafbf8"]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 8, 6]} intensity={2} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.3}>
            <group>
              <mesh position={[a / 2, -0.025, b / 2]}>
                <boxGeometry args={[a + 0.1, 0.04, b + 0.1]} />
                <meshStandardMaterial color="#edece4" />
              </mesh>
              {data.shape === "L" && (
                <mesh position={[0.325, 0.025, 0.325]}>
                  <boxGeometry args={[0.65, 0.05, 0.65]} />
                  <meshStandardMaterial color="#bcb4a3" />
                </mesh>
              )}
              {data.zones
                .filter((z) => data.shape === "L" || z.run === "A")
                .map((z) => {
                  const start = offsets[z.run];
                  offsets[z.run] += z.width / 1000;
                  return (
                    <mesh
                      key={z.id}
                      position={
                        z.run === "A"
                          ? [start + z.width / 2000, 0.002, 0.34]
                          : [0.34, 0.002, start + z.width / 2000]
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(z.id);
                      }}
                    >
                      <boxGeometry
                        args={
                          z.run === "A"
                            ? [z.width / 1000 - 0.008, 0.008, 0.68]
                            : [0.68, 0.008, z.width / 1000 - 0.008]
                        }
                      />
                      <meshStandardMaterial color={functions[z.kind].color} />
                    </mesh>
                  );
                })}
              {all.map((p) => (
                <Cabinet key={p.module.id} p={p} onSelect={onSelect} />
              ))}
            </group>
          </Bounds>
        </Suspense>
        <OrbitControls
          makeDefault
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
      <span className="scene-help">
        Kéo để xoay · cuộn để thu phóng · nhấp tủ để chọn vùng
      </span>
    </div>
  );
}
