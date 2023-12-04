"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMe = void 0;
const chains_1 = require("langchain/chains");
const openai_1 = require("langchain/chat_models/openai");
const text_1 = require("langchain/document_loaders/fs/text");
// import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
// import { PuppeteerWebBaseLoader } from 'langchain/document_loaders/web/puppeteer';
const openai_2 = require("langchain/embeddings/openai");
const text_splitter_1 = require("langchain/text_splitter");
const memory_1 = require("langchain/vectorstores/memory");
const key_1 = require("./key");
async function readMe(query, source) {
    const loader = new text_1.TextLoader(source);
    // const loader = new TextLoader(path.join(path.resolve(), 'src', 'demo.txt'));
    const data = await loader.load();
    const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 0,
    });
    const splitDocs = await textSplitter.splitDocuments(data);
    const embeddings = new openai_2.OpenAIEmbeddings({ openAIApiKey: key_1.OPENAI_API_KEY });
    const vectorStore = await memory_1.MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    const model = new openai_1.ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        openAIApiKey: key_1.OPENAI_API_KEY,
    });
    const chain = chains_1.RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
    const response = await chain.call({
        query,
    });
    console.log(response);
}
exports.readMe = readMe;
