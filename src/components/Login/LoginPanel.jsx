import React, { useState } from "react";
import Modal from "../CommonUIs/modal/modal"; // <-- Use your native Modal
import DefaultAPILogin from "./defaultAPILogin";
import Button from "../CommonUIs/Button";

const LoginPanel = ({ onClose, open, onLoginSuccess }) => {
  const [showDefaultLogin, setShowDefaultLogin] = useState(false);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        width={420}
      >
        <div style={{
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          padding: 0
        }}>
          <span style={{ color: "#fff", marginBottom: 24 }}>
            Login
          </span>
          <Button
            type="primary"
            onClick={() => setShowDefaultLogin(true)}
            style={{ marginTop: 16 }}
          >
            Username method
          </Button>
        </div>
      </Modal>
      <DefaultAPILogin
        open={showDefaultLogin}
        onClose={() => setShowDefaultLogin(false)}
        onLoginSuccess={onLoginSuccess}
      />
    </>
  );
};

export default LoginPanel;