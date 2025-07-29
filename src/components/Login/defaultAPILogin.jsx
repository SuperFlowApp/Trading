import React, { useState, useEffect } from "react";
import { message } from "antd";
import { getAuthKey, setAuthKey } from "../../utils/authKeyStorage";
import { UsernameInput, PasswordInput } from "../CommonUIs/inputs/inputs";
import Button from "../CommonUIs/Button";
import Modal from "../CommonUIs/modal/modal";
import DefaultAPISignup from "./defaultAPISignup"; // <-- import signup modal

const DefaultAPILogin = ({ open, onClose, onLoginSuccess, clickPosition }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false); // <-- signup modal state

  // On mount, check localStorage for authKey (optional, can be removed if not needed)
  useEffect(() => {
    // You can remove this effect if you don't need to do anything with the auth key on mount
    getAuthKey();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        username,
        password,
      }).toString();

      const response = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/token?${params}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = await response.json();

      if (data.access_token) {
        message.success("Login successful!");
        setAuthKey(data.access_token); // Only use setAuthKey
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
    setSignupOpen(true); // <-- open signup modal
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