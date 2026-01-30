import { useEffect, useState } from "react";

// Helper to interpolate between two hex colors
function interpolateColor(color1, color2, factor) {
  const c1 = color1.match(/\w\w/g).map(x => parseInt(x, 16));
  const c2 = color2.match(/\w\w/g).map(x => parseInt(x, 16));
  const result = c1.map((v, i) => Math.round(v + (c2[i] - v) * factor));
  return `#${result.map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export default function LoadingScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  // Define start and end colors
  const startColor = "#F59DEF";
  const endColor = "#00B7C9";
  // Calculate intermediate colors
  const colors = [
    startColor,
    interpolateColor(startColor, endColor, 1 / 3),
    interpolateColor(startColor, endColor, 2 / 3),
    endColor,
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-boxbackground min-h-screen w-full">
      {/* Center loading animation */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex flex-col items-center">
          {/* Flow-like loading animation */}
          <div className="flex gap-2">
            {colors.map((color, i) => (
              <span
                key={i}
                className="block w-4 h-4 rounded-full animate-bounce"
                style={{
                  background: color,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Logo at the bottom */}
      <div className="mb-8 flex justify-center w-full">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-auto opacity-90"
          style={{ maxWidth: 180 }}
        >
          <g clipPath="url(#clip0_857_13209)">
            <path
              d="M14.1995 15.7344L15.7345 14.1993C15.8813 14.0526 16.1191 14.0526 16.2659 14.1993L17.801 15.7344C17.9477 15.8811 17.9477 16.119 17.801 16.2658L16.2659 17.8008C16.1191 17.9476 15.8813 17.9476 15.7345 17.8008L14.1995 16.2658C14.0527 16.119 14.0527 15.8811 14.1995 15.7344Z"
              fill="#8AABB2"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.7343 0.110043L0.110044 15.7343C-0.0366811 15.8811 -0.0366813 16.1189 0.110043 16.2657L15.7343 31.89C15.8811 32.0367 16.1189 32.0367 16.2657 31.89L31.89 16.2657C32.0367 16.1189 32.0367 15.8811 31.89 15.7343L16.2657 0.110043C16.1189 -0.0366811 15.8811 -0.036681 15.7343 0.110043ZM13.6638 5.59664L16.0718 8.00461L18.4797 5.59666C20.3641 6.03094 22.1535 6.98217 23.6217 8.45037C25.09 9.91862 26.0412 11.7081 26.4755 13.5926L24.0675 16.0006L26.4754 18.4085C26.0411 20.2928 25.0899 22.0822 23.6217 23.5504C22.1534 25.0187 20.3639 25.9699 18.4793 26.4042L16.0716 23.9965L13.6639 26.4041C11.7794 25.9699 9.98997 25.0186 8.52171 23.5504C7.0535 22.0822 6.10226 20.2927 5.66799 18.4083L8.07575 16.0006L5.66791 13.5927C6.10215 11.7082 7.05341 9.91866 8.52171 8.45037C9.98993 6.98214 11.7794 6.0309 13.6638 5.59664Z"
              fill="#8AABB2"
            />
          </g>
          <defs>
            <clipPath id="clip0_857_13209">
              <rect width="32" height="32" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
      {/* Responsive min-h for mobile */}
      <style>{`
        @media (max-width: 640px) {
          .h-10 { height: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}