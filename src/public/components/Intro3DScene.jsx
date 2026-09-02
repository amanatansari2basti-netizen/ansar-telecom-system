import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  ContactShadows,
  RoundedBox,
} from "@react-three/drei";

import * as THREE from "three";
import { gsap } from "gsap";

/* =========================================================
   CAMERA LENS
========================================================= */

function CameraLens({
  position = [0, 0, 0],
  scale = 1,
}) {
  return (
    <group
      position={position}
      scale={scale}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <mesh>
        <cylinderGeometry
          args={[0.28, 0.28, 0.09, 64]}
        />

        <meshPhysicalMaterial
          color="#252b2e"
          metalness={0.98}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.06}
        />
      </mesh>

      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry
          args={[0.215, 0.215, 0.035, 64]}
        />

        <meshPhysicalMaterial
          color="#03080b"
          metalness={0.38}
          roughness={0.035}
          clearcoat={1}
          clearcoatRoughness={0.02}
        />
      </mesh>

      <mesh
        position={[
          -0.06,
          0.075,
          0.05,
        ]}
      >
        <sphereGeometry
          args={[0.045, 32, 32]}
        />

        <meshBasicMaterial
          color="#8cd9eb"
          transparent
          opacity={0.52}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   REAR PHONE FRAME
========================================================= */

function PhoneFrame({ layerRef }) {
  return (
    <group ref={layerRef}>
      {/* metallic outer frame */}

      <RoundedBox
        args={[3.16, 6.45, 0.38]}
        radius={0.43}
        smoothness={10}
      >
        <meshPhysicalMaterial
          color="#555d61"
          metalness={1}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.06}
        />
      </RoundedBox>

      {/* dark back glass */}

      <RoundedBox
        args={[3.02, 6.28, 0.31]}
        radius={0.39}
        smoothness={10}
        position={[0, 0, 0.05]}
      >
        <meshPhysicalMaterial
          color="#111719"
          metalness={0.42}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </RoundedBox>

      {/* soft glass highlight */}

      <mesh
        position={[
          0.48,
          0.25,
          0.225,
        ]}
        rotation={[0, 0, -0.15]}
      >
        <planeGeometry
          args={[0.38, 4.8]}
        />

        <meshBasicMaterial
          color="#c6eef1"
          transparent
          opacity={0.045}
          blending={
            THREE.AdditiveBlending
          }
        />
      </mesh>

      {/* camera island */}

      <RoundedBox
        args={[1.48, 1.68, 0.2]}
        radius={0.3}
        smoothness={8}
        position={[
          -0.68,
          2.08,
          0.29,
        ]}
      >
        <meshPhysicalMaterial
          color="#31383b"
          metalness={0.94}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </RoundedBox>

      <CameraLens
        position={[
          -0.94,
          2.42,
          0.43,
        ]}
        scale={0.96}
      />

      <CameraLens
        position={[
          -0.45,
          1.88,
          0.43,
        ]}
        scale={0.96}
      />

      <CameraLens
        position={[
          -0.43,
          2.53,
          0.43,
        ]}
        scale={0.96}
      />

      {/* flash */}

      <mesh
        position={[
          -1.03,
          1.82,
          0.44,
        ]}
      >
        <sphereGeometry
          args={[0.095, 28, 28]}
        />

        <meshPhysicalMaterial
          color="#f8edcf"
          emissive="#c6b37e"
          emissiveIntensity={0.34}
          roughness={0.3}
        />
      </mesh>

      {/* rear center detail */}

      <mesh
        position={[
          0,
          -0.12,
          0.225,
        ]}
      >
        <ringGeometry
          args={[0.29, 0.305, 72]}
        />

        <meshBasicMaterial
          color="#a6b3b5"
          transparent
          opacity={0.24}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   MOTHERBOARD
========================================================= */

function Motherboard({ layerRef }) {
  const chips = [
    [-0.78, 1.9, 0.15],
    [0.7, 1.72, 0.15],
    [-0.76, 1.15, 0.15],
    [0.7, 0.88, 0.15],
    [-0.78, 0.4, 0.15],
    [0.62, 0.18, 0.15],
  ];

  return (
    <group ref={layerRef}>
      {/* main green board */}

      <RoundedBox
        args={[2.5, 3.2, 0.16]}
        radius={0.2}
        smoothness={6}
        position={[0, 1.1, 0]}
      >
        <meshPhysicalMaterial
          color="#31503d"
          metalness={0.14}
          roughness={0.58}
          clearcoat={0.18}
        />
      </RoundedBox>

      {/* processor */}

      <RoundedBox
        args={[0.98, 0.98, 0.16]}
        radius={0.09}
        smoothness={5}
        position={[0, 1.48, 0.18]}
      >
        <meshPhysicalMaterial
          color="#1f2628"
          metalness={0.8}
          roughness={0.25}
          clearcoat={0.5}
        />
      </RoundedBox>

      <mesh position={[0, 1.48, 0.27]}>
        <planeGeometry args={[0.58, 0.58]} />

        <meshBasicMaterial
          color="#88988d"
          transparent
          opacity={0.38}
        />
      </mesh>

      {/* smaller ICs */}

      {chips.map(
        (position, index) => (
          <RoundedBox
            key={`${position.join("-")}-${index}`}
            args={
              index % 2 === 0
                ? [0.4, 0.3, 0.14]
                : [0.31, 0.42, 0.14]
            }
            radius={0.04}
            smoothness={4}
            position={position}
          >
            <meshPhysicalMaterial
              color="#171d1d"
              metalness={0.62}
              roughness={0.3}
            />
          </RoundedBox>
        )
      )}

      {/* metal shields */}

      <RoundedBox
        args={[0.72, 0.52, 0.1]}
        radius={0.04}
        smoothness={4}
        position={[-0.65, 2.25, 0.16]}
      >
        <meshPhysicalMaterial
          color="#8b9290"
          metalness={0.94}
          roughness={0.28}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.62, 0.42, 0.1]}
        radius={0.04}
        smoothness={4}
        position={[0.72, 2.18, 0.16]}
      >
        <meshPhysicalMaterial
          color="#8a918f"
          metalness={0.94}
          roughness={0.27}
        />
      </RoundedBox>

      {/* gold contact points */}

      {Array.from({ length: 24 }).map(
        (_, index) => {
          const column =
            index % 8;

          const row =
            Math.floor(index / 8);

          return (
            <mesh
              key={`contact-${index}`}
              position={[
                -1.05 +
                  column * 0.3,
                0.04 +
                  row * 0.24,
                0.15,
              ]}
            >
              <cylinderGeometry
                args={[
                  0.035,
                  0.035,
                  0.025,
                  18,
                ]}
              />

              <meshStandardMaterial
                color="#d5b465"
                metalness={0.95}
                roughness={0.18}
              />
            </mesh>
          );
        }
      )}

      {/* board traces */}

      <mesh
        position={[
          0,
          1.05,
          0.1,
        ]}
      >
        <planeGeometry
          args={[2.15, 2.7]}
        />

        <meshBasicMaterial
          color="#7ca184"
          transparent
          opacity={0.035}
          wireframe
        />
      </mesh>

      {/* lower charging board */}

      <RoundedBox
        args={[2.22, 0.7, 0.13]}
        radius={0.12}
        smoothness={5}
        position={[0, -2.45, 0]}
      >
        <meshPhysicalMaterial
          color="#263d31"
          metalness={0.18}
          roughness={0.55}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.72, 0.16, 0.14]}
        radius={0.04}
        smoothness={4}
        position={[0, -2.45, 0.13]}
      >
        <meshPhysicalMaterial
          color="#9a9f9c"
          metalness={0.98}
          roughness={0.2}
        />
      </RoundedBox>
    </group>
  );
}

