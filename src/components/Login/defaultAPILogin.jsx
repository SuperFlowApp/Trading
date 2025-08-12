import { useState } from "react";
import { message } from "antd";
import { useAuthKey } from "../../contexts/AuthKeyContext";
import { UsernameInput, PasswordInput } from "../CommonUIs/inputs/inputs";
import Button from "../CommonUIs/Button";
import Modal from "../CommonUIs/modal/modal";
import DefaultAPISignup from "./defaultAPISignup";

const DefaultAPILogin = ({ open, onClose, onLoginSuccess, clickPosition }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false); 

  const { setAuthKey } = useAuthKey();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://fastify-serverless-function-rimj.onrender.com/api/token", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, password }).toString(),
      });

      const data = await response.json();

      if (data.access_token) {
        message.success("Login successful!");
        setAuthKey(data.access_token); 
        onLoginSuccess && onLoginSuccess(username, data.access_token);
        onClose();
      } else {
        if (data.detail && Array.isArray(data.detail) && data.detail[0]?.msg) {
          message.error(data.detail[0].msg);
        } else {
          message.error("Invalid credentials.");
        }
      }
    } catch (err) {
      message.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    setSignupOpen(true);
  };

  const handleSignupSuccess = (username) => {
    setSignupOpen(false);
    message.success(`Account created for ${username}. You can now log in.`);
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
            <Button type="primary" onClick={handleSignUp}>
              SignUp
            </Button>
          </div>
        </div>
      </Modal>
      <DefaultAPISignup
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSignupSuccess={handleSignupSuccess}
        clickPosition={clickPosition}
      />
    </>
  );
};

export default DefaultAPILogin;