import { message } from 'antd';
import { setAuthKey } from './authKeyStorage.jsx';

export function logout({ onLogout } = {}) {
    setAuthKey(null);
    localStorage.clear();
    message.info("Disconnected");

    if (typeof window !== "undefined" && window.message) {
        window.message.info?.("Disconnected");
    }

    window.dispatchEvent(new Event("authKeyChanged"));

    if (typeof onLogout === "function") {
        onLogout();
    }
}