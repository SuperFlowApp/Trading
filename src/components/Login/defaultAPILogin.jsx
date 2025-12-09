import { useState } from "react";
import { message } from "antd";
import Cookies from "js-cookie";
import { UsernameInput, PasswordInput } from "../CommonUIs/inputs/inputs";
import Button from "../CommonUIs/Button";
import Modal from "../CommonUIs/modal/modal";
import { loginUser } from "../../hooks/useDefaultAPILogin";

const DefaultAPILogin = ({ open, onClose, onLoginSuccess, clickPosition }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { ok, status, data } = await loginUser({ username, password });

      if (data.access_token && data.token_type) {
        message.success("Login successful!");
        Cookies.set("authKey", data.access_token, { expires: 7, secure: true, sameSite: 'Strict' });
        Cookies.set("username", username, { expires: 7, secure: true, sameSite: 'Strict' });
        // Trigger event for auth change
        window.dispatchEvent(new Event("authKeyChanged"));
        onLoginSuccess && onLoginSuccess();
        onClose();
      } else if (data.error_code === 1110 && data.msg) {
        message.error(data.msg);
      } else {
        message.error("Invalid credentials.");
      }
    } catch (err) {
      message.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        width={350}
        clickPosition={clickPosition}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "60px 20px" }}>
          <UsernameInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button type="secondary" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DefaultAPILogin;