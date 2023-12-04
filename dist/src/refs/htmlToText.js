"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlToText = void 0;
const chains_1 = require("langchain/chains");
const openai_1 = require("langchain/chat_models/openai");
const cheerio_1 = require("langchain/document_loaders/web/cheerio");
const html_to_text_1 = require("langchain/document_transformers/html_to_text");
const openai_2 = require("langchain/embeddings/openai");
const text_splitter_1 = require("langchain/text_splitter");
const memory_1 = require("langchain/vectorstores/memory");
const key_1 = require("./key");
async function htmlToText(query, source) {
    const loader = new cheerio_1.CheerioWebBaseLoader(source, {
        selector: '.task-card',
    });
    const docs = await loader.load();
    const splitter = text_splitter_1.RecursiveCharacterTextSplitter.fromLanguage('html');
    const transformer = new html_to_text_1.HtmlToTextTransformer();
    const sequence = splitter.pipe(transformer);
    const splitDocs = await sequence.invoke(docs);
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
    // console.log(newDocuments);
}
exports.htmlToText = htmlToText;
