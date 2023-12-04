"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFolder = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function loadFolder(dirPath) {
    const files = [];
    function walkDir(curPath) {
        const filesAndDirs = node_fs_1.default.readdirSync(curPath);
        for (const fileOrDir of filesAndDirs) {
            const filePath = node_path_1.default.join(curPath, fileOrDir);
            const stat = node_fs_1.default.statSync(filePath);
            if (stat.isDirectory()) {
                walkDir(filePath);
            }
            else if (stat.isFile()) {
                files.push(filePath);
            }
        }
    }
    walkDir(dirPath);
    return files;
}
exports.loadFolder = loadFolder;
