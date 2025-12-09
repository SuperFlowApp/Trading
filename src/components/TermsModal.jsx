import { useState } from 'react';
import Cookies from 'js-cookie';

function CustomCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center cursor-pointer gap-2 select-none">
      <span
        className={`w-5 h-5 flex items-center justify-center rounded border-2 transition
          ${checked ? 'bg-primary2normal border-primary2normal' : 'bg-boxbackground border-color_lighter_gray'}`}
        onClick={() => onChange(!checked)}
        tabIndex={0}
        role="checkbox"
        aria-checked={checked}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(!checked); }}
      >
        {checked && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8.5L7 11.5L12 5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span>{label}</span>
    </label>
  );
}

export default function TermsModal({ onAccept, onDecline }) {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  const handleAccept = () => {
    Cookies.set('termsAccepted', 'true', { expires: 365, sameSite: 'Strict' });
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-boxbackground rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Terms of Use, Privacy Policy, and Cookie Policy</h2>
        <div className="mb-2">
          <CustomCheckbox
            checked={checked1}
            onChange={setChecked1}
            label="I agree to the Terms of Use and Privacy Policy"
          />
        </div>
        <div className="mb-4">
          <CustomCheckbox
            checked={checked2}
            onChange={setChecked2}
            label="I accept the Cookie Policy"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-red text-backgroundlight hover:bg-red"
            onClick={onDecline}
          >
            Decline
          </button>
          <button
            className={`px-4 py-2 rounded ${checked1 && checked2 ? 'bg-green text-backgroundlight hover:bg-green' : 'bg-gray-300 text-gray-500 cursor-default'}`}
            onClick={handleAccept}
            disabled={!(checked1 && checked2)}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}