/* =========================================================
   BATTERY
========================================================= */

function Battery({ layerRef }) {
  return (
    <group ref={layerRef}>
      <RoundedBox
        args={[2.34, 3.18, 0.24]}
        radius={0.2}
        smoothness={8}
        position={[0, -0.82, 0]}
      >
        <meshPhysicalMaterial
          color="#262b2d"
          metalness={0.32}
          roughness={0.3}
          clearcoat={0.44}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>

      {/* battery reflection */}

      <mesh
        position={[
          -0.45,
          -0.75,
          0.13,
        ]}
        rotation={[0, 0, -0.06]}
      >
        <planeGeometry
          args={[0.3, 2.55]}
        />

        <meshBasicMaterial
          color="#d9ebec"
          transparent
          opacity={0.035}
        />
      </mesh>

      {/* logo circle */}

      <mesh
        position={[
          0,
          -0.45,
          0.14,
        ]}
      >
        <ringGeometry
          args={[0.28, 0.3, 64]}
        />

        <meshBasicMaterial
          color="#9aa8aa"
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* lines */}

      <mesh
        position={[
          0,
          -1.05,
          0.14,
        ]}
      >
        <planeGeometry
          args={[0.95, 0.055]}
        />

        <meshBasicMaterial
          color="#889395"
          transparent
          opacity={0.28}
        />
      </mesh>

      <mesh
        position={[
          0,
          -1.26,
          0.14,
        ]}
      >
        <planeGeometry
          args={[1.3, 0.035]}
        />

        <meshBasicMaterial
          color="#889395"
          transparent
          opacity={0.18}
        />
      </mesh>

      <mesh
        position={[
          0,
          -1.39,
          0.14,
        ]}
      >
        <planeGeometry
          args={[1.05, 0.025]}
        />

        <meshBasicMaterial
          color="#889395"
          transparent
          opacity={0.14}
        />
      </mesh>

      {/* connector */}

      <RoundedBox
        args={[0.72, 0.22, 0.1]}
        radius={0.04}
        smoothness={4}
        position={[0, 0.82, 0.16]}
      >
        <meshPhysicalMaterial
          color="#b19450"
          metalness={0.9}
          roughness={0.2}
        />
      </RoundedBox>
    </group>
  );
}

