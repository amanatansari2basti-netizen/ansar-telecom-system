import { useEffect, useRef } from "react";

function SoundController({ enabled }) {
  const contextRef = useRef(null);
  const ambientRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (gainRef.current) {
        try {
          gainRef.current.gain.setTargetAtTime(
            0,
            contextRef.current.currentTime,
            0.15
          );
        } catch {
          // Audio context may already be closed.
        }
      }

      return undefined;
    }

    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return undefined;
    }

    let context = contextRef.current;

    if (!context || context.state === "closed") {
      context = new AudioContext();
      contextRef.current = context;
    }

    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    if (!ambientRef.current) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 82;

      gain.gain.value = 0;

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();

      ambientRef.current = oscillator;
      gainRef.current = gain;
    }

    gainRef.current.gain.setTargetAtTime(
      0.012,
      context.currentTime,
      0.4
    );

    return undefined;
  }, [enabled]);

  useEffect(() => {
    return () => {
      try {
        ambientRef.current?.stop();
      } catch {
        // Already stopped.
      }

      try {
        contextRef.current?.close();
      } catch {
        // Already closed.
      }

      ambientRef.current = null;
      gainRef.current = null;
      contextRef.current = null;
    };
  }, []);

  return null;
}

export default SoundController;