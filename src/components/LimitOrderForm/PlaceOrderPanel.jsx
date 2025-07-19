import { useState, useEffect } from 'react';
import { useAuth, useAuthFetch } from '../../context/Authentication.jsx';
import usePanelStore from '../../store/panelStore.js'; // <-- Add this import
import LeveragePanel from './Leverage.jsx';
import MarginMode from './MarginMode.jsx';
import PositionMode from './PositionMode.jsx';

function LimitOrderForm({ onCurrencyChange, onConnect }) {
  const selectedPairBase = usePanelStore(s => s.selectedPair);
  const selectedPair = selectedPairBase ? `${selectedPairBase}USDT` : null;
  const pairDetails = { base: selectedPairBase, quote: 'USDT' };
  const leverage = usePanelStore(s => s.leverage);
  const setLeveragePanelOpen = usePanelStore(s => s.setLeveragePanelOpen);
  const setPositionModePanelOpen = usePanelStore(s => s.setPositionModePanelOpen);

  // Use Zustand for selectedCurrency
  const selectedCurrency = usePanelStore(s => s.selectedCurrency);
  const setSelectedCurrency = usePanelStore(s => s.setSelectedCurrency);

  // Use Zustand for priceMidpoint
  const priceMidpoint = usePanelStore(s => s.priceMidpoint);

  // Move this check AFTER all hooks
  const { token, availableBalance } = useAuth();
  const [balanceTotal, setBalanceTotal] = useState("--");
  const balanceFree = availableBalance ? parseFloat(availableBalance).toFixed(2) : "--";
  const [price, setPrice] = useState(priceMidpoint || '');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('buy');
  const [market, setMarket] = useState('limit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [blinkClass, setBlinkClass] = useState("");
  const [inputSource, setInputSource] = useState(null);

  const marginMode = usePanelStore(s => s.marginMode);
  const setMarginModePanelOpen = usePanelStore(s => s.setMarginModePanelOpen);
  const selectedPrice = usePanelStore(s => s.selectedPrice); // <-- Read from Zustand

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
      setPrice('');
      setAmount('');
      setSide('buy');
      setMarket('limit');
      setError('');
      setSuccess('');
      setSliderValue(0); // Reset slider to default value
      setSelectedCurrency(pairDetails.base); // Reset to the first currency
    }
  }, [token]);

  const placeOrder = async () => {
    if (!token) {
      // Just blink when not logged in, no error message
      setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass(""), 400);
      return;
    }

    if (!selectedPair || !amount) {
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

      // Try to parse the error response before checking if response is ok
      let errorData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }

      if (!response.ok) {
        // Use error message from response if available
        const errorMessage = errorData && typeof errorData === 'object' && errorData.message
          ? errorData.message
          : typeof errorData === 'string' ? errorData : 'Failed to place order';

        throw new Error(errorMessage);
      }

      const data = typeof errorData === 'object' ? errorData : { orderId: 'unknown' };
      setSuccess(`Order placed! Order ID: ${data.orderId}`);
      setAmount('');
      setSliderValue(0);
      setBlinkClass("blink-success");
      setTimeout(() => setBlinkClass(""), 400);
    } catch (err) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order');
      setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass(""), 400);
    } finally {
      setLoading(false);
    }
  };

  // Set price to priceMidpoint when switching to Limit or Scale, unless user typed manually
  useEffect(() => {
    if ((market === 'limit' || market === 'scale') && !price) {
      if (priceMidpoint) setPrice(priceMidpoint.toFixed(1));
    }
    if (market === 'market') {
      setPrice('');
    }
  }, [market, priceMidpoint]);



  // Update on slider change
  const handleSliderChange = (e) => {
    let value = Number(e.target.value);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    setSliderValue(value);
    setInputSource('slider');
  };

  // Update on input change
  const handleInputChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '') value = '';
    else value = Math.max(0, Math.min(100, Number(value)));
    setSliderValue(value);
    setInputSource('slider');
  };

  // Update on amount (Size) input change
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
    setInputSource('input');

    // Still calculate the slider position, but don't set input source to 'slider'
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

  // Update the amount field whenever sliderValue changes or balance changes
  useEffect(() => {
    // Only update amount from slider when inputSource is 'slider'
    if (inputSource === 'slider' && sliderValue >= 0) {
      // Calculate based on selected currency
      if (selectedCurrency === pairDetails.base) {
        // Convert balanceFree (in quote currency) to base currency
        const currentPrice = parseFloat(price) || priceMidpoint;
        if (currentPrice && !isNaN(currentPrice) && !isNaN(parseFloat(balanceFree))) {
          const baseEquivalent = parseFloat(balanceFree) / currentPrice;
          const calculatedAmount = (sliderValue / 100) * baseEquivalent;
          setAmount(calculatedAmount.toFixed(6)); // More decimals for base currency like BTC
        }
      } else {
        // For quote currency, use balanceFree directly
        const calculatedAmount = (sliderValue / 100) * parseFloat(balanceFree);
        setAmount(calculatedAmount.toFixed(2)); // Fewer decimals for quote currency like USDT
      }

      // Reset input source after processing
      setInputSource(null);
    }
  }, [sliderValue, balanceFree, selectedCurrency, price, priceMidpoint, inputSource]);

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

  // Notify parent when currency changes
  useEffect(() => {
    if (onCurrencyChange) {
      onCurrencyChange(selectedCurrency);
    }
  }, [selectedCurrency, onCurrencyChange]);

  // Reset to the first currency when selectedPair (base in URL) changes
  useEffect(() => {
    setSelectedCurrency(pairDetails.base);
  }, [pairDetails.base, setSelectedCurrency]);

  // Add this useEffect to handle currency switching and maintain equivalent values
  useEffect(() => {
    if (!amount) return;

    const currentAmount = parseFloat(amount);
    // Use price if available (Limit/Scale mode), otherwise use priceMidpoint (Market mode)
    const currentPrice = parseFloat(price) || priceMidpoint;

    if (isNaN(currentAmount) || !currentPrice || isNaN(currentPrice)) return;

    // When switching from base to quote, convert amount to quote value
    if (selectedCurrency === pairDetails.quote) {
      const quoteValue = currentAmount * currentPrice;
      setAmount(quoteValue.toFixed(2));
    }
    // When switching from quote to base, convert amount back to base value
    else if (selectedCurrency === pairDetails.base) {
      const baseValue = currentAmount / currentPrice;
      setAmount(baseValue.toFixed(6));
    }
  }, [selectedCurrency]); // Only trigger when currency selection changes

  return (
    <div className="w-full text-white flex flex-col gap-3">





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


      {/* Margin Mode - Leverage - Position Mode */}
      <div className="flex justify-between items-center text-sm font-semibold p-4 gap-2">


        <MarginMode />
        <button
          className={`w-[70px] h-[38px] bg-backgrounddark flex items-center justify-center border border-secondary2 hover:border-secondary1 text-secondary1 hover:text-white  rounded-lg cursor-pointer`}
          onClick={() => setMarginModePanelOpen(true)}
        >
          {marginMode}
        </button>

        <LeveragePanel />
        <button
          className={`w-[70px] h-[38px] bg-backgrounddark flex items-center justify-center border border-secondary2 hover:border-secondary1 text-secondary1 hover:text-white  rounded-lg cursor-pointer`}
          onClick={() => setLeveragePanelOpen(true)}
        >
          {leverage}X
        </button>

        <PositionMode />
        <button
          className={`w-[70px] h-[38px] bg-backgrounddark flex items-center justify-center border border-secondary2 hover:border-secondary1 text-secondary1 hover:text-white  rounded-lg cursor-pointer`}
          onClick={() => setPositionModePanelOpen(true)}
        >
          One-way
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

      </div>
      {/* Balance Row */}
      <div className="px-2 font-semibold text-[12px]">
        <span className="flex items-center justify-between w-full text-secondary1">
          Free Balance: <span className="text-white">{balanceFree !== "--" ? parseFloat(balanceFree).toFixed(1) : "--"} USDT</span>
        </span>
      </div>

      {/* Conditionally render the Price field */}
      <div className="px-2 flex flex-col text-sm">
        {market !== 'market' && (
          <>
            <label className=" pl-1 text-white pt-2">Price</label>
            <div className="gap-2 w-full justify-between items-center">
              <div className="w-full relative">
                <input
                  type="number"
                  placeholder="$0.0"
                  className="bg-backgrounddark border border-secondary2 hover:border-secondary1  focus:outline-none focus:border-secondary1 w-full text-white p-1 rounded-md text-sm placeholder-white/50 "
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {/* "Mid" Button */}
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary1 px-2 py-1 rounded text-xs font-semibold hover:text-white cursor-pointer"
                  onClick={async () => {
                    // Fetch orderbook from your API (adjust symbol as needed)
                    const symbol = selectedPair; // e.g. BTCUSDT
                    try {
                      const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=5`);
                      const data = await res.json();
                      const bestBid = data.bids?.[0]?.[0] ? parseFloat(data.bids[0][0]) : null;
                      const bestAsk = data.asks?.[0]?.[0] ? parseFloat(data.asks[0][0]) : null;
                      if (bestBid && bestAsk) {
                        const mid = ((bestBid + bestAsk) / 2).toFixed(1);
                        setPrice(mid);
                      }
                    } catch (err) {
                      console.error('Failed to fetch orderbook for mid price:', err);
                    }
                  }}
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
            <label className="pt-2 pl-1 text-white">Size</label>
            <div className="w-full relative">
              <input
                type="number"
                placeholder="0.0"
                className="bg-backgrounddark border border-secondary2 hover:border-secondary1 focus:outline-none focus:border-secondary1 w-full text-white p-1 rounded-md text-sm placeholder-white/50 focus:outline-none focus:border-secondary1 "
                value={amount}
                onChange={handleAmountChange}
              />
              {/* Selecting currency */}
              <div className=" absolute right-0 top-1/2 transform -translate-y-1/2 px-1 rounded text-xs font-semibold focus:outline-none hover:text-white focus:text-white cursor-pointer">
                <button
                  className={`px-4 border border-transparent rounded-md font-semibold text-sm transition-colors ${selectedCurrency === pairDetails.base ? 'bg-secondary2 text-white' : 'bg-backgrounddark text-secondary1 hover:border-secondary2 hover:text-white'}`}
                  onClick={() => {
                    if (selectedCurrency !== pairDetails.base) {
                      setSelectedCurrency(pairDetails.base);
                    }
                  }}
                >
                  {pairDetails.base}
                </button>
                <button
                  className={`px-4 border border-transparent rounded-md font-semibold text-sm transition-colors ${selectedCurrency === pairDetails.quote ? 'bg-secondary2 text-white' : 'bg-backgrounddark text-secondary1 hover:border-secondary2 hover:text-white'}`}
                  onClick={() => {
                    if (selectedCurrency !== pairDetails.quote) {
                      setSelectedCurrency(pairDetails.quote);
                    }
                  }}
                >
                  {pairDetails.quote}
                </button>
              </div>
            </div>

          </>
        )}
      </div>

      {/* --- AmountSlider UI --- */}
      <div className="flex items-center gap-3 my-1 px-4">
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
        className={`mx-2 mt-8 rounded-md font-semibold text-lg transition-colors border-2 border-transparent ${side === 'buy'
          ? 'bg-primary2 text-black hover:bg-primary2/80'
          : 'bg-primary1 text-black hover:bg-primary1/80'
          } ${blinkClass}`}
        type="button"
        onClick={() => {
          if (!token) {
            if (typeof onConnect === 'function') {
              onConnect();
            }
            return;
          }
          placeOrder();
        }}
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

      {/* Order Information */}
      <div className="px-2 mt-4">
        <div className="border-t border-secondary2 py-3 text-xs flex flex-col gap-2">
          <span className="w-full flex justify-between text-white font-semibold">
            Order Value
            <span>
              {amount && (price || priceMidpoint)
                ? `$${(() => {
                  const numAmount = parseFloat(amount);
                  // Use price if available (Limit/Scale mode), otherwise use priceMidpoint (Market mode)
                  const numPrice = parseFloat(price) || priceMidpoint;

                  // If we're in quote currency mode (USDT), the amount IS the order value
                  if (selectedCurrency === pairDetails.quote) {
                    return numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }
                  // If we're in base currency mode (BTC), multiply by price to get order value
                  else {
                    return (numAmount * numPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }
                })()}`
                : "--"}
            </span>
          </span>
          <span className="w-full flex justify-between text-white font-semibold">
            Fees
            <span>0.0700% / 0.0400%</span>
          </span>
        </div>
      </div>

    </div>
  );
}

export default LimitOrderForm;
