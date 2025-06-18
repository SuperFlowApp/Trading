import { useState, useEffect } from 'react';
import { useAuth } from '../context/Authentication.jsx';

import { getSelectedPairDetails } from './ChartPanel/Infobar.jsx';

const leverageSteps = [5, 10, 15, 20]
const pairDetails = getSelectedPairDetails();
console.log(pairDetails); // Debugging output

function LeverageButton() {
  const [index, setIndex] = useState(0)
  const { token } = useAuth()
  const symbol = "BTCUSDT"

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
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(pairDetails[0]); // Default to the first value

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
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'market' ? 'text-[#fff] border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('market')}
          disabled={!token}
          style={!token ? { opacity: 0.5 } : {}}
        >
          Market
        </button>
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'limit' ? 'text-[#fff] border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
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
        <span className="text-secondary1">
          Total Balance: <span className="text-[#fff]"><br />{balanceTotal !== "--" ? parseFloat(balanceTotal).toFixed(3) : "--"} USDT</span>
        </span>
        <span className="text-secondary1">
          Free Balance: <span className="text-[#fff]"><br />{balanceFree !== "--" ? parseFloat(balanceFree).toFixed(3) : "--"} USDT</span>
        </span>
      </div>

      {/* Side + Leverage */}
      <div className="px-2 flex gap-4 items-center">
        <div className="flex w-full gap-2 bg-backgrounddark border border-secondary2 p-1 rounded-lg">
          <button
            className={`w-full py-1 rounded-md font-bold ${side === 'buy'
              ? 'bg-primary2 text-black border border-transparent'
              : 'hover:border border-primary2 text-white'
              } flex items-center justify-center gap-2`}
            onClick={() => setSide('buy')}
            disabled={!token} // Disable if not signed in
            style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
          >
            Buy
          </button>
          <button
            className={`w-full py-1 rounded-md font-bold  ${side === 'sell'
              ? 'bg-primary1 text-black border border-transparent'
              : 'hover:border border-primary1 text-white'
              } flex items-center justify-center gap-2`}
            onClick={() => setSide('sell')}
            disabled={!token} // Disable if not signed in
            style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
          >
            Sell
          </button>
        </div>

        <div className="w-[48px] h-[38px] flex items-center justify-center border border-secondary2 hover:border-secondary1 focus:outline-none focus:border-secondary1 text-secondary1 hover:text-white  rounded-lg cursor-pointer">
          <LeverageButton />
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-2 flex flex-col gap-3 mt-3 text-sm">
        <label className="text-white">Limit Price</label>
        <div className="flex flex-row gap-2 w-full justify-between items-center">
          <div className="w-full relative">
            <input
              type="number"
              placeholder="$0.0"
              className="bg-backgrounddark border border-secondary2 hover:border-secondary1  focus:outline-none focus:border-secondary1 w-full text-white p-2 rounded-md text-sm placeholder-white/50 "
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={!token} // Disable if not signed in
              style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
            />
            {/* "Mid" Button */}
            <button
              type="button"
              className="bg-backgrounddark absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary1 px-2 py-1 rounded text-xs font-semibold hover:text-white"
              onClick={() => setPrice(priceMidpoint?.toFixed(4) || '')} // Set price to priceMidpoint
              disabled={!priceMidpoint} // Disable if priceMidpoint is null
            >
              Mid
            </button>


          </div>
          {/* Dropdown for selecting currency */}
          <select
            className="self-end w-20 bg-backgrounddark text-secondary1 hover:text-white border border-secondary2  hover:border-secondary1 px-2 h-full rounded text-sm font-semibold hover:bg-backgrounddark cursor-pointer"
            value={selectedDropdownValue}
            onChange={(e) => setSelectedDropdownValue(e.target.value)}
          >
            <option value={pairDetails.base}>{pairDetails.base}</option>
            <option value={pairDetails.quote}>{pairDetails.quote}</option>
          </select>
        </div>

        <label className="text-white">Amount</label>
        <input
          type="number"
          placeholder="0.0"
          className="bg-backgrounddark border border-secondary2 hover:border-secondary1 w-full text-white p-2 rounded-md text-sm placeholder-white/50 focus:outline-none focus:border-secondary1 "
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!token} // Disable if not signed in
          style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
        />
      </div>

      {/* Place Order Button */}
      <button
        className={`mx-2 mt-4 py-2 rounded-md font-semibold text-lg transition-colors ${side === 'buy'
          ? 'bg-primary2 text-black hover:bg-primary2/80'
          : 'bg-primary1 text-black hover:bg-primary1/80'
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
