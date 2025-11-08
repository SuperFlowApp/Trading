import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { loginUser } from "../../hooks/useDefaultAPILogin";
import { signupUser } from "../../hooks/useDefaultAPISignup";
import Modal from "../CommonUIs/modal/modal";
import Button from "../CommonUIs/Button";
import { useAuthKey } from "../../contexts/AuthKeyContext";

/**
 * Remove wallet address from localStorage on signout.
 */
export function clearWalletAddress() {
  localStorage.removeItem("wallet_address");
}

/**
 * Checklist UI component for wallet steps.
 */
export const StepChecklist = ({ steps, currentStep, errorStep }) => (
  <ol style={{ margin: "16px 0 24px 0", padding: 0, listStyle: "none" }}>
    {steps.map((step, idx) => {
      const isActive = idx === currentStep;
      const isDone = idx < currentStep;
      const isError = errorStep === idx;
      return (
        <li
          key={step}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
            color: isError ? "#ff4d4f" : isDone ? "#52c41a" : isActive ? "#1890ff" : "#fff",
            fontWeight: isActive ? "bold" : "normal",
            opacity: isActive ? 1 : 0.7,
            transition: "color 0.2s, opacity 0.2s"
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              marginRight: 10,
              background: isError
                ? "#ff4d4f"
                : isDone
                ? "#52c41a"
                : isActive
                ? "linear-gradient(90deg,#1890ff 50%,#fff 50%)"
                : "#d9d9d9",
              animation: isActive ? "blinker 1s linear infinite" : "none",
            }}
          />
          {step}
          <style>
            {`
              @keyframes blinker {
                50% { opacity: 0.4; }
              }
            `}
          </style>
        </li>
      );
    })}
  </ol>
);

const SIGNIN_STEPS = [
  "Connect wallet",
  "Login"
];

const SIGNUP_STEPS = [
  "Accept terms",
  "Sign up",
  "Login"
];

/**
 * Attempts to get the wallet address and login using it as both username and password,
 * but skips the first 16 characters of the address for login/signup due to server restrictions.
 * If login fails with error_code 1110, tries to signup and then login again.
 * Accepts step callbacks for UI progress.
 * @returns {Promise<{address: string, loginResult?: object, error?: string, notSignedUp?: boolean}>}
 */
export const getWalletAddress = async ({ onStep, onSteps, onNotSignedUp } = {}) => {
  if (onSteps) onSteps(SIGNIN_STEPS);

  if (!window.ethereum) {
    if (onStep) onStep(0);
    return { address: "", error: "No wallet extension found." };
  }
  try {
    if (onStep) onStep(0); // Connect wallet
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const address = accounts[0];
    const shortAddress = address.slice(16);

    if (onStep) onStep(1); // Login
    const { ok, data } = await loginUser({ username: shortAddress, password: shortAddress });
    if (ok && data.access_token && data.token_type) {
      return { address, loginResult: data };
    } else if (data.error_code === 1110 && data.msg) {
      // Not signed up
      if (onNotSignedUp) onNotSignedUp();
      if (onSteps) onSteps(SIGNUP_STEPS);
      if (onStep) onStep(0); // Accept terms
      try {
        const signer = await provider.getSigner();
        const message = "By signing this message, you accept the Terms of Service.";
        await signer.signMessage(message);
      } catch (signErr) {
        return { address, error: "You must sign to accept the terms." };
      }
      if (onStep) onStep(1); // Sign up
      const signupRes = await signupUser({ username: shortAddress, password: shortAddress });
      if (signupRes.ok) {
        if (onStep) onStep(2); // Login after signup
        const retryLogin = await loginUser({ username: shortAddress, password: shortAddress });
        if (retryLogin.ok && retryLogin.data.access_token && retryLogin.data.token_type) {
          return { address, loginResult: retryLogin.data };
        } else {
          return { address, error: retryLogin.data?.msg || "Login failed after signup." };
        }
      } else {
        return { address, error: signupRes.data?.msg || "Signup failed." };
      }
    } else {
      return { address, error: data.msg || "Login failed." };
    }
  } catch (err) {
    return { address: "", error: "Could not get wallet address." };
  }
};

/**
 * MyWalletModal component to show wallet steps and handle wallet login/signup.
 */
export const MyWalletModal = ({
  open,
  onClose,
  onLoginSuccess
}) => {
  const [walletSteps, setWalletSteps] = useState(SIGNIN_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorStep, setErrorStep] = useState(null);
  const [notSignedUp, setNotSignedUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { setAuthKey, setUsername: setContextUsername } = useAuthKey();

  // Sign out and clear keys
  const signOut = () => {
    setAuthKey(null);
    setContextUsername(null);
    clearWalletAddress();
  };

  // Watch for wallet disconnect or account change (async, handles regrant/disconnect)
  useEffect(() => {
    if (!window.ethereum) return;

    let lastAccount = null;
    let isMounted = true;

    const checkAccounts = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) {
          if (isMounted) signOut();
        } else if (lastAccount && accounts[0] !== lastAccount) {
          if (isMounted) signOut();
        }
        lastAccount = accounts[0] || null;
      } catch {
        if (isMounted) signOut();
      }
    };

    window.ethereum.on("accountsChanged", checkAccounts);
    window.ethereum.on("disconnect", checkAccounts);
    window.ethereum.on("connect", checkAccounts);

    checkAccounts();
    const interval = setInterval(checkAccounts, 5000);

    return () => {
      isMounted = false;
      window.ethereum.removeListener("accountsChanged", checkAccounts);
      window.ethereum.removeListener("disconnect", checkAccounts);
      window.ethereum.removeListener("connect", checkAccounts);
      clearInterval(interval);
    };
  }, [setAuthKey, setContextUsername]);

  const handleWalletFlow = async () => {
    setWalletSteps(SIGNIN_STEPS);
    setCurrentStep(0);
    setErrorStep(null);
    setNotSignedUp(false);
    setErrorMsg("");

    try {
      const result = await getWalletAddress({
        onStep: (stepIdx) => setCurrentStep(stepIdx),
        onSteps: (stepsArr) => setWalletSteps(stepsArr),
        onNotSignedUp: () => setNotSignedUp(true)
      });

      if (result.error) {
        setErrorStep(currentStep);
        setErrorMsg(result.error);
      } else if (result.loginResult && result.loginResult.access_token) {
        setAuthKey(result.loginResult.access_token);
        setContextUsername(result.address.slice(16));
        onLoginSuccess && onLoginSuccess();
      } else {
        setErrorMsg("Unknown error.");
      }
    } catch (e) {
      setErrorStep(currentStep);
      setErrorMsg("Unexpected error.");
    }
  };

  useEffect(() => {
    if (open) {
      handleWalletFlow();
    }
    // eslint-disable-next-line
  }, [open]);

  // Clear wallet address on signout (when modal closes)
  useEffect(() => {
    if (!open) {
      clearWalletAddress();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
    >
      <div style={{
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        padding: 24,
        color: "#fff"
      }}>
        <StepChecklist
          steps={walletSteps}
          currentStep={currentStep}
          errorStep={errorStep}
        />
        {notSignedUp && (
          <div style={{ color: "#ffec3d", marginBottom: 8, fontWeight: "bold" }}>
            Not signed up?
          </div>
        )}
        {errorMsg && (
          <span style={{ color: "#ff4d4f", marginBottom: 16 }}>{errorMsg}</span>
        )}
        <Button
          type="secondary"
          onClick={onClose}
          style={{ marginTop: 24 }}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};