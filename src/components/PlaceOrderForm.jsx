import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';


const leverageSteps = [5, 10, 15, 20]
const marketStates = ['X5', 'X10', 'X15', 'X20']

function LeverageButton() {
  const [index, setIndex] = useState(0)
  const { token } = useAuth()
  const symbol = "BTCUSDT" // or make this dynamic

  const handleClick = async () => {
    const newIndex = (index + 1) % leverageSteps.length
    setIndex(newIndex)

    const requestBody = {
      symbol,
      leverage: leverageSteps[newIndex],
    }


    try {
      const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/leverage', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })
      const data = await response.json()
      //console.log("Leverage API response:", data)
    } catch (err) {
      console.error('Failed to set leverage:', err)
    }
  }

  return (
    <button className="leverage" onClick={handleClick}>
      {leverageSteps[index]}X
    </button>
  )
}




function AmountSlider() {
  const [sliderValue, setSliderValue] = useState(0);

  return (
    <div className="flex items-center gap-3 mt-3">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={sliderValue}
        onChange={(e) => setSliderValue(e.target.value)}
        className="w-full h-2 bg-[#1E4D4E] rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-[#2D9DA8]
                   [&::-webkit-slider-thumb]:shadow
                   [&::-webkit-slider-thumb]:transition
                   [&::-webkit-slider-thumb]:duration-200
                   [&::-moz-range-thumb]:bg-[#2D9DA8]
                   [&::-moz-range-thumb]:rounded-full"
      />
      <div className="min-w-[40px] text-right text-sm text-gray-400">
        {sliderValue}%
      </div>
    </div>
  );
}

function TpSlToggle() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex items-center gap-2.5 mt-3">
      {/* Switch */}
      <label className="relative inline-flex items-center w-[34px] h-[18px]">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
          className="sr-only peer"
        />
        <div className="w-full h-full bg-[#1E4D4E] rounded-full peer-checked:bg-[#2D9DA8] transition-colors duration-300" />
        <div className="absolute left-[3px] bottom-[3px] w-[12px] h-[12px] bg-[#87CFD4] rounded-full transition-transform duration-300 peer-checked:translate-x-[16px]" />
      </label>

      {/* Label */}
      <span className="text-sm text-[#87CFD4]">TP / SL</span>
    </div>
  );
}

