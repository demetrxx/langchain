"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concepts = void 0;
const agents_1 = require("langchain/agents");
const chains_1 = require("langchain/chains");
const openai_1 = require("langchain/chat_models/openai");
const document_1 = require("langchain/document");
const text_1 = require("langchain/document_loaders/fs/text");
const hn_1 = require("langchain/document_loaders/web/hn");
const openai_2 = require("langchain/embeddings/openai");
const openai_3 = require("langchain/llms/openai");
const memory_1 = require("langchain/memory");
const output_parsers_1 = require("langchain/output_parsers");
const prompts_1 = require("langchain/prompts");
const schema_1 = require("langchain/schema");
const text_splitter_1 = require("langchain/text_splitter");
const tools_1 = require("langchain/tools");
const faiss_1 = require("langchain/vectorstores/faiss");
async function chatModel() {
    const chat = new openai_1.ChatOpenAI({ temperature: 0.7 });
    const res = await chat.call([
        new schema_1.SystemMessage("Answer user's question as an car sales assistant."),
        new schema_1.HumanMessage('A like good cars, what can you recommend?'),
        new schema_1.AIMessage('Take a look at BMW X6.'),
        new schema_1.HumanMessage('Tell me more about it.'),
    ]);
    console.log(res);
}
async function doc() {
    const doc = new document_1.Document({
        pageContent: 'Who is Bogdan Khmelnitsky?',
        metadata: {
            source: 'ZNO 2021',
        },
    });
    console.log(doc);
}
async function textEmbeddings() {
    const embeddings = new openai_2.OpenAIEmbeddings();
    const text = "Hi! it's time for the beach";
    const textEmbedding = await embeddings.embedQuery(text);
    console.log('Length of text embedding:', textEmbedding.length);
    console.log('Text embedding:', `${textEmbedding.slice(0, 10).join('')}...`);
}
async function prompts() {
    const llm = new openai_3.OpenAI();
    const template = 'What is the capital of {country}?';
    const promptTemplate = new prompts_1.PromptTemplate({
        template,
        inputVariables: ['country'],
    });
    const prompt = await promptTemplate.format({ country: 'Ukraine' });
    console.log('Final Prompt:', prompt);
    console.log('-------');
    console.log('Response:', await llm.call(prompt));
}
async function exampleSelectors() {
    const llm = new openai_3.OpenAI();
    const examplePrompt = new prompts_1.PromptTemplate({
        template: 'Example Input: {input}\nExample Output: {output}',
        inputVariables: ['input', 'output'],
    });
    const examples = [
        { input: 'pirate', output: 'ship' },
        { input: 'pilot', output: 'plane' },
        { input: 'driver', output: 'car' },
        { input: 'tree', output: 'ground' },
        { input: 'bird', output: 'nest' },
    ];
    const exampleSelector = await prompts_1.SemanticSimilarityExampleSelector.fromExamples(examples, new openai_2.OpenAIEmbeddings(), faiss_1.FaissStore, { k: 2 });
    const similarPrompt = new prompts_1.FewShotPromptTemplate({
        exampleSelector,
        examplePrompt,
        prefix: 'Give the location an item is usually found in.',
        suffix: 'Input: {noun}\nOutput:',
        inputVariables: ['noun'],
    });
    const noun = 'student';
    const prompt = await similarPrompt.format({ noun });
    console.log('Prompt:', prompt);
    console.log('-------');
    console.log('Response:', await llm.call(prompt));
}
async function outputParsers() {
    const llm = new openai_3.OpenAI();
    const outputParser = output_parsers_1.StructuredOutputParser.fromNamesAndDescriptions({
        badString: 'Poorly formatted user input string',
        goodString: 'Your response, reformatted input',
    });
    const formatInstructions = outputParser.getFormatInstructions();
    // console.log(formatInstructions);
    const template = 'You will be given a poorly formatted string from a user.\n' +
        'Reformat it and make sure all the words are spelled correctly.\n' +
        '\n' +
        '{formatInstructions}\n' +
        '\n' +
        '% USER INPUT:\n' +
        '{userInput}\n' +
        '\n' +
        'YOUR RESPONSE:';
    const prompt = new prompts_1.PromptTemplate({
        template,
        partialVariables: { formatInstructions },
        inputVariables: ['userInput'],
    });
    const promptValue = await prompt.format({
        userInput: 'welcom to califonya!',
    });
    // console.log(promptValue);
    const llmOutput = await llm.call(promptValue);
    // console.log(llmOutput);
    const parsedOutput = await outputParser.parse(llmOutput);
    console.log(parsedOutput);
}
async function docLoaders() {
    const loader = new hn_1.HNLoader('https://news.ycombinator.com/item?id=34817881');
    const data = await loader.load();
    console.log(`Found ${data.length} documents.`);
    console.log(data[0]);
}
async function textSplitters() {
    const loader = new text_1.TextLoader('src/refs/2021-test.txt');
    const docs = await loader.load();
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log(splitDocs[100]);
}
async function retrievers() {
    const loader = new text_1.TextLoader('src/refs/2021-test.txt');
    const docs = await loader.load();
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    const embeddings = new openai_2.OpenAIEmbeddings();
    // db
    const vectorStore = await faiss_1.FaissStore.fromDocuments(splitDocs, embeddings);
    const retriever = vectorStore.asRetriever();
    const relevantDocs = await retriever.getRelevantDocuments('У чому полягає історична цінність карикатур?');
    console.log(relevantDocs);
}
async function vectorStores() {
    // Pinecone + Weaviate
    // FaissStore & Chroma for local
    const loader = new text_1.TextLoader('src/refs/2021-test.txt');
    const docs = await loader.load();
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    const embeddings = new openai_2.OpenAIEmbeddings();
    const embeddingsList = await embeddings.embedDocuments(splitDocs.map((doc) => doc.pageContent));
    console.log(splitDocs.length);
    console.log(embeddingsList.length);
}
async function memory() {
    const chat = new openai_1.ChatOpenAI({ temperature: 0 });
    const history = new memory_1.ChatMessageHistory();
    await history.addAIChatMessage('Hello, I am a chatbot.');
    await history.addUserMessage('What is the capital of Ukraine?');
    // console.log(await history.getMessages());
    const aiResponse = await chat.call(await history.getMessages());
    await history.addAIChatMessage(aiResponse.content);
    console.log(await history.getMessages());
}
async function simpleSequentialChain() {
    const llm = new openai_3.OpenAI({ temperature: 1 });
    const locationTemplate = `
  Your job is to come up with a classic dish from the area that users suggest.
  % USER LOCATION
  
  {userLocation}
  YOUR RESPONSE:
  `;
    const locationPrompt = new prompts_1.PromptTemplate({
        template: locationTemplate,
        inputVariables: ['userLocation'],
    });
    const locationChain = new chains_1.LLMChain({ llm, prompt: locationPrompt });
    const mealTemplate = `
  Given a meal, give a short and simple recipe on how to make that dish at home.
  % MEAL
  
  {userMeal}
  YOUR RESPONSE:
  `;
    const mealPrompt = new prompts_1.PromptTemplate({
        template: mealTemplate,
        inputVariables: ['userMeal'],
    });
    const mealChain = new chains_1.LLMChain({ llm, prompt: mealPrompt });
    const overallChain = new chains_1.SimpleSequentialChain({
        chains: [locationChain, mealChain],
        verbose: true,
    });
    const response = await overallChain.run('Ukraine');
    console.log(response);
}
async function summarizationChain() {
    const llm = new openai_3.OpenAI({ temperature: 1 });
    const loader = new text_1.TextLoader('src/data/tristan-tate.txt');
    const doc = await loader.load();
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 40,
    });
    const splitDocs = await splitter.splitDocuments(doc);
    // console.log(splitDocs.length);
    const chain = (0, chains_1.loadSummarizationChain)(llm, { type: 'map_reduce', verbose: true });
    const summary = await chain.call({ input_documents: splitDocs });
    console.log(summary);
}
async function agents() {
    const llm = new openai_3.OpenAI({ temperature: 0 });
    const toolkit = [new tools_1.SerpAPI(process.env.SERP_API_KEY)];
    const agent = await (0, agents_1.initializeAgentExecutorWithOptions)(toolkit, llm, {
        verbose: true,
        agentType: 'zero-shot-react-description',
    });
    const res = await agent.run('What is the second album of the band that Adam Gontier became famous in?');
    console.log(res);
}
async function concepts() {
    await agents();
}
exports.concepts = concepts;
