import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  height = 'auto',
  showMessage = true,
  variant = 'default'
}) => {
  const sizes = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  const variants = {
    default: {
      primary: '#2D9DA8',
      secondary: '#565A93',
      text: '#8AABB2'
    },
    modal: {
      primary: '#2D9DA8',
      secondary: '#565A93',
      text: '#8AABB2'
    },
    chart: {
      primary: '#2D9DA8',
      secondary: '#565A93',
      text: '#8AABB2'
    }
  };

  const currentVariant = variants[variant] || variants.default;
  const spinnerSize = sizes[size] || sizes.medium;

  const containerStyle = {
    height: height === 'auto' ? 'auto' : height,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  };

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: `3px solid ${currentVariant.secondary}`,
    borderTop: `3px solid ${currentVariant.primary}`,
    borderRadius: '50%',
    animation: 'loading-spin 1s linear infinite',
  };

  const messageStyle = {
    color: currentVariant.text,
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    fontWeight: '500',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle} className="loading-spinner-container">
      <div style={contentStyle}>
        <div style={spinnerStyle} className="loading-spinner" />
        {showMessage && (
          <span style={messageStyle} className="loading-message">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
