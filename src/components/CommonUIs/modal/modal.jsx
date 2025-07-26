import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./modal.css";

const Modal = ({ open, onClose, children, clickPosition = { x: "50%", y: "50%" }, width = 420 }) => {
    const modalRef = useRef();

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    return ReactDOM.createPortal(
        <div className="custom-modal-overlay" onClick={onClose}>
            <div
                className="custom-modal"
                ref={modalRef}
                style={{
                    width
                }}
                onClick={e => e.stopPropagation()}
            >
                <span className="custom-modal-close" onClick={onClose}>&times;</span>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;