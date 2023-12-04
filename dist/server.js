"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
const upload_1 = require("./src/final/upload");
// import { concepts } from './src/study/concepts';
// import { useCases } from './src/study/useCases';
dotenv_1.default.config();
const link = 'https://zno.osvita.ua/ukraine-history/493/';
const filePath = node_path_1.default.resolve('tests', '2021-ADDITIONAL.json');
(async function () {
    await (0, upload_1.upload)(filePath);
    // await aiParse(link);
})();
