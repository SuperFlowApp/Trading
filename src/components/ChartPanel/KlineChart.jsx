import { useEffect, useRef } from 'react';

const KlineChartProPanel = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chartInstance;
    let isMounted = true;

    import('https://cdn.skypack.dev/@klinecharts/pro').then(kline => {
      if (!isMounted) return;
      chartInstance = new kline.KLineChartPro({
        container: chartRef.current,
        locale: 'en-US',
        symbol: {
          exchange: 'XNYS',
          market: 'stocks',
          name: 'Alibaba Group Holding Limited American Depositary Shares, each represents eight Ordinary Shares',
          shortName: 'BABA',
          ticker: 'BABA',
          priceCurrency: 'usd',
          type: 'ADRC',
        },
        period: { multiplier: 15, timespan: 'minute', text: '15m' },
        datafeed: new kline.DefaultDatafeed('IR3qS2VjZ7kIDgnlqKxSmCRHqyBaMh9q'),
        styles: {
          grid: {
            show: true,
            horizontal: {
              show: true,
              size: 1,
              color: '#555', // Set your grid color here
              style: 'dashed',
              dashedValue: [2, 2],
            },
            vertical: {
              show: true,
              size: 1,
              color: '#555', // Set your grid color here
              style: 'dashed',
              dashedValue: [2, 2],
            },
          },
        },
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '500px', background: 'transparent' }}
    />
  );
};

export default KlineChartProPanel;