import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

import {
  BatteryCharging,
  Check,
  Cpu,
  ScanLine,
  Smartphone,
  Wrench,
  Zap,
} from "lucide-react";

import "../styles/repairStory.css";

gsap.registerPlugin(ScrollTrigger);

const STORY_STAGES = [
  {
    number: "01",
    kicker: "DEVICE RECEIVED",
    title: "Every repair starts with inspection.",
    text: "The device is recorded, checked and prepared for a structured diagnosis.",
    icon: Smartphone,
  },
  {
    number: "02",
    kicker: "DISPLAY",
    title: "Layer by layer.",
    text: "The display assembly separates so internal components can be inspected safely.",
    icon: ScanLine,
  },
  {
    number: "03",
    kicker: "POWER SYSTEM",
    title: "Battery health matters.",
    text: "Power delivery, battery condition and related charging behaviour are examined.",
    icon: BatteryCharging,
  },
  {
    number: "04",
    kicker: "LOGIC BOARD",
    title: "Diagnosis goes deeper.",
    text: "Board-level components are inspected to locate the actual source of the fault.",
    icon: Cpu,
  },
  {
    number: "05",
    kicker: "PRECISION REPAIR",
    title: "Repair only what matters.",
    text: "The required repair is carried out with a controlled technician workflow.",
    icon: Wrench,
  },
  {
    number: "06",
    kicker: "FINAL TESTING",
    title: "Repair is not the final step.",
    text: "The device goes through functional checks before it can be marked ready.",
    icon: Zap,
  },
  {
    number: "07",
    kicker: "READY",
    title: "Back together. Ready for you.",
    text: "After testing, the device is reassembled and moved to the delivery stage.",
    icon: Check,
  },
];

const clamp = (value, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const rangeProgress = (progress, start, end) => {
  if (end === start) return 0;

  return clamp((progress - start) / (end - start));
};

const smooth = (value) =>
  value * value * (3 - 2 * value);

function CameraLens({
  position = [0, 0, 0],
  size = 0.22,
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[size, size, 0.06, 40]}
        />

        <meshStandardMaterial
          color="#0b0e11"
          metalness={0.82}
          roughness={0.19}
        />
      </mesh>

      <mesh
        position={[0, 0.035, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[
            size * 0.68,
            size * 0.68,
            0.022,
            40,
          ]}
        />

        <meshPhysicalMaterial
          color="#06151c"
          roughness={0.06}
          metalness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.03}
        />
      </mesh>

      <mesh
        position={[
          -size * 0.15,
          0.05,
          size * 0.12,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[size * 0.1, 20]} />

        <meshBasicMaterial
          color="#9aedff"
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  );
}

function PhoneFrame() {
  return (
    <group>
      <RoundedBox
        args={[3.35, 6.62, 0.48]}
        radius={0.34}
        smoothness={7}
      >
        <meshPhysicalMaterial
          color="#161a1d"
          metalness={0.94}
          roughness={0.22}
          clearcoat={0.85}
          clearcoatRoughness={0.12}
        />
      </RoundedBox>

      <RoundedBox
        args={[3.18, 6.45, 0.5]}
        radius={0.3}
        smoothness={7}
        position={[0, 0, 0.015]}
      >
        <meshPhysicalMaterial
          color="#343c41"
          metalness={0.96}
          roughness={0.17}
          clearcoat={1}
          clearcoatRoughness={0.09}
        />
      </RoundedBox>

      <RoundedBox
        args={[3.01, 6.27, 0.34]}
        radius={0.26}
        smoothness={7}
        position={[0, 0, 0.11]}
      >
        <meshStandardMaterial
          color="#07090a"
          metalness={0.3}
          roughness={0.33}
        />
      </RoundedBox>

      <RoundedBox
        args={[1.2, 1.5, 0.19]}
        radius={0.26}
        smoothness={7}
        position={[-0.77, 2.14, -0.3]}
      >
        <meshStandardMaterial
          color="#252d31"
          metalness={0.78}
          roughness={0.2}
        />
      </RoundedBox>

      <group
        position={[-0.77, 2.14, -0.41]}
        rotation={[Math.PI, 0, 0]}
      >
        <CameraLens
          position={[-0.28, 0.31, 0]}
          size={0.25}
        />

        <CameraLens
          position={[0.28, 0.31, 0]}
          size={0.25}
        />

        <CameraLens
          position={[-0.28, -0.31, 0]}
          size={0.25}
        />

        <mesh
          position={[0.29, -0.31, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry
            args={[0.105, 0.105, 0.03, 28]}
          />

          <meshBasicMaterial color="#ede8cb" />
        </mesh>
      </group>
    </group>
  );
}

function DisplayAssembly({ progressRef }) {
  const displayRef = useRef(null);
  const glowRef = useRef(null);

  useFrame((state, delta) => {
    const progress = progressRef.current;

    const remove =
      smooth(rangeProgress(progress, 0.12, 0.28));

    const reassemble =
      smooth(rangeProgress(progress, 0.83, 0.97));

    const amount = remove * (1 - reassemble);

    if (displayRef.current) {
      displayRef.current.position.x =
        THREE.MathUtils.damp(
          displayRef.current.position.x,
          amount * 1.85,
          5,
          delta
        );

      displayRef.current.position.z =
        THREE.MathUtils.damp(
          displayRef.current.position.z,
          0.32 + amount * 1.45,
          5,
          delta
        );

      displayRef.current.rotation.y =
        THREE.MathUtils.damp(
          displayRef.current.rotation.y,
          amount * 0.17,
          5,
          delta
        );
    }

    if (glowRef.current) {
      const testing =
        rangeProgress(progress, 0.7, 0.9);

      glowRef.current.material.emissiveIntensity =
        0.8 +
        testing * 1.7 +
        Math.sin(state.clock.elapsedTime * 1.7) *
          0.08;
    }
  });

  return (
    <group
      ref={displayRef}
      position={[0, 0, 0.32]}
    >
      <RoundedBox
        args={[3.02, 6.28, 0.12]}
        radius={0.25}
        smoothness={7}
      >
        <meshPhysicalMaterial
          color="#020405"
          metalness={0.08}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.025}
        />
      </RoundedBox>

      <RoundedBox
        ref={glowRef}
        args={[2.9, 6.13, 0.045]}
        radius={0.21}
        smoothness={7}
        position={[0, 0, 0.075]}
      >
        <meshStandardMaterial
          color="#041014"
          emissive="#0a4c59"
          emissiveIntensity={0.85}
          roughness={0.12}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.78, 0.22, 0.035]}
        radius={0.1}
        smoothness={6}
        position={[0, 2.73, 0.105]}
      >
        <meshBasicMaterial color="#000000" />
      </RoundedBox>

      <mesh position={[0, -1.72, 0.105]}>
        <planeGeometry args={[1.25, 0.035]} />

        <meshBasicMaterial
          color="#8beeff"
          transparent
          opacity={0.55}
        />
      </mesh>

      <mesh position={[0, -1.88, 0.105]}>
        <planeGeometry args={[0.72, 0.018]} />

        <meshBasicMaterial
          color="#dceef2"
          transparent
          opacity={0.25}
        />
      </mesh>
    </group>
  );
}

