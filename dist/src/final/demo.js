"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiParse2 = void 0;
const openai_1 = require("langchain/llms/openai");
const prompts_1 = require("langchain/prompts");
const fetchHtml_1 = require("../utils/fetchHtml");
const parseHtmlSimple_1 = require("./parseHtmlSimple");
const topics_1 = require("./topics");
async function aiParse2(url) {
    const model = new openai_1.OpenAI({
        temperature: 0,
        modelName: 'gpt-3.5-turbo',
        verbose: true,
        timeout: 10000,
    });
    // const prompt = `
    //   Given a javascript object of topics and their corresponding ids, return an array of topic ids, that correspond to the topics that you will find in a provided string.
    //   String may have one, many or no topics. Wording of the topics in the string may vary a little from the ones in the object, so find the most appropriate ones.
    //   Return an empty array if no topics are found. Return arrays and nothing else.
    //   Topics and string are in Ukrainian language.
    //   Example output: [1, 21, 30].
    //
    //   % Topics object:
    //   {topicsMap}
    //
    //   % String:
    //   {string}
    //
    //   % Your answer:
    //   `;
    const prompt2 = `
  This is a map of topics and their ids:
  {topicsMap}
  
  Given the string bellow, return an array of topics that were mentioned, but as an array of their ids from the map above. 
  Wording of topics may differ slightly, so be aware of that.
  
  String:
  {string}
  
  Your answer:
  `;
    async function getTopic(string) {
        const promptTemplate = prompts_1.PromptTemplate.fromTemplate(prompt2);
        const prompt = await promptTemplate.format({ string, topicsMap: JSON.stringify(topics_1.topicsMap) });
        const res = await model.call(prompt);
        return JSON.parse(res);
    }
    const html = await (0, fetchHtml_1.fetchHTML)(url);
    if (!html) {
        console.error('Error fetching HTML');
        return;
    }
    await (0, parseHtmlSimple_1.parseHtml)({ html, getTopic });
    // console.log(doc);
    // const docs = await loadQDocs(link);
    // const parser = StructuredOutputParser.fromNamesAndDescriptions({
    //   name: 'Текст завдання',
    //   options: 'Варіанти відповіді',
    //   topic: 'Назва теми',
    // });
    //
    // const chain = RunnableSequence.from([
    //   PromptTemplate.fromTemplate(
    //     '{taskDescription}.\n{formatInstructions}\nQuestion {question}\nYour answer:',
    //   ),
    //   new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' }),
    // ]);
    //
    // const taskDescription =
    //   "You'll be given a test question in Ukrainian language. Give me it's structure";
    // const response = await chain.invoke({
    //   question: docs[0].pageContent,
    //   taskDescription,
    //   formatInstructions: parser.getFormatInstructions(),
    // });
    // console.log(response);
}
exports.aiParse2 = aiParse2;
