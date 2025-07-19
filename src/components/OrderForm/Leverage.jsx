import usePanelStore from '../../Zustandstore/panelStore.js';
import Slider from '@mui/material/Slider';

const MIN_LEVERAGE = 1;
const MAX_LEVERAGE = 20;

export default function LeveragePanel() {
  const leverage = usePanelStore(s => s.leverage);
  const setLeverage = usePanelStore(s => s.setLeverage);
  const isOpen = usePanelStore(s => s.isLeveragePanelOpen);
  const setOpen = usePanelStore(s => s.setLeveragePanelOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-backgrounddark p-6 rounded-lg shadow-lg min-w-[320px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Set Leverage</h2>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Slider
            min={MIN_LEVERAGE}
            max={MAX_LEVERAGE}
            value={leverage}
            onChange={(_, value) => setLeverage(Number(value))}
            valueLabelDisplay="off"
            sx={{
              color: 'var(--color-primary2)',
              height: 8,
              '& .MuiSlider-thumb': {
                height: 20,
                width: 20,
                backgroundColor: 'var(--color-primary2)',
                border: '2px solid var(--color-primary2)',
                boxShadow: '0px 2px 1px -1px rgba(255, 255, 255, 0.0)',
                '&:hover': {
                  boxShadow: '0px 3px 1px -2px rgba(255, 255, 255, 0.0)',
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.3,
                backgroundColor: 'var(--color-primary2)',
                height: 8,
              },
              '& .MuiSlider-track': {
                backgroundColor: 'var(--color-primary2)',
                height: 8,
              },
            }}
          />
          <div className="text-2xl font-bold text-primary2">{leverage}X</div>
          <button
            className="mt-2 px-6 py-2 bg-primary2 text-black rounded font-semibold hover:bg-primary2/80"
            onClick={() => setOpen(false)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}