import { useRef } from "react";
import { useZustandStore } from "../Zustandstore/useStore"; // adjust path if needed

const COLOR_PACKS = [
    { name: "SuperFlow", red: "#F59DEF", green: "#00B7C9" },
    { name: "Classic", red: "#F6465D", green: "#0ECB81" },
    { name: "violet", red: "#b1509aff", green: "#0b9dbaff" },
    { name: "Smooth", red: "#9f7070ff", green: "#74987bff" },
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

    // Handler for chart settings
    const handleChartSettingChange = (key) => {
        setChartSettings({ [key]: !chartSettings[key] });
    };

    return (
        <div className="relative" ref={settingsRef}>
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
                <div className="absolute right-0 mt-2 w-64 bg-backgroundmid border border-[#23272e] rounded shadow-lg z-50 p-4">
                    <div className="font-semibold mb-2 text-liquidwhite">Settings</div>
                    <ul className="space-y-2">
                        {/* Chart settings */}
                        {Object.entries(chartSettings).map(([key, value]) =>
                            key !== "red" && key !== "green" ? (
                                key === 'price_axis_type' ? (
                                    <li key={key} className="flex items-center justify-between">
                                        <span className="text-liquidlightergray text-sm">{key}</span>
                                        <select
                                            className="bg-transparent border border-[#00B7C950] rounded px-2 py-1 text-sm"
                                            value={chartSettings.price_axis_type}
                                            onChange={e => setChartSettings({ price_axis_type: e.target.value })}
                                        >
                                            <option value="normal">normal</option>
                                            <option value="log">log</option>
                                            <option value="percentage">percentage</option>
                                        </select>
                                    </li>
                                ) : (
                                    <li key={key} className="flex items-center justify-between">
                                        <span className="text-liquidlightergray text-sm">{key}</span>
                                        <input
                                            type="checkbox"
                                            checked={!!chartSettings[key]}
                                            onChange={() => handleChartSettingChange(key)}
                                            className="accent-primary2normal"
                                        />
                                    </li>
                                )
                            ) : null
                        )}
                        {/* Color pack picker remains */}
                        <li>
                            <span className="text-liquidlightergray text-sm block mb-1">
                                Color Pack
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PACKS.map((pack) => (
                                    <button
                                        key={pack.name}
                                        type="button"
                                        className={`flex items-center gap-1 px-2 py-1 rounded border ${
                                            red === pack.red && green === pack.green
                                                ? "border-green-500"
                                                : "border-transparent"
                                        } bg-backgroundlight hover:border-green-400`}
                                        onClick={() => handleColorPack(pack)}
                                        title={pack.name}
                                    >
                                        <span
                                            className="w-4 h-4 rounded bg-red"
                                            style={{ backgroundColor: pack.red }}
                                        />
                                        <span
                                            className="w-4 h-4 rounded bg-green"
                                            style={{ backgroundColor: pack.green }}
                                        />
                                        <span className="text-xs text-liquidwhite">
                                            {pack.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SettingsDropdown;