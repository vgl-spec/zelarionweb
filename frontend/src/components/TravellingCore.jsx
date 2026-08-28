import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { scrollStore } from '../lib/scrollStore';
import { prefersReducedMotion } from '../lib/utils';

// The crystal makes one deliberate gesture and is gone: it sits still at
// REST through the top of the hero, then over the first viewport of scroll
// it drifts, settles back in scale, and fades to fully invisible by
// SETTLE_END (before the hero has finished leaving the screen). Driven by
// viewports scrolled (scrollY / innerHeight), not whole-document progress,
// so it is unaffected by how much content is added further down the page.
const REST = { x: 2.7, y: 0.15, s: 1.1, o: 0.8 };
const SETTLED = { x: 3.05, y: -0.55, s: 0.7, o: 0 };
const SETTLE_END = 0.85;

function settle(viewportsScrolled) {
  let t = viewportsScrolled / SETTLE_END;
  t = Math.max(0, Math.min(1, t));
  // easeInOutCubic for buttery interpolation
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  return {
    x: REST.x + (SETTLED.x - REST.x) * e,
    y: REST.y + (SETTLED.y - REST.y) * e,
    s: REST.s + (SETTLED.s - REST.s) * e,
    o: REST.o + (SETTLED.o - REST.o) * e,
  };
}

function Core({ reduced }) {
  const group = useRef();
  const mesh = useRef();
  const inner = useRef();
  // Seeded from the live scroll position, not a hardcoded REST -- Core
  // remounts fresh each time the canvas comes back (see TravellingCore's
  // hysteresis below), and remounting only happens past 1.1 viewports, well
  // inside the settled/invisible zone. Seeding from REST there would flash
  // the crystal back in at full opacity and fade it out a second time.
  const cur = useRef(settle(scrollStore.viewportsScrolled));

  useFrame((state, delta) => {
    const target = settle(scrollStore.viewportsScrolled);
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

// Tears down the WebGL context (and its useFrame loop) once the hero is well
// off screen -- the crystal has already finished fading out by 0.85
// viewports, so nothing is visibly lost by unmounting. The two thresholds
// are deliberately apart, not equal: a visitor whose scroll position sits
// right at the boundary (inertial scroll settling, a trackpad wiggle) would
// otherwise mount/unmount the canvas on every frame. Unmounting only once
// comfortably past the fade (1.4) and remounting only once comfortably back
// under it (1.1) gives that a dead zone to sit in.
const UNMOUNT_AT = 1.4;
const REMOUNT_AT = 1.1;

export default function TravellingCore() {
  const [reduced, setReduced] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    // disable heavy transmission on small screens for performance
    setEnabled(window.innerWidth > 820);
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return; // coalesce to one read per frame rather than per scroll event
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Read the same value the render loop reads rather than recomputing it,
        // so the gate and the animation can never disagree about where we are.
        const { viewportsScrolled } = scrollStore;
        setMounted((wasMounted) => {
          if (wasMounted && viewportsScrolled > UNMOUNT_AT) return false;
          if (!wasMounted && viewportsScrolled < REMOUNT_AT) return true;
          return wasMounted;
        });
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none [&_*]:pointer-events-none fixed inset-0 z-[2] hidden md:block"
      aria-hidden="true"
    >
      {mounted && (
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
      )}
    </div>
  );
}