function BatteryLayer({ progressRef }) {
  const ref = useRef(null);

  useFrame((_, delta) => {
    const progress = progressRef.current;

    const expose =
      smooth(rangeProgress(progress, 0.26, 0.42));

    const reassemble =
      smooth(rangeProgress(progress, 0.82, 0.96));

    const amount = expose * (1 - reassemble);

    if (!ref.current) return;

    ref.current.position.x =
      THREE.MathUtils.damp(
        ref.current.position.x,
        -amount * 1.55,
        5,
        delta
      );

    ref.current.position.z =
      THREE.MathUtils.damp(
        ref.current.position.z,
        0.21 + amount * 1.12,
        5,
        delta
      );

    ref.current.rotation.z =
      THREE.MathUtils.damp(
        ref.current.rotation.z,
        -amount * 0.06,
        5,
        delta
      );
  });

  return (
    <group
      ref={ref}
      position={[0, -0.45, 0.21]}
    >
      <RoundedBox
        args={[2.25, 3.7, 0.14]}
        radius={0.18}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#171b1e"
          metalness={0.3}
          roughness={0.48}
        />
      </RoundedBox>

      <RoundedBox
        args={[1.75, 0.52, 0.025]}
        radius={0.1}
        smoothness={4}
        position={[0, 0.25, 0.085]}
      >
        <meshBasicMaterial
          color="#253037"
        />
      </RoundedBox>

      <mesh position={[0, -0.35, 0.086]}>
        <planeGeometry args={[1.28, 0.034]} />

        <meshBasicMaterial
          color="#73dfef"
          transparent
          opacity={0.35}
        />
      </mesh>

      <mesh position={[0, -0.53, 0.086]}>
        <planeGeometry args={[0.82, 0.022]} />

        <meshBasicMaterial
          color="#a7b4b8"
          transparent
          opacity={0.22}
        />
      </mesh>
    </group>
  );
}

