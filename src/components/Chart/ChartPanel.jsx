import React from "react";
import TVChart from './TVChart'; 
import { selectedPairStore } from '../../Zustandstore/userOrderStore'; 

export default function ChartPanel() {
  // Use the Zustand store instead of the non-existent context
  const selectedPair = selectedPairStore(state => state.selectedPair);

  return (
    <div className="w-full h-[583px] bg-boxbackground border-[1px] border-borderscolor rounded-md flex flex-col">
      <TVChart
        symbol={`${selectedPair}USDT`}
        theme="dark"
      />
    </div>
  );
}
