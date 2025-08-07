export default function OrderButton({
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
            '!bg-green !text-black hover:!bg-green/80',
        secondary:
            '!bg-red !text-black hover:!bg-red/80',
        danger:
            '!bg-red-500 !text-white hover:!bg-red-600',
        success:
            '!bg-green-500 !text-white hover:!bg-red-600',
        orderdisconnect:
            '!bg-gray-700 !text-white hover:!bg-gray-500',
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