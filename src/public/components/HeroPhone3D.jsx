import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

import "../styles/hero3d.css";

function CameraLens({
  position = [0, 0, 0],
  size = 0.22,
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[size, size, 0.055, 48]}
        />

        <meshStandardMaterial
          color="#111418"
          metalness={0.75}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[0, 0.032, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[
            size * 0.69,
            size * 0.69,
            0.02,
            48,
          ]}
        />

        <meshPhysicalMaterial
          color="#07121a"
          metalness={0.15}
          roughness={0.08}
          transmission={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      <mesh
        position={[
          -size * 0.16,
          0.045,
          size * 0.15,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry
          args={[size * 0.11, 24]}
        />

        <meshBasicMaterial
          color="#9eeeff"
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

function SideButton({
  position,
  scale,
}) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />

      <meshStandardMaterial
        color="#262d33"
        metalness={0.85}
        roughness={0.24}
      />
    </mesh>
  );
}

function PhoneModel() {
  const phoneRef = useRef(null);
  const screenGlowRef = useRef(null);
  const scanRef = useRef(null);

  useFrame((state, delta) => {
    if (!phoneRef.current) return;

    const targetRotationX =
      -0.08 + state.pointer.y * 0.12;

    const targetRotationY =
      -0.46 + state.pointer.x * 0.28;

    phoneRef.current.rotation.x =
      THREE.MathUtils.damp(
        phoneRef.current.rotation.x,
        targetRotationX,
        4,
        delta
      );

    phoneRef.current.rotation.y =
      THREE.MathUtils.damp(
        phoneRef.current.rotation.y,
        targetRotationY,
        4,
        delta
      );

    if (screenGlowRef.current) {
      screenGlowRef.current.material.emissiveIntensity =
        1.25 +
        Math.sin(state.clock.elapsedTime * 1.6) * 0.18;
    }

    if (scanRef.current) {
      scanRef.current.position.y =
        Math.sin(
          state.clock.elapsedTime * 0.85
        ) * 1.55;
    }
  });

  return (
    <Float
      speed={1.25}
      rotationIntensity={0.12}
      floatIntensity={0.3}
      floatingRange={[-0.12, 0.12]}
    >
      <group
        ref={phoneRef}
        rotation={[-0.08, -0.46, 0.03]}
        scale={1.06}
      >
        {/* BODY */}

        <RoundedBox
          args={[3.35, 6.65, 0.47]}
          radius={0.34}
          smoothness={8}
        >
          <meshPhysicalMaterial
            color="#191d20"
            metalness={0.92}
            roughness={0.22}
            clearcoat={0.8}
            clearcoatRoughness={0.16}
          />
        </RoundedBox>

        {/* METALLIC EDGE */}

        <RoundedBox
          args={[3.23, 6.53, 0.5]}
          radius={0.3}
          smoothness={8}
          position={[0, 0, 0.005]}
        >
          <meshPhysicalMaterial
            color="#323a40"
            metalness={0.95}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </RoundedBox>

        {/* FRONT BLACK PANEL */}

        <RoundedBox
          args={[3.07, 6.36, 0.11]}
          radius={0.25}
          smoothness={8}
          position={[0, 0, 0.292]}
        >
          <meshPhysicalMaterial
            color="#020405"
            metalness={0.15}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.03}
          />
        </RoundedBox>

        {/* DISPLAY */}

        <RoundedBox
          ref={screenGlowRef}
          args={[2.94, 6.19, 0.045]}
          radius={0.21}
          smoothness={8}
          position={[0, 0, 0.36]}
        >
          <meshStandardMaterial
            color="#050b0e"
            emissive="#08232c"
            emissiveIntensity={1.35}
            roughness={0.14}
            metalness={0.05}
          />
        </RoundedBox>

        {/* SCREEN GRADIENT-LIKE GLOW */}

        <mesh position={[0, 0.4, 0.392]}>
          <planeGeometry args={[2.62, 4.9]} />

          <meshBasicMaterial
            color="#0b3944"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* DYNAMIC ISLAND */}

        <RoundedBox
          args={[0.82, 0.23, 0.04]}
          radius={0.11}
          smoothness={8}
          position={[0, 2.72, 0.42]}
        >
          <meshStandardMaterial
            color="#000000"
            roughness={0.15}
          />
        </RoundedBox>

        {/* SCANNER LINE */}

        <mesh
          ref={scanRef}
          position={[0, 0, 0.425]}
        >
          <planeGeometry args={[2.55, 0.025]} />

          <meshBasicMaterial
            color="#75eaff"
            transparent
            opacity={0.78}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* SCREEN TEXT-LIKE BARS */}

        <mesh position={[0, -1.55, 0.425]}>
          <planeGeometry args={[1.45, 0.055]} />

          <meshBasicMaterial
            color="#8cefff"
            transparent
            opacity={0.65}
          />
        </mesh>

        <mesh position={[0, -1.73, 0.425]}>
          <planeGeometry args={[0.92, 0.025]} />

          <meshBasicMaterial
            color="#dcecef"
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* HOME INDICATOR */}

        <RoundedBox
          args={[0.82, 0.055, 0.025]}
          radius={0.025}
          smoothness={4}
          position={[0, -2.88, 0.42]}
        >
          <meshBasicMaterial
            color="#e7f8fb"
            transparent
            opacity={0.72}
          />
        </RoundedBox>

        {/* CAMERA AREA ON REAR SIDE */}

        <RoundedBox
          args={[1.24, 1.55, 0.18]}
          radius={0.28}
          smoothness={8}
          position={[
            -0.77,
            2.13,
            -0.315,
          ]}
        >
          <meshStandardMaterial
            color="#20272b"
            metalness={0.72}
            roughness={0.2}
          />
        </RoundedBox>

        <group
          position={[
            -0.77,
            2.13,
            -0.425,
          ]}
          rotation={[Math.PI, 0, 0]}
        >
          <CameraLens
            position={[-0.3, 0.34, 0]}
            size={0.26}
          />

          <CameraLens
            position={[0.3, 0.34, 0]}
            size={0.26}
          />

          <CameraLens
            position={[-0.3, -0.32, 0]}
            size={0.26}
          />

          <mesh
            position={[0.3, -0.32, 0]}
            rotation={[
              Math.PI / 2,
              0,
              0,
            ]}
          >
            <cylinderGeometry
              args={[0.12, 0.12, 0.03, 32]}
            />

            <meshBasicMaterial
              color="#f5f1d6"
            />
          </mesh>
        </group>

        {/* SIDE BUTTONS */}

        <SideButton
          position={[1.69, 1.2, 0]}
          scale={[0.055, 0.83, 0.22]}
        />

        <SideButton
          position={[-1.69, 1.65, 0]}
          scale={[0.055, 0.48, 0.22]}
        />

        <SideButton
          position={[-1.69, 0.65, 0]}
          scale={[0.055, 0.72, 0.22]}
        />

        {/* INTERNAL GLOW CORE FOR FUTURE EXPLODED VIEW */}

        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[1.65, 3.5, 0.12]} />

          <meshStandardMaterial
            color="#0c313a"
            emissive="#0d6a78"
            emissiveIntensity={0.38}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.75} />

      <directionalLight
        position={[5, 7, 5]}
        intensity={3.1}
        color="#ffffff"
      />

      <directionalLight
        position={[-4, 1, 4]}
        intensity={2.4}
        color="#8de9ff"
      />

      <pointLight
        position={[3, -3, 4]}
        intensity={30}
        distance={9}
        color="#4dcce7"
      />

      <pointLight
        position={[-4, 4, -1]}
        intensity={20}
        distance={10}
        color="#849dff"
      />

      <Sparkles
        count={30}
        scale={[6, 8, 4]}
        size={1.2}
        speed={0.2}
        opacity={0.22}
        color="#a6edff"
      />

      <PhoneModel />
    </>
  );
}

function HeroPhone3D() {
  return (
    <div className="at-hero3d">
      <div className="at-hero3d__backlight" />

      <div className="at-hero3d__ring at-hero3d__ring--one" />
      <div className="at-hero3d__ring at-hero3d__ring--two" />
      <div className="at-hero3d__ring at-hero3d__ring--three" />

      <Canvas
        className="at-hero3d__canvas"
        camera={{
          position: [0, 0.05, 8.7],
          fov: 34,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.6]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className="at-hero3d__hud at-hero3d__hud--top">
        <span>DEVICE ANALYSIS</span>

        <strong>
          <i />
          SYSTEM ACTIVE
        </strong>
      </div>

      <div className="at-hero3d__hud at-hero3d__hud--left">
        <span>PRECISION</span>
        <strong>01</strong>
      </div>

      <div className="at-hero3d__hud at-hero3d__hud--right">
        <span>REPAIR STATUS</span>
        <strong>READY</strong>
      </div>

      <div className="at-hero3d__technical">
        <span>AT / DEVICE LAB</span>
        <span>03.2718</span>
      </div>
    </div>
  );
}

export default HeroPhone3D;