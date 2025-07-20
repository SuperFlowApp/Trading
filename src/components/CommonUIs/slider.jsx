export default function NativeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  style = {},
  className = '',
  ...props
}) {
  // Helper to round to nearest step
  const clampToStep = (val) => {
    const num = Number(val);
    const stepped = Math.round((num - min) / step) * step + Number(min);
    return Math.min(max, Math.max(min, Number(stepped.toFixed(10))));
  };

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
        accentColor: 'var(--color-primary2)',
        ...style,
      }}
      {...props}
    />
  );
}