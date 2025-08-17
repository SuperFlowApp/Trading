
export default function Button({
    children,
    type = 'primary',
    onClick,
    className = '',
    style = {},
    block = false,
    disabled = false,
    ...props
}) {
    // Define style maps for each button type
    const typeClasses = {
        primary: "text-title bg-[var(--color-backgroundlight,#1b2937)] text-white hover:bg-[var(--color-primary2darker)]",
        secondary: "text-title bg-[var(--color-primary2normal,#00B7C9)] text-black hover:bg-[var(--color-primary2light,#00B7C9)]",
        danger: "text-title bg-red-500 text-white hover:bg-red-700",
        success: "text-title bg-green-500 text-white hover:bg-green-700",
        nav: "text-title bg-[var(--color-backgroundlight,#00B7C9)] text-black hover:bg-[var(--color-primary2darker,#00B7C9)]",
        navconnected: "text-title bg-[var(--color-primary2normal,#00B7C9)] text-black hover:bg-[var(--color-primary2light,#00B7C9)]",
        navdisconnected: "text-title text-[var(--color-liquidwhite)] hover:text-[var(--color-primary2light)]",
        navdisconnection: "text-title bg-[var(--color-backgroundlight,#00B7C9)] text-white hover:bg-[var(--color-primary2darker,#00B7C9)] hover:text-white",
        navsignup: "text-title bg-[var(--color-liquiddarkgray)] hover:bg-[var(--color-primary2normal)] text-white  hover:text-black",
    };

    return (
        <button
            type="button"
            className={`
                transition-colors duration-200 rounded-md outline-none border-none px-6 py-1.5 cursor-pointer
                ${typeClasses[type] || typeClasses.primary}
                ${block ? 'w-full' : ''}
                ${className}
            `}
            style={style}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}