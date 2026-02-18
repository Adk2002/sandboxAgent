import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { generateWebApp, writeAppToTestingFolder, runInSandbox } from "./agents";

// Load environment variables from .env file
dotenv.config();
const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────

// Health-check
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "running",
    endpoints: {
      "POST /generate": "Generate a web app from a prompt (writes to ./testing/)",
      "POST /generate-and-run": "Generate + deploy to CodeSandbox",
    },
  });
});

/**
 * POST /generate
 * Body: { "prompt": "Build a todo app with categories" }
 *
 * 1. Sends the prompt to Claude  →  gets structured JSON
 * 2. Writes all files to ./testing/<appName>/
 * 3. Returns the file list + project path
 */
app.post("/generate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "A 'prompt' string is required in the request body." });
      return;
    }

    console.log("\n════════════════════════════════════════");
    console.log("  New generation request");
    console.log("════════════════════════════════════════");

    // Step 1 — Ask Claude to generate the app
    const generatedApp = await generateWebApp(prompt);

    // Step 2 — Write files locally into ./testing/<appName>/
    const projectPath = writeAppToTestingFolder(generatedApp);

    res.json({
      success: true,
      appName: generatedApp.appName,
      description: generatedApp.description,
      projectPath,
      files: generatedApp.files.map((f) => f.path),
    });
  } catch (err: any) {
    console.error("❌ Generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /generate-and-run
 * Body: { "prompt": "Build a todo app" }
 *
 * Same as /generate but also deploys into a CodeSandbox
 * and returns preview URLs.
 */
app.post("/generate-and-run", async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "A 'prompt' string is required in the request body." });
      return;
    }

    console.log("\n════════════════════════════════════════");
    console.log("  New generation + sandbox request");
    console.log("════════════════════════════════════════");

    // Step 1 — Generate
    const generatedApp = await generateWebApp(prompt);

    // Step 2 — Write locally
    const projectPath = writeAppToTestingFolder(generatedApp);

    // Step 3 — Deploy to CodeSandbox
    const sandbox = await runInSandbox(generatedApp);

    res.json({
      success: true,
      appName: generatedApp.appName,
      description: generatedApp.description,
      projectPath,
      files: generatedApp.files.map((f) => f.path),
      sandbox,
    });
  } catch (err: any) {
    console.error("❌ Generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Web-App Generator running at http://localhost:${PORT}`);
  console.log(`   POST /generate           → generate app locally`);
  console.log(`   POST /generate-and-run   → generate + sandbox\n`);
});
