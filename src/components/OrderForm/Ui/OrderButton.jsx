import { useMemo } from "react";

export default function OrderButton({
    children,
    type = 'order',
    onClick,
    className = '',
    style = {},
    block = false,
    disabled = false,
    loading = false,
    ...props
}) {
    // Basic style presets
    const base =

        'transition-colors  text-black text-title  py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary2normal ';
    const types = {
        primary:
            'bg-green hover:bg-green-80',
        secondary:
            'bg-red hover:bg-red-80',
        danger:
            'bg-red',
        success:
            'bg-green', 
        orderdisconnect:
            'text-color_lighter_gray bg-gray-700 hover:bg-primary2darker',
    };

    // Dots colors (same as LoadingScreen)
    const dotColors = useMemo(() => [
        "#000000",
        "#000000",
        "#000000",
        "#000000",
    ], []);

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
            disabled={disabled || loading} // Disable while loading
            {...props}
        >
            {loading ? (
                <span className="flex gap-1 items-center justify-center py-[6px]">
                    {dotColors.map((color, i) => (
                        <span
                            key={i}
                            className="block w-2 h-2 rounded-full animate-bounce"
                            style={{
                                background: color,
                                animationDelay: `${i * 0.15}s`,
                                animationDuration: "1s",
                            }}
                        />
                    ))}
                </span>
            ) : (
                children
            )}
        </button>
    );
}