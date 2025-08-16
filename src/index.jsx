import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FuturesApp from './FuturesApp';
import Navbar from './components/navbar';
import CommingSoon from './components/CommonUIs/CommingSoon';
import { AuthKeyProvider } from './contexts/AuthKeyContext'; // <-- use provider

import './components/index.css';
import './components/ant-overrides.css';

const container = document.getElementById('root');
const root = createRoot(container);

function CurrentPage() {
  if (window.location.pathname.includes('options-trading')) {
    return <CommingSoon />;
  }
  return <FuturesApp />;
}

function RootApp() {
  return (
    <StrictMode>
      <AuthKeyProvider>
        <Navbar />
        <div className="flex justify-center items-center min-h-[80vh]">
          <CurrentPage />
        </div>
      </AuthKeyProvider>
    </StrictMode>
  );
}

root.render(<RootApp />);