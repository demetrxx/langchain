"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getList = void 0;
const openai_1 = require("langchain/chat_models/openai");
const prompts_1 = require("langchain/prompts");
const output_parser_1 = require("langchain/schema/output_parser");
/**
 * Parse the output of an LLM call to a comma-separated list.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
class CommaSeparatedListOutputParser extends output_parser_1.BaseOutputParser {
    async parse(text) {
        return text.split(',').map((item) => item.trim());
    }
}
const template = `You are a helpful assistant who generates comma separated lists.
A user will pass in a category, and you should generate 5 objects in that category in a comma separated list.
ONLY return a comma separated list, and nothing more.`;
const humanTemplate = '{text}';
/**
 * Chat prompt for generating comma-separated lists. It combines the system
 * template and the human template.
 */
const chatPrompt = prompts_1.ChatPromptTemplate.fromMessages([
    ['system', template],
    ['human', humanTemplate],
]);
const parser = new CommaSeparatedListOutputParser();
async function getList() {
    const model = new openai_1.ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const chain = chatPrompt.pipe(model).pipe(parser);
    const result = await chain.invoke({
        text: 'cars',
    });
    console.log(result);
}
exports.getList = getList;
