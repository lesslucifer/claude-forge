import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { IAIModel, IAIModelGenerationRequest } from '../models/base';
import { getConfiguredModel } from './modelConfig';

export async function analyzeProject(indexData: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    try {
        const model = getConfiguredModel("gemini", "fast");
        const analysis = await getModelAnalysis(model, indexData);

        // Save analysis to a file
        const analysisFilePath = path.join(rootPath, 'project-analysis.md');
        fs.writeFileSync(analysisFilePath, analysis);

        // Open the analysis file in a new editor
        const document = await vscode.workspace.openTextDocument(analysisFilePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage('Project analysis completed. Results saved to project-analysis.md');
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to analyze project: ${error?.message}`);
    }
}

async function getModelAnalysis(model: IAIModel, indexData: string): Promise<string> {
    const prompt = `
Analyze the following project structure and provide a comprehensive overview:

${indexData}

Please provide the following information:
1. Project Information:
   - Summarize the overall project, its purpose, and main technologies used.
   - Describe the general structure of the project.

2. Folder Analysis:
   - For each main folder, provide a brief summary of its contents and purpose.
   - Describe the structure within each folder.

3. Features:
   - Identify the main features of the application.
   - List which files or folders are related to each feature.

4. Core Components:
   - Identify the core files and features of the project.
   - Explain their significance to the overall application.

Please format your response in Markdown, using appropriate headers, lists, and code blocks for clarity.
`;

    const request: IAIModelGenerationRequest = {
        prompts: [{ role: 'user', parts: [{ text: prompt }] }],
        customConfig: {
            temperature: 0.4,
            maxOutputTokens: 3000
        }
    };

    try {
        const response = await model.generate(request);
        return response.prompt.parts[0].text || 'No analysis generated.';
    } catch (error) {
        console.error('Error calling AI model:', error);
        throw new Error('Failed to analyze project. Please check your API key and try again.');
    }
}