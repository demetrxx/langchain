"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
async function upload(filePath) {
    const file = node_fs_1.default.readFileSync(filePath, 'utf8');
    await fetch(process.env.API_URL ?? '', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
        body: file,
    });
}
exports.upload = upload;
