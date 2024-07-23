// components/SettingsView.tsx

import React, { useState, useEffect } from 'react';

export interface ExtensionConfig {
    gptApiKey?: string;
    geminiApiKey?: string;
    claudeApiKey?: string;
    preferredModelFamily?: string;
    defaultTier?: string;
}

interface SettingsViewProps {
    config: ExtensionConfig;
    updateConfig: (newConfig: ExtensionConfig) => void;
    backToMain: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, updateConfig, backToMain }) => {
    const [localConfig, setLocalConfig] = useState<ExtensionConfig>(config);

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveConfig = () => {
        updateConfig(localConfig);
        backToMain();
    };

    return (
        <div className="settings-view">
            <h2>Settings</h2>
            <div className="form-group">
                <label htmlFor="gptApiKey">GPT API Key:</label>
                <input
                    type="password"
                    id="gptApiKey"
                    name="gptApiKey"
                    value={localConfig.gptApiKey}
                    onChange={handleInputChange}
                    className="input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="geminiApiKey">Gemini API Key:</label>
                <input
                    type="password"
                    id="geminiApiKey"
                    name="geminiApiKey"
                    value={localConfig.geminiApiKey}
                    onChange={handleInputChange}
                    className="input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="claudeApiKey">Claude API Key:</label>
                <input
                    type="password"
                    id="claudeApiKey"
                    name="claudeApiKey"
                    value={localConfig.claudeApiKey}
                    onChange={handleInputChange}
                    className="input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="preferredModelFamily">Preferred Model:</label>
                <select
                    id="preferredModelFamily"
                    name="preferredModelFamily"
                    value={localConfig.preferredModelFamily}
                    onChange={handleInputChange}
                    className="select"
                >
                    <option value="gpt">GPT</option>
                    <option value="gemini">Gemini</option>
                    <option value="claude">Claude</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="defaultTier">Default Tier:</label>
                <select
                    id="defaultTier"
                    name="defaultTier"
                    value={localConfig.defaultTier}
                    onChange={handleInputChange}
                    className="select"
                >
                    <option value="pro">Pro (Tier 1)</option>
                    <option value="fast">Fast (Tier 2)</option>
                </select>
            </div>
            <button onClick={handleSaveConfig} className="button">Save Configuration</button>
            <button onClick={backToMain} className="button">Back to Main</button>
        </div>
    );
};

export default SettingsView;