/* =========================================================
   DISPLAY
========================================================= */

function Display({ layerRef }) {
  return (
    <group ref={layerRef}>
      {/* outer metallic rim */}

      <RoundedBox
        args={[3.12, 6.4, 0.2]}
        radius={0.43}
        smoothness={10}
      >
        <meshPhysicalMaterial
          color="#52595d"
          metalness={1}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </RoundedBox>

      {/* OLED glass */}

      <RoundedBox
        args={[2.96, 6.23, 0.13]}
        radius={0.39}
        smoothness={10}
        position={[0, 0, 0.12]}
      >
        <meshPhysicalMaterial
          color="#071012"
          metalness={0.08}
          roughness={0.045}
          clearcoat={1}
          clearcoatRoughness={0.025}
        />
      </RoundedBox>

      {/* actual visible screen */}

      <RoundedBox
        args={[2.78, 6.02, 0.035]}
        radius={0.34}
        smoothness={8}
        position={[0, 0, 0.19]}
      >
        <meshBasicMaterial
          color="#0a252b"
          transparent
          opacity={0.88}
        />
      </RoundedBox>

      {/* cyan screen glow */}

      <mesh
        position={[
          0.48,
          0.62,
          0.215,
        ]}
      >
        <circleGeometry
          args={[1.45, 64]}
        />

        <meshBasicMaterial
          color="#4aa8b5"
          transparent
          opacity={0.12}
          blending={
            THREE.AdditiveBlending
          }
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={[
          -0.55,
          -1.5,
          0.216,
        ]}
      >
        <circleGeometry
          args={[1.05, 64]}
        />

        <meshBasicMaterial
          color="#265d67"
          transparent
          opacity={0.09}
          blending={
            THREE.AdditiveBlending
          }
          depthWrite={false}
        />
      </mesh>

      {/* dynamic island */}

      <RoundedBox
        args={[0.88, 0.22, 0.045]}
        radius={0.11}
        smoothness={6}
        position={[
          0,
          2.72,
          0.225,
        ]}
      >
        <meshBasicMaterial color="#000000" />
      </RoundedBox>

      {/* center ring */}

      <mesh
        position={[
          0,
          -0.05,
          0.225,
        ]}
      >
        <ringGeometry
          args={[0.58, 0.595, 96]}
        />

        <meshBasicMaterial
          color="#80d7e0"
          transparent
          opacity={0.24}
          blending={
            THREE.AdditiveBlending
          }
        />
      </mesh>

      <mesh
        position={[
          0,
          -0.05,
          0.227,
        ]}
      >
        <ringGeometry
          args={[0.34, 0.348, 96]}
        />

        <meshBasicMaterial
          color="#b6f4f7"
          transparent
          opacity={0.28}
          blending={
            THREE.AdditiveBlending
          }
        />
      </mesh>

      {/* screen reflection */}

      <mesh
        position={[
          -0.72,
          0.1,
          0.23,
        ]}
        rotation={[0, 0, -0.13]}
      >
        <planeGeometry
          args={[0.38, 5.4]}
        />

        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.035}
          blending={
            THREE.AdditiveBlending
          }
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   PHONE ASSEMBLY
========================================================= */

const PhoneAssembly = forwardRef(
  function PhoneAssembly(_, ref) {
    const masterRef = useRef(null);

    const frameRef = useRef(null);
    const boardRef = useRef(null);
    const batteryRef = useRef(null);
    const displayRef = useRef(null);

    const rimLightRef = useRef(null);
    const screenLightRef = useRef(null);

    const idleEnabledRef =
      useRef(false);

    const mouseRef = useRef({
      x: 0,
      y: 0,
    });

    const {
      viewport,
    } = useThree();

    /* =====================================================
       POINTER PARALLAX
    ===================================================== */

    useEffect(() => {
      const handlePointerMove = (
        event
      ) => {
        mouseRef.current.x =
          (event.clientX /
            window.innerWidth -
            0.5) *
          2;

        mouseRef.current.y =
          (event.clientY /
            window.innerHeight -
            0.5) *
          2;
      };

      window.addEventListener(
        "pointermove",
        handlePointerMove,
        {
          passive: true,
        }
      );

      return () => {
        window.removeEventListener(
          "pointermove",
          handlePointerMove
        );
      };
    }, []);

    /* =====================================================
       IDLE ANIMATION
    ===================================================== */

    useFrame((state) => {
      if (
        !masterRef.current ||
        !idleEnabledRef.current
      ) {
        return;
      }

      const master =
        masterRef.current;

      const isMobile =
        viewport.width < 7;

      const time =
        state.clock.elapsedTime;

      const floatY =
        Math.sin(time * 0.72) *
        0.07;

      const floatRotation =
        Math.sin(time * 0.45) *
        0.025;

      const pointerX =
        isMobile
          ? 0
          : mouseRef.current.x *
            0.1;

      const pointerY =
        isMobile
          ? 0
          : mouseRef.current.y *
            0.055;

      master.position.y +=
        (floatY -
          master.position.y) *
        0.035;

      master.rotation.y +=
        (0.19 +
          floatRotation +
          pointerX -
          master.rotation.y) *
        0.035;

      master.rotation.x +=
        (-0.035 -
          pointerY -
          master.rotation.x) *
        0.035;

      if (rimLightRef.current) {
        rimLightRef.current.position.x =
          3.5 +
          Math.sin(time * 0.65) *
            2.2;
      }

      if (
        screenLightRef.current
      ) {
        screenLightRef.current.intensity =
          1.55 +
          Math.sin(time * 1.1) *
            0.15;
      }
    });

    /* =====================================================
       INTRO TIMELINE
    ===================================================== */

    useEffect(() => {
      const master =
        masterRef.current;

      const frame =
        frameRef.current;

      const board =
        boardRef.current;

      const battery =
        batteryRef.current;

      const display =
        displayRef.current;

      if (
        !master ||
        !frame ||
        !board ||
        !battery ||
        !display
      ) {
        return undefined;
      }

      const isMobile =
        viewport.width < 7;

      const finalScale =
        isMobile ? 0.6 : 0.8;

      const finalX =
        isMobile ? 0 : 1.75;

      idleEnabledRef.current =
        false;

      /* master initial */

      master.position.set(
        isMobile ? 0 : 0.8,
        0.05,
        0
      );

      master.rotation.set(
        0.15,
        -0.82,
        -0.07
      );

      master.scale.set(
        0.28,
        0.28,
        0.28
      );

      /* exploded positions */

      frame.position.set(
        -3.45,
        0.15,
        -2
      );

      board.position.set(
        -1.25,
        0.18,
        -0.5
      );

      battery.position.set(
        1.25,
        -0.12,
        0.85
      );

      display.position.set(
        3.65,
        0.12,
        2.4
      );

      frame.rotation.set(
        0,
        -0.34,
        -0.07
      );

      board.rotation.set(
        0,
        -0.16,
        -0.04
      );

      battery.rotation.set(
        0,
        0.15,
        0.045
      );

      display.rotation.set(
        0,
        0.33,
        0.07
      );

      const tl =
        gsap.timeline({
          defaults: {
            ease: "power3.out",
          },
        });

      /* enter scene */

      tl.to(
        master.scale,
        {
          x: finalScale,
          y: finalScale,
          z: finalScale,
          duration: 1.1,
          ease: "power4.out",
        },
        0
      );

      tl.to(
        master.rotation,
        {
          x: 0.06,
          y: -0.36,
          z: -0.02,
          duration: 1.2,
          ease: "power4.inOut",
        },
        0.05
      );

      /*
        EXPLODED VIEW
      */

      tl.to(
        frame.position,
        {
          x: -2.35,
          y: 0,
          z: -1.15,
          duration: 1,
        },
        0.22
      );

      tl.to(
        board.position,
        {
          x: -0.95,
          y: 0,
          z: -0.3,
          duration: 1,
        },
        0.36
      );

      tl.to(
        battery.position,
        {
          x: 0.95,
          y: 0,
          z: 0.65,
          duration: 1,
        },
        0.5
      );

      tl.to(
        display.position,
        {
          x: 2.4,
          y: 0,
          z: 1.45,
          duration: 1,
        },
        0.64
      );

      /* camera-style rotation */

      tl.to(
        master.rotation,
        {
          x: -0.02,
          y: 0.28,
          z: 0.025,
          duration: 1.05,
          ease: "power2.inOut",
        },
        1.12
      );

      /*
        HOLD EXPLODED VIEW LONGER
      */

      tl.to(
        master.position,
        {
          y: 0.14,
          duration: 0.45,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        1.55
      );

      /*
        ASSEMBLE
      */

      tl.to(
        frame.position,
        {
          x: 0,
          y: 0,
          z: -0.13,
          duration: 1.05,
          ease: "power4.inOut",
        },
        2.18
      );

      tl.to(
        board.position,
        {
          x: 0,
          y: 0,
          z: 0.03,
          duration: 1.05,
          ease: "power4.inOut",
        },
        2.24
      );

      tl.to(
        battery.position,
        {
          x: 0,
          y: 0,
          z: 0.11,
          duration: 1.05,
          ease: "power4.inOut",
        },
        2.3
      );

      tl.to(
        display.position,
        {
          x: 0,
          y: 0,
          z: 0.28,
          duration: 1.05,
          ease: "power4.inOut",
        },
        2.36
      );

      tl.to(
        frame.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.9,
          ease: "power3.inOut",
        },
        2.25
      );

      tl.to(
        board.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.9,
          ease: "power3.inOut",
        },
        2.25
      );

      tl.to(
        battery.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.9,
          ease: "power3.inOut",
        },
        2.25
      );

      tl.to(
        display.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.9,
          ease: "power3.inOut",
        },
        2.25
      );

      /*
        FINAL HERO POSITION
      */

      tl.to(
        master.position,
        {
          x: finalX,
          y: 0,
          z: 0.2,
          duration: 1.05,
          ease: "power3.inOut",
        },
        2.65
      );

      tl.to(
        master.rotation,
        {
          x: -0.035,
          y: 0.19,
          z: -0.018,
          duration: 1,
          ease: "power3.inOut",
        },
        2.68
      );

      tl.call(
        () => {
          idleEnabledRef.current =
            true;
        },
        [],
        3.45
      );

      return () => {
        tl.kill();
      };
    }, [viewport.width]);

    /* =====================================================
       EXIT
    ===================================================== */

    useImperativeHandle(
      ref,
      () => ({
        exit() {
          const master =
            masterRef.current;

          if (!master) return;

          idleEnabledRef.current =
            false;

          const tl =
            gsap.timeline();

          tl.to(
            master.rotation,
            {
              x: 0,
              y: 0,
              z: 0,
              duration: 0.42,
              ease: "power3.inOut",
            },
            0
          );

          tl.to(
            master.position,
            {
              x: 0,
              y: 0,
              z: 4,
              duration: 0.85,
              ease: "power4.in",
            },
            0.05
          );

          tl.to(
            master.scale,
            {
              x: 2.15,
              y: 2.15,
              z: 2.15,
              duration: 0.85,
              ease: "power4.in",
            },
            0.05
          );
        },
      }),
      []
    );

    return (
      <group ref={masterRef}>
        <PhoneFrame
          layerRef={frameRef}
        />

        <Motherboard
          layerRef={boardRef}
        />

        <Battery
          layerRef={batteryRef}
        />

        <Display
          layerRef={displayRef}
        />

        {/* strong right rim */}

        <pointLight
          ref={rimLightRef}
          position={[4, 2.2, 4]}
          intensity={6}
          distance={10}
          decay={2}
          color="#a9eef3"
        />

        {/* display glow */}

        <pointLight
          ref={screenLightRef}
          position={[0, 0, 2.2]}
          intensity={1.6}
          distance={4.5}
          decay={2}
          color="#62cbd7"
        />
      </group>
    );
  }
);

