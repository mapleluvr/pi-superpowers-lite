import { readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
export const bootstrapMarker = "superpowers:using-superpowers bootstrap for pi";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const defaultPackageRoot = resolve(extensionDir, "../..");
const defaultBootstrapSkillPath = resolve(defaultPackageRoot, "skills", "using-superpowers", "SKILL.md");

type TodoStatus = "pending" | "in_progress" | "completed";

interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
  priority?: "high" | "medium" | "low";
}

interface SkillMeta {
  name: string;
  description?: string;
  path: string;
}

interface SkillToolDetails {
  requestedSkill?: string;
  availableSkills?: string[];
  skillName?: string;
  skillPath?: string;
  skillDescription?: string;
  totalLines?: number;
  error?: string;
}

interface PiSkillDefinition {
  name: string;
  description?: string;
  filePath: string;
}

interface ExtensionOptions {
  bootstrapSkillPath?: string;
  packageRoot?: string;
}

const TodoWriteSchema = Type.Object({
  todos: Type.Array(
    Type.Object({
      id: Type.String({ description: "Unique identifier for the todo item" }),
      content: Type.String({ description: "The content or description of the todo item" }),
      status: Type.Union([
        Type.Literal("pending"),
        Type.Literal("in_progress"),
        Type.Literal("completed"),
      ]),
      priority: Type.Optional(Type.Union([
        Type.Literal("high"),
        Type.Literal("medium"),
        Type.Literal("low"),
      ])),
    }),
  ),
});

type TodoWriteInput = Static<typeof TodoWriteSchema>;

const SkillSchema = Type.Object({
  skill: Type.String({ description: "Name of the installed skill to load" }),
});

type SkillInput = Static<typeof SkillSchema>;

export function piToolMapping(): string {
  return `## Pi tool mapping

Use Skill({ skill: "name" }) for an installed skill.
Use lowercase Pi tools for file and shell work.
Use subagent from pi-subagents when available.
Do not invent Task calls when no subagent tool exists.
Use TodoWrite when an installed todo tool is available.`;
}

export function buildBootstrapContent(skillBody: string): string {
  return `${EXTREMELY_IMPORTANT_MARKER}
${bootstrapMarker}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Pi session. Follow it now. Do not try to load using-superpowers again.

${stripFrontmatter(skillBody)}

${piToolMapping()}
</EXTREMELY_IMPORTANT>`;
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return (match ? match[1] : content).trim();
}

function messageContainsBootstrap(message: unknown): boolean {
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content.includes(bootstrapMarker);
  if (!Array.isArray(content)) return false;

  return content.some((part) => {
    return (
      part !== null
      && typeof part === "object"
      && (part as { type?: unknown }).type === "text"
      && typeof (part as { text?: unknown }).text === "string"
      && (part as { text: string }).text.includes(bootstrapMarker)
    );
  });
}

function firstNonCompactionSummaryIndex(messages: readonly unknown[]): number {
  let index = 0;
  while ((messages[index] as { role?: unknown } | undefined)?.role === "compactionSummary") {
    index += 1;
  }
  return index;
}

function isInsidePackageRoot(packageRoot: string, filePath: string): boolean {
  const relativePath = relative(packageRoot, resolve(filePath));
  return relativePath === "" || (
    relativePath !== ".."
    && !relativePath.startsWith(`..${sep}`)
    && !isAbsolute(relativePath)
  );
}

function formatTodos(todos: readonly TodoItem[]): string {
  if (todos.length === 0) return "No todos. Use TodoWrite to create tasks.";

  const completed = todos.filter((todo) => todo.status === "completed").length;
  const lines = todos.map((todo, index) => {
    const priority = todo.priority ? `[${todo.priority.toUpperCase()}] ` : "";
    return `${index + 1}. [${todo.status}] ${priority}${todo.content}`;
  });
  return `Todos (${completed}/${todos.length} completed):\n${lines.join("\n")}`;
}

