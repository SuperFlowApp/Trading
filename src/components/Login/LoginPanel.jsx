import React, { useState } from "react";
import Modal from "../CommonUIs/modal/modal";
import DefaultAPILogin from "./defaultAPILogin";
import SiweLogin from "./siweLogin";
import Button from "../CommonUIs/Button";

function setTokens(t) {
  localStorage.setItem("access_token", t.access_token);
  localStorage.setItem("token_type", t.token_type);
  if (t.refresh_token) localStorage.setItem("refresh_token", t.refresh_token);
  // TODO: configure your fetch/axios interceptor to send Authorization: `${t.token_type} ${t.access_token}`
}

const LoginPanel = ({ onClose, open }) => {
  const [showDefaultLogin, setShowDefaultLogin] = useState(false);
  const [showSiweLogin, setShowSiweLogin] = useState(false);

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
          borderRadius: 4,
          padding: 0
        }}>
          <span style={{ color: "#fff", marginBottom: 24 }}>
            Login
          </span>
          <Button
            type="secondary"
            onClick={() => setShowDefaultLogin(true)}
            style={{ marginTop: 16 }}
          >
            Default method
          </Button>

          <Button
            type="secondary"
            onClick={() => setShowSiweLogin(true)}
            style={{ marginTop: 16 }}
          >
            Wallet
          </Button>
        </div>
      </Modal>
      <DefaultAPILogin
        open={showDefaultLogin}
        onClose={() => setShowDefaultLogin(false)}
        onLoginSuccess={setTokens}
      />
      <SiweLogin
        open={showSiweLogin}
        onClose={() => setShowSiweLogin(false)}
        onLoginSuccess={setTokens}
      />
    </>
  );
};

export default LoginPanel;