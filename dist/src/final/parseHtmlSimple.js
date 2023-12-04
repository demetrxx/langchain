"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHtml = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const cheerio_1 = __importDefault(require("cheerio"));
function clearHtml(html) {
    return html
        .replace(/[\n\t]/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/ /g, ' ')
        .replace(/\u00a0/g, ' ');
}
function findText(el) {
    if (el.type === 'text') {
        return el.data;
    }
    if (el.children) {
        return el.children.map(findText).join('');
    }
    return '';
}
// Data/getters
const correctMap = {
    А: 0,
    Б: 1,
    В: 2,
    Г: 3,
    Д: 4,
};
const getType = (id) => {
    const num = id + 1;
    if (num <= 23 || (num >= 31 && num <= 53)) {
        return 'SINGLE';
    }
    if ((num >= 24 && num <= 26) || (num >= 54 && num <= 56)) {
        return 'MATCH';
    }
    if ((num >= 27 && num <= 28) || (num >= 57 && num <= 58)) {
        return 'ORDER';
    }
    if ((num >= 29 && num <= 30) || (num >= 59 && num <= 60)) {
        return 'SELECT';
    }
    return 'SINGLE';
};
async function parseHtml({ html, getTopic, }) {
    const $ = cheerio_1.default.load(clearHtml(html));
    // Field getters
    function getId(i) {
        return i.attribs.id;
    }
    function getOrder(id) {
        return parseInt(id.slice(1));
    }
    function getName(id) {
        return $(`#${id} .question`).html();
    }
    function getOptions(id) {
        const options = [];
        $(`#${id} .marker`).remove();
        $(`#${id} .answer`).each(function () {
            const isImg = this.children.filter((i) => i.name === 'img').length > 0;
            if (isImg) {
                const [option] = this.children
                    .filter((i) => i.name === 'img')
                    .map((i) => i.attribs.src);
                options.push(option);
            }
            else {
                const option = findText(this)?.trim();
                option && options.push(option);
            }
        });
        return options;
    }
    async function getSolutionWithTopic(id) {
        const explanationRaw = $(`#${id} .explanation`);
        const solution = explanationRaw.html()?.replace('<strong>Коментар</strong><br><br>', '');
        const topicStr = explanationRaw.children()[3]?.children?.[0]?.children?.[0]?.data;
        if (!topicStr) {
            return { solution, topics: [] };
        }
        const topics = await getTopic(topicStr);
        return { solution, topics };
    }
    function getCorrectNums(id) {
        const correctRaw = $(`#${id} .explanation strong`).text();
        const correct = correctRaw.split('Правильна відповідь')[1].match(/[1234567]/g) ?? [];
        return correct?.map((i) => parseInt(i) - 1);
    }
    const getCorrectChars = (id) => {
        const correctRaw = $(`#${id} .explanation strong`).text();
        const correct = correctRaw.split('Правильна відповідь')[1].match(/[АБВГД]/g) ?? [];
        return correct.map((i) => correctMap[i]);
    };
    function getTypeGetters(type) {
        return type === 'SELECT' ? getCorrectNums : getCorrectChars;
    }
    function getTestMeta() {
        const title = $('title').text();
        const year = parseInt(title.match(/\d+/)?.[0] ?? '3000');
        let type = 'MAIN';
        if (title.includes('пробний')) {
            type = 'TEST';
        }
        if (title.includes('додаткова')) {
            type = 'ADDITIONAL';
        }
        if (title.includes('1 сесія')) {
            type = 'FIRST';
        }
        if (title.includes('2 сесія')) {
            type = 'SECOND';
        }
        if (title.includes('демоваріант')) {
            type = 'DEMO';
        }
        return { year, type };
    }
    async function parseQuestion(i) {
        const type = getType(i);
        const getCorrect = getTypeGetters(type);
        const id = getId(this);
        const order = getOrder(id);
        const name = getName(id);
        const options = getOptions(id);
        const { solution, topics } = await getSolutionWithTopic(id);
        const correct = getCorrect(id);
        return {
            order,
            type,
            name,
            options,
            topics,
            correct,
            solution,
        };
    }
    const questions = await Promise.all($('.task-card').slice(0, 60).map(parseQuestion));
    const { year, type } = getTestMeta();
    const test = {
        year,
        type,
        questions,
    };
    const jsonData = JSON.stringify(test);
    const fileName = `./tests/${year}-${type}.json`;
    node_fs_1.default.writeFileSync(fileName, jsonData, 'utf-8');
    console.log(`JSON data has been written to ${fileName}`);
}
exports.parseHtml = parseHtml;