function capturePiSkills(skills: readonly PiSkillDefinition[] | undefined): Map<string, SkillMeta> {
  const available = new Map<string, SkillMeta>();
  for (const skill of skills ?? []) {
    if (!skill.name || !skill.filePath || available.has(skill.name)) continue;
    available.set(skill.name, {
      name: skill.name,
      description: skill.description,
      path: skill.filePath,
    });
  }
  return available;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createSuperpowersPiExtension(options: ExtensionOptions = {}): (pi: ExtensionAPI) => void {
  const packageRoot = resolve(options.packageRoot ?? defaultPackageRoot);
  const skillsDir = resolve(packageRoot, "skills");
  const bootstrapSkillPath = resolve(options.bootstrapSkillPath ?? defaultBootstrapSkillPath);

  return (pi: ExtensionAPI) => {
    let bootstrapCache: string | null | undefined;
    let injectBootstrap = true;
    let todos: TodoItem[] = [];
    let skills = new Map<string, SkillMeta>();
    let conflictWarningEmitted = false;

    const getBootstrapContent = (ctx: ExtensionContext): string | null => {
      if (bootstrapCache !== undefined) return bootstrapCache;

      try {
        bootstrapCache = buildBootstrapContent(readFileSync(bootstrapSkillPath, "utf8"));
        return bootstrapCache;
      } catch (error) {
        bootstrapCache = null;
        const message = `[pi-superpowers-lite] Failed to read bootstrap skill at ${bootstrapSkillPath}: ${errorMessage(error)}`;
        console.error(message);
        if (ctx.hasUI) ctx.ui.notify(message, "error");
        return null;
      }
    };

    pi.registerTool({
      name: "TodoWrite",
      label: "TodoWrite",
      description: "Create, update, or replace the in-session todo list.",
      promptSnippet: "Track tasks with pending, in_progress, and completed status",
      promptGuidelines: [
        "Use TodoWrite when task tracking helps a multi-step task.",
        "Keep todo status current while work is in progress.",
      ],
      parameters: TodoWriteSchema,
      async execute(_toolCallId, params: TodoWriteInput) {
        todos = params.todos.map((todo) => ({
          id: todo.id,
          content: todo.content,
          status: todo.status,
          priority: todo.priority,
        }));
        return {
          content: [{ type: "text", text: formatTodos(todos) }],
          details: { todoCount: todos.length },
        };
      },
    });

    pi.registerTool<typeof SkillSchema, SkillToolDetails>({
      name: "Skill",
      label: "Skill",
      description: "Load the complete instructions for a Pi-installed skill by name.",
      promptSnippet: "Load installed skill instructions",
      promptGuidelines: [
        "Use Skill to load an installed skill before following its workflow.",
      ],
      parameters: SkillSchema,
      async execute(_toolCallId, params: SkillInput) {
        const skill = skills.get(params.skill);
        if (!skill) {
          const availableSkills = [...skills.keys()].sort();
          return {
            content: [{
              type: "text",
              text: `Skill "${params.skill}" not found.\n\nAvailable skills:\n${availableSkills.map((name) => `  - ${name}`).join("\n")}`,
            }],
            isError: true,
            details: { requestedSkill: params.skill, availableSkills },
          };
        }

        try {
          const body = stripFrontmatter(readFileSync(skill.path, "utf8"));
          return {
            content: [{
              type: "text",
              text: `Loaded skill: ${skill.name}${skill.description ? `\n\nDescription: ${skill.description}` : ""}\n---\n\n${body}`,
            }],
            details: {
              skillName: skill.name,
              skillPath: skill.path,
              skillDescription: skill.description,
              totalLines: body.split("\n").length,
            },
          };
        } catch (error) {
          const message = `Error loading skill "${params.skill}": Failed to read skill file at ${skill.path}: ${errorMessage(error)}`;
          return {
            content: [{ type: "text", text: message }],
            isError: true,
            details: { error: "Failed to read skill file", skillPath: skill.path },
          };
        }
      },
    });

    pi.registerCommand("todos", {
      description: "Show current todo list",
      handler: async (_args, ctx) => {
        ctx.ui.notify(formatTodos(todos), "info");
      },
    });

    pi.registerCommand("todo-clear", {
      description: "Clear all todos",
      handler: async (_args, ctx) => {
        todos = [];
        ctx.ui.notify("All todos cleared.", "info");
      },
    });

    pi.on("resources_discover", async () => ({ skillPaths: [skillsDir] }));

    pi.on("session_start", async () => {
      bootstrapCache = undefined;
      conflictWarningEmitted = false;
      injectBootstrap = true;
      skills = new Map<string, SkillMeta>();
      todos = [];
    });

    pi.on("session_compact", async () => {
      injectBootstrap = true;
    });

    pi.on("agent_end", async () => {
      injectBootstrap = false;
    });

    pi.on("before_agent_start", async (event, ctx) => {
      skills = capturePiSkills(event.systemPromptOptions.skills as readonly PiSkillDefinition[] | undefined);
      const usingSuperpowers = skills.get("using-superpowers");
      if (
        !conflictWarningEmitted
        && usingSuperpowers
        && !isInsidePackageRoot(packageRoot, usingSuperpowers.path)
      ) {
        conflictWarningEmitted = true;
        const message = `[pi-superpowers-lite] Pi resolved using-superpowers outside this package (${usingSuperpowers.path}). Remove the conflicting package.`;
        console.warn(message);
        if (ctx.hasUI) ctx.ui.notify(message, "warning");
      }
    });

    pi.on("context", async (event, ctx) => {
      if (!injectBootstrap) return;
      if (event.messages.some(messageContainsBootstrap)) return;

      const bootstrap = getBootstrapContent(ctx);
      if (!bootstrap) return;

      const bootstrapMessage = {
        role: "user" as const,
        content: [{ type: "text" as const, text: bootstrap }],
        timestamp: Date.now(),
      };
      const insertAt = firstNonCompactionSummaryIndex(event.messages);
      return {
        messages: [
          ...event.messages.slice(0, insertAt),
          bootstrapMessage,
          ...event.messages.slice(insertAt),
        ],
      };
    });
  };
}

export default function superpowersPiExtension(pi: ExtensionAPI): void {
  createSuperpowersPiExtension()(pi);
}
