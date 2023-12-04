import { RetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

import { OPENAI_API_KEY } from './key';

export async function htmlToText(query: string, source: string): Promise<void> {
  const loader = new CheerioWebBaseLoader(source, {
    selector: '.task-card',
  });

  const docs = await loader.load();

  const splitter = RecursiveCharacterTextSplitter.fromLanguage('html');
  const transformer = new HtmlToTextTransformer();

  const sequence = splitter.pipe(transformer);

  const splitDocs = await sequence.invoke(docs);

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

  // console.log(newDocuments);
}
