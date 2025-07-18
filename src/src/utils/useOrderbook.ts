import { useState, useEffect } from 'react';
import { groupByTicketSize } from "../helpers";
import { ORDERBOOK_LEVELS } from "../constants";

export interface OrderbookState {
  market: string;
  rawBids: number[][];
  bids: number[][];
  maxTotalBids: number;
  rawAsks: number[][];
  asks: number[][];
  maxTotalAsks: number;
  groupingSize: number;
}

// Helper functions
const removePriceLevel = (price: number, levels: number[][]): number[][] => 
  levels.filter(level => level[0] !== price);

const updatePriceLevel = (updatedLevel: number[], levels: number[][]): number[][] => {
  return levels.map(level => {
    if (level[0] === updatedLevel[0]) {
      level = updatedLevel;
    }
    return level;
  });
};

const levelExists = (deltaLevelPrice: number, currentLevels: number[][]): boolean => 
  currentLevels.some(level => level[0] === deltaLevelPrice);

const addPriceLevel = (deltaLevel: number[], levels: number[][]): number[][] => {
  return [ ...levels, deltaLevel ];
};

/**
 *  If the size returned by a delta is 0 then
 that price level should be removed from the orderbook,
 otherwise you can safely overwrite the state of that
 price level with new data returned by that delta.

 - The orders returned by the feed are in the format
 of [price, size][].
 */
const applyDeltas = (currentLevels: number[][], orders: number[][]): number[][] => {
  let updatedLevels: number[][] = currentLevels;

  orders.forEach((deltaLevel) => {
    const deltaLevelPrice = deltaLevel[0];
    const deltaLevelSize = deltaLevel[1];

    // If new size is zero - delete the price level
    if (deltaLevelSize === 0 && updatedLevels.length > ORDERBOOK_LEVELS) {
      updatedLevels = removePriceLevel(deltaLevelPrice, updatedLevels);
    } else {
      // If the price level exists and the size is not zero, update it
      if (levelExists(deltaLevelPrice, currentLevels)) {
        updatedLevels = updatePriceLevel(deltaLevel, updatedLevels);
      } else {
        // If the price level doesn't exist in the orderbook and there are less than 25 levels, add it
        if (updatedLevels.length < ORDERBOOK_LEVELS) {
          updatedLevels = addPriceLevel(deltaLevel, updatedLevels);
        }
      }
    }
  });

  return updatedLevels;
}

const addTotalSums = (orders: number[][]): number[][] => {
  const totalSums: number[] = [];

  return orders.map((order: number[], idx) => {
    const size: number = order[1];
    if (typeof order[2] !== 'undefined') {
      return order;
    } else {
      const updatedLevel = [ ...order ];
      const totalSum: number = idx === 0 ? size : size + totalSums[idx - 1];
      updatedLevel[2] = totalSum;
      totalSums.push(totalSum);
      return updatedLevel;
    }
  });
};

const addDepths = (orders: number[][], maxTotal: number): number[][] => {
  return orders.map(order => {
    if (typeof order[3] !== 'undefined') {
      return order;
    } else {
      const calculatedTotal: number = order[2];
      const depth = (calculatedTotal / maxTotal) * 100;
      const updatedOrder = [ ...order ];
      updatedOrder[3] = depth;
      return updatedOrder;
    }
  });
};

const getMaxTotalSum = (orders: number[][]): number => {
  const totalSums: number[] = orders.map(order => order[2]);
  return Math.max.apply(Math, totalSums);
}

// Custom hook
export function useOrderbook(initialMarket: string = 'PI_XBTUSD', initialGroupingSize: number = 0.5) {
  const [state, setState] = useState<OrderbookState>({
    market: initialMarket,
    rawBids: [],
    bids: [],
    maxTotalBids: 0,
    rawAsks: [],
    asks: [],
    maxTotalAsks: 0,
    groupingSize: initialGroupingSize
  });

  const addBids = (payload: number[][]) => {
    setState(prevState => {
      const currentTicketSize: number = prevState.groupingSize;
      const groupedCurrentBids: number[][] = groupByTicketSize(payload, currentTicketSize);
      const updatedBids: number[][] = addTotalSums(
        applyDeltas(
          groupByTicketSize(prevState.rawBids, currentTicketSize),
          groupedCurrentBids
        )
      );

      const maxTotalBids = getMaxTotalSum(updatedBids);
      const bids = addDepths(updatedBids, maxTotalBids);

      return {
        ...prevState,
        maxTotalBids,
        bids,
        rawBids: [...prevState.rawBids, ...payload]
      };
    });
  };

  const addAsks = (payload: number[][]) => {
    setState(prevState => {
      const currentTicketSize: number = prevState.groupingSize;
      const groupedCurrentAsks: number[][] = groupByTicketSize(payload, currentTicketSize);
      const updatedAsks: number[][] = addTotalSums(
        applyDeltas(
          groupByTicketSize(prevState.rawAsks, currentTicketSize),
          groupedCurrentAsks
        )
      );

      const maxTotalAsks = getMaxTotalSum(updatedAsks);
      const asks = addDepths(updatedAsks, maxTotalAsks);

      return {
        ...prevState,
        maxTotalAsks,
        asks,
        rawAsks: [...prevState.rawAsks, ...payload]
      };
    });
  };

  const addExistingState = (payload: any) => {
    setState(prevState => {
      const rawBids: number[][] = payload.bids;
      const rawAsks: number[][] = payload.asks;
      const bids: number[][] = addTotalSums(groupByTicketSize(rawBids, prevState.groupingSize));
      const asks: number[][] = addTotalSums(groupByTicketSize(rawAsks, prevState.groupingSize));

      const maxTotalBids = getMaxTotalSum(bids);
      const maxTotalAsks = getMaxTotalSum(asks);

      return {
        ...prevState,
        market: payload['product_id'],
        rawBids,
        rawAsks,
        maxTotalBids,
        maxTotalAsks,
        bids: addDepths(bids, maxTotalBids),
        asks: addDepths(asks, maxTotalAsks)
      };
    });
  };

  const setGrouping = (size: number) => {
    setState(prevState => ({
      ...prevState,
      groupingSize: size
    }));
  };

  const clearOrdersState = () => {
    setState(prevState => ({
      ...prevState,
      bids: [],
      asks: [],
      rawBids: [],
      rawAsks: [],
      maxTotalBids: 0,
      maxTotalAsks: 0
    }));
  };

  return {
    state,
    addBids,
    addAsks,
    addExistingState,
    setGrouping,
    clearOrdersState
  };
}