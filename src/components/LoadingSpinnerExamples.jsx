// LoadingSpinner Usage Examples
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

// Example usage in different scenarios:

// 1. Basic usage
const BasicExample = () => (
  <LoadingSpinner />
);

// 2. Chart loading (like in CandleChart)
const ChartLoadingExample = () => (
  <LoadingSpinner 
    size="medium"
    message="Loading chart data..."
    height="450px"
    variant="chart"
  />
);

// 3. Modal loading
const ModalLoadingExample = () => (
  <div className="loading-spinner-modal">
    <LoadingSpinner 
      size="large"
      message="Processing your request..."
      variant="modal"
    />
  </div>
);

// 4. Small inline loading
const InlineLoadingExample = () => (
  <LoadingSpinner 
    size="small"
    message="Loading..."
    showMessage={false}
  />
);

// 5. Full page loading
const FullPageLoadingExample = () => (
  <LoadingSpinner 
    size="large"
    message="Initializing application..."
    height="100vh"
    variant="default"
  />
);

// 6. Custom message and no spinner visibility
const CustomMessageExample = () => (
  <LoadingSpinner 
    size="medium"
    message="Fetching market data from Binance..."
    height="300px"
    variant="chart"
  />
);

export {
  BasicExample,
  ChartLoadingExample,
  ModalLoadingExample,
  InlineLoadingExample,
  FullPageLoadingExample,
  CustomMessageExample
};
