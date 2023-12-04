"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiParse = void 0;
const openai_1 = require("langchain/chat_models/openai");
const document_1 = require("langchain/document");
const openai_2 = require("langchain/embeddings/openai");
const prompts_1 = require("langchain/prompts");
const output_parser_1 = require("langchain/schema/output_parser");
const runnable_1 = require("langchain/schema/runnable");
const document_2 = require("langchain/util/document");
const hnswlib_1 = require("langchain/vectorstores/hnswlib");
const fetchHtml_1 = require("../utils/fetchHtml");
const parseHtmlSimple_1 = require("./parseHtmlSimple");
const topics_1 = require("./topics");
async function aiParse(url) {
    const config = {
        temperature: 0,
        modelName: 'gpt-4-1106-preview',
        verbose: true,
    };
    const models = [new openai_1.ChatOpenAI(config), new openai_1.ChatOpenAI(config), new openai_1.ChatOpenAI(config)];
    const docs = Object.entries(topics_1.topicsMap).map(([name, id]) => new document_1.Document({ pageContent: `${name}: ${id}`, metadata: { id } }));
    const vectorStore = await hnswlib_1.HNSWLib.fromDocuments(docs, new openai_2.OpenAIEmbeddings());
    const vectorStoreRetriever = vectorStore.asRetriever();
    // Create a system & human prompt for the chat model
    const SYSTEM_TEMPLATE = `
  This is a list of topics and their ids, of format <topicName>: <id>:
  {topicsList}
  
  Given the string at the end, return an array of topics that were mentioned in it, but as an array of ids. 
  Wording of topics in the string bellow may differ slightly from the ones in the list.
  Your answer should only be an array of mentioned ids and nothing else.
  If no topics were mentioned, return an empty array.
  `;
    const messages = [
        prompts_1.SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
        prompts_1.HumanMessagePromptTemplate.fromTemplate('{string}'),
    ];
    const prompt = prompts_1.ChatPromptTemplate.fromMessages(messages);
    function getChain(model) {
        return runnable_1.RunnableSequence.from([
            {
                topicsList: vectorStoreRetriever.pipe(document_2.formatDocumentsAsString),
                string: new runnable_1.RunnablePassthrough(),
            },
            prompt,
            model,
            new output_parser_1.StringOutputParser(),
        ]);
    }
    const chains = models.map(getChain);
    let questions = 0;
    async function getTopic(string) {
        questions++;
        const finalChain = chains[Math.ceil(questions / 20) - 1];
        const answer = await finalChain.invoke(string);
        return JSON.parse(answer);
    }
    const html = await (0, fetchHtml_1.fetchHTML)(url);
    await (0, parseHtmlSimple_1.parseHtml)({ html, getTopic });
}
exports.aiParse = aiParse;
