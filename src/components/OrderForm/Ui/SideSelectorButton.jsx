const SideSelectorButton = ({ side, setSide }) => (
  <div className="relative flex w-full bg-backgroundlight rounded-md overflow-hidden" style={{ minHeight: 30 }}>
    {/* Sliding background */}
    <div
      className={`
        absolute top-0 left-0 h-full w-1/2 rounded-md z-0 transition-all duration-300 pointer-events-none
        ${side === 'buy' ? 'bg-green translate-x-0' : 'bg-red translate-x-full'}
      `}
      style={{
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        transform: side === 'buy' ? 'translateX(0)' : 'translateX(100%)',
      }}
    />
    <button
      className={`w-1/2  rounded-md font-title z-10 transition-colors duration-200 ${
        side === 'buy' ? 'text-black' : 'text-white hover:bg-green'
      }`}
      onClick={() => setSide('buy')}
      type="button"
      style={{ position: 'relative' }}
    >
      Buy
    </button>
    <button
      className={`w-1/2  rounded-md font-title z-10 transition-colors duration-200 ${
        side === 'sell' ? 'text-black' : 'text-white hover:bg-red/30'
      }`}
      onClick={() => setSide('sell')}
      type="button"
      style={{ position: 'relative' }}
    >
      Sell
    </button>
  </div>
);

export default SideSelectorButton;