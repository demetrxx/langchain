"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCases = void 0;
const node_path_1 = __importDefault(require("node:path"));
const chains_1 = require("langchain/chains");
const openai_1 = require("langchain/chat_models/openai");
const text_1 = require("langchain/document_loaders/fs/text");
const openai_2 = require("langchain/embeddings/openai");
const openai_3 = require("langchain/llms/openai");
const memory_1 = require("langchain/memory");
const output_parsers_1 = require("langchain/output_parsers");
const prompts_1 = require("langchain/prompts");
const schema_1 = require("langchain/schema");
const runnable_1 = require("langchain/schema/runnable");
const text_splitter_1 = require("langchain/text_splitter");
const faiss_1 = require("langchain/vectorstores/faiss");
const loadFolder_1 = require("../utils/loadFolder");
// Summarization
async function summarizeShortText() {
    const llm = new openai_3.OpenAI({ temperature: 0 });
    const template = `
  %INSTRUCTIONS:
  Please summarize the following piece of text.
  Respond in a manner that a 5 year old would understand.
  
  %TEXT:
  {text}
  `;
    const prompt = prompts_1.PromptTemplate.fromTemplate(template);
    const confusingText = `
  For the next 130 years, debate raged.
  Some scientists called Prototaxites a lichen, others a fungus, and still others clung to the notion that it was some kind of tree.
  “The problem is that when you look up close at the anatomy, it’s evocative of a lot of different things, but it’s diagnostic of nothing,” says Boyce, an associate professor in geophysical sciences and the Committee on Evolutionary Biology.
  “And it’s so damn big that when whenever someone says it’s something, everyone else’s hackles get up: ‘How could you have a lichen 20 feet tall?’”
  `;
    console.log('------- Prompt Begin -------');
    const finalPrompt = await prompt.format({ text: confusingText });
    console.log(finalPrompt);
    console.log('------- Prompt End -------');
    const output = await llm.call(finalPrompt);
    console.log(output);
}
async function summarizeMapReduce() {
    const docs = await new text_1.TextLoader('src/data/good.txt').load();
    const llm = new openai_3.OpenAI({ temperature: 0 });
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 4000,
        chunkOverlap: 350,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    const summarizeChain = (0, chains_1.loadSummarizationChain)(llm, { type: 'map_reduce', verbose: true });
    const output = await summarizeChain.call({ input_documents: splitDocs });
    console.log(output);
}
// QA over Documents
async function qaSimple() {
    // answer = llm(context + question)
    const llm = new openai_3.OpenAI({ temperature: 0 });
    const context = `
  Rachel is 30 years old
  Bob is 45 years old
  Kevin is 65 years old
  `;
    const question = 'Who is under 50 years old?';
    const output = await llm.call(context + question);
    console.log(output);
}
async function qaWithEmbeddings() {
    const llm = new openai_3.OpenAI({ temperature: 0 });
    const loader = new text_1.TextLoader('src/data/worked.txt');
    const docs = await loader.load();
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 3000,
        chunkOverlap: 400,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    const embeddings = new openai_2.OpenAIEmbeddings();
    const vectorStore = await faiss_1.FaissStore.fromDocuments(splitDocs, embeddings);
    const stuffChain = (0, chains_1.loadQAStuffChain)(llm, { verbose: true });
    const question = 'What does the author describe as good work?';
    const relevantDocs = await vectorStore.similaritySearch(question);
    const res = await stuffChain.call({
        input_documents: relevantDocs,
        question,
    });
    // same as stuffChain
    // const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever(), { verbose: true });
    //
    // const a = await chain.call({
    //   query: 'What does the author describe as good work?',
    // });
    console.log(res);
}
// Extraction
async function extractionSimple() {
    const chatModel = new openai_1.ChatOpenAI({ temperature: 0 });
    const instructions = `
  You will be given a sentence with fruit names, extract those fruit names and assign an emoji to them
  Return the fruit name and emojis in a javascript object
  `;
    const fruits = 'Apple, Pear, this is a kiwi';
    const prompt = instructions + fruits;
    const output = await chatModel.call([new schema_1.HumanMessage(prompt)]);
    console.log(output);
    const parsedOutput = JSON.parse(output.content);
    console.log(parsedOutput);
}
async function extractionOutputParser() {
    const chatModel = new openai_1.ChatOpenAI({ temperature: 0 });
    const outputParser = output_parsers_1.StructuredOutputParser.fromNamesAndDescriptions({
        name: 'The name of the musical artist',
        song: 'The name of the song that the artist plays',
    });
    const formatInstructions = outputParser.getFormatInstructions();
    // console.log(formatInstructions);
    const prompt = new prompts_1.ChatPromptTemplate({
        partialVariables: { formatInstructions },
        promptMessages: [
            prompts_1.HumanMessagePromptTemplate.fromTemplate('Given a command from the user, extract the artist and song names \n \\\n {formatInstructions}\n{userPrompt}'),
        ],
        inputVariables: ['userPrompt'],
    });
    const query = await prompt.formatMessages({ userPrompt: 'I really like Nowadays by Lil Skies' });
    // console.log(query[0].content);
    const output = await chatModel.call(query);
    const parsedOutput = await outputParser.parse(output.content);
    console.log(parsedOutput);
}
async function extractionOutputParserChain() {
    const chatModel = new openai_1.ChatOpenAI({ temperature: 0 });
    const outputParser = output_parsers_1.StructuredOutputParser.fromNamesAndDescriptions({
        name: 'The name of the musical artist',
        song: 'The name of the song that the artist plays',
    });
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        [
            'system',
            'Given a command from the user, extract the artist and song names \n \\\n {formatInstructions}',
        ],
        ['human', '{userPrompt}'],
    ]);
    // Sequence chain
    const chain = runnable_1.RunnableSequence.from([prompt, chatModel, outputParser]);
    const res = await chain.invoke({
        userPrompt: 'I really like Nowadays by Lil Skies',
        formatInstructions: outputParser.getFormatInstructions(),
    });
    console.log(res);
    // Llm chain
    const chainB = new chains_1.LLMChain({
        prompt,
        llm: chatModel,
        outputParser,
    });
    const resB = await chainB.invoke({
        userPrompt: 'I really like Nowadays by Lil Skies',
        formatInstructions: outputParser.getFormatInstructions(),
    });
    // console.log(resB);
}
// Code
async function code() {
    const chatModel = new openai_1.ChatOpenAI({ temperature: 0 });
    const embeddings = new openai_2.OpenAIEmbeddings();
    const docs = await Promise.all((0, loadFolder_1.loadFolder)(node_path_1.default.join(process.cwd(), 'src', 'data', 'thefuzz')).map(async (doc) => (await new text_1.TextLoader(doc).loadAndSplit())[0]));
    // console.log(docs);
    const vectorStore = await faiss_1.FaissStore.fromDocuments(docs, embeddings);
    const qaChain = chains_1.RetrievalQAChain.fromLLM(chatModel, vectorStore.asRetriever());
    const query = 'What function do I use if I want to find the most similar item in a list of items?';
    const output = await qaChain.call({ query });
    // console.log(output);
    const queryCode = 'Can you write the code to use the process.extractOne() function? Only respond with code. No other text or explanation';
    const outputCode = await qaChain.call({ query: queryCode });
    console.log(outputCode);
    // const stuffChain = loadQAStuffChain(chatModel);
    // const question =
    //   'What function do I use if I want to find the most similar item in a list of items?';
    // const relevantDocs = await vectorStore.similaritySearch(question);
    //
    // const res = await stuffChain.call({
    //   input_documents: relevantDocs,
    //   question,
    // });
    //
    // console.log(res);
}
async function chatBot() {
    // llm + memory
    const template = `
  You are a chatbot that is unhelpful.
  Your goal is to not help the user but only make jokes.
  Take what the user is saying and make a joke out of it
  
  {chatHistory}
  Human: {humanInput}
  Chatbot:
  `;
    const prompt = new prompts_1.PromptTemplate({
        template,
        inputVariables: ['chatHistory', 'humanInput'],
    });
    const llm = new openai_1.ChatOpenAI({ temperature: 0 });
    const memory = new memory_1.BufferMemory({ memoryKey: 'chatHistory' });
    const llmChain = new chains_1.LLMChain({
        llm,
        prompt,
        memory,
        verbose: true,
    });
    const res = await llmChain.invoke({ humanInput: 'Is a pear a fruit or vegetable?' });
    // console.log(res);
    const resB = await llmChain.invoke({
        humanInput: 'What was one of the fruits I first asked you about?',
    });
    console.log(resB.text);
}
exports.useCases = chatBot;