function LogicBoard({ progressRef }) {
  const ref = useRef(null);
  const scanRef = useRef(null);

  useFrame((state, delta) => {
    const progress = progressRef.current;

    const expose =
      smooth(rangeProgress(progress, 0.39, 0.56));

    const reassemble =
      smooth(rangeProgress(progress, 0.83, 0.96));

    const amount = expose * (1 - reassemble);

    if (ref.current) {
      ref.current.position.x =
        THREE.MathUtils.damp(
          ref.current.position.x,
          amount * 1.45,
          5,
          delta
        );

      ref.current.position.z =
        THREE.MathUtils.damp(
          ref.current.position.z,
          0.23 + amount * 1.05,
          5,
          delta
        );

      ref.current.rotation.z =
        THREE.MathUtils.damp(
          ref.current.rotation.z,
          amount * 0.07,
          5,
          delta
        );
    }

    if (scanRef.current) {
      const diagnosis =
        rangeProgress(progress, 0.48, 0.69);

      scanRef.current.visible =
        diagnosis > 0 && diagnosis < 1;

      scanRef.current.position.y =
        1.15 -
        ((state.clock.elapsedTime * 0.65) % 1) *
          2.3;
    }
  });

  return (
    <group
      ref={ref}
      position={[0, 1.52, 0.23]}
    >
      <RoundedBox
        args={[2.18, 1.52, 0.16]}
        radius={0.17}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#101c1a"
          metalness={0.47}
          roughness={0.38}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.68, 0.58, 0.08]}
        radius={0.08}
        smoothness={4}
        position={[-0.45, 0.23, 0.12]}
      >
        <meshStandardMaterial
          color="#242b2c"
          metalness={0.72}
          roughness={0.3}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.52, 0.45, 0.075]}
        radius={0.06}
        smoothness={4}
        position={[0.48, 0.3, 0.12]}
      >
        <meshStandardMaterial
          color="#293133"
          metalness={0.7}
          roughness={0.29}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.48, 0.34, 0.07]}
        radius={0.05}
        smoothness={4}
        position={[0.48, -0.33, 0.12]}
      >
        <meshStandardMaterial
          color="#252d2f"
          metalness={0.68}
          roughness={0.32}
        />
      </RoundedBox>

      <mesh
        ref={scanRef}
        position={[0, 0.8, 0.19]}
      >
        <planeGeometry args={[2.05, 0.035]} />

        <meshBasicMaterial
          color="#79efff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function RepairCore({ progressRef }) {
  const coreRef = useRef(null);

  useFrame((state) => {
    if (!coreRef.current) return;

    const progress = progressRef.current;

    const repairing =
      rangeProgress(progress, 0.56, 0.76);

    coreRef.current.material.opacity =
      repairing > 0 && repairing < 1
        ? 0.16 +
          Math.sin(state.clock.elapsedTime * 4) *
            0.05
        : 0;
  });

  return (
    <mesh
      position={[0.7, 1.55, 0.55]}
    >
      <sphereGeometry args={[0.65, 32, 32]} />

      <meshBasicMaterial
        ref={coreRef}
        color="#72eaff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function StoryPhone({ progressRef }) {
  const groupRef = useRef(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const progress = progressRef.current;

    const targetY =
      -0.36 +
      Math.sin(progress * Math.PI) * 0.11;

    const targetRotationY =
      THREE.MathUtils.lerp(
        -0.44,
        0.27,
        smooth(
          rangeProgress(progress, 0, 0.65)
        )
      );

    const readyRotation =
      smooth(
        rangeProgress(progress, 0.82, 1)
      );

    const finalRotationY =
      THREE.MathUtils.lerp(
        targetRotationY,
        -0.22,
        readyRotation
      );

    groupRef.current.position.y =
      THREE.MathUtils.damp(
        groupRef.current.position.y,
        targetY,
        4,
        delta
      );

    groupRef.current.rotation.y =
      THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        finalRotationY,
        4,
        delta
      );

    groupRef.current.rotation.x =
      THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        -0.05 +
          Math.sin(progress * Math.PI * 2) *
            0.045,
        4,
        delta
      );
  });

  return (
    <Float
      speed={0.65}
      rotationIntensity={0.03}
      floatIntensity={0.08}
    >
      <group
        ref={groupRef}
        scale={0.92}
        rotation={[-0.05, -0.44, 0]}
      >
        <PhoneFrame />
        <BatteryLayer progressRef={progressRef} />
        <LogicBoard progressRef={progressRef} />
        <DisplayAssembly progressRef={progressRef} />
        <RepairCore progressRef={progressRef} />
      </group>
    </Float>
  );
}

