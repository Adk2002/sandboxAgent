import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// ---------- Types ----------
export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratedApp {
  appName: string;
  description: string;
  files: GeneratedFile[];
}

// ---------- Load system prompt ----------
const SYSTEM_PROMPT_PATH = path.join(__dirname, "..", "templates", "systemPrompt.txt");

function loadSystemPrompt(): string {
  const raw = fs.readFileSync(SYSTEM_PROMPT_PATH, "utf-8");
  // Strip any markdown fences or extra commentary — keep only the prompt text
  const fenceStart = raw.indexOf("You are an expert");
  const fenceEnd = raw.lastIndexOf("Do NOT include any explanation");
  if (fenceStart !== -1 && fenceEnd !== -1) {
    return raw.slice(fenceStart, fenceEnd + "Do NOT include any explanation, markdown, or text outside the JSON object.".length);
  }
  return raw;
}

// ---------- Agent ----------
export async function generateWebApp(userPrompt: string): Promise<GeneratedApp> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY is not set in environment variables.");
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = loadSystemPrompt();

  console.log("🤖 Sending prompt to Claude…");
  console.log(`   User prompt: "${userPrompt}"\n`);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  // Extract text content from the response
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return a text response.");
  }

  const raw = textBlock.text.trim();

  // Parse the JSON — Claude should return pure JSON per the system prompt
  let parsed: GeneratedApp;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Sometimes Claude wraps JSON in ```json ... ``` fences — try to extract
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      throw new Error("Failed to parse Claude response as JSON.\n\nRaw response:\n" + raw.slice(0, 500));
    }
  }

  // Basic validation
  if (!parsed.appName || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    throw new Error("Claude returned an invalid app structure (missing appName or files).");
  }

  console.log(`✅ Claude generated "${parsed.appName}" with ${parsed.files.length} files.`);
  return parsed;
}
