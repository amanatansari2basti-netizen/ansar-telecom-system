import { useRef, useState } from "react";
import { RotateCcw, Check } from "lucide-react";

// Dot positions in a 240x240 box
const DOT_COORDS = {
  1: { x: 40, y: 40 },
  2: { x: 120, y: 40 },
  3: { x: 200, y: 40 },
  4: { x: 40, y: 120 },
  5: { x: 120, y: 120 },
  6: { x: 200, y: 120 },
  7: { x: 40, y: 200 },
  8: { x: 120, y: 200 },
  9: { x: 200, y: 200 },
};

/**
 * PatternLock Component
 * Supports interactive drawing (tap or drag) and read-only display mode.
 *
 * @param {Array<number>} value - Array of numbers 1-9 e.g. [1, 2, 5, 8, 9]
 * @param {Function} onChange - Callback when pattern changes
 * @param {boolean} readOnly - If true, displays compact pattern without editing
 * @param {number} size - Pixel width/height of the container (default 240, readOnly 170)
 */
export const PatternLock = ({
  value = [],
  onChange,
  readOnly = false,
  size = readOnly ? 170 : 240,
}) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCurrentPos, setDragCurrentPos] = useState(null);

  const pattern = Array.isArray(value) ? value : [];

  const scale = size / 240;

  // Find nearest dot within hit radius
  const getDotAtPoint = (clientX, clientY) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;

    const hitRadius = 30; // Radius in 240x240 scale
    for (let dotNum = 1; dotNum <= 9; dotNum++) {
      const coord = DOT_COORDS[dotNum];
      const dx = coord.x - x;
      const dy = coord.y - y;
      if (Math.hypot(dx, dy) <= hitRadius) {
        return dotNum;
      }
    }
    return null;
  };

  // Pointer down: start drawing or tap
  const handlePointerDown = (e) => {
    if (readOnly) return;
    const dot = getDotAtPoint(e.clientX, e.clientY);
    setIsDragging(true);

    if (dot) {
      if (!pattern.includes(dot)) {
        const next = [...pattern, dot];
        onChange && onChange(next);
      }
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragCurrentPos({
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      });
    }
  };

  // Pointer move: connect dots as user drags
  const handlePointerMove = (e) => {
    if (readOnly || !isDragging) return;
    const dot = getDotAtPoint(e.clientX, e.clientY);

    if (dot && !pattern.includes(dot)) {
      const next = [...pattern, dot];
      onChange && onChange(next);
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragCurrentPos({
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      });
    }
  };

  // Pointer up: finish dragging
  const handlePointerUp = () => {
    if (readOnly) return;
    setIsDragging(false);
    setDragCurrentPos(null);
  };

  // Click on a single dot to add/toggle
  const handleDotClick = (dotNum, e) => {
    if (readOnly) return;
    e.stopPropagation();
    if (!pattern.includes(dotNum)) {
      const next = [...pattern, dotNum];
      onChange && onChange(next);
    }
  };

  const handleClear = (e) => {
    e && e.preventDefault();
    if (readOnly) return;
    onChange && onChange([]);
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
      }}
    >
      {/* 3x3 Canvas Box */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "#f8fafc",
          borderRadius: "16px",
          border: "2px solid #e2e8f0",
          boxShadow: readOnly
            ? "inset 0 1px 3px rgba(0,0,0,0.04)"
            : "0 4px 12px rgba(15,23,42,0.05)",
          touchAction: "none",
          cursor: readOnly ? "default" : "crosshair",
          overflow: "hidden",
        }}
      >
        {/* SVG for connecting lines */}
        <svg
          viewBox="0 0 240 240"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <marker
              id="pattern-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
            </marker>
          </defs>

          {/* Polyline connecting completed dots */}
          {pattern.length > 1 && (
            <polyline
              points={pattern
                .map((dotNum) => {
                  const c = DOT_COORDS[dotNum];
                  return `${c.x},${c.y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#2563eb"
              strokeWidth={readOnly ? "4.5" : "5"}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          )}

          {/* Directional arrow lines between consecutive dots */}
          {pattern.length > 1 &&
            pattern.slice(0, -1).map((dotNum, idx) => {
              const from = DOT_COORDS[dotNum];
              const to = DOT_COORDS[pattern[idx + 1]];
              // Calculate midpoint slightly before target for arrow
              const mx = from.x + (to.x - from.x) * 0.65;
              const my = from.y + (to.y - from.y) * 0.65;
              return (
                <line
                  key={`arrow-${idx}`}
                  x1={from.x}
                  y1={from.y}
                  x2={mx}
                  y2={my}
                  stroke="#2563eb"
                  strokeWidth="0"
                  markerEnd="url(#pattern-arrow)"
                />
              );
            })}

          {/* Live line following current drag pointer */}
          {!readOnly && isDragging && pattern.length > 0 && dragCurrentPos && (
            <line
              x1={DOT_COORDS[pattern[pattern.length - 1]].x}
              y1={DOT_COORDS[pattern[pattern.length - 1]].y}
              x2={dragCurrentPos.x}
              y2={dragCurrentPos.y}
              stroke="#60a5fa"
              strokeWidth="3.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* 9 Dots */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dotNum) => {
          const coord = DOT_COORDS[dotNum];
          const orderIndex = pattern.indexOf(dotNum);
          const isVisited = orderIndex !== -1;

          const dotRadius = readOnly ? 10 : 14;
          const hitSize = readOnly ? 36 : 48;

          return (
            <div
              key={dotNum}
              onClick={(e) => handleDotClick(dotNum, e)}
              style={{
                position: "absolute",
                left: `${coord.x * scale}px`,
                top: `${coord.y * scale}px`,
                transform: "translate(-50%, -50%)",
                width: `${hitSize * scale}px`,
                height: `${hitSize * scale}px`,
                display: "grid",
                placeItems: "center",
                cursor: readOnly ? "default" : "pointer",
                zIndex: 2,
              }}
            >
              {/* Outer circle / glow */}
              <div
                style={{
                  width: `${dotRadius * 2 * scale}px`,
                  height: `${dotRadius * 2 * scale}px`,
                  borderRadius: "50%",
                  backgroundColor: isVisited ? "#2563eb" : "#cbd5e1",
                  border: isVisited
                    ? "3px solid #ffffff"
                    : "2px solid #ffffff",
                  boxShadow: isVisited
                    ? "0 0 0 3px rgba(37,99,235,0.35), 0 2px 6px rgba(0,0,0,0.15)"
                    : "0 1px 3px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: `${11 * scale}px`,
                  fontWeight: 800,
                  transition: "all 0.15s ease",
                }}
              >
                {isVisited ? orderIndex + 1 : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Control buttons & Pattern Sequence Text */}
      {!readOnly && (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: pattern.length ? "#1e293b" : "#64748b",
              backgroundColor: pattern.length ? "#eff6ff" : "#f1f5f9",
              border: pattern.length ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
              padding: "4px 12px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {pattern.length ? (
              <>
                <Check size={14} style={{ color: "#2563eb" }} />
                <span>
                  Pattern: <strong>{pattern.join(" → ")}</strong> ({pattern.length} dots)
                </span>
              </>
            ) : (
              <span>Touch or click dots to draw pattern</span>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleClear}
              disabled={pattern.length === 0}
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                color: pattern.length ? "#dc2626" : "#94a3b8",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: pattern.length ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <RotateCcw size={12} />
              <span>Clear / रीसेट</span>
            </button>
          </div>
        </div>
      )}

      {readOnly && pattern.length > 0 && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#1e3a8a",
            backgroundColor: "#dbeafe",
            padding: "2px 8px",
            borderRadius: "6px",
            display: "inline-block",
          }}
        >
          Dots: {pattern.join(" → ")}
        </div>
      )}
    </div>
  );
};

export default PatternLock;
