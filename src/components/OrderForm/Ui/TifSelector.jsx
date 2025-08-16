const TIF_OPTIONS = [
    { key: '1', label: 'GTC' },
    { key: '2', label: 'IOL' },
    { key: '3', label: 'ALO' },
];

function TifSelector({ value, onChange }) {
    const selected = value || TIF_OPTIONS[0].label;

    return (
        <div>
            <select
                className="custom-input-dropdown"
                value={selected}
                onChange={e => {
                    if (onChange) onChange(e.target.value);
                }}
                style={{  width:64 }}
            >
                {TIF_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.label}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default TifSelector;