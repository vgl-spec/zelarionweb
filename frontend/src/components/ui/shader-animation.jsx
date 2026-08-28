import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../../lib/utils';

// Full-screen raw-shader backdrop: concentric interference lines sweeping out
// from the centre. Ported from a TSX/Next reference to this project's JSX/CRA
// stack, and recoloured — the reference summed three phase-offset passes
// straight into r/g/b, which reads as rainbow static and belongs to no palette.
// Here each pass is tinted with one of the site's aurora colours instead, so
// the same motion lands on-brand.
const VERTEX_SHADER = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec2 resolution;
  uniform float time;

  // aurora-teal #2DD4C4, aurora-cyan #06B6D4, aurora-indigo #6366F1
  const vec3 TEAL   = vec3(0.176, 0.831, 0.769);
  const vec3 CYAN   = vec3(0.024, 0.714, 0.831);
  const vec3 INDIGO = vec3(0.388, 0.400, 0.945);

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.05;
    float lineWidth = 0.002;

    vec3 pass = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        pass[j] += lineWidth * float(i * i)
          / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
      }
    }

    vec3 color = TEAL * pass.r + CYAN * pass.g + INDIGO * pass.b;
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Above ~1.5 there is nothing left to see in a soft gradient field, and the
// fragment shader runs per physical pixel — this is the difference between a
// warm laptop and a cool one.
const MAX_PIXEL_RATIO = 1.5;

/**
 * Decorative animated backdrop. Fills its nearest positioned ancestor and never
 * takes pointer input, so it can sit behind interactive content.
 *
 * Renders one static frame under `prefers-reduced-motion` rather than nothing:
 * the texture is part of the design, the motion is what the preference is about.
 */
export function ShaderAnimation({ className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const reduced = prefersReducedMotion();

    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
      renderer.render(scene, camera);
    };

    // ResizeObserver, not a window resize listener: the container is sized by
    // the layout around it and can change without the window changing at all.
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
    };

    // A backdrop scrolled off screen, or on a hidden tab, must not keep a
    // fragment shader running per physical pixel.
    const isOnScreen = { current: true };
    const syncPlayback = () => {
      const shouldRun = !reduced && isOnScreen.current && document.visibilityState === 'visible';
      if (shouldRun && !frame) animate();
      else if (!shouldRun && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const visibility = new IntersectionObserver(
      ([entry]) => {
        isOnScreen.current = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0 }
    );
    visibility.observe(container);
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', syncPlayback);
      visibility.disconnect();
      observer.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className={className} />;
}

export default ShaderAnimation;
