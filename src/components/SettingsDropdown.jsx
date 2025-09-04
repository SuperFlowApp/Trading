import { useZustandStore } from "../Zustandstore/useStore"; // adjust path if needed

const COLOR_PACKS = [
    { name: "SuperFlow", red: "#F59DEF", green: "#00B7C9" },
    { name: "Classic", red: "#F6465D", green: "#0ECB81" },
    { name: "SuperFlow Dark", red: "#b1509aff", green: "#0b9dbaff" },
    { name: "Classic Dark", red: "#9f7070ff", green: "#74987bff" },
];

const SettingsDropdown = ({
    settingsOpen,
    setSettingsOpen,
    settingsRef,
}) => {
    const red = useZustandStore((s) => s.red);
    const green = useZustandStore((s) => s.green);
    const setRed = useZustandStore((s) => s.setRed);
    const setGreen = useZustandStore((s) => s.setGreen);
    const chartSettings = useZustandStore(s => s.chartSettings);
    const setChartSettings = useZustandStore(s => s.setChartSettings);

    // Handler for color pack change
    const handleColorPack = (pack) => {
        setRed(pack.red);
        setGreen(pack.green);
        document.documentElement.style.setProperty("--color-red", pack.red);
        document.documentElement.style.setProperty("--color-green", pack.green);
    };

    // Separate styling and chart settings
    const stylingSettings = (
        <div>
            {/*<div className="border-t border-liquiddarkgray text-body text-liquidwhite pt-2 mb-2 mt-2">Style Settings</div> 
            */}
            {/* Font size selector - replaced dropdown with visual radio buttons */}
            <div className="mb-3">
                <span className="text-liquidlightergray text-body block mb-2 select-none">Font Size</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setChartSettings({ fontSize: 'small' })}
                        className={`flex items-center justify-center py-1 px-3 rounded border transition-colors duration-100 flex-1
                            ${chartSettings.fontSize === 'small'
                                ? "border-primary2normal bg-[#00B7C91a] text-liquidwhite"
                                : "border-[#23272e] text-liquidmidgray hover:border-[#00B7C950]"}`}
                    >
                        <span style={{ fontSize: '12px' }}>Small</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChartSettings({ fontSize: 'medium' })}
                        className={`flex items-center justify-center py-1 px-3 rounded border transition-colors duration-100 flex-1
                            ${chartSettings.fontSize === 'medium'
                                ? "border-primary2normal bg-[#00B7C91a] text-liquidwhite"
                                : "border-[#23272e] text-liquidmidgray hover:border-[#00B7C950]"}`}
                    >
                        <span style={{ fontSize: '14px' }}>Medium</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChartSettings({ fontSize: 'large' })}
                        className={`flex items-center justify-center py-1 px-3 rounded border transition-colors duration-100 flex-1
                            ${chartSettings.fontSize === 'large'
                                ? "border-primary2normal bg-[#00B7C91a] text-liquidwhite"
                                : "border-[#23272e] text-liquidmidgray hover:border-[#00B7C950]"}`}
                    >
                        <span style={{ fontSize: '16px' }}>Large</span>
                    </button>
                </div>
            </div>

            {/* Color pack picker */}
            <div>
                <span className="text-liquidlightergray text-body block mb-1 select-none">
                    Color Pack
                </span>
                <div className="flex flex-col gap-2">
                    {COLOR_PACKS.map((pack) => (
                        <button
                            key={pack.name}
                            type="button"
                            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors duration-100
                                ${red === pack.red && green === pack.green
                                    ? "border-green-500"
                                    : "border-[#23272e]"}
                                bg-backgroundlight hover:border-green-400`}
                            onClick={() => handleColorPack(pack)}
                            title={pack.name}
                        >
                            <span
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: pack.red }}
                            />
                            <span
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: pack.green }}
                            />
                            <span className="text-body text-liquidwhite select-none">
                                {pack.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );

    return (
        <div className="relative text-body" ref={settingsRef}>
            <button
                className={`flex items-center justify-center w-8 h-8 rounded-md active-transition
                             hover:bg-primary2darker ${settingsOpen ? "bg-primary2darker" : ""}
                          `}
                onClick={() => setSettingsOpen((open) => !open)}
                aria-label="Settings"
                type="button"
            >
                <img
                    src="/assets/settings-icon.svg"
                    alt="Settings"
                    className="w-4 h-4"
                />
            </button>

            {settingsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-backgroundmid border border-[#23272e] rounded-xl shadow-2xl z-50 p-5 space-y-5">
                    {stylingSettings}
                </div>
            )}
        </div>
    );
};

export default SettingsDropdown;