import { useState } from "react";

function ManageAccountModal({ accessToken, apiKeyData, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePwError, setChangePwError] = useState("");
  const [responseData, setResponseData] = useState(null);

  // Password validation (reuse from LoginPanel)
  const validatePassword = (password) =>
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleChangePassword = async () => {
    setChangePwError("");
    let valid = true;
    if (!oldPassword) {
      setChangePwError("Old password is required.");
      valid = false;
    }
    if (!newPassword) {
      setChangePwError("New password is required.");
      valid = false;
    } else if (!validatePassword(newPassword)) {
      setChangePwError("New password must have 1 uppercase letter, 1 number and 1 special character.");
      valid = false;
    }
    if (!valid) return;

    
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#0D2221] text-white p-6 rounded-lg w-full max-w-md mx-auto space-y-4 border border-[#7DADB1] relative">
        <button
          className="absolute top-2 right-2 text-white text-lg"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Manage Account</h2>
        <div>
          <label className="block text-xs mb-1">Old Password</label>
          <input
            className="w-full px-4 py-2 rounded bg-[#1E4D4E] text-white border border-transparent"
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">New Password</label>
          <input
            className="w-full px-4 py-2 rounded bg-[#1E4D4E] text-white border border-transparent"
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {changePwError && (
          <div className="bg-red-600 text-white text-xs rounded px-2 py-1 mt-2">
            {changePwError}
          </div>
        )}
        <button
          onClick={handleChangePassword}
          className="bg-[#2D9DA8] px-4 py-2 rounded font-medium hover:bg-opacity-80 mt-2"
        >
          Change Password
        </button>
        {responseData && (
          <div className="text-sm mt-2 text-white">
            {responseData.msg && <div>{responseData.msg}</div>}
            {responseData.detail && (
              <pre className="bg-black/40 p-2 rounded mt-2 text-xs overflow-x-auto">
                {typeof responseData.detail === "string"
                  ? responseData.detail
                  : JSON.stringify(responseData.detail, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageAccountModal;