import React, { useState, useEffect } from "react";
import { Modal, Input, Button, message } from "antd";
import { authKey } from "../../Zustandstore/panelStore"; // <-- import the store

const DefaultAPILogin = ({ open, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the setter from Zustand
  const setauthKey = authKey((state) => state.setauthKey);

  // Set a static string to authKey on component mount and show a message
  useEffect(() => {
    setauthKey("STATIC_TEST_STRING");
    message.info("Static authKey set on load");
  }, [setauthKey]);

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

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      if (data.access_token) {
        message.success("Login successful!");
        onLoginSuccess && onLoginSuccess(username, data.access_token);
        onClose();
      } else {
        message.error("Invalid credentials or unexpected response.");
      }
    } catch (err) {
      message.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Add your signup logic here
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={350}
      destroyOnHidden
      title="Default API Login"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button type="primary" onClick={handleLogin} loading={loading}>
            Login
          </Button>
          <Button onClick={handleSignUp}>SignUp</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DefaultAPILogin;