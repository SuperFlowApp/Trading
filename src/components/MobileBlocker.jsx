import React from 'react';

const MobileBlocker = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h1 className="text-2xl font-bold mb-4">Mobile Access Unavailable</h1>
      <p className="mb-4">Our trading platform is currently optimized for larger screens only.</p>
      <p className="mb-2">Please access our platform from a desktop or tablet device.</p>
      <p className="text-sm text-gray-400 mt-6">We're working on mobile support and will make it available soon.</p>
    </div>
  );
};

export default MobileBlocker;