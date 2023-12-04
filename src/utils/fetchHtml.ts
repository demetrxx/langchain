export async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    throw new Error(`Error fetching HTML`);
  }
}
