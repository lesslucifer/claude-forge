// aiFileSelector.ts

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IAIModel, IAIModelGenerationRequest } from './models/base';
import { getConfiguredModel } from './modelConfig';

export async function performAIFileSelection(userInput: string): Promise<string[]> {
    console.log('Starting AI file selection process');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        console.log('No workspace folder open');
        throw new Error('No workspace folder open');
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log(`Root path: ${rootPath}`);
    const indexFilePath = path.join(rootPath, '.claude-forge.txt');
    const analysisFilePath = path.join(rootPath, 'project-analysis.md');

    if (!fs.existsSync(indexFilePath)) {
        console.log('Project index not found');
        throw new Error('Project index not found');
    }

    console.log('Reading project index and analysis files');
    const indexContent = await fs.promises.readFile(indexFilePath, 'utf8');
    const analysisContent = fs.existsSync(analysisFilePath) ? await fs.promises.readFile(analysisFilePath, 'utf8') : '';

    console.log('Getting configured AI model');
    const model = getConfiguredModel();
    // const model = getConfiguredModel('claude', 'pro');
    console.log(`Using model: ${model.description}`);

    console.log('Sending request to AI model', model.description);
    const response = await getAIFileSelection(model, userInput, indexContent, analysisContent);

    console.log('Parsing AI response');
    const selectedFiles = parseAIResponse(response);
    console.log(`Selected files: ${selectedFiles.join(', ')}`);

    return selectedFiles;
}

async function getAIFileSelection(model: IAIModel, userInput: string, indexContent: string, analysisContent: string): Promise<string> {
    console.log('Preparing AI prompt');
    const prompt = `
    You are an AI assistant tasked with identifying relevant files for a given request in a software project. You will be provided with a project description, file descriptions, and a user request. Your goal is to output a list of files that might be relevant to accomplish the user's request.

    First, here's the overall project description:
    <project_description>
    ${analysisContent}
    </project_description>

    Now, here are the descriptions of the files in the project:
    <file_descriptions>
    ${indexContent}
    </file_descriptions>

    Your task is to analyze the user's request and identify which files from the project might be relevant to accomplish that request

    To complete this task, follow these steps:

    1. Carefully read and analyze the user's request.
    2. Review the project description to understand the context.
    3. Examine each file description, considering the factors mentioned above.
    4. Select the files that seem most relevant to the user's request.

    When you've identified the relevant files, provide your answer in the following format. You must strictly follow the format and keep the original file path (especially the SEPARATOR) since it will affect the parser:

    <relevant_files>
    1. Filename 1
    2. Filename 2
    ...
    </relevant_files>

    If you believe no files are relevant to the request, explain why inside the <relevant_files> tags.

    Here is the user's request:
    <user_request>
    ${userInput}
    </user_request>

    Based on this request and the project information provided, please identify and list the relevant files as instructed above. List up to 7 files maximum.
    `;
    const request: IAIModelGenerationRequest = {
        prompts: [{ role: 'user', parts: [{ text: prompt }] }],
        customConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
        }
    };

    console.log('Sending request to AI model');
    const response = await model.generate(request);
    console.log('Received response from AI model', JSON.stringify(response, null, 2));
    return response.prompt.parts[0].text || '';
}

function parseAIResponse(response: string): string[] {
    console.log('Parsing AI response');
    const relevantFilesMatch = response.match(/<relevant_files>([\s\S]*?)<\/relevant_files>/);
    if (!relevantFilesMatch) {
        console.log('No relevant files found in AI response');
        return [];
    }

    const relevantFilesContent = relevantFilesMatch[1];
    console.log("parseAIResponse matched content");
    console.log(relevantFilesContent);
    const fileMatches = relevantFilesContent.match(/\b\d+\.\s*(.+)\b/g);

    if (!fileMatches) {
        console.log('No file matches found in relevant files content');
        return [];
    }

    const selectedFiles = fileMatches.map(match => {
        const [, filename] = match.match(/\b\d+\.\s*(.+)\b/) || [];
        return filename.trim();
    }).slice(0, 7);

    console.log(`Parsed ${selectedFiles.length} files from AI response`);
    return selectedFiles;
}