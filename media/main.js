(function() {
    const vscode = acquireVsCodeApi();

    document.getElementById('indexProject').addEventListener('click', () => {
        console.log(`[CF]: indexProject`);
        vscode.postMessage({ type: 'indexProject' });
    });

    document.getElementById('configure').addEventListener('click', () => {
        console.log(`[CF]: Configure`);
        vscode.postMessage({ type: 'configure' });
    });
}());