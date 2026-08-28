import React from 'react';
import {
  Shader,
  DotGrid,
  ChromaFlow,
  LinearGradient,
  CursorRipples,
  FilmGrain,
} from 'shaders/react';

/**
 * Sole importer of `shaders/react` for the contact section, so webpack can split the
 * (34MB-source) shaders library into its own chunk instead of shipping it in the
 * initial bundle for a decorative, below-the-fold background. Loaded via React.lazy
 * from CursorTrailContact, which keeps its own heading/CTA/footer content eager and
 * outside the Suspense boundary.
 *
 * The visible "cursor trail" effect is produced by two components that render NOTHING
 * on screen directly, chained together by `id` / `maskSource` / `dotSize.source`:
 *
 *   ChromaFlow#trailFlow (visible=false) tracks the cursor and produces a fading flow
 *   field. DotGrid#trailDots (visible=false) reads that field's alpha channel through
 *   its `dotSize` map driver, so its dots only grow where the cursor recently moved --
 *   but DotGrid itself is invisible too. The white LinearGradient below it is masked
 *   by `maskSource="trailDots"`, so THAT layer is what actually paints the glowing
 *   trail on screen. Removing either invisible layer, or breaking either id linkage,
 *   silently kills the whole effect (nothing errors -- the mask/driver just resolves
 *   to nothing), so don't "simplify" this tree.
 */
export default function CursorTrailCanvas({ onUnavailable }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
      <Shader
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        onUnavailable={onUnavailable}
      >
        <DotGrid
          id="trailDots"
          density={40}
          twinkle={0.9}
          visible={false}
          dotSize={{
            type: 'map',
            source: 'trailFlow',
            channel: 'alpha',
            inputMin: 0,
            inputMax: 1,
            outputMin: 0,
            outputMax: 1,
          }}
        />
        <ChromaFlow id="trailFlow" intensity={1.4} radius={2.9} visible={false} />
        <LinearGradient
          colorA="#1e1e1f"
          colorB="#070708"
          colorSpace="hsl"
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        />
        <LinearGradient
          colorA="#000000"
          colorB="#ffffff"
          colorSpace="hsl"
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          maskSource="trailDots"
        />
        <CursorRipples />
        <FilmGrain strength={0.1} />
      </Shader>
    </div>
  );
}
