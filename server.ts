import path from 'node:path';

import dotenv from 'dotenv';

import { aiParse } from './src/final/aiParser';
import { upload } from './src/final/upload';

// import { concepts } from './src/study/concepts';
// import { useCases } from './src/study/useCases';

dotenv.config();

const link = 'https://zno.osvita.ua/ukraine-history/493/';
const filePath = path.resolve('tests', '2021-MAIN.json');

(async function () {
  await upload(filePath);
  // await aiParse(link);
})();
