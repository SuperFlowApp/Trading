import { useState, useEffect } from 'react';
import { useAuth, useAuthFetch } from '../../context/Authentication.jsx';
import usePanelStore from '../../Zustandstore/panelStore.js'; // already imported
import LeveragePanel from './Leverage.jsx';
import MarginMode from './MarginMode.jsx';
import PositionMode from './PositionMode.jsx';
import { Input, Select, Space } from 'antd';
import Tab from '../CommonUIs/tab.jsx';
import ModalModButton from '../CommonUIs/modalmodbutton';
import NativeSlider from '../CommonUIs/slider.jsx';
import Button from '../CommonUIs/OrderButton.jsx';
import SideSelectorButton from '../CommonUIs/SideSelectorButton.jsx';

function LimitOrderForm({ onCurrencyChange }) { // REMOVE onConnect from props
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
  const [price, setPrice] = useState(priceMidpoint);
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
  const setShowLoginPanel = usePanelStore(s => s.setShowLoginPanel); // ADD THIS

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
          setAmount(calculatedAmount.toFixed(6));
        }
      } else {
        // quote currency, balanceFree directly
        const calculatedAmount = (sliderValue / 100) * parseFloat(balanceFree);
        setAmount(calculatedAmount.toFixed(2));
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
    <div className="w-full text-white flex flex-col gap-3 flex flex-col bg-backgrounddark rounded-md min-w-0 overflow-hidden">

      {/* Head Tabs */}
      <Tab
        tabs={['market', 'limit', 'scale']}
        active={market}
        onChange={setMarket}
      />


      {/* Margin Mode - Leverage - Position Mode */}
      <div className="flex justify-between items-center text-sm font-semibold px-2 py-4 gap-2">


        <MarginMode />
        <ModalModButton onClick={() => setMarginModePanelOpen(true)}>
          {marginMode}
        </ModalModButton>

        <LeveragePanel />
        <ModalModButton onClick={() => setLeveragePanelOpen(true)}>
          {leverage}X
        </ModalModButton>

        <PositionMode />
        <ModalModButton onClick={() => setPositionModePanelOpen(true)}>
          One-way
        </ModalModButton>


      </div>


      {/* Side + Leverage */}
      <div className="px-2 flex gap-4 items-center">
        <SideSelectorButton side={side} setSide={setSide} />
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
              <Space.Compact>
                <Input
                  type="primary"
                  placeholder="0.0"
                  value={price === null || price === undefined ? "" : price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <Button
                  type="submit"
                  className="mid-btn"
                  style={{
                    borderTopLeftRadius: '0px',
                    borderBottomLeftRadius: '0px',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    border: '1px solid #444',
                  }}
                  onClick={async () => {
                    const symbol = selectedPair;
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
                </Button>
              </Space.Compact>

            </div>
          </>
        )}


        {/* Conditionally render the Amount field */}

        {market !== '' && (
          <>
            <label className="pt-2 pl-1 text-white">Size</label>
            <div className="w-full relative flex items-center">
              <Space.Compact className="w-full">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount === null || amount === undefined ? "" : amount}
                  onChange={handleAmountChange}
                />
                <Select
                  value={selectedCurrency}
                  onChange={(val) => setSelectedCurrency(val)}
                  options={[
                    { value: pairDetails.base, label: pairDetails.base },
                    { value: pairDetails.quote, label: pairDetails.quote }
                  ]}
                  style={{
                    minWidth: 90,
                  }}
                  className="currencyselector"
                />
              </Space.Compact>
            </div>

          </>
        )}
      </div>

      {/* --- AmountSlider UI --- */}
      <div className="flex items-center gap-3 my-1 px-4">
        <NativeSlider
          min={0}
          max={100}
          step={1}
          value={sliderValue === null || sliderValue === undefined ? 0 : sliderValue}
          onChange={(_, value) => {
            setSliderValue(value);
            setInputSource('slider');
          }}
          style={{ width: '100%' }}
        />
        <div className="min-w-[60px] flex items-center gap-1 text-right text-sm text-gray-400">
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={sliderValue === null || sliderValue === undefined ? 0 : sliderValue}
            onChange={handleInputChange}
            className="w-12 bg-backgrounddark border border-secondary2 rounded px-1 py-0.5 text-white text-sm text-right"
          />
          <span>%</span>
        </div>
      </div>
      {/* --- End AmountSlider UI --- */}

      {/* Place Order Button */}
      <Button
        type={
          error
            ? 'danger'
            : success
              ? 'success'
              : side === 'buy'
                ? 'primary'
                : 'secondary'
        }
        className={`mt-8 text-lg transition-colors border-2 border-transparent ${blinkClass}`}
        block
        onClick={() => {
          if (!token) {
            setShowLoginPanel(true);
            return;
          }
          placeOrder();
        }}
        disabled={loading}
      >
        {!token
          ? "Connect"
          : loading
            ? "Placing..."
            : side === 'buy'
              ? 'Place buy order'
              : 'Place sell order'}
      </Button>

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
