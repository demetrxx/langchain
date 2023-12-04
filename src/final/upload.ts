import fs from 'node:fs';

export async function upload(filePath: string): Promise<void> {
  const file = fs.readFileSync(filePath, 'utf8');

  await fetch(process.env.API_URL ?? '', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
    body: file,
  });
}
