import { useState } from 'react';

export function useOrderPlacer(token) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const placeOrder = async ({
    selectedPair,
    market,
    side,
    amount,
    price,
    priceMidpoint,
    timeInForce = 'GTC',
    onSuccess,
    onError,
    resetAmount,
    resetSlider,
    setBlinkClass,
  }) => {
    if (!selectedPair || !amount) {
      setError('Please fill all fields.');
      setBlinkClass && setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass && setBlinkClass(""), 400);
      return;
    }

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
      timeInForce,
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
          : typeof errorData === 'string' ? errorData : 'Failed to place order';
        throw new Error(errorMessage);
      }

      const data = typeof errorData === 'object' ? errorData : { orderId: 'unknown' };
      setSuccess(`Order placed! Order ID: ${data.orderId}`);
      resetAmount && resetAmount('');
      resetSlider && resetSlider(0);
      setBlinkClass && setBlinkClass("blink-success");
      setTimeout(() => setBlinkClass && setBlinkClass(""), 400);
      onSuccess && onSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to place order');
      setBlinkClass && setBlinkClass("blink-error");
      setTimeout(() => setBlinkClass && setBlinkClass(""), 400);
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  return { placeOrder, loading, error, success, setError, setSuccess };
}