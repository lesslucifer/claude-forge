(function() {
    const vscode = acquireVsCodeApi();

    document.getElementById('indexProject').addEventListener('click', () => {
        vscode.postMessage({ type: 'indexProject' });
    });

    document.getElementById('saveConfig').addEventListener('click', () => {
        const config = {
            gptApiKey: document.getElementById('gptApiKey').value,
            geminiApiKey: document.getElementById('geminiApiKey').value,
            claudeApiKey: document.getElementById('claudeApiKey').value,
            preferredModelForAnalysis: document.getElementById('preferredModel').value,
            defaultModel: document.getElementById('defaultModel').value,
            defaultTier: document.getElementById('defaultTier').value,
        };
        vscode.postMessage({ type: 'updateConfiguration', config });
    });

    // Request initial configuration
    vscode.postMessage({ type: 'getConfiguration' });

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'configuration':
                updateConfigurationFields(message.config);
                break;
        }
    });

    function updateConfigurationFields(config) {
        document.getElementById('gptApiKey').value = config.gptApiKey || '';
        document.getElementById('geminiApiKey').value = config.geminiApiKey || '';
        document.getElementById('claudeApiKey').value = config.claudeApiKey || '';
        document.getElementById('preferredModel').value = config.preferredModelForAnalysis || 'gpt';
        document.getElementById('defaultModel').value = config.defaultModel || 'gpt-4o-mini';
        document.getElementById('defaultTier').value = config.defaultTier || 'fast';
    }
}());