import { RetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { TextLoader } from 'langchain/document_loaders/fs/text';
// import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
// import { PuppeteerWebBaseLoader } from 'langchain/document_loaders/web/puppeteer';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

import { OPENAI_API_KEY } from './key';
export async function readMe(query: string, source: string): Promise<void> {
  const loader = new TextLoader(source);
  // const loader = new TextLoader(path.join(path.resolve(), 'src', 'demo.txt'));
  const data = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });

  const splitDocs = await textSplitter.splitDocuments(data);

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });

  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    openAIApiKey: OPENAI_API_KEY,
  });

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const response = await chain.call({
    query,
  });

  console.log(response);
}