function LimitOrderForm({ selectedPair, priceMidpoint, selectedPrice }) {
  const { token } = useAuth();

  const [balanceTotal, setBalanceTotal] = useState("--");
  const [balanceFree, setBalanceFree] = useState("--");
  const [price, setPrice] = useState(priceMidpoint || ''); // Initialize with priceMidpoint
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('buy');
  const [market, setMarket] = useState('limit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update price when selectedPrice changes
  useEffect(() => {
    if (selectedPrice) {
      setPrice(selectedPrice); // Set the price to the selected value
    }
  }, [selectedPrice]);

  // Clear all fields and reset states when logged out
  useEffect(() => {
    if (!token) {
      setBalanceTotal("--");
      setBalanceFree("--");
      setPrice(''); // Reset price
      setAmount('');
      setSide('buy'); // Reset to default "buy"
      setMarket('limit'); // Reset to default "limit"
      setError('');
      setSuccess('');
    }
  }, [token]);


  const placeOrder = async () => {
    if (!token || !selectedPair || !price || !amount) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const requestBody = {
      symbol: selectedPair,
      type: market.toUpperCase(),
      side: side.toUpperCase(),
      positionSide: 'BOTH',
      quantity: parseFloat(amount),
      price: parseFloat(price),
      timeInForce: 'GTC',
      orderRespType: 'ACK',
      params: {
        additionalProp1: {},
      },
    };

    try {
      const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/order', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      setSuccess(`Order placed successfully! Order ID: ${data.orderId}`);
    } catch (err) {
      setError('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/balance', {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }

        const data = await response.json();
        const usdtBalance = data.balances?.USDT || {};
        setBalanceTotal(usdtBalance.total || "--");
        setBalanceFree(usdtBalance.free || "--");
      } catch (err) {
        console.error('Error fetching balance:', err);
        setBalanceTotal("--");
        setBalanceFree("--");
      }
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="w-full text-white flex flex-col gap-4">
      {/* Market/Limit Tabs */}
      <div className="flex justify-between items-center text-sm font-semibold">
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${
            market === 'market' ? 'bg-[#1E4D4E]/50 text-[#fff] border-b-2 border-[#00B7C9]' : 'bg-[#000]/0 text-[#a9a9a9] border-b-2 border-[#00B7C9]/30 hover:bg-[#1E4D4E]/40'
          }`}
          onClick={() => setMarket('market')}
          disabled={!token}
          style={!token ? { opacity: 0.5 } : {}}
        >
          Market
        </button>
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${
            market === 'limit' ? 'bg-[#1E4D4E]/40 text-[#fff] border-b-2 border-[#00B7C9]' : 'bg-[#000]/0 text-[#a9a9a9] border-b-2 border-[#00B7C9]/30 hover:bg-[#1E4D4E]/40'
          }`}
          onClick={() => setMarket('limit')}
          disabled={!token}
          style={!token ? { opacity: 0.5 } : {}}
        >
          Limit
        </button>
      </div>

      {/* Balance Row */}
      <div className="px-8 flex justify-between  font-semibold gap-[20px] text-[16px] px-1">
        <span className="text-[#7DADB1]">
          Total Balance: <span className="text-[#fff]"><br/>{balanceTotal !== "--" ? parseFloat(balanceTotal).toFixed(3) : "--"} USDT</span>
        </span>
        <span className="text-[#7DADB1]">
          Free Balance: <span className="text-[#fff]"><br/>{balanceFree !== "--" ? parseFloat(balanceFree).toFixed(3) : "--"} USDT</span>
        </span>
      </div>

      {/* Side + Leverage */}
      <div className="px-2 flex gap-4 items-center">
        <div className="flex w-full gap-2 bg-[#1E4D4E] p-1 rounded-lg">
          <button
            className={`w-full py-1 rounded-md font-bold ${
              side === 'buy'
                ? 'bg-[#00B7C9] border border-[#00000000]'
                : 'hover:border border-[#00B7C9] text-white'
            } flex items-center justify-center gap-2`}
            onClick={() => setSide('buy')}
            disabled={!token} // Disable if not signed in
            style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
          >
            Buy
          </button>
          <button
            className={`w-full py-1 rounded-md font-bold  ${
              side === 'sell'
                ? 'bg-[#F5CB9D] border border-[#00000000]'
                : 'hover:border border-[#F5CB9D] text-white'
            } flex items-center justify-center gap-2`}
            onClick={() => setSide('sell')}
            disabled={!token} // Disable if not signed in
            style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
          >
            Sell
          </button>
        </div>

        <div className="w-[48px] h-[38px] flex items-center justify-center bg-[#1E4D4E] rounded-lg hover:border hover:border-[#F5CB9D] hover:bg-[#276c6d]">
          <LeverageButton />
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-2 flex flex-col gap-3 mt-3 text-sm">
        <label className="text-white">Limit Price</label>
        <div className="relative">
          <input
            type="number"
            placeholder="$0.0"
            className="bg-[#1E4D4E] text-white p-2 rounded-md text-sm placeholder-white/50 focus:outline-none w-full pr-12" // Add padding for the "Mid" label
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={!token} // Disable if not signed in
            style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
          />
          {/* "Mid" Label */}
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#2D9DA8] text-black px-2 py-1 rounded text-xs font-semibold hover:bg-[#23848b]"
            onClick={() => setPrice(priceMidpoint?.toFixed(4) || '')} // Set price to priceMidpoint
            disabled={!priceMidpoint} // Disable if priceMidpoint is null
          >
            Mid
          </button>
        </div>

        <label className="text-white">Amount</label>
        <input
          type="number"
          placeholder="0.0"
          className="bg-[#1E4D4E] w-full text-white p-2 rounded-md text-sm placeholder-white/50 focus:outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!token} // Disable if not signed in
          style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
        />
      </div>

      {/* Place Order Button */}
      <button
        className={`mx-2  mt-4 py-2 rounded-md font-semibold text-lg transition-colors ${
          side === 'buy'
            ? 'bg-[#2D9DA8] text-black hover:bg-[#23848b]'
            : 'bg-[#F5CB9D] text-black hover:bg-[#e6b87d]'
        }`}
        type="button"
        disabled={!token || loading} // Disable if not signed in or loading
        style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
        onClick={placeOrder}
      >
        {loading
          ? "Placing..."
          : side === 'buy'
            ? 'Place buy order'
            : 'Place sell order'}
      </button>
      {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
      {success && <div className="text-green-400 text-xs mt-2">{success}</div>}
    </div>
  );
}

export default LimitOrderForm;
