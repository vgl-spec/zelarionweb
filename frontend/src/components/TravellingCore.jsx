import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { scrollStore } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

// Keyframes: the "verification core" travels down the page and docks at pricing.
const KEYS = [
  { p: 0.0, x: 2.7, y: 0.15, s: 1.1, o: 0.8 },
  { p: 0.14, x: 3.6, y: -0.4, s: 0.9, o: 0.5 },
  { p: 0.3, x: -3.1, y: 0.2, s: 0.85, o: 0.5 },
  { p: 0.46, x: 3.0, y: 0.0, s: 0.8, o: 0.45 },
  { p: 0.6, x: -2.9, y: 0.1, s: 0.85, o: 0.45 },
  { p: 0.73, x: 2.6, y: 0.35, s: 0.95, o: 0.5 },
  { p: 0.82, x: 2.6, y: 0.35, s: 0.9, o: 0.0 },
  { p: 1.0, x: 2.6, y: 0.35, s: 0.9, o: 0.0 },
];

function sample(progress) {
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (progress >= KEYS[i].p && progress <= KEYS[i + 1].p) {
      a = KEYS[i];
      b = KEYS[i + 1];
      break;
    }
  }
  const span = b.p - a.p || 1;
  let t = (progress - a.p) / span;
  t = Math.max(0, Math.min(1, t));
  // easeInOutCubic for buttery interpolation
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    s: a.s + (b.s - a.s) * e,
    o: a.o + (b.o - a.o) * e,
  };
}

function Core({ reduced }) {
  const group = useRef();
  const mesh = useRef();
  const inner = useRef();
  const cur = useRef({ x: 2.7, y: 0.15, s: 1.1, o: 0.8 });

  useFrame((state, delta) => {
    const target = sample(scrollStore.progress);
    const c = cur.current;
    const lerp = reduced ? 1 : Math.min(1, delta * 3.2);
    c.x += (target.x - c.x) * lerp;
    c.y += (target.y - c.y) * lerp;
    c.s += (target.s - c.s) * lerp;
    c.o += (target.o - c.o) * lerp;

    if (group.current) {
      group.current.position.x = c.x;
      group.current.position.y = c.y;
      group.current.scale.setScalar(c.s);
      group.current.visible = c.o > 0.02;
    }
    if (mesh.current) {
      if (!reduced) {
        mesh.current.rotation.y += delta * 0.35;
        mesh.current.rotation.x += delta * 0.12;
      }
      mesh.current.material.opacity = c.o;
    }
    if (inner.current) {
      inner.current.material.opacity = c.o * 0.9;
      if (!reduced) inner.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group ref={group}>
      {/* faceted teal crystal shell */}
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial
          transparent
          color="#0c9b90"
          emissive="#2DD4C4"
          emissiveIntensity={0.35}
          metalness={0.65}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.25}
          flatShading
        />
        <Edges threshold={12} color="#7ff5ea" />
      </mesh>
      {/* inner glowing core */}
      <mesh ref={inner} scale={0.55}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial transparent color="#6366F1" />
      </mesh>
    </group>
  );
}

export default function TravellingCore() {
  const [reduced, setReduced] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    // disable heavy transmission on small screens for performance
    setEnabled(window.innerWidth > 820);
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] hidden md:block"
      aria-hidden="true"
    >
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 42 }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 3, 5]} intensity={40} color="#2DD4C4" />
        <pointLight position={[-4, -2, 3]} intensity={30} color="#6366F1" />
        <pointLight position={[0, 4, -2]} intensity={18} color="#06B6D4" />
        <Core reduced={reduced} />
      </Canvas>
    </div>
  );
}
