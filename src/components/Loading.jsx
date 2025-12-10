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
        <img
          src="/assets/favIcon.svg"
          alt="Logo"
          className="h-10 w-auto opacity-90"
          style={{ maxWidth: 180 }}
        />
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