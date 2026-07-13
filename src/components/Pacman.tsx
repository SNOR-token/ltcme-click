import { useEffect, useState } from "react";

/**
 * LTCme retro Pacman banner.
 * Light-blue Pacman chomps a row of dots. White + pink ghosts glide behind.
 * Pure CSS animation, no JS timers (except a one-time mount so SSR is clean).
 */
export function PacmanBanner({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={compact ? "h-8" : "h-24"} aria-hidden />;

  const dots = Array.from({ length: compact ? 8 : 14 });
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden ${compact ? "h-8" : "h-24"}`}
      style={{
        background:
          "linear-gradient(180deg, oklch(0.14 0.04 240 / 0.0), oklch(0.14 0.04 240 / 0.45))",
      }}
    >
      {/* dot row */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-around px-6">
        {dots.map((_, i) => (
          <span
            key={i}
            className="ltc-dot"
            style={{ animationDelay: `${(i * 0.28).toFixed(2)}s` }}
          />
        ))}
      </div>
      {/* pacman */}
      <div className={`ltc-pac ${compact ? "ltc-pac-sm" : ""}`}>
        <div className="ltc-pac-top" />
        <div className="ltc-pac-bot" />
      </div>
      {/* ghosts */}
      <Ghost color="white" delay="1.4s" compact={compact} />
      <Ghost color="pink" delay="3.1s" compact={compact} />

      <style>{css}</style>
    </div>
  );
}

/**
 * Big floating baby-blue Pacman ghost. Rendered near the top of every page as
 * a friendly mascot. Pure-CSS gentle bob animation; positioned to not block
 * interaction with the page below it.
 */
export function BigGhost() {
  return (
    <div className="pointer-events-none relative w-full flex justify-center">
      <svg
        aria-hidden
        viewBox="0 0 32 32"
        className="ltc-big-ghost"
        style={{ width: 96, height: 96 }}
        fill="none"
      >
        <defs>
          <linearGradient id="bigGhostFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.92 0.09 230)" />
            <stop offset="100%" stopColor="oklch(0.78 0.14 230)" />
          </linearGradient>
        </defs>
        <path
          d="M4 16a12 12 0 0124 0v12l-4-3-4 3-4-3-4 3-4-3-4 3V16z"
          fill="url(#bigGhostFill)"
        />
        <ellipse cx="12" cy="15" rx="3" ry="3.4" fill="#0b1220" />
        <ellipse cx="20" cy="15" rx="3" ry="3.4" fill="#0b1220" />
        <circle cx="12.9" cy="15.6" r="1.15" fill="oklch(0.98 0.02 230)" />
        <circle cx="20.9" cy="15.6" r="1.15" fill="oklch(0.98 0.02 230)" />
      </svg>
    </div>
  );
}

function Ghost({
  color,
  delay,
  compact,
}: {
  color: "white" | "pink";
  delay: string;
  compact: boolean;
}) {
  const fill =
    color === "white" ? "oklch(0.98 0.01 220)" : "oklch(0.82 0.14 15)";
  const size = compact ? 20 : 34;
  return (
    <svg
      className="ltc-ghost"
      style={{ animationDelay: delay, width: size, height: size }}
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        d="M4 16a12 12 0 0124 0v12l-4-3-4 3-4-3-4 3-4-3-4 3V16z"
        fill={fill}
      />
      <circle cx="12" cy="15" r="2.5" fill="#0b1220" />
      <circle cx="20" cy="15" r="2.5" fill="#0b1220" />
      <circle cx="12.7" cy="15.5" r="1" fill="oklch(0.78 0.14 230)" />
      <circle cx="20.7" cy="15.5" r="1" fill="oklch(0.78 0.14 230)" />
    </svg>
  );
}

const css = `
.ltc-dot {
  width: 6px; height: 6px; border-radius: 999px;
  background: oklch(0.88 0.11 220);
  box-shadow: 0 0 8px oklch(0.78 0.14 230 / 0.7);
  animation: ltcDotEat 5.6s linear infinite;
}
@keyframes ltcDotEat {
  0%, 40% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(0.2); }
  100% { opacity: 1; transform: scale(1); }
}
.ltc-pac {
  position: absolute; top: 50%; left: -60px;
  width: 44px; height: 44px;
  transform: translateY(-50%);
  animation: ltcPacGo 5.6s linear infinite;
  filter: drop-shadow(0 0 12px oklch(0.78 0.14 230 / 0.7));
}
.ltc-pac-sm { width: 26px; height: 26px; }
.ltc-pac-top, .ltc-pac-bot {
  position: absolute; left: 0; width: 100%; height: 50%;
  background: linear-gradient(135deg, oklch(0.78 0.14 230), oklch(0.88 0.11 220));
  transform-origin: 50% 100%;
  animation: ltcChompTop 0.32s ease-in-out infinite;
}
.ltc-pac-top { top: 0; border-radius: 100% 100% 0 0; }
.ltc-pac-bot { bottom: 0; border-radius: 0 0 100% 100%; transform-origin: 50% 0%; animation-name: ltcChompBot; }
@keyframes ltcChompTop { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-40deg)} }
@keyframes ltcChompBot { 0%,100%{transform:rotate(0)} 50%{transform:rotate(40deg)} }
@keyframes ltcPacGo {
  0%   { left: -60px; }
  100% { left: 105%; }
}
.ltc-ghost {
  position: absolute; top: 50%; left: -40px;
  transform: translateY(-50%);
  animation: ltcGhostGo 5.6s linear infinite;
  filter: drop-shadow(0 0 8px oklch(1 0 0 / 0.35));
}
@keyframes ltcGhostGo {
  0%   { left: -40px; }
  100% { left: 105%; }
}
.ltc-big-ghost {
  filter: drop-shadow(0 8px 24px oklch(0.78 0.14 230 / 0.55));
  animation: ltcBigGhostBob 4.2s ease-in-out infinite;
  margin-top: 8px;
}
@keyframes ltcBigGhostBob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50%      { transform: translateY(-10px) rotate(2deg); }
}
`;