import { ComponentProps } from "react";

/**
 * Litecoin Logo Component
 * Various styles for different use cases
 */

export function LitecoinLogo({
  className = "",
  size = 24,
  variant = "full",
  ...props
}: { size?: number; variant?: "full" | "circle" | "symbol"; } & ComponentProps<"svg">) {
  const isFull = variant === "full";
  const isCircle = variant === "circle";

  if (isCircle) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        {/* Litecoin Circle Logo */}
        <circle cx="12" cy="12" r="12" fill="#1983f5" />
        <path
          d="M12 4C8.68629 4 6 6.68629 6 10C6 13.3137 8.68629 16 12 16C15.3137 16 18 13.3137 18 10C18 6.68629 15.3137 4 12 4Z"
          fill="white"
        />
        <path
          d="M12 6C14.2091 6 16 7.79086 16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10C8 7.79086 9.79086 6 12 6Z"
          fill="#1983f5"
        />
      </svg>
    );
  }

  if (isFull) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        {/* Litecoin Full Logo */}
        <circle cx="32" cy="32" r="32" fill="#1983f5" />
        <path
          d="M32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8Z"
          fill="white"
        />
        <path
          d="M32 16C42.6274 16 52 25.3726 52 36C52 46.6274 42.6274 56 32 56C21.3726 56 12 46.6274 12 36C12 25.3726 21.3726 16 32 16Z"
          fill="#1983f5"
        />
        <text
          x="64"
          y="36"
          fontFamily="Arial, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="white"
        >
          Litecoin
        </text>
      </svg>
    );
  }

  // Symbol only (LTC)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill="#1983f5" />
      <path
        d="M12 4C8.68629 4 6 6.68629 6 10C6 13.3137 8.68629 16 12 16C15.3137 16 18 13.3137 18 10C18 6.68629 15.3137 4 12 4Z"
        fill="white"
      />
      <path
        d="M12 6C14.2091 6 16 7.79086 16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10C8 7.79086 9.79086 6 12 6Z"
        fill="#1983f5"
      />
    </svg>
  );
}

/**
 * Animated Litecoin logo with pulsing effect
 */
export function LitecoinLogoAnimated({
  className = "",
  size = 32,
  ...props
}: { size?: number } & ComponentProps<"svg">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill="#1983f5" className="animate-pulse" style={{ animationDuration: "2s" }} />
      <path
        d="M12 4C8.68629 4 6 6.68629 6 10C6 13.3137 8.68629 16 12 16C15.3137 16 18 13.3137 18 10C18 6.68629 15.3137 4 12 4Z"
        fill="white"
      />
      <path
        d="M12 6C14.2091 6 16 7.79086 16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10C8 7.79086 9.79086 6 12 6Z"
        fill="#1983f5"
      />
    </svg>
  );
}

/**
 * Litecoin gradient background component
 * Can be used as a decorative element
 */
export function LitecoinGradient({
  className = "",
  width = "100%",
  height = "200px",
}: { className?: string; width?: string | number; height?: string | number }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        background: "linear-gradient(135deg, #1983f5 0%, #00a3ff 50%, #00c2ff 100%)",
        opacity: 0.1,
      }}
    />
  );
}

/**
 * Litecoin themed pattern for backgrounds
 */
export function LitecoinPattern({
  className = "",
  size = 40,
}: { className?: string; size?: number }) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `radial-gradient(circle at ${size/2}px ${size/2}px, #1983f5 ${size/4}px, transparent ${size/4 + 1}px)`,
        backgroundSize: `${size}px ${size}px`,
        opacity: 0.05,
      }}
    />
  );
}
