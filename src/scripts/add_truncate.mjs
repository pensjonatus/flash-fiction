import fs from "fs/promises";
import path from "path";

const BLOG_DIR = path.resolve(process.cwd(), "blog");

function countWords(text) {
  return (text.match(/\b\w+\b/g) || []).length;
}

async function processFile(filePath) {
  let content = await fs.readFile(filePath, "utf-8");
  // Split paragraphs (empty line or more)
  const paragraphs = content.split(/(\r?\n\s*\r?\n)/);
  let wordSum = 0;
  let truncateInserted = false;
  let newContent = [];

  for (let i = 0; i < paragraphs.length; i += 2) {
    const para = paragraphs[i];
    const sep = paragraphs[i + 1] || "";
    newContent.push(para);
    wordSum += countWords(para);
    if (!truncateInserted && wordSum >= 20) {
      // Ensure a blank line before the truncate tag
      newContent.push("\n\n<!-- truncate -->\n");
      truncateInserted = true;
    }
    newContent.push(sep);
  }

  if (truncateInserted) {
    await fs.writeFile(filePath, newContent.join(""), "utf-8");
    console.log(`Processed: ${filePath}`);
  } else {
    console.log(`Skipped (not enough words): ${filePath}`);
  }
}

async function processDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      await processFile(fullPath);
    }
  }
}

processDir(BLOG_DIR).catch(console.error);
