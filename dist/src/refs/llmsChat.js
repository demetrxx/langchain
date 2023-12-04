"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmsChat = void 0;
const openai_1 = require("langchain/chat_models/openai");
const openai_2 = require("langchain/llms/openai");
const prompts_1 = require("langchain/prompts");
async function llmsChat() {
    const llm = new openai_2.OpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const template = "You are a helpful assistant that translates {input_language} into {output_language}. In the beginning of every answer always introduce yourself as 'Привіт мене звати Мета! Ось твій переклад:'";
    const humanTemplate = '{text}';
    const chatPrompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', template],
        ['human', humanTemplate],
    ]);
    const formattedChatPrompt = await chatPrompt.formatMessages({
        input_language: 'English',
        output_language: 'Ukrainian',
        text: 'I love programming.',
    });
    const text = 'Who is Volodymyr Zelensky?';
    // const llmResult = await llm.predict(text);
    // console.log(llmResult);
    const chatModel = new openai_1.ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const chatModelResult = await chatModel.predictMessages(formattedChatPrompt);
    console.log(chatModelResult);
}
exports.llmsChat = llmsChat;
