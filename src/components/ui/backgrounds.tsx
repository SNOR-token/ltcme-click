import { LitecoinPattern, LitecoinGradient } from "@/components/LitecoinLogo";

/**
 * Subtle animated background with Litecoin theme
 * Uses CSS animations for smooth gradient transitions
 */
export function AnimatedLitecoinBackground({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(-45deg, #1983f5, #00a3ff, #00c2ff, #1983f5)",
        backgroundSize: "400% 400%",
        animation: "gradient-bg 15s ease infinite",
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-background/90" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0">
        <LitecoinPattern size={60} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      {/* Add CSS animation keyframes */}
      <style>{`
        @keyframes gradient-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Static Litecoin-themed background
 * Good for cards and sections that need a subtle crypto aesthetic
 */
export function LitecoinCardBackground({
  className = "",
  children,
  intensity = "subtle",
}: {
  className?: string;
  children?: React.ReactNode;
  intensity?: "subtle" | "medium" | "strong";
}) {
  const opacityMap = {
    subtle: 0.03,
    medium: 0.06,
    strong: 0.1,
  };

  return (
    <div
      className={`relative ${className}`}
    >
      <div className="absolute inset-0" style={{ opacity: opacityMap[intensity] }}>
        <LitecoinPattern size={40} className="absolute inset-0" />
      </div>
      {children}
    </div>
  );
}

/**
 * Glass-morphism effect with Litecoin theme
 * Creates a frosted glass effect with subtle crypto branding
 */
export function GlassCard({
  className = "",
  children,
  borderColor = "primary",
}: {
  className?: string;
  children?: React.ReactNode;
  borderColor?: string;
}) {
  const borderColors: Record<string, string> = {
    primary: "border-primary/30",
    neon: "border-neon-yellow/30",
    blue: "border-blue-500/30",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl ${borderColors[borderColor] || borderColors.primary} ${className}`}
    >
      {/* Subtle inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(25, 131, 245, 0.1) 0%, transparent 50%)",
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Hero background with Litecoin branding
 * Perfect for landing pages and feature highlights
 */
export function HeroBackground({
  className = "",
  children,
  gradientDirection = "to bottom right",
}: {
  className?: string;
  children?: React.ReactNode;
  gradientDirection?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
    >
      {/* Main gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${gradientDirection}, rgba(25, 131, 245, 0.15) 0%, rgba(0, 163, 255, 0.1) 50%, transparent 100%)`,
        }}
      />
      
      {/* Litecoin pattern overlay */}
      <div className="absolute inset-0">
        <LitecoinPattern size={80} />
      </div>
      
      {/* Floating particles effect (CSS-based) */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      {/* Add float animation */}
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Subtle border with Litecoin gradient
 * Adds a nice touch to cards and containers
 */
export function GradientBorder({
  className = "",
  children,
  thickness = "2px",
  radius = "16px",
}: {
  className?: string;
  children?: React.ReactNode;
  thickness?: string;
  radius?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        padding: thickness,
        background: "linear-gradient(135deg, #1983f5, #00a3ff, #00c2ff)",
        borderRadius: radius,
      }}
    >
      <div
        className="h-full w-full"
        style={{
          background: "inherit",
          borderRadius: `calc(${radius} - ${thickness})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
