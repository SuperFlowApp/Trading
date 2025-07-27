import { useState, useEffect } from 'react';
import { Input, Select, Space, Button } from 'antd';

import { useZustandStore } from '../../Zustandstore/panelStore.js';
import userInputStore from '../../Zustandstore/userInputStore.js';

import LeveragePanel from './Leverage';
import MarginMode from './MarginMode';
import PositionMode from './PositionMode';
import Tab from '../CommonUIs/tab';
import ModalModButton from '../CommonUIs/modalmodbutton';
import NativeSlider from '../CommonUIs/slider';
import OrderButton from './OrderButton';
import SideSelectorButton from './SideSelectorButton';
import TifSelector from './TifSelector';
import BalanceFetch from './BalanceFetch';
import { InputWithButton, InputWithDropDown } from '../CommonUIs/inputs/inputs.jsx';

function LimitOrderForm({ onCurrencyChange }) {
  // Move this to the top, before any use of balanceFree!
  const [balanceFree, setBalanceFree] = useState("--");

  const selectedPairBase = userInputStore(s => s.selectedPair);
  const selectedPair = selectedPairBase ? `${selectedPairBase}USDT` : null;
  const pairDetails = { base: selectedPairBase, quote: 'USDT' };
  const leverage = useZustandStore(s => s.leverage);
  const setLeveragePanelOpen = useZustandStore(s => s.setLeveragePanelOpen);
  const setPositionModePanelOpen = useZustandStore(s => s.setPositionModePanelOpen);

  // Use Zustand for selectedCurrency
  const selectedCurrency = useZustandStore(s => s.selectedCurrency);
  const setSelectedCurrency = useZustandStore(s => s.setSelectedCurrency);

  // Use Zustand for priceMidpoint
  const priceMidpoint = useZustandStore(s => s.priceMidpoint);

  // Move this check AFTER all hooks
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
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderHovered, setIsSliderHovered] = useState(false); // <-- Add this
  const [timeInForce, setTimeInForce] = useState('GTC');

  const marginMode = useZustandStore(s => s.marginMode);
  const setMarginModePanelOpen = useZustandStore(s => s.setMarginModePanelOpen);
  const OrderBookClickedPrice = useZustandStore(s => s.OrderBookClickedPrice); // <-- Read from Zustand
  const setShowLoginPanel = useZustandStore(s => s.setShowLoginPanel); // ADD THIS
  const setOrderFormState = userInputStore(s => s.setOrderFormState);

  // Update price when OrderBookClickedPrice changes
  useEffect(() => {
    if (OrderBookClickedPrice) {
      setPrice(OrderBookClickedPrice);
    }
  }, [OrderBookClickedPrice]);


  const placeOrder = async () => {

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

  // Update order form state on relevant changes
  useEffect(() => {
    setOrderFormState({
      symbol: selectedPair,
      type: market.toUpperCase(),
      side: side.toUpperCase(),
      positionSide: 'BOTH',
      quantity: parseFloat(amount) || 0,
      price: parseFloat(price) || 0,
      timeInForce,
      orderRespType: 'ACK',
      params: {},
    });
  }, [selectedPair, market, side, amount, price, timeInForce, setOrderFormState]);

  return (
    <div className="p-2 w-full text-white flex flex-col gap-3 flex flex-col bg-backgroundmid rounded-md min-w-0 overflow-hidden">

      {/* Head Tabs */}
      <Tab
        tabs={['market', 'limit', 'scale']}
        active={market}
        onChange={setMarket}
      />


      {/* Margin Mode - Leverage - Position Mode */}
      <div className="flex justify-between items-center text-sm font-semibold py-2 gap-2">


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
      <div className="flex gap-4 items-center">
        <SideSelectorButton side={side} setSide={setSide} />
      </div>
      {/* Balance Row - replaced with BalanceFetch */}
      <div className="font-semibold text-[12px]">
        <BalanceFetch onBalance={setBalanceFree} />
      </div>

      {/* Conditionally render the Price field */}
      <div className=" flex flex-col text-sm pt-8 gap-4">
        {market !== 'market' && (
          <InputWithButton
            value={price === null || price === undefined ? "" : price}
            onChange={e => setPrice(e.target.value)}
            label="Price"
            buttonLabel="Mid"
            onButtonClick={async () => {
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
          />
        )}


        {/* Conditionally render the Amount field */}

        {market !== '' && (
          <InputWithDropDown
            value={amount === null || amount === undefined ? "" : amount}
            onChange={handleAmountChange}
            label="Size"
            options={[
              { value: pairDetails.base, label: pairDetails.base },
              { value: pairDetails.quote, label: pairDetails.quote }
            ]}
            selectedOption={selectedCurrency || ""}
            onOptionChange={setSelectedCurrency}
          />
        )}
      </div>

      {/* --- AmountSlider UI --- */}
      <div className="flex items-center gap-3 my-1 ">



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
          filledColor={
            isDragging
              ? 'var(--color-primary2deactiveactive)' // color while dragging
              : isSliderHovered
                ? 'var(--color-primary2deactiveactive)' // color on hover
                : 'var(--color-primary2deactive)' // normal color
          }
          unfilledColor={
            isSliderHovered
              ? 'var(--color-backgroundlighthover)' // hover color for unfilled
              : 'var(--color-backgroundlight)' // normal color
          }
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => { setIsDragging(false); setIsSliderHovered(false); }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseEnter={() => setIsSliderHovered(true)} // <-- Add this
          onMouseOut={() => setIsSliderHovered(false)} // <-- Add this
        />



        <div className="min-w-[60px] flex items-center gap-1 text-right text-sm text-gray-400">
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={sliderValue === null || sliderValue === undefined ? 0 : sliderValue}
            onChange={handleInputChange}
            className="h-[28px]"
          />
          <span>%</span>
        </div>
      </div>



      <div className='w-full flex flex-row items-center justify-end gap-4'>
        <span>TIF</span>
        <TifSelector value={timeInForce} onChange={setTimeInForce} />
      </div>


      {/* Place Order Button */}
      <OrderButton
        type={
          error
            ? 'danger'
            : success
              ? 'success'
              : side === 'buy'
                ? 'primary'
                : 'secondary'
        }
        className={` mt-8 text-lg transition-colors border-2 border-transparent ${blinkClass}`}
        block
        onClick={() => {
          placeOrder();
        }}
        disabled={loading}
      >
        {/*!token
          ? "Connect"
          : loading
            ? "Placing..."
            : side === 'buy'
              ? 'Place buy order'
              : 'Place sell order'*/}
        {'place order'}
      </OrderButton>

      <div className='px-4' style={{ minHeight: '16px' }}>
        {error && <div className="text-red-400 text-xs">{error}</div>}
        {success && <div className="text-green-400 text-xs">{success}</div>}
      </div>

      {/* Order Information */}
      <div className="px-2 mt-4">
        <div className="border-t border-liquidwhite py-3 text-xs flex flex-col gap-2">
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
