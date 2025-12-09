import { useEffect, useState } from 'react';
import Cookies from "js-cookie";
import { fetchMarkets } from '../../hooks/useMarketsAPI';

import { useZustandStore } from '../../Zustandstore/useStore.js';
import { selectedPairStore, orderFormStore } from '../../Zustandstore/userOrderStore.js';
import { marketsData } from '../../Zustandstore/marketsDataStore.js';

import LeveragePanel from './marginLeverage/Leverage.jsx';
import MarginMode from './marginLeverage/MarginMode.jsx';
import PositionMode from './marginLeverage/PositionMode';
import Tab from '../CommonUIs/tab';
import NativeSlider from '../CommonUIs/slider';
import OrderButton from './Ui/OrderButton.jsx';
import SideSelectorButton from './Ui/SideSelectorButton.jsx';
import { PriceFieldInput, InputWithDropDown, PercentageInput, MinimalDropDown } from '../CommonUIs/inputs/inputs.jsx';
import DefaultAPILogin from "../Login/defaultAPILogin";
import { API_BASE_URL } from '../../config/api';
import { formatPrice } from '../../utils/priceFormater';

function LimitOrderForm({ onCurrencyChange }) {
  const authKey = Cookies.get("authKey");

  const selectedPairBase = selectedPairStore(s => s.selectedPair);
  const selectedPair = selectedPairBase ? `${selectedPairBase}USDT` : null;
  const pairDetails = { base: selectedPairBase, quote: 'USDT' };

  // Use Zustand for selectedCurrency
  const selectedCurrency = useZustandStore(s => s.selectedCurrency);
  const setSelectedCurrency = useZustandStore(s => s.setSelectedCurrency);

  // Use Zustand for priceMidpoint
  const priceMidpoint = useZustandStore(s => s.priceMidpoint);

  // Move this check AFTER all hooks
  const [price, setPrice] = useState("0");
  const [amount, setAmount] = useState("0");
  const [side, setSide] = useState('buy');
  const [market, setMarket] = useState('limit'); // Default to 'limit', only 'market' and 'limit' allowed
  const [loading, setLoading] = useState(false);

  const [sliderValue, setSliderValue] = useState(0);
  const [blinkClass, setBlinkClass] = useState("");
  const [inputSource, setInputSource] = useState(null);
  const [timeInForce, setTimeInForce] = useState('GTC');

  const OrderBookClickedPrice = useZustandStore(s => s.OrderBookClickedPrice); // <-- Read from Zustand
  const OrderFormState = orderFormStore(s => s.OrderFormState);
  const setOrderFormStore = orderFormStore(s => s.setOrderFormState);
  const setNotional = useZustandStore(s => s.setNotional);
  const currentNotional = useZustandStore(s => s.currentNotional);
  const [accountInfo, setAccountInfo] = useState(() => {
    try {
      return JSON.parse(Cookies.get("accountInfo") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setAccountInfo(JSON.parse(Cookies.get("accountInfo") || "null"));
      } catch {
        setAccountInfo(null);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get available balance directly from account info
  const availableForOrder = accountInfo?.availableForOrder || "0";
  const balanceFree = parseFloat(availableForOrder) || 0;

  // Helper to normalize zero (copy from AccountInfoPanel or import)
  function normalizeZero(val) {
    if (typeof val === "string" && /^0(\.0*)?E-\d+$/.test(val)) return "0";
    return val;
  }

  // Get Unrealized PNL (same logic as AccountInfoPanel)
  const position = accountInfo?.positions?.[0];
  const unrealizedPNL = accountInfo?.upnl != null
    ? normalizeZero(accountInfo.upnl)
    : (position?.upnl != null
      ? normalizeZero(position.upnl)
      : null);

  // Helper to get color class for PNL values
  function getPnlClass(val) {
    const num = Number(val);
    if (isNaN(num)) return "text-liquidGray";
    if (num > 0) return "text-liquidGreen";
    if (num < 0) return "text-liquidRed";
    return "text-liquidGray";
  }

  // Update price when OrderBookClickedPrice changes
  useEffect(() => {
    if (OrderBookClickedPrice) {
      setPrice(OrderBookClickedPrice);
    }
  }, [OrderBookClickedPrice]);

  // Reset price and amount when selectedPair changes (new pair detected/selected)
  useEffect(() => {
    setPrice("0");
    setAmount("0");
  }, [selectedPairBase]);

  // Update notional whenever price, amount, or selectedCurrency changes
  useEffect(() => {
    if (!amount || !price) {
      setNotional(null);
      return;
    }
    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(price);

    if (isNaN(numAmount) || isNaN(numPrice)) {
      setNotional(null);
      return;
    }

    let baseSize;
    if (selectedCurrency === pairDetails.base) {
      baseSize = numAmount;
    } else {
      // If amount is in quote, convert to base
      baseSize = numAmount / numPrice;
    }

    const notional = numPrice * baseSize;
    setNotional(notional);
  }, [amount, price, selectedCurrency, setNotional, pairDetails.base]);

  // --- OrderPlacer logic moved here ---
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  const placeOrder = async () => {
    setOrderLoading(true);
    setOrderError('');
    setOrderSuccess('');

    // Use Zustand store for request body
    const requestBody = { ...OrderFormState };

    try {
      const response = await fetch(`${API_BASE_URL}/api/order`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      let errorData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }

      if (!response.ok) {
        const errorMessage = errorData && typeof errorData === 'object' && errorData.message
          ? errorData.message
          : (typeof errorData === 'string' ? errorData : '');
        throw new Error(errorMessage);
      }

      //  on success
      const data = typeof errorData === 'object' ? errorData : { orderId: 'unknown' };
      setOrderSuccess(`Order placed! Order ID: ${data.orderId}`);
      setAmount("0.0");
      setBlinkClass && setBlinkClass("blink-success");
      setTimeout(() => setBlinkClass && setBlinkClass(""), 400);
    } catch (err) {
      setOrderError(err.message);
      setBlinkClass && setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass && setBlinkClass(""), 400);
    } finally {
      setOrderLoading(false);
    }
  };

  // --- End OrderPlacer logic ---

  // switching tabs:
  const handleTabChange = (tab) => {
    setMarket(tab);
    if (tab === 'market') {
      setPrice('');
    } else if (tab === 'limit') {
      setPrice('0');
    }
  };

  // When orderbook price is clicked, switch to Limit and set price
  useEffect(() => {
    if (OrderBookClickedPrice) {
      setMarket('limit');
      setPrice(OrderBookClickedPrice);
    }
  }, [OrderBookClickedPrice]);


  const handleSliderChange = (_, value) => {
    setSliderValue(value);
    setInputSource('slider');
  };

  // Update on input change
  const handleInputChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    value = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    setSliderValue(value);
    setInputSource('slider');
  };

  // Update on amount (Size) input change
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
    setInputSource('input');
    // Calculate sliderValue from amount
    const numericValue = parseFloat(value);
    const numericBalance = parseFloat(balanceFree);
    if (!isNaN(numericValue) && numericBalance > 0) {
      let percent = (numericValue / numericBalance) * 100;
      percent = Math.max(0, Math.min(100, percent));
      setSliderValue(percent);
    } else {
      setSliderValue(0);
    }
  };

  // Update amount when sliderValue changes
  useEffect(() => {
    if (inputSource === 'slider' && sliderValue >= 0) {
      if (sliderValue === 0) {
        setAmount("0");
        setInputSource(null);
        return;
      }
      const bal = parseFloat(balanceFree);
      if (isNaN(bal)) {
        setAmount("0");
        setInputSource(null);
        return;
      }

      if (selectedCurrency === pairDetails.base) {
        const currentPrice = parseFloat(price) || priceMidpoint;
        if (currentPrice && !isNaN(currentPrice)) {
          const baseEquivalent = bal / currentPrice;
          const calculatedAmount = (sliderValue / 100) * baseEquivalent;
          setAmount(calculatedAmount === 0 ? "0" : calculatedAmount.toFixed(6));
        }
      } else {
        const calculatedAmount = (sliderValue / 100) * bal;
        setAmount(calculatedAmount === 0 ? "0" : calculatedAmount.toFixed(2));
      }
      setInputSource(null);
    }
  }, [sliderValue, balanceFree, selectedCurrency, price, priceMidpoint, inputSource]);

  // Auto-hide error and success messages after 3 seconds
  useEffect(() => {
    if (orderError) {
      const timer = setTimeout(() => setOrderError(''), 3000);
      return () => clearTimeout(timer);
    }
    if (orderSuccess) {
      const timer = setTimeout(() => setOrderSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [orderError, orderSuccess]);

  // Notify parent when currency changes
  useEffect(() => {
    if (onCurrencyChange) {
      onCurrencyChange(selectedCurrency);
    }
  }, [selectedCurrency, onCurrencyChange]);

  // Reset to the quote currency when selectedPair (base in URL) changes
  useEffect(() => {
    setSelectedCurrency(pairDetails.quote);
  }, [pairDetails.base, setSelectedCurrency]);

  // Add this useEffect to handle currency switching and maintain equivalent values
  useEffect(() => {
    if (!amount) return;

    const currentAmount = parseFloat(amount);
    const currentPrice = parseFloat(price) || priceMidpoint;

    if (isNaN(currentAmount) || !currentPrice || isNaN(currentPrice)) return;

    if (currentAmount === 0) {
      setAmount("0");
      return;
    }

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
    let baseQuantity = 0;
    const amt = parseFloat(amount);
    const prc = parseFloat(price) || priceMidpoint;

    if (selectedCurrency === pairDetails.base) {
      baseQuantity = isNaN(amt) ? 0 : amt;
    } else {
      baseQuantity = (isNaN(amt) || !prc || isNaN(prc)) ? 0 : amt / prc;
    }

    // Round to 5 decimals
    baseQuantity = Number(baseQuantity.toFixed(5));

    setOrderFormStore({
      symbol: selectedPair,
      type: market.toUpperCase(),
      side: side.toUpperCase(),
      positionSide: 'BOTH',
      quantity: baseQuantity, // always base, rounded to 5 decimals
      price: market === 'market' ? null : (parseFloat(price) || 0), // <-- updated line
      timeInForce,
      orderRespType: 'ACK',
      params: {},
    });
  }, [selectedPair, market, side, amount, price, timeInForce, setOrderFormStore, selectedCurrency, priceMidpoint]);


  const orderButtonText = !authKey
    ? 'Login'
    : side === 'buy'
      ? 'Place buy order'
      : 'Place sell order';

  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (username, token) => {
    setShowLogin(false);
    // Optionally, you can show a message or trigger a refresh here
  };

  const [priceInvalid, setPriceInvalid] = useState(false);
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [showOrderValueWarning, setShowOrderValueWarning] = useState(false);
  const [showInvalidInputMsg, setShowInvalidInputMsg] = useState(false);

  useEffect(() => {
    if (
      currentNotional !== null &&
      !isNaN(currentNotional) &&
      parseFloat(currentNotional) > parseFloat(balanceFree)
    ) {
      setShowOrderValueWarning(true);
      const timer = setTimeout(() => setShowOrderValueWarning(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowOrderValueWarning(false);
    }
  }, [currentNotional, balanceFree]);

  // --- Use Zustand for markets data ---
  const allMarketData = marketsData(s => s.allMarketData);
  const [selectedMarket, setSelectedMarket] = useState(null);

  useEffect(() => {
    if (!selectedPair) {
      setSelectedMarket(null);
      return;
    }
    const market = allMarketData.find(m => m.symbol === selectedPair);
    setSelectedMarket(market || null);
  }, [selectedPair, allMarketData]);

  // Helper to format fee as percentage string
  function formatFeePercent(fee) {
    if (!fee) return "--";
    return `${(parseFloat(fee) * 100).toFixed(4)}%`;
  }

  // Helper to calculate margin required
  function calcMarginRequired(orderValue, takerFee) {
    if (!orderValue || !takerFee) return "--";
    const margin = parseFloat(orderValue) * parseFloat(takerFee) * 100;
    return `$${margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="px-2 py-1 w-full text-white flex flex-col gap-3 flex flex-col border-[1px] border-borderscolor bg-boxbackground rounded-md min-w-0 overflow-hidden">

      {/* Head Tabs */}
      <Tab
        tabs={['market', 'limit']}
        active={market}
        onChange={handleTabChange} // <-- use new handler
      />


      {/* Margin Mode - Leverage - Position Mode */}
      <div className="flex justify-between items-center text-body gap-2 my-1">
        <MarginMode />
        <LeveragePanel />
        <PositionMode />
      </div>


      {/* Side + Leverage */}
      <div className="flex gap-4 items-center">
        <SideSelectorButton side={side} setSide={setSide} />
      </div>

      {/* Balance Row - show available balance directly */}
      <div>
        <div className="text-body">
          <span className="flex w-full justify-between text-color_lighter_gray">
            Available for order: <span className="text-white">
              {formatPrice(availableForOrder)} USDT
            </span>
          </span>
        </div>
        <span className="text-body text-color_lighter_gray w-full flex justify-between">
          Unrealized PNL
          <span className={`font-semibold ${getPnlClass(unrealizedPNL)}`}>
            {unrealizedPNL !== null && unrealizedPNL !== undefined
              ? `${Number(unrealizedPNL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "--"}
          </span>
        </span>
      </div>

      {/* Conditionally render the Price field */}
      <div className=" flex flex-col text-body gap-2">
        {market !== 'market' && (
          // For price input
          <PriceFieldInput
            value={price === null || price === undefined ? "" : price}
            onChange={e => {
              let val = e.target.value.replace(/[^0-9.]/g, '');
              if (val.length > 1 && val[0] === "0" && !val.startsWith("0.")) {
                val = val.replace(/^0+/, '');
              }
              setPrice(val === "" ? "0" : val);
              setPriceInvalid(false); // Reset invalid state on change
            }}
            label="Price (USD)"
            buttonLabel="Mid"
            onButtonClick={() => {
              if (priceMidpoint) {
                setPrice(priceMidpoint);
                setPriceInvalid(false); // Reset invalid state on button click
              }
            }}
            invalid={priceInvalid}
          />
        )}


        {market !== '' && (
          // For amount (size) input
          <InputWithDropDown
            value={amount === null || amount === undefined ? "" : amount}
            onChange={e => {
              let val = e.target.value.replace(/[^0-9.]/g, '');
              if (val.length > 1 && val[0] === "0" && !val.startsWith("0.")) {
                val = val.replace(/^0+/, '');
              }
              setAmount(val === "" ? "0" : val);
              setInputSource('input');
              setAmountInvalid(false); // Reset invalid state on change
              const numericValue = parseFloat(val === "" ? "0" : val);
              const numericBalance = parseFloat(balanceFree);
              if (!isNaN(numericValue) && numericBalance > 0) {
                let percent = (numericValue / numericBalance) * 100;
                percent = Math.max(0, Math.min(100, percent));
                setSliderValue(percent);
              } else {
                setSliderValue(0);
              }
            }}
            label="Size"
            options={[
              { value: pairDetails.quote, label: pairDetails.quote },
              { value: pairDetails.base, label: pairDetails.base }
            ]}
            selectedOption={selectedCurrency || ""}
            onOptionChange={setSelectedCurrency}
            invalid={amountInvalid}
          />
        )}
      </div>

      {/* --- AmountSlider UI --- */}
      <div className="flex items-center gap-2 my-1 ">



        <NativeSlider
          min={0}
          max={100}
          step={1}
          value={sliderValue === null || sliderValue === undefined ? 0 : sliderValue}
          onChange={handleSliderChange}
          style={{ width: '100%' }}
          filledColor={'var(--color-primary2deactive)'}
          unfilledColor={'var(--color-backgroundlight)'}
        />



        <div className="min-w-[60px] flex items-center gap-1 text-right text-body text-gray-400">
          <PercentageInput
            value={sliderValue === null || sliderValue === undefined ? 0 : sliderValue}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className='text-body w-full flex flex-row items-center justify-end gap-4'>
        <span>TIF</span>
        <div className='border border-liquiddarkgray'>

          <MinimalDropDown
            options={[
              { value: "GTC", label: "GTC" },
              { value: "IOC", label: "IOC" },
              { value: "FOK", label: "FOK" }
            ]}
            selectedOption={timeInForce}
            onOptionChange={setTimeInForce}
          />      </div>
      </div>

      {/* Place Order Button */}
      <OrderButton
        type={
          !authKey
            ? 'orderdisconnect'
            : side === 'buy'
              ? 'primary'
              : 'secondary'
        }
        className={` mt-2  transition-colors border-2 border-transparent ${blinkClass}`}
        block
        onClick={() => {
          // Validation: prevent order if price or amount is 0 or 0.0
          let invalid = false;
          if (market !== 'market' && (price === "0" || price === "0.0" || price === "")) {
            setPriceInvalid(true);
            invalid = true;
          } else {
            setPriceInvalid(false);
          }
          if (amount === "0" || amount === "0.0" || amount === "") {
            setAmountInvalid(true);
            invalid = true;
          } else {
            setAmountInvalid(false);
          }
          if (invalid) {
            setShowInvalidInputMsg(true);
            setTimeout(() => setShowInvalidInputMsg(false), 3000);
            return;
          }

          if (!authKey) {
            setShowLogin(true);
            return;
          }
          placeOrder();
        }}
        disabled={loading || orderLoading}
        loading={orderLoading}
      >
        {orderButtonText}
      </OrderButton>

      {/* Login Popup Modal */}
      {showLogin && (
        <DefaultAPILogin
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <div className='min-h-8' >
        {orderError && <div className="text-red-400 text-body">{orderError}</div>}
        {orderSuccess && <div className="text-green-400 text-body">{orderSuccess}</div>}
        {showInvalidInputMsg && (
          <div className="text-warning text-body">
            invalid input
          </div>
        )}
        {showOrderValueWarning && (
          <div className="text-warning text-body">
            order value exceeds your balance
          </div>
        )}
      </div>

      {/* Order Information */}
      <div>
        <div className="pt-2 border-t border-liquiddarkgray text-body text-color_lighter_gray flex flex-col">
          <span className="w-full flex justify-between">
            Order Value
            <span
              className={
                currentNotional !== null &&
                  !isNaN(currentNotional) &&
                  parseFloat(currentNotional) > parseFloat(balanceFree)
                  ? "text-warning"
                  : "text-liquidwhite"
              }
            >
              {currentNotional !== null && !isNaN(currentNotional)
                ? `$${currentNotional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "--"}
            </span>
          </span>

          <span className="w-full flex justify-between">
            Margin Required
            <span className="text-liquidwhite">
              {selectedMarket && currentNotional
                ? calcMarginRequired(currentNotional, selectedMarket.takerFee)
                : "--"}
            </span>
          </span>

          <span className="w-full flex justify-between">
            Fees
            <span className="text-liquidwhite">
              {selectedMarket
                ? `${formatFeePercent(selectedMarket.takerFee)} / ${formatFeePercent(selectedMarket.makerFee)}`
                : "--"}
            </span>
          </span>
        </div>
      </div>

    </div>
  );
}

export default LimitOrderForm;