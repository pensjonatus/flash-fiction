import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const BLOG_DIR = path.resolve(process.cwd(), 'blog');
const TAGS_YML = path.join(BLOG_DIR, 'tags.yml');

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

function tagObject(tag) {
  return {
    label: tag.charAt(0).toUpperCase() + tag.slice(1),
    permalink: `/${tag}`,
    description: `${tag.charAt(0).toUpperCase() + tag.slice(1)} tag description`,
  };
}

async function main() {
  const tagSet = new Set();
  const files = await fs.readdir(BLOG_DIR);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(BLOG_DIR, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const frontMatter = extractFrontMatter(content);
    if (!frontMatter) continue;
    let changed = false;
    let tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [];
    if (Array.isArray(frontMatter.categories)) {
      tags = Array.from(new Set([...tags, ...frontMatter.categories]));
      delete frontMatter.categories;
      changed = true;
    }
    if (tags.length) {
      frontMatter.tags = tags;
      tags.forEach((t) => tagSet.add(t));
      changed = true;
    }
    if (changed) {
      content = replaceFrontMatter(content, frontMatter);
      await fs.writeFile(filePath, content, 'utf-8');
    }
  }
  // Write tags.yml in the requested format
  const tagList = Array.from(tagSet).sort();
  const tagMap = {};
  for (const tag of tagList) {
    tagMap[tag] = tagObject(tag);
  }
  const yml = yaml.dump(tagMap, { lineWidth: 0 });
  await fs.writeFile(TAGS_YML, yml, 'utf-8');
  console.log('tags.yml updated with tags:', tagList);
}

main().catch(console.error);
