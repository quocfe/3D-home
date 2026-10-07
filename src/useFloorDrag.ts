import { useEffect, useRef, useState, type RefObject } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { OrbitControls } from "three-stdlib";
import type { Item, Pose } from "./core";
import { planner } from "./runtime";
interface Drag {
  item: Item;
  pointerId: number;
  screen: Vector2;
  offset: Vector2;
  pose: Pose;
  moved: boolean;
}
export function useFloorDrag(
  controls: RefObject<OrbitControls | null>,
  onBusy: (v: boolean) => void,
  cancelToken: number,
  placing: boolean,
) {
  const { camera, gl } = useThree(),
    [draft, setDraft] = useState<Item | null>(null),
    drag = useRef<Drag | null>(null);
  const floor = new Plane(new Vector3(0, 1, 0), 0),
    ray = new Raycaster();
  const placingRef = useRef(placing);
  placingRef.current = placing;
  const at = (x: number, y: number) => {
    const r = gl.domElement.getBoundingClientRect();
    ray.setFromCamera(
      new Vector2(
        ((x - r.left) / r.width) * 2 - 1,
        (-(y - r.top) / r.height) * 2 + 1,
      ),
      camera,
    );
    return ray.ray.intersectPlane(floor, new Vector3());
  };
  const finish = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    setDraft(null);
    onBusy(false);
    if (controls.current) controls.current.enabled = !placingRef.current;
    if (d) {
      if (gl.domElement.hasPointerCapture(d.pointerId))
        gl.domElement.releasePointerCapture(d.pointerId);
      if (commit && d.moved) planner.getState().transform(d.item.id, d.pose);
    }
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const r = gl.domElement.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        finish(false);
        return;
      }
      if (
        !d.moved &&
        Math.hypot(e.clientX - d.screen.x, e.clientY - d.screen.y) < 5
      )
        return;
      const p = at(e.clientX, e.clientY);
      if (!p) return;
      d.moved = true;
      d.pose = {
        x: p.x + d.offset.x,
        z: p.z + d.offset.y,
        angle: d.item.angle,
      };
      setDraft({ ...d.item, ...d.pose });
    };
    const up = (e: PointerEvent) => {
      if (drag.current?.pointerId === e.pointerId) finish(true);
    };
    const cancel = () => finish(false);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", key);
    gl.domElement.addEventListener("lostpointercapture", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", key);
      gl.domElement.removeEventListener("lostpointercapture", cancel);
      finish(false);
    };
  }, [camera, gl]);
  useEffect(() => {
    finish(false);
  }, [cancelToken]);
  const start = (e: ThreeEvent<PointerEvent>, item: Item) => {
    e.stopPropagation();
    if (placing || e.button !== 0) return;
    planner.getState().select(item.id);
    const p = at(e.clientX, e.clientY);
    if (!p) return;
    drag.current = {
      item,
      pointerId: e.pointerId,
      screen: new Vector2(e.clientX, e.clientY),
      offset: new Vector2(item.x - p.x, item.z - p.z),
      pose: { x: item.x, z: item.z, angle: item.angle },
      moved: false,
    };
    if (controls.current) controls.current.enabled = false;
    onBusy(true);
    gl.domElement.setPointerCapture(e.pointerId);
  };
  return { draft, start };
}
