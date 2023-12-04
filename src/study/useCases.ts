import path from 'node:path';

import {
  LLMChain,
  loadQAStuffChain,
  loadSummarizationChain,
  RetrievalQAChain,
} from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { BufferMemory } from 'langchain/memory';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate } from 'langchain/prompts';
import { HumanMessage } from 'langchain/schema';
import { RunnableSequence } from 'langchain/schema/runnable';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { FaissStore } from 'langchain/vectorstores/faiss';

import { loadFolder } from '../utils/loadFolder';

// Summarization
async function summarizeShortText(): Promise<void> {
  const llm = new OpenAI({ temperature: 0 });

  const template = `
  %INSTRUCTIONS:
  Please summarize the following piece of text.
  Respond in a manner that a 5 year old would understand.
  
  %TEXT:
  {text}
  `;

  const prompt = PromptTemplate.fromTemplate(template);

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

async function summarizeMapReduce(): Promise<void> {
  const docs = await new TextLoader('src/data/good.txt').load();
  const llm = new OpenAI({ temperature: 0 });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 350,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const summarizeChain = loadSummarizationChain(llm, { type: 'map_reduce', verbose: true });

  const output = await summarizeChain.call({ input_documents: splitDocs });
  console.log(output);
}

// QA over Documents

async function qaSimple(): Promise<void> {
  // answer = llm(context + question)
  const llm = new OpenAI({ temperature: 0 });

  const context = `
  Rachel is 30 years old
  Bob is 45 years old
  Kevin is 65 years old
  `;

  const question = 'Who is under 50 years old?';

  const output = await llm.call(context + question);
  console.log(output);
}

async function qaWithEmbeddings(): Promise<void> {
  const llm = new OpenAI({ temperature: 0 });
  const loader = new TextLoader('src/data/worked.txt');
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3000,
    chunkOverlap: 400,
  });
  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

  const stuffChain = loadQAStuffChain(llm, { verbose: true });
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

async function extractionSimple(): Promise<void> {
  const chatModel = new ChatOpenAI({ temperature: 0 });

  const instructions = `
  You will be given a sentence with fruit names, extract those fruit names and assign an emoji to them
  Return the fruit name and emojis in a javascript object
  `;

  const fruits = 'Apple, Pear, this is a kiwi';

  const prompt = instructions + fruits;

  const output = await chatModel.call([new HumanMessage(prompt)]);
  console.log(output);

  const parsedOutput = JSON.parse(output.content);
  console.log(parsedOutput);
}

async function extractionOutputParser(): Promise<void> {
  const chatModel = new ChatOpenAI({ temperature: 0 });

  const outputParser = StructuredOutputParser.fromNamesAndDescriptions({
    name: 'The name of the musical artist',
    song: 'The name of the song that the artist plays',
  });

  const formatInstructions = outputParser.getFormatInstructions();

  // console.log(formatInstructions);

  const prompt = new ChatPromptTemplate({
    partialVariables: { formatInstructions },
    promptMessages: [
      HumanMessagePromptTemplate.fromTemplate(
        'Given a command from the user, extract the artist and song names \n \\\n {formatInstructions}\n{userPrompt}',
      ),
    ],
    inputVariables: ['userPrompt'],
  });

  const query = await prompt.formatMessages({ userPrompt: 'I really like Nowadays by Lil Skies' });

  // console.log(query[0].content);

  const output = await chatModel.call(query);
  const parsedOutput = await outputParser.parse(output.content);
  console.log(parsedOutput);
}

async function extractionOutputParserChain(): Promise<void> {
  const chatModel = new ChatOpenAI({ temperature: 0 });

  const outputParser = StructuredOutputParser.fromNamesAndDescriptions({
    name: 'The name of the musical artist',
    song: 'The name of the song that the artist plays',
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      'Given a command from the user, extract the artist and song names \n \\\n {formatInstructions}',
    ],
    ['human', '{userPrompt}'],
  ]);

  // Sequence chain
  const chain = RunnableSequence.from([prompt, chatModel, outputParser]);

  const res = await chain.invoke({
    userPrompt: 'I really like Nowadays by Lil Skies',
    formatInstructions: outputParser.getFormatInstructions(),
  });

  console.log(res);

  // Llm chain
  const chainB = new LLMChain({
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
async function code(): Promise<void> {
  const chatModel = new ChatOpenAI({ temperature: 0 });
  const embeddings = new OpenAIEmbeddings();

  const docs = await Promise.all(
    loadFolder(path.join(process.cwd(), 'src', 'data', 'thefuzz')).map(
      async (doc) => (await new TextLoader(doc).loadAndSplit())[0],
    ),
  );
  // console.log(docs);

  const vectorStore = await FaissStore.fromDocuments(docs, embeddings);

  const qaChain = RetrievalQAChain.fromLLM(chatModel, vectorStore.asRetriever());

  const query =
    'What function do I use if I want to find the most similar item in a list of items?';

  const output = await qaChain.call({ query });
  // console.log(output);

  const queryCode =
    'Can you write the code to use the process.extractOne() function? Only respond with code. No other text or explanation';
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

async function chatBot(): Promise<void> {
  // llm + memory
  const template = `
  You are a chatbot that is unhelpful.
  Your goal is to not help the user but only make jokes.
  Take what the user is saying and make a joke out of it
  
  {chatHistory}
  Human: {humanInput}
  Chatbot:
  `;

  const prompt = new PromptTemplate({
    template,
    inputVariables: ['chatHistory', 'humanInput'],
  });

  const llm = new ChatOpenAI({ temperature: 0 });
  const memory = new BufferMemory({ memoryKey: 'chatHistory' });

  const llmChain = new LLMChain({
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

export const useCases = chatBot;
