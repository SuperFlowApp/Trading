import { useState } from 'react';
import './slider.css';

export default function NativeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  style = {},
  className = '',
  filledColor = 'var(--color-primary2deactive)',
  unfilledColor = 'var(--color-backgroundlight)',
  ...props
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderHovered, setIsSliderHovered] = useState(false);

  const clampToStep = (val) => {
    const num = Number(val);
    const stepped = Math.round((num - min) / step) * step + Number(min);
    return Math.min(max, Math.max(min, Number(stepped.toFixed(10))));
  };

  const percent = ((value - min) * 100) / (max - min);

  // Dynamic colors based on state
  const filled = isDragging
    ? 'var(--color-primary2deactiveactive)'
    : isSliderHovered
      ? 'var(--color-primary2deactiveactive)'
      : filledColor;
  const unfilled = isSliderHovered
    ? 'var(--color-backgroundlighthover)'
    : unfilledColor;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => {
        const steppedValue = clampToStep(e.target.value);
        onChange && onChange(e, steppedValue);
      }}
      className={`native-slider ${className}`}
      style={{
        width: '100%',
        accentColor: filled,
        background: `linear-gradient(90deg, ${filled} ${percent}%, ${unfilled} ${percent}%)`,
        ...style,
      }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => { setIsDragging(false); setIsSliderHovered(false); }}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onMouseEnter={() => setIsSliderHovered(true)}
      onMouseOut={() => setIsSliderHovered(false)}
      {...props}
    />
  );
}