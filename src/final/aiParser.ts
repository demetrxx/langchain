import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { RunnablePassthrough, RunnableSequence } from 'langchain/schema/runnable';
import { formatDocumentsAsString } from 'langchain/util/document';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';

import { fetchHTML } from '../utils/fetchHtml';
import { parseHtml } from './parseHtmlSimple';
import { topicsMap } from './topics';

async function aiParse(url: string): Promise<void> {
  const config = {
    temperature: 0,
    modelName: 'gpt-4-1106-preview',
    verbose: true,
  };

  const models = [new ChatOpenAI(config), new ChatOpenAI(config), new ChatOpenAI(config)];

  const docs = Object.entries(topicsMap).map(
    ([name, id]) => new Document({ pageContent: `${name}: ${id}`, metadata: { id } }),
  );

  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
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
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate('{string}'),
  ];

  const prompt = ChatPromptTemplate.fromMessages(messages);
  function getChain(model: ChatOpenAI): RunnableSequence<any, string> {
    return RunnableSequence.from([
      {
        topicsList: vectorStoreRetriever.pipe(formatDocumentsAsString),
        string: new RunnablePassthrough(),
      },
      prompt,
      model,
      new StringOutputParser(),
    ]);
  }

  const chains = models.map(getChain);

  let questions = 0;

  async function getTopic(string: string): Promise<any> {
    questions++;
    const finalChain = chains[Math.ceil(questions / 20) - 1];

    const answer = await finalChain.invoke(string);
    return JSON.parse(answer);
  }

  const html = await fetchHTML(url);

  await parseHtml({ html, getTopic });
}

export { aiParse };
