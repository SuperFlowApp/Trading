import React from "react";

// Dummy data for UI preview
const positions = [
  {
    symbol: "BTCUSDT",
    positionAmt: "1",
    entryPrice: "50000",
    markPrice: "50100",
    liquidationPrice: "45000",
    unrealizedPnl: "100",
    positionSide: "LONG",
    leverage: 10,
  },
  {
    symbol: "ETHUSDT",
    positionAmt: "1",
    entryPrice: "2000",
    markPrice: "2020",
    liquidationPrice: "2200",
    unrealizedPnl: "-50",
    positionSide: "SHORT",
    leverage: 5,
  }
];

const Positions = () => {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 gap-2 text-xs font-semibold text-liquidwhite">
            <div>Pair</div>
            <div>Size</div>
            <div>Open Price</div>
            <div>Market Price</div>
            <div>Liquid. Price</div>
            <div>Unrealized P&amp;L</div>
            <div>TP/SL</div>
            <div>Actions</div>
          </div>
          {positions.map((pos, idx) => (
            <div
              key={pos.symbol + pos.positionSide}
              className={`rounded-md grid grid-cols-8 gap-2 items-center px-3 py-1 mt-2 text-sm ${idx % 2 ? 'bg-liquidwhite/10' : 'bg-liquidwhite/20'}`}
            >
              <div className="font-semibold">
                {pos.symbol} <span className="ml-1 text-xs text-gray-400">{pos.positionSide}</span>
              </div>
              <div>{pos.positionAmt}</div>
              <div>{pos.entryPrice}</div>
              <div>{pos.markPrice}</div>
              <div>{pos.liquidationPrice}</div>
              <div className={Number(pos.unrealizedPnl) >= 0 ? 'text-primary2' : 'text-warningcolor'}>
                {pos.unrealizedPnl}
              </div>
              <div>
                <button className="bg-backgrounddark border border-transparent hover:border-liquidwhite text-liquidwhite hover:text-white px-2 py-1 rounded text-xs mr-1">Set TP</button>
                <button className="bg-backgrounddark border border-transparent hover:border-liquidwhite text-liquidwhite hover:text-white px-2 py-1 rounded text-xs">Set SL</button>
              </div>
              <div className="flex gap-1">
                <button className="border border-primary2 hover:border-liquidwhite text-white px-2 py-1 rounded text-xs">Edit</button>
                <button className="bg-warningcolor border border-transparent hover:border-liquidwhite text-white px-2 py-1 rounded text-xs">Close</button>
              </div>
            </div>
          ))}
          {positions.length === 0 && (
            <div className="text-center py-8 text-gray-400">No open positions.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Positions;