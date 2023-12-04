import { ChatOpenAI } from 'langchain/chat_models/openai';
import { OpenAI } from 'langchain/llms/openai';
import { ChatPromptTemplate } from 'langchain/prompts';

export async function llmsChat(): Promise<void> {
  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const template =
    "You are a helpful assistant that translates {input_language} into {output_language}. In the beginning of every answer always introduce yourself as 'Привіт мене звати Мета! Ось твій переклад:'";
  const humanTemplate = '{text}';

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ['system', template],
    ['human', humanTemplate],
  ]);

  const formattedChatPrompt = await chatPrompt.formatMessages({
    input_language: 'English',
    output_language: 'Ukrainian',
    text: 'I love programming.',
  });

  const text = 'Who is Volodymyr Zelensky?';

  // const llmResult = await llm.predict(text);
  // console.log(llmResult);

  const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const chatModelResult = await chatModel.predictMessages(formattedChatPrompt);
  console.log(chatModelResult);
}
