import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const BLOG_DIR = path.resolve(process.cwd(), 'blog');

function extractFrontMatter(content) {
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) return null;
  try {
    return yaml.load(match[1]);
  } catch {
    return null;
  }
}

function replaceFrontMatter(content, newFrontMatter) {
  return content.replace(
    /^---([\s\S]*?)---/,
    `---\n${yaml.dump(newFrontMatter)}---`,
  );
}

async function main() {
  const files = await fs.readdir(BLOG_DIR);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(BLOG_DIR, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const frontMatter = extractFrontMatter(content);
    if (!frontMatter) continue;
    if (frontMatter.authors === 'pensjonatus') continue;
    frontMatter.authors = 'pensjonatus';
    content = replaceFrontMatter(content, frontMatter);
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`Updated authors in: ${file}`);
  }
}

main().catch(console.error);
