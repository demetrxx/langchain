import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatPromptTemplate } from 'langchain/prompts';
import { BaseOutputParser } from 'langchain/schema/output_parser';

/**
 * Parse the output of an LLM call to a comma-separated list.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
class CommaSeparatedListOutputParser extends BaseOutputParser<string[]> {
  async parse(text: string): Promise<string[]> {
    return text.split(',').map((item) => item.trim());
  }
}

const template = `You are a helpful assistant who generates comma separated lists.
A user will pass in a category, and you should generate 5 objects in that category in a comma separated list.
ONLY return a comma separated list, and nothing more.`;

const humanTemplate = '{text}';

/**
 * Chat prompt for generating comma-separated lists. It combines the system
 * template and the human template.
 */
const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', template],
  ['human', humanTemplate],
]);

const parser = new CommaSeparatedListOutputParser();

export async function getList(): Promise<void> {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const chain = chatPrompt.pipe(model).pipe(parser);

  const result = await chain.invoke({
    text: 'cars',
  });

  console.log(result);
}
