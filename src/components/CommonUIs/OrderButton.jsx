
export default function Button({
    children,
    type = 'order',
    onClick,
    className = '',
    style = {},
    block = false,
    disabled = false,
    ...props
}) {
    // Basic style presets
    const base =
        'transition-colors font-semibold rounded focus:outline-none focus:ring-2 focus:ring-primary2';
    const types = {
        primary:
            '!bg-primary2 !text-black hover:!bg-primary2/80',
        secondary:
            '!bg-primary1 !text-black hover:!bg-primary1/80',
        danger:
            '!bg-red-500 !text-white hover:!bg-red-600',
        success:
            '!bg-green-500 !text-white hover:!bg-red-600',
    };

    return (
        <button
            type="button"
            className={`
        ${base}
        ${types[type] || ''}
        ${block ? 'w-full' : ''}
        ${className}
        px-6 py-2
      `}
            style={{
                background: type === 'primary' ? 'var(--color-primary2)' : undefined,
                color: type === 'primary' ? 'black' : undefined,
                border: 'none',
                fontWeight: 600,
                borderRadius: 8,
                ...style,
            }}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}