/* =========================================================
   COMPLETE SCENE
========================================================= */

const Intro3DScene = forwardRef(
  function Intro3DScene(_, ref) {
    const phoneRef = useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        exit() {
          phoneRef.current?.exit();
        },
      }),
      []
    );

    return (
      <div className="at-intro3d">
        <Canvas
          dpr={[1, 1.8]}
          camera={{
            position: [0, 0, 11.2],
            fov: 34,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference:
              "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace =
              THREE.SRGBColorSpace;

            gl.toneMapping =
              THREE.ACESFilmicToneMapping;

            gl.toneMappingExposure =
              1.45;
          }}
        >
          {/* =================================================
              STUDIO LIGHTING
          ================================================= */}

          <ambientLight
            intensity={0.72}
            color="#d9e7e8"
          />

          {/* key light */}

          <directionalLight
            position={[-4, 7, 8]}
            intensity={4.6}
            color="#ffffff"
          />

          {/* cyan rim */}

          <directionalLight
            position={[7, 2, 5]}
            intensity={5}
            color="#8cdce5"
          />

          {/* opposite cool rim */}

          <directionalLight
            position={[-6, -1, 4]}
            intensity={2.1}
            color="#527d86"
          />

          {/* top metal reflection */}

          <spotLight
            position={[
              1,
              8,
              7,
            ]}
            angle={0.42}
            penumbra={0.8}
            intensity={7}
            distance={18}
            color="#ffffff"
          />

          {/* side studio strip */}

          <spotLight
            position={[
              8,
              1,
              6,
            ]}
            angle={0.3}
            penumbra={0.72}
            intensity={5}
            distance={18}
            color="#a6eaf0"
          />

          {/* motherboard visibility */}

          <pointLight
            position={[
              -3.2,
              1.5,
              3.6,
            ]}
            intensity={4}
            distance={8}
            decay={2}
            color="#eef3d5"
          />

          {/* lower fill */}

          <pointLight
            position={[
              0,
              -4,
              4,
            ]}
            intensity={2.1}
            distance={9}
            decay={2}
            color="#587f85"
          />

          <PhoneAssembly
            ref={phoneRef}
          />

          <ContactShadows
            position={[
              1.2,
              -3.7,
              0,
            ]}
            opacity={0.54}
            scale={12}
            blur={2.7}
            far={7}
          />
        </Canvas>
      </div>
    );
  }
);

export default Intro3DScene;