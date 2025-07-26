import "./button.css";

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
    return (
        <button
            type="button"
            className={`
                button-base
                button-${type}
                ${block ? 'button-block' : ''}
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