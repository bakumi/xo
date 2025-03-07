declare namespace JSX {
  interface IntrinsicElements {
    group: any;
    mesh: any;
    boxGeometry: any;
    meshPhysicalMaterial: any;
    meshBasicMaterial: any;
    torusGeometry: any;
    bufferGeometry: any;
    bufferAttribute: any;
    sphereGeometry: any;
    lineBasicMaterial: any;
    line: any;
    primitive: any;
    ambientLight: any;
    pointLight: any;
    spotLight: any;
    color: any;
  }
}

declare module "@react-three/fiber" {
  export const Canvas: any;
  export const useFrame: any;
}

declare module "@react-three/drei" {
  export const OrbitControls: any;
  export const Billboard: any;
  export const Environment: any;
  export const BakeShadows: any;
}

declare module "@react-three/postprocessing" {
  export const EffectComposer: any;
  export const Bloom: any;
} 