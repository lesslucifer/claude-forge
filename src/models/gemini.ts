import { Content, FunctionDeclaration, FunctionDeclarationSchema, GoogleGenerativeAI, GenerativeModel, GenerateContentResult, GenerateContentRequest, GenerateContentResponse, Part } from '@google/generative-ai';
import { IAIModel, IAIModelGenerationRequest, IAIModelOutput, IAIModelPrompt, IAIModelPromptPart, IAIToolDeclaration, mkPrompt } from './base';
import _ from 'lodash';

export class GeminiModel implements IAIModel {
    private model: GenerativeModel;

    constructor(apiKey: string, private modelName: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: modelName, });
    }

    get description() {
        return `GEMINI_${this.modelName}`
    }

    private convertToolsToGeminiFormat(tools: IAIToolDeclaration[]): FunctionDeclaration[] {
        return tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters as FunctionDeclarationSchema
        }));
    }

    private convertPromptToGeminiFormat(prompt: IAIModelPrompt): Content {
        return {
            role: prompt.role,
            parts: prompt.parts.map(this.convertPartToGeminiFormat)
        };
    }

    private convertPartToGeminiFormat(part: IAIModelPromptPart): Part {
        if (part.text) {
            return { text: part.text };
        }
        if (part.functionName && part.functionArgs) {
            return {
                functionCall: {
                    name: part.functionName,
                    args: part.functionArgs || {}
                }
            };
        }
        if (part.functionName && part.functionResponse) {
            return {
                functionResponse: {
                    name: part.functionName,
                    response: part.functionResponse
                }
            };
        }
        if (part.base64) {
            return {
                inlineData: {
                    mimeType: part.mimeType || 'application/octet-stream',
                    data: part.base64
                }
            };
        }
        if (part.fileUri) {
            return {
                fileData: {
                    mimeType: part.mimeType || 'application/octet-stream',
                    fileUri: part.fileUri
                }
            };
        }
        throw new Error('Invalid part format');
    }

    private convertGeminiResponseToAIModelOutput(response: GenerateContentResponse): IAIModelOutput {
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('No candidates in response');
        }
    
        const candidate = response.candidates[0];
        return {
            prompt: {
                role: 'model',
                parts: candidate.content.parts.map(this.convertGeminiPartToAIModelPart),
            },
            usage: response.usageMetadata ? {
                inputToken: response.usageMetadata.promptTokenCount,
                outputToken: response.usageMetadata.candidatesTokenCount,
                totalToken: (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0)
            } : undefined
        };
    }
    
    private convertGeminiPartToAIModelPart(part: Part): IAIModelPromptPart {
        if (part.text) {
            return { text: part.text };
        }
        if (part.functionCall) {
            return {
                functionName: part.functionCall.name,
                functionArgs: part.functionCall.args
            };
        }
        if (part.functionResponse) {
            return {
                functionName: part.functionResponse.name,
                functionResponse: part.functionResponse.response
            };
        }
        if (part.inlineData) {
            return {
                mimeType: part.inlineData.mimeType,
                base64: part.inlineData.data
            };
        }
        if (part.fileData) {
            return {
                mimeType: part.fileData.mimeType,
                fileUri: part.fileData.fileUri
            };
        }
        throw new Error('Invalid Gemini part format');
    }

    async generate(req: IAIModelGenerationRequest): Promise<IAIModelOutput> {
        const geminiRequest: GenerateContentRequest = {
            contents: req.prompts.map(prompt => this.convertPromptToGeminiFormat(mkPrompt(prompt))),
            generationConfig: {
                temperature: req.customConfig?.temperature,
                topK: req.customConfig?.topK,
                topP: req.customConfig?.topP,
                maxOutputTokens: req.customConfig?.maxOutputTokens,
                stopSequences: req.customConfig?.stopSequences,
            },
            safetySettings: req.customConfig?.safetySettings,
        };

        if (req.tools) {
            geminiRequest.tools = [{ functionDeclarations: this.convertToolsToGeminiFormat(req.tools) }];
        }

        if (req.sysInstruction) {
            geminiRequest.systemInstruction = req.sysInstruction;
        }

        try {
            const result: GenerateContentResult = await this.model.generateContent(geminiRequest);
            return this.convertGeminiResponseToAIModelOutput(result.response);
        } catch (error) {
            console.error('Error generating content:', error);
            throw error;
        }
    }
}