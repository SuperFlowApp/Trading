import { useRef } from "react";

const SettingsDropdown = ({
    settingsOpen,
    setSettingsOpen,
    settings,
    setSettings,
    handleSettingChange,
    settingsRef,
}) => {
    // Handler for color change
    const handleColorChange = (colorKey, value) => {
        setSettings((prev) => ({
            ...prev,
            [colorKey]: value,
        }));
        // Update CSS variable on :root
        document.documentElement.style.setProperty(
            colorKey === "red" ? "--color-red" : "--color-green",
            value
        );
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
                        {Object.entries(settings).map(([key, value]) =>
                            key !== "red" && key !== "green" ? (
                                <li
                                    key={key}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-liquidlightergray text-sm">
                                        {key}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => handleSettingChange(key)}
                                        className="accent-primary2normal"
                                    />
                                </li>
                            ) : null
                        )}
                        <li className="flex items-center justify-between">
                            <span className="text-liquidlightergray text-sm">
                                Red Color
                            </span>
                            <input
                                type="color"
                                value={settings.red || "#f54040"}
                                onChange={(e) =>
                                    handleColorChange("red", e.target.value)
                                }
                                className="w-8 h-8 border-none bg-transparent"
                            />
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="text-liquidlightergray text-sm">
                                Green Color
                            </span>
                            <input
                                type="color"
                                value={settings.green || "#09a22b"}
                                onChange={(e) =>
                                    handleColorChange("green", e.target.value)
                                }
                                className="w-8 h-8 border-none bg-transparent"
                            />
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SettingsDropdown;