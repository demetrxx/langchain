import { initializeAgentExecutorWithOptions, Toolkit } from 'langchain/agents';
import { LLMChain, loadSummarizationChain, SimpleSequentialChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Document } from 'langchain/document';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { HNLoader } from 'langchain/document_loaders/web/hn';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { ChatMessageHistory } from 'langchain/memory';
import { StructuredOutputParser } from 'langchain/output_parsers';
import {
  FewShotPromptTemplate,
  PromptTemplate,
  SemanticSimilarityExampleSelector,
} from 'langchain/prompts';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SerpAPI } from 'langchain/tools';
import { FaissStore } from 'langchain/vectorstores/faiss';

async function chatModel(): Promise<void> {
  const chat = new ChatOpenAI({ temperature: 0.7 });

  const res = await chat.call([
    new SystemMessage("Answer user's question as an car sales assistant."),
    new HumanMessage('A like good cars, what can you recommend?'),
    new AIMessage('Take a look at BMW X6.'),
    new HumanMessage('Tell me more about it.'),
  ]);

  console.log(res);
}

async function doc(): Promise<void> {
  const doc = new Document({
    pageContent: 'Who is Bogdan Khmelnitsky?',
    metadata: {
      source: 'ZNO 2021',
    },
  });

  console.log(doc);
}

async function textEmbeddings(): Promise<void> {
  const embeddings = new OpenAIEmbeddings();
  const text = "Hi! it's time for the beach";

  const textEmbedding = await embeddings.embedQuery(text);
  console.log('Length of text embedding:', textEmbedding.length);
  console.log('Text embedding:', `${textEmbedding.slice(0, 10).join('')}...`);
}

async function prompts(): Promise<void> {
  const llm = new OpenAI();
  const template = 'What is the capital of {country}?';

  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: ['country'],
  });

  const prompt = await promptTemplate.format({ country: 'Ukraine' });

  console.log('Final Prompt:', prompt);
  console.log('-------');
  console.log('Response:', await llm.call(prompt));
}

async function exampleSelectors(): Promise<void> {
  const llm = new OpenAI();

  const examplePrompt = new PromptTemplate({
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

  const exampleSelector = await SemanticSimilarityExampleSelector.fromExamples(
    examples,
    new OpenAIEmbeddings(),
    FaissStore,
    { k: 2 },
  );

  const similarPrompt = new FewShotPromptTemplate({
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

async function outputParsers(): Promise<void> {
  const llm = new OpenAI();

  const outputParser = StructuredOutputParser.fromNamesAndDescriptions({
    badString: 'Poorly formatted user input string',
    goodString: 'Your response, reformatted input',
  });

  const formatInstructions = outputParser.getFormatInstructions();

  // console.log(formatInstructions);

  const template =
    'You will be given a poorly formatted string from a user.\n' +
    'Reformat it and make sure all the words are spelled correctly.\n' +
    '\n' +
    '{formatInstructions}\n' +
    '\n' +
    '% USER INPUT:\n' +
    '{userInput}\n' +
    '\n' +
    'YOUR RESPONSE:';

  const prompt = new PromptTemplate({
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

async function docLoaders(): Promise<void> {
  const loader = new HNLoader('https://news.ycombinator.com/item?id=34817881');

  const data = await loader.load();

  console.log(`Found ${data.length} documents.`);
  console.log(data[0]);
}

async function textSplitters(): Promise<void> {
  const loader = new TextLoader('src/refs/2021-test.txt');

  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  console.log(splitDocs[100]);
}

async function retrievers(): Promise<void> {
  const loader = new TextLoader('src/refs/2021-test.txt');

  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings();

  // db
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

  const retriever = vectorStore.asRetriever();

  const relevantDocs = await retriever.getRelevantDocuments(
    'У чому полягає історична цінність карикатур?',
  );
  console.log(relevantDocs);
}

async function vectorStores(): Promise<void> {
  // Pinecone + Weaviate
  // FaissStore & Chroma for local
  const loader = new TextLoader('src/refs/2021-test.txt');

  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings();

  const embeddingsList = await embeddings.embedDocuments(splitDocs.map((doc) => doc.pageContent));

  console.log(splitDocs.length);
  console.log(embeddingsList.length);
}

async function memory(): Promise<void> {
  const chat = new ChatOpenAI({ temperature: 0 });

  const history = new ChatMessageHistory();

  await history.addAIChatMessage('Hello, I am a chatbot.');
  await history.addUserMessage('What is the capital of Ukraine?');

  // console.log(await history.getMessages());

  const aiResponse = await chat.call(await history.getMessages());

  await history.addAIChatMessage(aiResponse.content);

  console.log(await history.getMessages());
}

async function simpleSequentialChain(): Promise<void> {
  const llm = new OpenAI({ temperature: 1 });

  const locationTemplate = `
  Your job is to come up with a classic dish from the area that users suggest.
  % USER LOCATION
  
  {userLocation}
  YOUR RESPONSE:
  `;

  const locationPrompt = new PromptTemplate({
    template: locationTemplate,
    inputVariables: ['userLocation'],
  });

  const locationChain = new LLMChain({ llm, prompt: locationPrompt });

  const mealTemplate = `
  Given a meal, give a short and simple recipe on how to make that dish at home.
  % MEAL
  
  {userMeal}
  YOUR RESPONSE:
  `;

  const mealPrompt = new PromptTemplate({
    template: mealTemplate,
    inputVariables: ['userMeal'],
  });

  const mealChain = new LLMChain({ llm, prompt: mealPrompt });

  const overallChain = new SimpleSequentialChain({
    chains: [locationChain, mealChain],
    verbose: true,
  });

  const response = await overallChain.run('Ukraine');

  console.log(response);
}

async function summarizationChain(): Promise<void> {
  const llm = new OpenAI({ temperature: 1 });
  const loader = new TextLoader('src/data/tristan-tate.txt');
  const doc = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 40,
  });
  const splitDocs = await splitter.splitDocuments(doc);
  // console.log(splitDocs.length);

  const chain = loadSummarizationChain(llm, { type: 'map_reduce', verbose: true });

  const summary = await chain.call({ input_documents: splitDocs });
  console.log(summary);
}

async function agents(): Promise<void> {
  const llm = new OpenAI({ temperature: 0 });

  const toolkit = [new SerpAPI(process.env.SERP_API_KEY)];

  const agent = await initializeAgentExecutorWithOptions(toolkit, llm, {
    verbose: true,
    agentType: 'zero-shot-react-description',
  });

  const res = await agent.run(
    'What is the second album of the band that Adam Gontier became famous in?',
  );

  console.log(res);
}

export async function concepts(): Promise<void> {
  await agents();
}