function StoryScene({ progressRef }) {
  return (
    <>
      <ambientLight intensity={0.75} />

      <directionalLight
        position={[5, 7, 6]}
        intensity={3}
        color="#ffffff"
      />

      <directionalLight
        position={[-5, 2, 5]}
        intensity={2.2}
        color="#8eeaff"
      />

      <pointLight
        position={[4, -3, 5]}
        intensity={28}
        distance={10}
        color="#5edff4"
      />

      <pointLight
        position={[-4, 4, 1]}
        intensity={18}
        distance={9}
        color="#7c8dff"
      />

      <Sparkles
        count={25}
        scale={[7, 8, 4]}
        size={1}
        speed={0.18}
        opacity={0.15}
        color="#a7eeff"
      />

      <StoryPhone progressRef={progressRef} />
    </>
  );
}

function RepairStory3D() {
  const sectionRef = useRef(null);
  const progressRef = useRef(0);

  const [activeStage, setActiveStage] =
    useState(0);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return undefined;

    const progressObject = {
      value: 0,
    };

    let lastStage = -1;

    const ctx = gsap.context(() => {
      const tween = gsap.to(progressObject, {
        value: 1,
        ease: "none",

        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,

          onUpdate: () => {
            progressRef.current =
              progressObject.value;

            const calculatedStage =
              Math.min(
                STORY_STAGES.length - 1,
                Math.floor(
                  progressObject.value *
                    STORY_STAGES.length
                )
              );

            if (calculatedStage !== lastStage) {
              lastStage = calculatedStage;
              setActiveStage(calculatedStage);
            }
          },
        },
      });

      return () => {
        tween.kill();
      };
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  const ActiveIcon =
    STORY_STAGES[activeStage].icon;

  return (
    <section
      ref={sectionRef}
      className="at-repair-story"
    >
      <div className="at-repair-story__sticky">
        <div className="at-repair-story__background">
          <div className="at-repair-story__grid" />
          <div className="at-repair-story__glow at-repair-story__glow--one" />
          <div className="at-repair-story__glow at-repair-story__glow--two" />
        </div>

        <div className="at-repair-story__topbar">
          <div>
            <span>04 / INSIDE THE REPAIR</span>
            <strong>
              ANSAR TELECOM ENGINEERING
            </strong>
          </div>

          <div className="at-repair-story__top-status">
            <i />
            LIVE SYSTEM
          </div>
        </div>

        <div className="at-repair-story__copy">
          <div
            key={`copy-${activeStage}`}
            className="at-repair-story__copy-inner"
          >
            <div className="at-repair-story__stage-index">
              <span>
                {STORY_STAGES[activeStage].number}
              </span>

              <div />

              <span>
                0{STORY_STAGES.length}
              </span>
            </div>

            <div className="at-repair-story__stage-icon">
              <ActiveIcon
                size={20}
                strokeWidth={1.5}
              />
            </div>

            <span className="at-repair-story__kicker">
              {STORY_STAGES[activeStage].kicker}
            </span>

            <h2>
              {STORY_STAGES[activeStage].title}
            </h2>

            <p>
              {STORY_STAGES[activeStage].text}
            </p>
          </div>
        </div>

        <div className="at-repair-story__visual">
          <div className="at-repair-story__visual-ring at-repair-story__visual-ring--one" />
          <div className="at-repair-story__visual-ring at-repair-story__visual-ring--two" />

          <Canvas
            camera={{
              position: [0, 0.05, 9.1],
              fov: 34,
              near: 0.1,
              far: 100,
            }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference:
                "high-performance",
            }}
          >
            <Suspense fallback={null}>
              <StoryScene
                progressRef={progressRef}
              />
            </Suspense>
          </Canvas>
        </div>

        <div className="at-repair-story__progress">
          {STORY_STAGES.map((stage, index) => (
            <div
              className={`at-repair-story__progress-item ${
                index === activeStage
                  ? "at-repair-story__progress-item--active"
                  : ""
              } ${
                index < activeStage
                  ? "at-repair-story__progress-item--complete"
                  : ""
              }`}
              key={stage.number}
            >
              <span>{stage.number}</span>

              <div>
                <i />
              </div>
            </div>
          ))}
        </div>

        <div className="at-repair-story__technical">
          <span>AT / REPAIR LAB</span>
          <span>
            STAGE {STORY_STAGES[activeStage].number}
          </span>
        </div>
      </div>
    </section>
  );
}

export default RepairStory3D;