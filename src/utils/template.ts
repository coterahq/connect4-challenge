/**
 * Load an HTML template file and return its contents as a string
 */
export async function loadTemplate(path: string): Promise<string> {
  return await Bun.file(path).text();
} 