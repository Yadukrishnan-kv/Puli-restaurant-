import type React from "react";

/**
 * Chicken drumstick icon – indicates non-vegetarian dishes.
 * Uses a filled path so it stays visible even at small sizes (14 px).
 */
export function ChickenLegIcon({
  width = 20,
  height = 20,
  className,
  ...rest
}: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="currentColor"
      className={className ?? "app-icon"}
      aria-hidden
      {...rest}
    >
      <path d="M12.75 2C9.02 2 6 5.02 6 8.75c0 1.63.58 3.13 1.54 4.3L2.29 18.3a1 1 0 0 0 0 1.41l2 2a1 1 0 0 0 1.41 0l5.25-5.25c1.17.96 2.67 1.54 4.3 1.54C18.98 18 22 14.98 22 11.25S18.98 2 15.25 2h-2.5Zm2.5 2C17.87 4 20 6.13 20 8.75a5.25 5.25 0 0 1-5.25 5.25c-1.24 0-2.38-.43-3.28-1.16l-.63-.51-.51.51-5.04 5.04-.59-.59 5.04-5.04.51-.51-.51-.63A5.21 5.21 0 0 1 8 8.75C8 6.13 10.13 4 12.75 4h2.5Z" />
    </svg>
  );
}
