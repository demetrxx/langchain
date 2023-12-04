import fs from 'node:fs';
import path from 'node:path';

export function loadFolder(dirPath: string): string[] {
  const files: string[] = [];

  function walkDir(curPath: string): void {
    const filesAndDirs = fs.readdirSync(curPath);

    for (const fileOrDir of filesAndDirs) {
      const filePath = path.join(curPath, fileOrDir);

      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (stat.isFile()) {
        files.push(filePath);
      }
    }
  }

  walkDir(dirPath);
  return files;
}
