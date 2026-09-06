/* =========================================================
   ANSAR TELECOM - 5-SECOND FULL VOLUME ALERT SYSTEM
   
   Provides:
   1. 5-Second Loud Alert Siren / Chime (Web Audio API at 100% gain)
   2. Voice Text-To-Speech announcement (speechSynthesis at volume 1.0)
   3. Mobile Haptic Vibration (navigator.vibrate)
   4. Audio Context auto-unlock on user gesture
========================================================= */

let sharedAudioContext = null;
let activeAlertStopFn = null;

/**
 * Ensures a single shared AudioContext is created and resumed on user interaction
 */
export const getAudioContext = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioCtx();
    }

    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume().catch(() => {});
    }

    return sharedAudioContext;
  } catch (err) {
    console.warn("AudioContext init error:", err);
    return null;
  }
};

/**
 * Unlock AudioContext on first touch/click across the entire application
 */
export const initAudioUnlocker = () => {
  if (typeof window === "undefined") return;

    const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    } catch (err) {
      void err;
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
};

// Immediately register unlocker on script load
initAudioUnlocker();

/**
 * Play a 5-second loud alert chime with Text-To-Speech and Mobile Vibration
 *
 * @param {Object} options
 * @param {number} [options.durationMs=5000] - Duration in milliseconds (default 5000ms = 5 seconds)
 * @param {"job_assigned" | "pickup_booked"} [options.type="job_assigned"]
 * @param {string} [options.speechText=""] - Text to speak aloud
 * @param {Function} [options.onComplete] - Callback when 5 seconds elapse
 * @returns {Function} stopAlert function to cancel sound immediately
 */
export const playFullVolumeAlert = ({
  durationMs = 5000,
  type = "job_assigned",
  speechText = "",
  onComplete,
} = {}) => {
  // If an alert is already playing, stop the previous one first
  if (activeAlertStopFn) {
    try {
      activeAlertStopFn();
    } catch (err) {
      void err;
    }
    activeAlertStopFn = null;
  }

  let isCancelled = false;
  const activeNodes = [];
  const activeTimeouts = [];

  const cleanup = () => {
    isCancelled = true;
    activeTimeouts.forEach((tid) => clearTimeout(tid));
    activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (err) {
        void err;
      }
    });
    activeNodes.length = 0;
    activeTimeouts.length = 0;

    // Stop speech synthesis if speaking
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        void err;
      }
    }

    if (activeAlertStopFn === cleanup) {
      activeAlertStopFn = null;
    }

    if (onComplete) {
      try {
        onComplete();
      } catch (err) {
        void err;
      }
    }
  };

  activeAlertStopFn = cleanup;

  // 1. Trigger mobile vibration (5-second pattern)
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([400, 150, 400, 150, 700, 200, 400, 150, 700]);
    }
  } catch (err) {
    void err;
  }

  // 2. Text-To-Speech announcement
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // clear previous

      const defaultSpeech =
        type === "job_assigned"
          ? "Attention! New repair job assigned."
          : "Attention! New pick and drop request booked.";

      const text = speechText || defaultSpeech;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.0; // 100% full volume
      utterance.rate = 1.05;
      utterance.pitch = 1.15;
      utterance.lang = "en-IN"; // Crisp Indian English pronunciation

      // Small delay of 250ms so the initial loud chime grabs attention first
      const speechTid = setTimeout(() => {
        if (!isCancelled) {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            void err;
          }
        }
      }, 250);
      activeTimeouts.push(speechTid);
    }
  } catch (speechErr) {
    console.debug("Speech synthesis error:", speechErr);
  }

  // 3. Web Audio API Loud Chime loop
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Master Gain: 100% Full Volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      activeNodes.push(masterGain);

      // Play an urgent tone sequence
      const playBeep = (freq, startTime, dur, gainVal = 0.85, wave = "sine") => {
        if (isCancelled) return;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = wave;
        osc.frequency.setValueAtTime(freq, startTime);

        // Quick attack & release for distinct punch
        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + dur);

        activeNodes.push(osc, noteGain);
      };

      const now = ctx.currentTime;
      const loopInterval = 0.85; // each cycle ~850ms
      const cycles = Math.ceil(durationMs / 1000 / loopInterval);

      // Frequencies for High-Urgency Dispatch:
      // Job Assigned: Energetic Rising Chime (880Hz -> 1175Hz -> 1480Hz -> 1760Hz)
      // Pickup Booked: Urgent Dual Siren Ring (950Hz -> 1300Hz -> 950Hz -> 1300Hz)
      const freqs =
        type === "job_assigned"
          ? [880, 1175, 1480, 1760]
          : [988, 1318, 988, 1318];

      for (let c = 0; c < cycles; c++) {
        const cycleStart = now + c * loopInterval;
        if (cycleStart >= now + durationMs / 1000) break;

        playBeep(freqs[0], cycleStart, 0.12, 0.9, "triangle");
        playBeep(freqs[1], cycleStart + 0.14, 0.12, 0.95, "triangle");
        playBeep(freqs[2], cycleStart + 0.28, 0.14, 1.0, "sine");
        playBeep(freqs[3], cycleStart + 0.44, 0.22, 1.0, "sine");

        // Harmonic shimmer on top of the 4th note
        playBeep(freqs[3] * 1.5, cycleStart + 0.44, 0.2, 0.4, "triangle");
      }

      // Automatically ramp down volume precisely at durationMs
      masterGain.gain.setValueAtTime(1.0, now + durationMs / 1000 - 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    }
  } catch (audioErr) {
    console.debug("Web Audio alert error:", audioErr);
  }

  // 4. Timer to auto-cleanup at exactly durationMs
  const endTimer = setTimeout(() => {
    cleanup();
  }, durationMs);
  activeTimeouts.push(endTimer);

  return cleanup;
};
