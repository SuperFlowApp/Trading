import React, { useState, useEffect } from "react";
import { Modal, Input, Button, message } from "antd";
import { useAuthKeyStore } from "../../Zustandstore/panelStore";
import { getAuthKey, setAuthKey } from "../../utils/authKeyStorage";

const DefaultAPILogin = ({ open, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the setter from Zustand
  const setauthKey = useAuthKeyStore((state) => state.setauthKey);

  // On mount, check localStorage for authKey and set it to Zustand store
  useEffect(() => {
    const storedToken = getAuthKey();
    console.log("AuthKeyStorage value on refresh:", storedToken); // Debug print
    if (storedToken) {
      setauthKey(storedToken);
    }
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
        setauthKey(data.access_token); // Set the received token to Zustand store
        setAuthKey(data.access_token); // Save to localStorage
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
      styles={{
        body: { padding: 0, background: "#0f1529", borderRadius: 12 }
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "60px 20px" }}>
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