import { useState, useEffect } from 'react';
import { useAuth } from '../context/Authentication.jsx';

import { getSelectedPairDetails } from './ChartPanel/Infobar.jsx';

const leverageSteps = [5, 10, 15, 20]
const pairDetails = getSelectedPairDetails();

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




function LimitOrderForm({ selectedPair, priceMidpoint, selectedPrice }) {
  const { token } = useAuth();

  const [balanceTotal, setBalanceTotal] = useState("--");
  const [balanceFree, setBalanceFree] = useState("--");
  const [price, setPrice] = useState(priceMidpoint || '');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('buy');
  const [market, setMarket] = useState('limit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(pairDetails.base); // Initialize with the first currency
  const [sliderValue, setSliderValue] = useState(0); // State for slider value

  const calcAvailableSlider = sliderValue * balanceFree; // Calculate globally available value

  // Update price when selectedPrice changes
  useEffect(() => {
    if (selectedPrice) {
      setPrice(selectedPrice);
    }
  }, [selectedPrice]);

  // Clear all fields and reset states when logged out
  useEffect(() => {
    if (!token) {
      setBalanceTotal("--");
      setBalanceFree("--");
      setPrice('');
      setAmount('');
      setSide('buy');
      setMarket('limit');
      setError('');
      setSuccess('');
      setSliderValue(0); // Reset slider to default value
      setSelectedDropdownValue(pairDetails.base); // Reset to the first currency
    }
  }, [token]);

  const placeOrder = async () => {
    if (!token || !selectedPair || !amount) {
      setError('Please fill all fields.');
      return;
    }

    // Automatically set price to priceMidpoint if in "market" tab
    const finalPrice = market === 'market' ? priceMidpoint?.toFixed(1) : price;

    if (!finalPrice) {
      setError('Price is required.');
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
      price: parseFloat(finalPrice),
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
      setAmount(''); // <-- Reset amount immediately after success
      setSliderValue(0); // <-- Optionally reset slider as well
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


  function AmountSlider({ sliderValue, setSliderValue }) {
    return (
      <div className="flex items-center gap-3 mt-3">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={sliderValue}
          onChange={(e) => setSliderValue(e.target.value)}
          className="w-full h-2 bg-secondary2/60 rounded-lg appearance-none cursor-pointer
                   bg-secondary2/60
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:shadow
                   [&::-webkit-slider-thumb]:transition
                   [&::-webkit-slider-thumb]:duration-200
                   [&::-moz-range-thumb]:bg-white
                   [&::-moz-range-thumb]:rounded-full"
          style={{
            background: `linear-gradient(to right, #565A93 0%, #565A93 ${sliderValue}%, #565A9350 ${sliderValue}%, #565A9350 100%)`
          }}
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


  // Update the amount field whenever sliderValue changes
  useEffect(() => {
    const calculatedAmount = (sliderValue / 100) * balanceFree;
    setAmount(calculatedAmount.toFixed(1)); // Set the calculated value to the amount field
  }, [sliderValue, balanceFree]);

  return (
    <div className="w-full text-white flex flex-col gap-4">
      {/* Head Tabs */}
      <div className="flex justify-between items-center text-sm font-semibold">
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'market' ? 'text-white border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('market')}
          disabled={!token}
          style={!token ? { opacity: 0.5 } : {}}
        >
          Market
        </button>
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'limit' ? 'text-white border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('limit')}
          disabled={!token}
          style={!token ? { opacity: 0.5 } : {}}
        >
          Limit
        </button>
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'scale' ? 'text-white border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('scale')}
          disabled={!token}
          style={!token ? { opacity: 0.5 } : {}}
        >
          Scale
        </button>
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

        <div className="w-[48px] h-[38px] bg-backgrounddark flex items-center justify-center border border-secondary2 hover:border-secondary1 focus:outline-none focus:border-secondary1 text-secondary1 hover:text-white  rounded-lg cursor-pointer">
          <LeverageButton />
        </div>
      </div>
      {/* Balance Row */}
      <div className="px-2 font-semibold text-[12px]">
        <span className="flex items-center justify-between w-full text-secondary1">
          Free Balance: <span className="text-white">{balanceFree !== "--" ? parseFloat(balanceFree).toFixed(1) : "--"} USDT</span>
        </span>
      </div>

      {/* Conditionally render the Price field */}
      <div className="px-2 flex flex-col gap-3 mt-3 text-sm">
        {market !== 'market' && (
          <>
            <label className="text-white">Price</label>
            <div className="gap-2 w-full justify-between items-center">
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
                  className=" absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary1 px-2 py-1 rounded text-xs font-semibold hover:text-white"
                  onClick={() => setPrice(priceMidpoint?.toFixed(1) || '')} // Set price to priceMidpoint
                  disabled={!priceMidpoint} // Disable if priceMidpoint is null
                >
                  Mid
                </button>
              </div>
            </div>
          </>
        )}


        {/* Conditionally render the Amount field */}
        {market !== '' && (
          <>
            <label className="text-white">Size</label>
            <div className="w-full relative">

              <input
                type="number"
                placeholder="0.0"
                className="bg-backgrounddark border border-secondary2 hover:border-secondary1  focus:outline-none focus:border-secondary1 w-full text-white p-2 rounded-md text-sm placeholder-white/50 focus:outline-none focus:border-secondary1 "
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!token} // Disable if not signed in
                style={!token ? { border: '1px solid #87CFD4', opacity: 0.5 } : {}}
              />
              {/* Selecting currency */}
              <div className="bg-backgrounddark absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded text-xs font-semibold focus:outline-none hover:text-white focus:text-white cursor-pointer">
                <button
                  className={`px-4 border border-transparent rounded-md font-semibold text-sm transition-colors ${selectedDropdownValue === pairDetails.base ? 'bg-secondary2 text-white' : 'bg-backgrounddark text-secondary1 hover:border-secondary1 hover:text-white'}`}
                  onClick={() => setSelectedDropdownValue(pairDetails.base)}
                >
                  {pairDetails.base}
                </button>
                <button
                  className={`px-4 border border-transparent rounded-md font-semibold text-sm transition-colors ${selectedDropdownValue === pairDetails.quote ? 'bg-secondary2 text-white' : 'bg-backgrounddark text-secondary1 hover:border-secondary1 hover:text-white'}`}
                  onClick={() => setSelectedDropdownValue(pairDetails.quote)}
                >
                  {pairDetails.quote}
                </button>
              </div>
            </div>

          </>
        )}
      </div>
      <div className='px-4'>
        <AmountSlider sliderValue={sliderValue} setSliderValue={setSliderValue} />
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
