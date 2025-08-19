export const MAIN_INDICATORS = [
  { key: 'MAIN_MA', label: 'MA (Moving Average)', code: 'MA' },
  { key: 'MAIN_EMA', label: 'EMA (Exponential Moving Average)', code: 'EMA' },
  { key: 'MAIN_SMA', label: 'SMA', code: 'SMA' },
  { key: 'MAIN_BOLL', label: 'BOLL (Bollinger Bands)', code: 'BOLL' },
  { key: 'MAIN_SAR', label: 'SAR (Stop and Reverse)', code: 'SAR' },
  { key: 'MAIN_BBI', label: 'BBI (Bull And Bear Index)', code: 'BBI' },
];

export const SUB_INDICATORS = [
  { key: 'SUB_MA', label: 'MA (Moving Average)', code: 'MA' },
  { key: 'SUB_EMA', label: 'EMA (Exponential Moving Average)', code: 'EMA' },
  { key: 'SUB_VOL', label: 'VOL (Volume)', code: 'VOL' },
  { key: 'SUB_MACD', label: 'MACD', code: 'MACD' },
  { key: 'SUB_BOLL', label: 'BOLL (Bollinger Bands)', code: 'BOLL' },
  { key: 'SUB_KDJ', label: 'KDJ', code: 'KDJ' },
  { key: 'SUB_RSI', label: 'RSI', code: 'RSI' },
  { key: 'SUB_BIAS', label: 'BIAS', code: 'BIAS' },
  { key: 'SUB_BRAR', label: 'BRAR', code: 'BRAR' },
  { key: 'SUB_CCI', label: 'CCI', code: 'CCI' },
  { key: 'SUB_DMI', label: 'DMI', code: 'DMI' },
  { key: 'SUB_CR', label: 'CR', code: 'CR' },
  { key: 'SUB_PSY', label: 'PSY', code: 'PSY' },
  { key: 'SUB_DMA', label: 'DMA', code: 'DMA' },
  { key: 'SUB_TRIX', label: 'TRIX', code: 'TRIX' },
  { key: 'SUB_OBV', label: 'OBV', code: 'OBV' },
  { key: 'SUB_VR', label: 'VR', code: 'VR' },
  { key: 'SUB_WR', label: 'WR', code: 'WR' },
  { key: 'SUB_MTM', label: 'MTM', code: 'MTM' },
  { key: 'SUB_EMV', label: 'EMV', code: 'EMV' },
  { key: 'SUB_SAR', label: 'SAR (Stop and Reverse)', code: 'SAR' },
  { key: 'SUB_SMA', label: 'SMA', code: 'SMA' },
  { key: 'SUB_ROC', label: 'ROC', code: 'ROC' },
  { key: 'SUB_PVT', label: 'PVT', code: 'PVT' },
  { key: 'SUB_BBI', label: 'BBI', code: 'BBI' },
  { key: 'SUB_AO', label: 'AO', code: 'AO' },
];

import React, { useEffect, useRef } from 'react';

export default function IndicatorSettings({ open, onClose, toggles, onToggle, dropdown }) {
  const modalRef = useRef(null);
  const posRef = useRef({ x: 80, y: 80 });
  const draggingRef = useRef(false);
  const startRef = useRef({ mx: 0, my: 0, x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const nx = startRef.current.x + (e.clientX - startRef.current.mx);
      const ny = startRef.current.y + (e.clientY - startRef.current.my);
      posRef.current = { x: nx, y: ny };
      if (modalRef.current) {
        modalRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
      }
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    // reset translation when opened (keeps previous pos otherwise)
    if (open && modalRef.current) {
      modalRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  }, [open]);

  if (!open) return null;
  if (dropdown) {
    return (
      <div className="w-[320px] max-w-[95vw] bg-backgroundmid rounded shadow-lg p-4 border border-[#00B7C950]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Indicators</div>
          <button className="px-2 py-1 text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-semibold">Main Indicators</div>
          <div className="flex flex-wrap gap-2">
            {MAIN_INDICATORS.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!toggles[key]}
                  onChange={onToggle(key)}
                  className="accent-[#00B7C9]"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 mb-2 font-semibold">Sub Indicators</div>
          <div className="flex flex-wrap gap-2">
            {SUB_INDICATORS.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!toggles[key]}
                  onChange={onToggle(key)}
                  className="accent-[#00B7C9]"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // fallback to modal if not dropdown
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={(e) => {
          // click on backdrop closes
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="absolute w-[520px] max-w-[95%] bg-backgroundmid rounded shadow-lg p-4"
        style={{ top: 0, left: 0, transform: `translate(${posRef.current.x}px, ${posRef.current.y}px)` }}
      >
        <div
          className="flex items-center justify-between cursor-move select-none"
          onMouseDown={(e) => {
            draggingRef.current = true;
            startRef.current = { mx: e.clientX, my: e.clientY, x: posRef.current.x, y: posRef.current.y };
          }}
        >
          <div className="font-semibold">Indicators</div>
          <button className="px-2 py-1 text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="mt-3 text-sm">
          <div className="mb-2 font-semibold">Main Indicators</div>
          <div className="flex flex-wrap gap-2">
            {MAIN_INDICATORS.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!toggles[key]}
                  onChange={onToggle(key)}
                  className="accent-[#00B7C9]"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 mb-2 font-semibold">Sub Indicators</div>
          <div className="flex flex-wrap gap-2">
            {SUB_INDICATORS.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!toggles[key]}
                  onChange={onToggle(key)}
                  className="accent-[#00B7C9]"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}