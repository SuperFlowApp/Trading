import React, { useState } from "react";
import Modal from "../CommonUIs/modal/modal";
import DefaultAPILogin from "./defaultAPILogin";
import SiweLogin from "./siweLogin";
import Button from "../CommonUIs/Button";
import { MyWalletModal } from "./MyWallet";

const LoginPanel = ({ onClose, open }) => {
  const [showDefaultLogin, setShowDefaultLogin] = useState(false);
  const [showSiweLogin, setShowSiweLogin] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  // Handler to close all modals and the login panel
  const handleLoginSuccess = () => {
    setShowDefaultLogin(false);
    setShowSiweLogin(false);
    setShowWallet(false);
    onClose && onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        width={420}
      >
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          padding: 50
          }}>
          <Button
            type="secondary"
            onClick={() => setShowDefaultLogin(true)}
            style={{ marginTop: 16,minWidth: 220 }}
          >
            Default method
          </Button>
          {/* 
          <Button
            type="secondary"
            onClick={() => setShowSiweLogin(true)}
            style={{ marginTop: 16 }}
          >
            Wallet
          </Button>
          */}
          <Button
            type="secondary"
            onClick={() => setShowWallet(true)}
            style={{ marginTop: 16,minWidth: 220 }}
          >
            My Wallet
          </Button>
        </div>
      </Modal>
      <DefaultAPILogin
        open={showDefaultLogin}
        onClose={() => setShowDefaultLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <SiweLogin
        open={showSiweLogin}
        onClose={() => setShowSiweLogin(false)}
      />
      <MyWalletModal
        open={showWallet}
        onClose={() => setShowWallet(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default LoginPanel;