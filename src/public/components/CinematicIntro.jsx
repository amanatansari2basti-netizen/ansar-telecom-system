import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react";

import "../styles/cinematic.css";

function CinematicIntro({ onComplete }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  const [videoReady, setVideoReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  /* =====================================================
     AUTOPLAY VIDEO
  ===================================================== */

  useEffect(() => {
    // Fallback: If video is missing or taking too long, mark ready so intro still reveals seamlessly
    const timeout = setTimeout(() => {
      setVideoReady(true);
    }, 600);

    const video = videoRef.current;

    if (!video) return () => clearTimeout(timeout);

    video.muted = true;
    video.volume = 0.75;

    const startVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.log(
          "Intro autoplay waiting for interaction:",
          error
        );
      }
    };

    startVideo();
    return () => clearTimeout(timeout);
  }, []);

  /* =====================================================
     PREMIUM CENTER REVEAL
  ===================================================== */

  useEffect(() => {
    if (!videoReady) return;

    const root = rootRef.current;

    if (!root) return;

    const ctx = gsap.context(() => {
      const eyebrow = ".at-center-eyebrow";
      const ansarLetters =
        ".at-brand-line-ansar .at-brand-letter";
      const telecomLetters =
        ".at-brand-line-telecom .at-brand-letter";
      const divider = ".at-center-divider";
      const location = ".at-center-location";
      const button = ".at-center-enter";
      const hint = ".at-center-hint";

      gsap.set(eyebrow, {
        opacity: 0,
        y: 12,
        filter: "blur(8px)",
      });

      gsap.set(ansarLetters, {
        opacity: 0,
        y: 34,
        rotateX: -55,
        filter: "blur(12px)",
      });

      gsap.set(telecomLetters, {
        opacity: 0,
        y: 26,
        rotateX: -45,
        filter: "blur(10px)",
      });

      gsap.set(divider, {
        scaleX: 0,
        opacity: 0,
      });

      gsap.set(location, {
        opacity: 0,
        y: 14,
        letterSpacing: "0.55em",
        filter: "blur(7px)",
      });

      gsap.set(button, {
        opacity: 0,
        y: 20,
        scale: 0.94,
        filter: "blur(6px)",
      });

      gsap.set(hint, {
        opacity: 0,
        y: 8,
      });

      const tl = gsap.timeline({
        delay: 0.45,
      });

      tl.to(eyebrow, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.75,
        ease: "power3.out",
      });

      tl.to(
        ansarLetters,
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.07,
          ease: "power4.out",
        },
        "-=0.35"
      );

      tl.to(
        telecomLetters,
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.85,
          stagger: 0.055,
          ease: "power4.out",
        },
        "-=0.52"
      );

      tl.to(
        divider,
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.85,
          ease: "power3.inOut",
        },
        "-=0.42"
      );

      tl.to(
        location,
        {
          opacity: 1,
          y: 0,
          letterSpacing: "0.24em",
          filter: "blur(0px)",
          duration: 0.95,
          ease: "power3.out",
        },
        "-=0.55"
      );

      tl.to(
        button,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "back.out(1.4)",
        },
        "-=0.38"
      );

      tl.to(
        hint,
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: "power2.out",
        },
        "-=0.3"
      );
    }, root);

    return () => ctx.revert();
  }, [videoReady]);

  /* =====================================================
     VIDEO READY
  ===================================================== */

  const handleVideoReady = () => {
    setVideoReady(true);

    const video = videoRef.current;

    if (video && video.paused) {
      video.play().catch(() => {});
    }
  };

  /* =====================================================
     SOUND
  ===================================================== */

  const toggleSound = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      }

      const nextState = !soundEnabled;

      video.muted = !nextState;
      video.volume = 0.75;

      setSoundEnabled(nextState);
    } catch (error) {
      console.log(
        "Unable to change intro sound:",
        error
      );
    }
  };

  /* =====================================================
     ENTER WEBSITE
  ===================================================== */

  const enterWebsite = () => {
    if (isLeaving) return;

    setIsLeaving(true);

    sessionStorage.setItem(
      "ansar-public-intro-seen",
      "true"
    );

    const root = rootRef.current;
    const video = videoRef.current;
    const content = contentRef.current;

    if (!root) {
      onComplete?.();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        if (video) {
          video.pause();
        }

        onComplete?.();
      },
    });

    if (content) {
      tl.to(content, {
        opacity: 0,
        scale: 1.035,
        filter: "blur(8px)",
        duration: 0.45,
        ease: "power3.in",
      });
    }

    tl.to(
      ".at-intro-sound",
      {
        opacity: 0,
        duration: 0.25,
      },
      0
    );

    tl.to(
      ".at-intro-video",
      {
        scale: 1.07,
        filter: "brightness(0.55) blur(3px)",
        duration: 0.9,
        ease: "power3.inOut",
      },
      0.08
    );

    tl.to(
      root,
      {
        opacity: 0,
        duration: 0.55,
        ease: "power2.inOut",
      },
      0.52
    );
  };

  /* =====================================================
     TEXT LETTERS
  ===================================================== */

  const renderLetters = (text) =>
    text.split("").map((letter, index) => (
      <span
        className="at-brand-letter"
        key={`${letter}-${index}`}
      >
        {letter === " " ? "\u00A0" : letter}
      </span>
    ));

  return (
    <div
      ref={rootRef}
      className={`at-cinematic-video-intro ${
        videoReady ? "is-ready" : ""
      } ${isLeaving ? "is-leaving" : ""}`}
    >
      {/* ================================================
          LOOPING VIDEO
      ================================================= */}

      <video
        ref={videoRef}
        className="at-intro-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={handleVideoReady}
        onLoadedData={handleVideoReady}
        onError={handleVideoReady}
      >
        <source
          src="/videos/ansar-intro.mp4"
          type="video/mp4"
          onError={handleVideoReady}
        />
      </video>

      {/* ================================================
          VIDEO OVERLAYS
      ================================================= */}

      <div className="at-intro-vignette" />
      <div className="at-intro-center-focus" />
      <div className="at-intro-grain" />

      {/* ================================================
          SOUND
      ================================================= */}

      <button
        type="button"
        className="at-intro-sound"
        onClick={toggleSound}
        aria-label={
          soundEnabled
            ? "Mute intro sound"
            : "Enable intro sound"
        }
      >
        {soundEnabled ? (
          <Volume2 size={17} />
        ) : (
          <VolumeX size={17} />
        )}

        <span>
          {soundEnabled
            ? "Sound On"
            : "Sound Off"}
        </span>
      </button>

      {/* ================================================
          CENTER BRANDING
      ================================================= */}

      <main
        ref={contentRef}
        className="at-intro-center"
      >
        <div className="at-center-eyebrow">
          <span className="at-center-eyebrow-line" />

          <span>
            PROFESSIONAL MOBILE REPAIR
          </span>

          <span className="at-center-eyebrow-line" />
        </div>

        <div className="at-center-brand">
          <div className="at-brand-line at-brand-line-ansar">
            {renderLetters("ANSAR")}
          </div>

          <div className="at-brand-line at-brand-line-telecom">
            {renderLetters("TELECOM")}
          </div>
        </div>

        <div className="at-center-divider">
          <span />
        </div>

        <div className="at-center-location">
          BASTI, UTTAR PRADESH
        </div>

        <button
          type="button"
          className="at-center-enter"
          onClick={enterWebsite}
          disabled={isLeaving}
        >
          <span className="at-center-enter-label">
            Enter Website
          </span>

          <span className="at-center-enter-arrow">
            <ArrowRight size={20} />
          </span>
        </button>

        <span className="at-center-hint">
          MOBILE REPAIR · DEVICE CARE
        </span>
      </main>

      {/* ================================================
          LOADER
      ================================================= */}

      {!videoReady && (
        <div className="at-intro-loader">
          <div className="at-intro-loader-mark">
            AT
          </div>

          <div className="at-intro-loader-bar">
            <span />
          </div>

          <p>Ansar Telecom</p>
        </div>
      )}
    </div>
  );
}

export default CinematicIntro;