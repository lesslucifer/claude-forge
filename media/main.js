(function() {
    const vscode = acquireVsCodeApi();

    let selectedFiles = new Set();
    let allFiles = [];

    document.getElementById('indexButton').addEventListener('click', () => {
        vscode.postMessage({ type: 'indexProject' });
    });

    document.getElementById('settingsButton').addEventListener('click', () => {
        vscode.postMessage({ type: 'openSettings' });
    });

    document.getElementById('backButton').addEventListener('click', () => {
        vscode.postMessage({ type: 'backToMain' });
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

    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    document.getElementById('removeAllSelectedFiles').addEventListener('click', () => {
        const selectedFiles = document.querySelectorAll('#selectedFileList .file-item input[type="checkbox"]:checked');
        selectedFiles.forEach(checkbox => {
            checkbox.checked = false;
            moveFileItem(checkbox.closest('.file-item'), 'unselectedFileList');
        });
        updateFileList();
    });

    document.getElementById('selectedFilesSearch').addEventListener('input', (e) => {
        filterFiles(e.target.value, 'selectedFileList');
    });

    document.getElementById('unselectedFilesSearch').addEventListener('input', (e) => {
        filterFiles(e.target.value, 'unselectedFileList');
    });

    function filterFiles(query, listId) {
        const fileItems = document.querySelectorAll(`#${listId} .file-item`);
        fileItems.forEach(item => {
            const fileName = item.querySelector('label').textContent.toLowerCase();
            if (fileName.includes(query.toLowerCase())) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('You', message);
            vscode.postMessage({ type: 'sendMessage', message });
            userInput.value = '';
        }
    }

    function addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender.toLowerCase() + '-message');
        messageElement.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = file.path;
        checkbox.checked = selectedFiles.has(file.path);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedFiles.add(file.path);
                moveFileItem(fileItem, 'selectedFileList');
            } else {
                selectedFiles.delete(file.path);
                moveFileItem(fileItem, 'unselectedFileList');
            }
            updateFileList();
        });
        
        const label = document.createElement('label');
        label.textContent = `${file.path} (${file.language})`;
        
        fileItem.appendChild(checkbox);
        fileItem.appendChild(label);
        
        return fileItem;
    }

    function moveFileItem(fileItem, targetListId) {
        document.getElementById(targetListId).appendChild(fileItem);
    }

    function updateFileList() {
        vscode.postMessage({ type: 'updateFileList', selectedFiles: Array.from(selectedFiles) });
    }

    function populateFileLists(files) {
        const selectedFileList = document.getElementById('selectedFileList');
        const unselectedFileList = document.getElementById('unselectedFileList');
        selectedFileList.innerHTML = '';
        unselectedFileList.innerHTML = '';

        files.forEach(file => {
            const fileItem = createFileItem(file);
            if (selectedFiles.has(file.path)) {
                selectedFileList.appendChild(fileItem);
            } else {
                unselectedFileList.appendChild(fileItem);
            }
        });
    }

    // Request initial file list and configuration
    vscode.postMessage({ type: 'getFiles' });
    vscode.postMessage({ type: 'getConfiguration' });

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'fileList':
                allFiles = message.files;
                populateFileLists(allFiles);
                break;
            case 'aiResponse':
                addMessageToChat('AI', message.message);
                break;
            case 'showSettings':
                document.getElementById('mainView').style.display = 'none';
                document.getElementById('settingsView').style.display = 'block';
                break;
            case 'showMain':
                document.getElementById('settingsView').style.display = 'none';
                document.getElementById('mainView').style.display = 'block';
                break;
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