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

        'transition-colors text-title  py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary2normal ';
    const types = {
        primary:
            'bg-green text-black hover:bg-green-80',
        secondary:
            'bg-red text-black hover:bg-red-80',
        danger:
            'bg-red text-white', // add a .hover:bg-red-dark if you want a darker red on hover
        success:
            'border border-white text-white', // add a .hover:bg-green-dark if you want a darker green on hover
        orderdisconnect:
            'bg-gray-700 text-white hover:bg-primary2darker',
    };

    return (
        <button
            type="button"
            className={`
        ${base}
        ${types[type] || ''}
        ${block ? 'w-full' : ''}
        ${className}
      `}
            style={{
                background: type === 'primary',
                color: type === 'primary' ? 'black' : undefined,
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