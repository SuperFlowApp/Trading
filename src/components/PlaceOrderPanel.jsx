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
  const pairDetails = getSelectedPairDetails() || { base: 'BTC', quote: 'USDT' }; // fallback

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
  const [blinkClass, setBlinkClass] = useState(""); // <-- Add this state
  const [accountInfo, setAccountInfo] = useState(null);
  const [accountInfoError, setAccountInfoError] = useState('');

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

  // Fetch account information function
  const fetchAccountInfo = async () => {
    if (!token) {
      setAccountInfo(null);
      setAccountInfoError('');
      return;
    }
    try {
      const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information-direct', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch account information');
      }
      const data = await response.json();
      setAccountInfo(data);
      setAccountInfoError('');
    } catch (err) {
      setAccountInfo(null);
      setAccountInfoError('Failed to fetch account information.');
    }
  };

  // Fetch on mount and every 5 seconds
  useEffect(() => {
    fetchAccountInfo();
    if (!token) return;
    const interval = setInterval(fetchAccountInfo, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const placeOrder = async () => {
    if (!token || !selectedPair || !amount) {
      setError('Please fill all fields.');
      setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass(""), 400);
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
      setSuccess(`Order placed! Order ID: ${data.orderId}`);
      setAmount('');
      setSliderValue(0);
      setBlinkClass("blink-success");
      setTimeout(() => setBlinkClass(""), 400);

      // Fetch updated account info after placing order
      fetchAccountInfo();

    } catch (err) {
      setError('Failed to place order.');
      setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass(""), 400);
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


  // Fetch account information
  useEffect(() => {
    if (!token) {
      setAccountInfo(null);
      setAccountInfoError('');
      return;
    }
    const fetchAccountInfo = async () => {
      try {
        const response = await fetch('https://fastify-serverless-function-rimj.onrender.com/api/account-information-direct', {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch account information');
        }
        const data = await response.json();
        setAccountInfo(data);
        setAccountInfoError('');
      } catch (err) {
        setAccountInfo(null);
        setAccountInfoError('Failed to fetch account information.');
      }
    };
    fetchAccountInfo();
  }, [token]);

  // Update on slider change
  const handleSliderChange = (e) => {
    let value = Number(e.target.value);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    setSliderValue(value);
  };

  // Update on input change
  const handleInputChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '') value = '';
    else value = Math.max(0, Math.min(100, Number(value)));
    setSliderValue(value);
  };

  // Update on amount (Size) input change
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);

    // Calculate sliderValue as percentage of balanceFree
    const numericValue = parseFloat(value);
    const numericBalance = parseFloat(balanceFree);
    if (!isNaN(numericValue) && numericBalance > 0) {
      let percent = (numericValue / numericBalance) * 100;
      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;
      setSliderValue(percent);
    } else {
      setSliderValue(0);
    }
  };

  // Update the amount field whenever sliderValue changes
  useEffect(() => {
    if (sliderValue > 0) {
      const calculatedAmount = (sliderValue / 100) * balanceFree;
      setAmount(calculatedAmount.toFixed(1));
    } else {
      setAmount('');
    }
  }, [sliderValue, balanceFree]);

  // Auto-hide error and success messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="w-full text-white flex flex-col gap-4">
      {/* Head Tabs */}
      <div className="flex justify-between items-center text-sm font-semibold">
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'market' ? 'text-white border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('market')}
        >
          Market
        </button>
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'limit' ? 'text-white border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('limit')}
        >
          Limit
        </button>
        <button
          className={`w-full py-2 font-semibold text-sm transition-colors ${market === 'scale' ? 'text-white border-b-2 border-primary2' : 'text-secondary1 border-b-2 border-primary2/30 hover:border-primary2/50'
            }`}
          onClick={() => setMarket('scale')}
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
          >
            Buy
          </button>
          <button
            className={`w-full py-1 rounded-md font-bold  ${side === 'sell'
              ? 'bg-primary1 text-black border border-transparent'
              : 'hover:border border-primary1 text-white'
              } flex items-center justify-center gap-2`}
            onClick={() => setSide('sell')}
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
                onChange={handleAmountChange}
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

      {/* --- AmountSlider UI moved here --- */}
      <div className="flex items-center gap-3 mt-3 px-4">
        {/* Slider markers */}
        <div className="relative w-full">
          {/* Circles at 25%, 50%, 75%, 100% */}
          <div className="absolute left-0 top-[8px] w-full h-0 pointer-events-none">
            {[25, 50, 75].map((percent) => (
              <span
                key={percent}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${percent}%`,
                  top: '50%',
                }}
              >
                <span className="w-[12px] h-[12px] rounded-full bg-secondary2/50 block " />
              </span>
            ))}
          </div>
          {/* The slider itself */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sliderValue || 0}
            onChange={handleSliderChange}
            className="w-full h-[12px] rounded-lg appearance-none cursor-pointer z-10 relative
             [&::-webkit-slider-thumb]:appearance-none
             [&::-webkit-slider-thumb]:h-[16px]
             [&::-webkit-slider-thumb]:w-[16px]
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
        </div>
        <div className="min-w-[60px] flex items-center gap-1 text-right text-sm text-gray-400">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={sliderValue}
            onChange={handleInputChange}
            className="w-12 bg-backgrounddark border border-secondary2 rounded px-1 py-0.5 text-white text-sm text-right"
          />
          <span>%</span>
        </div>
      </div>
      {/* --- End AmountSlider UI --- */}

      {/* Place Order Button */}
      <button
        className={`mx-2 mt-4 py-2 rounded-md font-semibold text-lg transition-colors border-2 border-transparent ${side === 'buy'
          ? 'bg-primary2 text-black hover:bg-primary2/80'
          : 'bg-primary1 text-black hover:bg-primary1/80'
          } ${blinkClass}`} // <-- Add blinkClass here
        type="button"
        onClick={placeOrder}
      >
        {!token
          ? "Connect"
          : loading
            ? "Placing..."
            : side === 'buy'
              ? 'Place buy order'
              : 'Place sell order'}
      </button>

      <div className='px-4' style={{ minHeight: '16px' }}>
        {error && <div className="text-red-400 text-xs">{error}</div>}
        {success && <div className="text-green-400 text-xs">{success}</div>}
      </div>

      {/* Account Information */}
      <div className="px-4 mt-4">
        {accountInfoError && (
          <div className="text-red-400 text-xs">{accountInfoError}</div>
        )}
        <div className="bg-backgrounddark rounded p-3 text-xs flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-secondary1">Account Equity</span>
            <span className="text-white font-semibold">
              {token && accountInfo
                ? `$${parseFloat(accountInfo.availableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary1">Balance</span>
            <span className="text-white font-semibold">
              {token && accountInfo
                ? `$${parseFloat(accountInfo.crossBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary1">Unrealized PNL</span>
            <span className="text-white font-semibold">
              {token && accountInfo
                ? `$${parseFloat(accountInfo.UnrealizedPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary1">Maintenance Margin</span>
            <span className="text-white font-semibold">
              {token && accountInfo
                ? `$${parseFloat(accountInfo.positions?.[0]?.maintenanceMargin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary1">Cross Account Leverage</span>
            <span className="text-white font-semibold">
              {token && accountInfo
                ? `${accountInfo.positions?.[0]?.leverage || 0}x`
                : "--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LimitOrderForm;
