import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Color } from 'three';

const hexToNormalizedRGB = (hex: string) => {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ];
};

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;

void main() {
  vec2 uv = vUv * uScale;
  float t = uTime * uSpeed;
  
  float pattern = 0.5 + 0.5 * sin(uv.x * 10.0 + t) * cos(uv.y * 8.0 + t * 0.7);
  pattern += 0.3 * sin(uv.x * 20.0 + t * 1.5) * sin(uv.y * 15.0 + t * 0.5);
  
  vec3 color = uColor * pattern;
  gl_FragColor = vec4(color, 0.3);
}
`;

function SilkPlane({ uniforms }: { uniforms: any }) {
  const meshRef = useRef<any>();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial 
        uniforms={uniforms} 
        vertexShader={vertexShader} 
        fragmentShader={fragmentShader}
        transparent={true}
      />
    </mesh>
  );
}

interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk = ({ speed = 2, scale = 3, color = '#10b981' }: SilkProps) => {
  const uniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uTime: { value: 0 }
    }),
    [speed, scale, color]
  );

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: -1 
    }}>
      <Canvas>
        <SilkPlane uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;
