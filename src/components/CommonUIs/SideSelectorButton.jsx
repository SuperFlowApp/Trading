const SideSelectorButton = ({ side, setSide }) => (
  <div className="relative flex w-full bg-backgroundlight rounded-lg overflow-hidden" style={{ minHeight: 40 }}>
    {/* Sliding background */}
    <div
      className={`
        absolute top-0 left-0 h-full w-1/2 rounded-md z-0 transition-all duration-300 pointer-events-none
        ${side === 'buy' ? 'bg-primary2 translate-x-0' : 'bg-primary1 translate-x-full'}
      `}
      style={{
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        transform: side === 'buy' ? 'translateX(0)' : 'translateX(100%)',
      }}
    />
    <button
      className={`w-1/2 py-1 rounded-md font-bold z-10 transition-colors duration-200 ${
        side === 'buy' ? 'text-black' : 'text-white hover:bg-primary2deactivehover'
      }`}
      onClick={() => setSide('buy')}
      type="button"
      style={{ position: 'relative' }}
    >
      Buy
    </button>
    <button
      className={`w-1/2 py-1 rounded-md font-bold z-10 transition-colors duration-200 ${
        side === 'sell' ? 'text-black' : 'text-white hover:bg-primary1/30'
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