"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Button } from "@/components/ui/button";
import { SelectedShelfPanel } from "@/components/house/SelectedShelfPanel";
import type { HouseBrowserLevel, HouseBrowserShelf } from "@/lib/db/houseBrowser";

type ShelfPlacement = {
  shelf: HouseBrowserShelf;
  position: [number, number, number];
  rotationY: number;
  color: string;
};

const CAMERA_POSITION: [number, number, number] = [7, 7, 10];
const CAMERA_TARGET: [number, number, number] = [0, 0.7, -1.5];

export function GeneratedHouseScene({ levels }: { levels: HouseBrowserLevel[] }) {
  const shelves = useMemo(() => levels.flatMap((level) => level.rooms.flatMap((room) => room.shelves)), [levels]);
  const [selectedSceneKey, setSelectedSceneKey] = useState(shelves[0]?.sceneKey ?? null);
  const [resetToken, setResetToken] = useState(0);
  const selectedShelf = shelves.find((shelf) => shelf.sceneKey === selectedSceneKey) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-text">Generated scene: no Blender file is required. Shelf meshes carry database scene keys.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setResetToken((value) => value + 1)}>
            Reset camera
          </Button>
        </div>

        <div className="h-[34rem] overflow-hidden rounded-3xl border border-warm-border bg-gradient-to-b from-baby-blue/25 to-cream shadow-lg shadow-amber-shadow/10 max-sm:h-[26rem]">
          <Canvas camera={{ position: CAMERA_POSITION, fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
            <color attach="background" args={["#f8f0dc"]} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 8, 6]} intensity={1.4} castShadow />
            <GeneratedHouse levels={levels} selectedSceneKey={selectedSceneKey} onSelectShelf={setSelectedSceneKey} />
            <CameraControls resetToken={resetToken} />
          </Canvas>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Shelf shortcuts">
          {shelves.map((shelf) => (
            <button
              key={shelf.sceneKey}
              type="button"
              onClick={() => setSelectedSceneKey(shelf.sceneKey)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedSceneKey === shelf.sceneKey
                  ? "border-sage bg-sage/25 text-deep-brown"
                  : "border-warm-border bg-white/70 text-muted-text hover:bg-cream"
              }`}
            >
              {shelf.name}
            </button>
          ))}
        </div>
      </div>

      <SelectedShelfPanel shelf={selectedShelf} />
    </div>
  );
}

function GeneratedHouse({
  levels,
  selectedSceneKey,
  onSelectShelf,
}: {
  levels: HouseBrowserLevel[];
  selectedSceneKey: string | null;
  onSelectShelf: (sceneKey: string) => void;
}) {
  const placements = useMemo(() => buildShelfPlacements(levels), [levels]);

  return (
    <group>
      <HouseShell />
      {placements.map((placement) => (
        <ShelfMesh
          key={placement.shelf.sceneKey}
          placement={placement}
          selected={selectedSceneKey === placement.shelf.sceneKey}
          onSelectShelf={onSelectShelf}
        />
      ))}
    </group>
  );
}

function HouseShell() {
  return (
    <group>
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[9, 0.08, 6]} />
        <meshStandardMaterial color="#f2dfbd" />
      </mesh>
      <mesh position={[0, -0.02, -7]} receiveShadow>
        <boxGeometry args={[10, 0.08, 7]} />
        <meshStandardMaterial color="#ead5af" />
      </mesh>

      <RoomLabel position={[-3.1, 0.08, 2.35]} label="Downstairs entry" />
      <RoomLabel position={[-2.7, 0.08, -4.3]} label="Upstairs hallway" />
      <RoomLabel position={[3.1, 0.08, -7.7]} label="Study" />

      <Wall position={[-4.55, 0.75, 0]} size={[0.1, 1.5, 6]} />
      <Wall position={[4.55, 0.75, 0]} size={[0.1, 1.5, 6]} />
      <Wall position={[0, 0.75, 3]} size={[9.1, 1.5, 0.1]} />
      <Wall position={[0, 0.75, -3]} size={[9.1, 1.5, 0.1]} />

      <Wall position={[-5.05, 0.75, -7]} size={[0.1, 1.5, 7]} />
      <Wall position={[5.05, 0.75, -7]} size={[0.1, 1.5, 7]} />
      <Wall position={[0, 0.75, -3.5]} size={[10.1, 1.5, 0.1]} />
      <Wall position={[0, 0.75, -10.5]} size={[10.1, 1.5, 0.1]} />
      <Wall position={[1.6, 0.75, -7]} size={[0.1, 1.5, 7]} />
    </group>
  );
}

function Wall({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#d9c4a1" transparent opacity={0.38} />
    </mesh>
  );
}

function RoomLabel({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <Html position={position} center distanceFactor={10} transform>
      <span className="rounded-full border border-warm-border bg-white/80 px-2 py-1 text-[10px] font-semibold text-deep-brown shadow-sm">
        {label}
      </span>
    </Html>
  );
}

function ShelfMesh({
  placement,
  selected,
  onSelectShelf,
}: {
  placement: ShelfPlacement;
  selected: boolean;
  onSelectShelf: (sceneKey: string) => void;
}) {
  const copyCount = placement.shelf.slots.reduce((total, slot) => total + slot.copies.length, 0);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelectShelf(placement.shelf.sceneKey);
  }

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      <mesh
        name={placement.shelf.sceneKey}
        userData={{ sceneKey: placement.shelf.sceneKey, type: "bookshelf" }}
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
        castShadow
      >
        <boxGeometry args={[1.05, 1.8, 0.38]} />
        <meshStandardMaterial color={selected ? "#a8d5ba" : placement.color} emissive={selected ? "#446b55" : "#000000"} emissiveIntensity={selected ? 0.16 : 0} />
      </mesh>
      {Array.from({ length: placement.shelf.rowCount - 1 }).map((_, index) => (
        <mesh key={index} position={[0, -0.65 + index * (1.45 / placement.shelf.rowCount), 0.205]}>
          <boxGeometry args={[1, 0.025, 0.035]} />
          <meshStandardMaterial color="#8a6548" />
        </mesh>
      ))}
      <Html position={[0, 1.2, 0]} center distanceFactor={8} transform>
        <button
          type="button"
          onClick={() => onSelectShelf(placement.shelf.sceneKey)}
          className={`min-w-24 rounded-2xl border px-2 py-1 text-[10px] font-semibold shadow-sm ${
            selected ? "border-sage bg-sage text-deep-brown" : "border-warm-border bg-white/85 text-deep-brown"
          }`}
        >
          {placement.shelf.name}
          <span className="block font-normal text-muted-text">{copyCount} copies</span>
        </button>
      </Html>
    </group>
  );
}

function CameraControls({ resetToken }: { resetToken: number }) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...CAMERA_POSITION);
    controls.current?.target.set(...CAMERA_TARGET);
    controls.current?.update();
  }, [camera, resetToken]);

  return <OrbitControls ref={controls} target={CAMERA_TARGET} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={18} maxPolarAngle={Math.PI / 2.1} />;
}

function buildShelfPlacements(levels: HouseBrowserLevel[]): ShelfPlacement[] {
  const colors = ["#b99068", "#c79c75", "#9f775a", "#ba8766", "#d0a77c"];
  const roomOrigins = new Map<string, [number, number]>([
    ["room.downstairs.entry", [-2.6, 1.6]],
    ["room.upstairs.hallway", [-2.6, -5.6]],
    ["room.upstairs.study", [3.2, -7.2]],
  ]);

  let fallbackRoomIndex = 0;
  const placements: ShelfPlacement[] = [];

  for (const level of levels) {
    for (const room of level.rooms) {
      const fallbackOrigin: [number, number] = [-3 + (fallbackRoomIndex % 3) * 3, -1 - Math.floor(fallbackRoomIndex / 3) * 3];
      const origin = roomOrigins.get(room.sceneKey) ?? fallbackOrigin;
      fallbackRoomIndex += 1;

      room.shelves.forEach((shelf, index) => {
        const spread = (index - (room.shelves.length - 1) / 2) * 1.55;
        const hallway = room.sceneKey.includes("hallway");
        placements.push({
          shelf,
          position: hallway ? [origin[0] + spread, 0.9, origin[1]] : [origin[0], 0.9, origin[1] - spread],
          rotationY: hallway ? 0 : Math.PI / 2,
          color: colors[placements.length % colors.length]!,
        });
      });
    }
  }

  return placements;
}
