import { ComponentProps } from "react";

/**
 * Pacman-style ghost icon component
 * Default: Blue ghost (like the AI companion color)
 */
export function PacmanGhost({
  className = "",
  color = "#60a5fa", // baby blue to match primary
  size = 24,
  ...props
}: { color?: string; size?: number } & ComponentProps<"svg">) {
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
      {/* Ghost body - rounded rectangle */}
      <path
        d="M12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2Z"
        fill={color}
      />
      {/* Ghost bottom waves */}
      <path
        d="M8 14C8 14 6 18 6 18C6 20 8 22 12 22C16 22 18 20 18 18C18 18 16 14 16 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18C10 18 8 20 8 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 18C14 18 16 20 16 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ghost eyes - white */}
      <circle cx="9" cy="7" r="1.5" fill="white" />
      <circle cx="15" cy="7" r="1.5" fill="white" />
      {/* Ghost eye pupils - black */}
      <circle cx="9" cy="7" r="0.75" fill="black" />
      <circle cx="15" cy="7" r="0.75" fill="black" />
    </svg>
  );
}

/**
 * Alternative: Simpler ghost with just body and eyes
 */
export function SimpleGhost({
  className = "",
  color = "#60a5fa",
  size = 24,
  ...props
}: { color?: string; size?: number } & ComponentProps<"svg">) {
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
      {/* Ghost body */}
      <path
        d="M12 2C8.68629 2 6 4.68629 6 8C6 10.2091 7.79086 12 10 12C12.2091 12 14 10.2091 14 8C14 4.68629 11.3137 2 12 2Z"
        fill={color}
      />
      <path
        d="M10 12C10 14.2091 11.7909 16 14 16C16.2091 16 18 14.2091 18 12C18 9.79086 16.2091 8 14 8C11.7909 8 10 9.79086 10 12Z"
        fill={color}
      />
      {/* Eyes */}
      <circle cx="9" cy="7" r="1" fill="white" />
      <circle cx="15" cy="7" r="1" fill="white" />
      <circle cx="9" cy="7" r="0.5" fill="black" />
      <circle cx="15" cy="7" r="0.5" fill="black" />
    </svg>
  );
}
