import React, { useState } from 'react';

// Utility to lighten a hex color by a percentage
function lighten(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
  let b = (num & 0x0000FF) + Math.round(255 * percent);
  r = r > 255 ? 255 : r;
  g = g > 255 ? 255 : g;
  b = b > 255 ? 255 : b;
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

const SliderRail = ({ filledColor, unfilledColor, ...props }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: `linear-gradient(to right, 
          ${hover ? lighten(filledColor, 0.2) : filledColor} 0%, 
          ${hover ? lighten(unfilledColor, 0.2) : unfilledColor} 100%)`,
        height: '6px',
        borderRadius: '3px',
        transition: 'background 0.2s',
        // ...other styles
      }}
      {...props}
    />
  );
};

export default SliderRail;