import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function readRepoFile(relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || path.isAbsolute(relativePath)) {
    throw new TypeError("relativePath must be a non-empty relative path");
  }
  const resolvedPath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, resolvedPath);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new RangeError("relativePath must stay within the package root");
  }
  return readFileSync(resolvedPath, "utf8");
}

export function parseFrontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/u)
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator < 1) throw new Error(`invalid frontmatter line: ${line}`);
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, "$1$2");
        return [key, value];
      }),
  );
}

export function readSection(markdown, heading) {
  if (typeof heading !== "string" || heading.length === 0) throw new TypeError("heading must be a non-empty string");
  const lines = markdown.split(/\r?\n/u);
  const start = lines.findIndex((line) => /^#{1,6}\s+/u.test(line) && line.replace(/^#{1,6}\s+/u, "").trim() === heading);
  if (start < 0) return "";
  const level = lines[start].match(/^#+/u)[0].length;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = /^(#+)\s+/u.exec(lines[index]);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

export function wordCount(text) {
  const words = String(text).trim().match(/\S+/gu);
  return words ? words.length : 0;
}
