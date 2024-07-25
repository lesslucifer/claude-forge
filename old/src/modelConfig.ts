import * as vscode from 'vscode';
import { GPTModel } from './models/gpt';
import { GeminiModel } from './models/gemini';
import { ClaudeModel } from './models/claude';
import { IAIModel } from './models/base';

type ModelTier = 'pro' | 'fast';
type ModelFamily = 'claude' | 'gpt' | 'gemini';

interface ModelInfo {
    family: ModelFamily;
    tier: ModelTier;
    modelClass: new (apiKey: string, model: string) => IAIModel;
}

const modelInfoMap: { [key: string]: ModelInfo } = {
    'claude-3-5-sonnet-20240620': { family: 'claude', tier: 'pro', modelClass: ClaudeModel },
    'claude-3-haiku-20240307': { family: 'claude', tier: 'fast', modelClass: ClaudeModel },
    'gpt-4': { family: 'gpt', tier: 'pro', modelClass: GPTModel },
    'gpt-4o-mini': { family: 'gpt', tier: 'fast', modelClass: GPTModel },
    'gemini-1.5-pro': { family: 'gemini', tier: 'pro', modelClass: GeminiModel },
    'gemini-1.5-flash-latest': { family: 'gemini', tier: 'fast', modelClass: GeminiModel },
};

function getModelByFamilyAndTier(family: ModelFamily, tier: ModelTier): string | undefined {
    return Object.keys(modelInfoMap).find(model => 
        modelInfoMap[model].family === family && modelInfoMap[model].tier === tier
    );
}

export function getConfiguredModel(preferredFamily?: ModelFamily, preferredTier?: ModelTier): IAIModel {
    const config = vscode.workspace.getConfiguration('claudeForge');
    const gptApiKey = config.get('gptApiKey', '');
    const geminiApiKey = config.get('geminiApiKey', '');
    const claudeApiKey = config.get('claudeApiKey', '');
    const preferredModelFamily = config.get('preferredModelFamily', 'gpt');
    const defaultTier = config.get('defaultTier', 'fast') as ModelTier;

    const apiKeys: { [key in ModelFamily]: string } = {
        'gpt': gptApiKey,
        'gemini': geminiApiKey,
        'claude': claudeApiKey,
    };

    preferredFamily ??= preferredModelFamily;
    preferredTier ??= defaultTier;

    // Check if the preferred family and tier are available
    if (preferredFamily && preferredTier && apiKeys[preferredFamily]) {
        const model = getModelByFamilyAndTier(preferredFamily, preferredTier);
        if (model) {
            return new modelInfoMap[model].modelClass(apiKeys[preferredFamily], model);
        }
    }

    // Find the first available model with API key
    const modelPriority: ModelFamily[] = ['claude', 'gpt', 'gemini'];
    const targetTier = preferredTier || defaultTier;

    for (const family of modelPriority) {
        if (apiKeys[family]) {
            const model = getModelByFamilyAndTier(family, targetTier);
            if (model) {
                return new modelInfoMap[model].modelClass(apiKeys[family], model);
            }
        }
    }

    throw new Error('No API keys configured. Please set at least one API key in the Claude Forge settings.');
}