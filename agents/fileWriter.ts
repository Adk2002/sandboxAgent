import fs from "fs";
import path from "path";
import { GeneratedApp } from "./webAppAgent";

const TESTING_DIR = path.join(__dirname, "..", "testing");

/**
 * Writes every file from the GeneratedApp into ./testing/<appName>/
 * Returns the absolute path of the created project folder.
 */
export function writeAppToTestingFolder(app: GeneratedApp): string {
  const projectDir = path.join(TESTING_DIR, app.appName);

  // Wipe previous version if it exists
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
    console.log(`🗑️  Removed previous "${app.appName}" folder.`);
  }

  for (const file of app.files) {
    const filePath = path.join(projectDir, file.path);
    const dir = path.dirname(filePath);

    // Create nested directories as needed
    fs.mkdirSync(dir, { recursive: true });

    // Write file content
    fs.writeFileSync(filePath, file.content, "utf-8");
    console.log(`   📄 ${file.path}`);
  }

  // Write a small metadata file for reference
  const meta = {
    appName: app.appName,
    description: app.description,
    generatedAt: new Date().toISOString(),
    totalFiles: app.files.length,
  };
  fs.writeFileSync(path.join(projectDir, "_meta.json"), JSON.stringify(meta, null, 2), "utf-8");

  console.log(`\n📁 Project written to: ${projectDir}`);
  return projectDir;
}
