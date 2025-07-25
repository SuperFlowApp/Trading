import React, { useState } from "react";
import { Modal, Button } from "antd";
import DefaultAPILogin from "./defaultAPILogin";

const LoginPanel = ({ onClose, open, onLoginSuccess }) => {
  const [showDefaultLogin, setShowDefaultLogin] = useState(false);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={420}
        destroyOnHidden
        styles={{
          body: { padding: 0, background: "#23272f", borderRadius: 12 }
        }}
        closeIcon={<span style={{ color: "#fff", fontSize: 24 }}>&times;</span>}
      >
        <div style={{
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ color: "#fff", marginBottom: 24 }}>
            Login Panel (add methods here)
          </span>
          <Button
            type="primary"
            onClick={() => setShowDefaultLogin(true)}
            style={{ marginTop: 16 }}
          >
            Default method
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