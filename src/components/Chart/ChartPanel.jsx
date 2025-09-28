import React from "react";
import TVChart from './TVChart'; 

export default function ChartPanel() {
  return (
    <div className="w-full h-[583px] bg-backgroundmid border-[1px] border-backgroundlighthover rounded-md flex flex-col">
      <TVChart
        symbol="BTCUSDT"
        theme="dark"
      />
    </div>
  );
}
