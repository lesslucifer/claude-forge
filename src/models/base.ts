import _ from "lodash"

export type IAIModelPromptRole = 'user' | 'model' | 'function'

export interface IAIModelPromptPart {
    id?: number | string
    role?: IAIModelPromptRole
    text?: string
    mimeType?: string
    base64?: string
    fileUri?: string
    functionName?: string
    functionArgs?: object
    functionResponse?: object
}

export interface IAIModelPrompt {
    role: IAIModelPromptRole
    parts: IAIModelPromptPart[]
}

export type IAIModelDynamicPrompt = IAIModelPrompt | IAIModelPromptPart | string

export function emptyPrompt(role: IAIModelPromptRole = 'user'): IAIModelPrompt {
    return {
        role: role,
        parts: []
    }
}

export function mkPrompt(prompt: IAIModelDynamicPrompt): IAIModelPrompt {
    if (_.isString(prompt)) {
        return {
            role: 'user',
            parts: [{ text: prompt }]
        };
    }

    if (_.isPlainObject(prompt)) {
        if (isIAIModelPrompt(prompt)) {
            return {
                role: prompt.role ?? 'user',
                parts: prompt.parts
            };
        } else {
            const part = prompt as IAIModelPromptPart;
            return {
                role: part.role ?? 'user',
                parts: [part]
            };
        }
    }

    throw new Error('Invalid prompt type. Expected string, IAIModelPromptPart, or IAIModelPrompt.');
}

// Type guard functions
export function isIAIModelPrompt(prompt: IAIModelDynamicPrompt): prompt is IAIModelPrompt {
    return _.isPlainObject(prompt) && 'parts' in (prompt as object) && _.isArray((prompt as IAIModelPrompt)?.parts);
}

export function isIAIModelPromptPart(prompt: IAIModelDynamicPrompt): prompt is IAIModelPromptPart {
    return _.isPlainObject(prompt) && !('parts' in (prompt as object));
}

export interface IAIToolDeclaration {
    name: string
    description?: string
    parameters?: object
}

export interface IAIModelGenerationRequestCustomConfig {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
    stopSequences?: string[]
    safetySettings?: any
}

export interface IAIModelGenerationRequest {
    prompts: IAIModelDynamicPrompt[]
    sysInstruction?: string
    tools?: IAIToolDeclaration[]
    customConfig?: IAIModelGenerationRequestCustomConfig
}

export interface IAIModelUsage {
    inputToken: number
    outputToken: number
    totalToken: number
}

export const emptyAIModelUsage = () => ({ inputToken: 0, outputToken: 0, totalToken: 0 })

export interface IAIModelOutput {
    prompt: IAIModelPrompt
    usage?: IAIModelUsage
}

export interface IAIModel {
    readonly description: string
    generate(req: IAIModelGenerationRequest): Promise<IAIModelOutput>
}