import React, { useState } from "react";
import { message } from "antd";
import Modal from "../CommonUIs/modal/modal";
import { UsernameInput, PasswordInput } from "../CommonUIs/inputs/inputs";
import Button from "../CommonUIs/Button";

const DefaultAPISignup = ({ open, onClose, onSignupSuccess, clickPosition }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !password || !repeatPassword) {
      message.error("Please fill all fields.");
      return;
    }
    if (password !== repeatPassword) {
      message.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        username,
        password,
      }).toString();

      const response = await fetch(`https://fastify-serverless-function-rimj.onrender.com/api/create_user?${params}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "", // mimic curl -d ''
      });

      const data = await response.json();

      if (data.msg && data.user_id) {
        message.success(data.msg);
        onSignupSuccess && onSignupSuccess(username);
        onClose();
      } else if (data.detail) {
        message.error(data.detail);
      } else {
        message.error("Signup failed.");
      }
    } catch (err) {
      message.error("Signup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <PasswordInput
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          placeholder="Repeat Password"
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button type="primary" onClick={handleSignup} disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
          <Button type="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DefaultAPISignup;