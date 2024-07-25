import _ from 'lodash';
import OpenAI from 'openai';
import {
    ChatCompletion,
    ChatCompletionAssistantMessageParam,
    ChatCompletionContentPart,
    ChatCompletionCreateParams,
    ChatCompletionFunctionMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionTool,
    ChatCompletionUserMessageParam
} from 'openai/resources/chat/index';
import { emptyAIModelUsage, IAIModel, IAIModelGenerationRequest, IAIModelOutput, IAIModelPrompt, IAIModelPromptPart, IAIModelPromptRole, IAIModelUsage, IAIToolDeclaration, mkPrompt } from './base';

export class GPTModel implements IAIModel {
    private openai: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        this.openai = new OpenAI({ apiKey });
        this.model = model;
    }

    get description() {
        return `GPT_${this.model}`
    }

    private convertToolsToGPTFormat(tools: IAIToolDeclaration[]): ChatCompletionTool[] {
        return tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters as any // GPT expects a JSONSchema object
            }
        }));
    }

    private convertPromptToGPTFormat(prompt: IAIModelPrompt): ChatCompletionMessageParam {
        const contentParts = prompt.parts.map(this.convertPartToGPTFormat).filter((part): part is ChatCompletionContentPart => part !== null);
        const role = prompt.role === 'model' ? 'assistant' : prompt.role;
        const functionCallPart = prompt.parts.find(part => part.functionName && part.functionArgs);
        
        let message: ChatCompletionMessageParam;

        switch (role) {
            case 'user':
                message = {
                    role,
                    content: contentParts.length > 0 ? contentParts : null
                } as ChatCompletionUserMessageParam;
                break;
            case 'assistant':
                message = {
                    role,
                    content: contentParts.length > 0 ? contentParts : null
                } as unknown as ChatCompletionAssistantMessageParam;
                if (functionCallPart) {
                    (message as ChatCompletionAssistantMessageParam).function_call = {
                        name: functionCallPart.functionName!,
                        arguments: JSON.stringify(functionCallPart.functionArgs)
                    };
                }
                break;
            case 'function':
                if (!functionCallPart) {
                    throw new Error('Function message must have a function name');
                }
                message = {
                    role,
                    name: functionCallPart.functionName!,
                    content: JSON.stringify(functionCallPart.functionResponse)
                } as ChatCompletionFunctionMessageParam;
                break;
            default:
                throw new Error(`Unsupported role: ${role}`);
        }

        return message;
    }

    private convertPartToGPTFormat(part: IAIModelPromptPart): ChatCompletionContentPart | null {
        if (part.text) {
            return { type: 'text', text: part.text };
        }
        if (part.functionName && part.functionArgs) {
            return {
                type: 'text',
                text: JSON.stringify({
                    function_call: {
                        name: part.functionName,
                        arguments: JSON.stringify(part.functionArgs)
                    }
                })
            };
        }
        if (part.functionName && part.functionResponse) {
            return {
                type: 'text',
                text: JSON.stringify({
                    function_response: {
                        name: part.functionName,
                        content: JSON.stringify(part.functionResponse)
                    }
                })
            };
        }
        if (part.base64 || part.fileUri) {
            console.warn('GPT API does not support base64 or fileUri data in messages. This content will be omitted.');
            return null;
        }
        throw new Error('Invalid part format');
    }

    private extractUsageData(response: ChatCompletion): IAIModelUsage {
        return response.usage ? {
            inputToken: response.usage.prompt_tokens,
            outputToken: response.usage.completion_tokens,
            totalToken: (response.usage.prompt_tokens || 0) + (response.usage.completion_tokens || 0)
        } : emptyAIModelUsage();
    }

    private convertGPTResponseToAIModelPrompt(message: ChatCompletion.Choice['message']): IAIModelPrompt {
        let parts: IAIModelPromptPart[] = [];
        const content = message.content;

        if (_.isString(content)) {
            parts.push({ text: content });
        } else if (Array.isArray(content)) {
            parts = (content as any[]).map(part => {
                if (part.type === 'text') {
                    return { text: part.text };
                }
                // Handle other content types if needed
                return { text: JSON.stringify(part) };
            });
        }

        if (message.tool_calls) {
            parts.push(...message.tool_calls.filter(toolCall => toolCall.type === 'function').map(toolCall => {
                let args = {}
                try {
                    args = JSON.parse(toolCall.function.arguments || '{}')
                } catch (error) {
                    console.error('Error parsing tool call arguments:', error);
                }
                return {
                    functionName: toolCall.function.name,
                    functionArgs: args
                }
            }));
        }

        return {
            role: message.role === 'assistant' ? 'model' : message.role as IAIModelPromptRole,
            parts
        }
    }

    async generate(req: IAIModelGenerationRequest): Promise<IAIModelOutput> {
        const gptRequest: ChatCompletionCreateParams = {
            model: this.model,
            messages: req.prompts.map(prompt => this.convertPromptToGPTFormat(mkPrompt(prompt))),
            temperature: req.customConfig?.temperature,
            top_p: req.customConfig?.topP,
            n: 1,
            max_tokens: req.customConfig?.maxOutputTokens,
            stop: req.customConfig?.stopSequences,
        };

        if (req.tools) {
            gptRequest.tools = this.convertToolsToGPTFormat(req.tools);
        }

        if (req.sysInstruction) {
            gptRequest.messages.unshift({ role: 'system', content: req.sysInstruction });
        }

        try {
            const result = await this.openai.chat.completions.create(gptRequest);
            if (!result.choices || result.choices.length === 0) {
                throw new Error('No response from GPT');
            }
            const gptResponse = result.choices[0].message;
            if (!gptResponse) {
                throw new Error('Invalid response from GPT');
            }
            
            return {
                prompt: this.convertGPTResponseToAIModelPrompt(gptResponse),
                usage: this.extractUsageData(result)
            };
        } catch (error) {
            console.error('Error generating content:', error);
            throw error;
        }
    }
}