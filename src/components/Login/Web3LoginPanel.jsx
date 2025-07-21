import { ConnectButton, Connector } from '@ant-design/web3';
import {
  Mainnet,
  MetaMask,
  OkxWallet,
  TokenPocket,
  WagmiWeb3ConfigProvider,
  WalletConnect,
} from '@ant-design/web3-wagmi';
import { QueryClient } from '@tanstack/react-query';
import { http } from 'wagmi';

const queryClient = new QueryClient();

function Web3LoginPanel({ onClose }) {
  return (
    <WagmiWeb3ConfigProvider
      eip6963={{
        autoAddInjectedWallets: true,
      }}
      ens
      chains={[Mainnet]}
      transports={{
        [Mainnet.id]: http(),
      }}
      walletConnect={{
        projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Replace with your actual project ID
      }}
      wallets={[
        MetaMask(),
        WalletConnect(),
        TokenPocket({
          group: 'Popular',
        }),
        OkxWallet(),
      ]}
      queryClient={queryClient}
    >
      <Connector modalProps={{ mode: 'simple' }}>
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded shadow-lg">
          <ConnectButton quickConnect />
          {onClose && (
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </Connector>
    </WagmiWeb3ConfigProvider>
  );
}

export default Web3LoginPanel;