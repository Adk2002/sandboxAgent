import { CodeSandbox } from "@codesandbox/sdk";
import { GeneratedApp } from "./webAppAgent";

/**
 * Creates a CodeSandbox sandbox, uploads the generated files,
 * installs dependencies, and starts both backend & frontend.
 *
 * Returns the sandbox URL so the user can preview the running app.
 */
export async function runInSandbox(app: GeneratedApp): Promise<{ sandboxId: string; urls: string[] }> {
  const apiKey = process.env.SANDBOX_API_KEY;
  if (!apiKey) {
    throw new Error("SANDBOX_API_KEY is not set in environment variables.");
  }

  const sdk = new CodeSandbox(apiKey);

  console.log("\n🏖️  Creating CodeSandbox…");
  const sandbox = await sdk.sandboxes.create();
  console.log(`   Sandbox ID : ${sandbox.id}`);

  // Connect to get the sandbox client for file/shell operations
  const client = await sandbox.connect();

  // Upload all generated files
  console.log("📤 Uploading files…");
  const filesToUpload = app.files.map((f) => ({
    path: `/project/${f.path}`,
    content: f.content,
  }));
  await client.fs.batchWrite(filesToUpload);
  app.files.forEach((f) => console.log(`   ✔ ${f.path}`));

  // Install backend dependencies & start
  console.log("\n⚙️  Installing backend dependencies…");
  const backendInstall = await client.commands.run("cd /project/backend && npm install");
  console.log(backendInstall.slice(-200)); // last 200 chars

  console.log("🚀 Starting backend server…");
  await client.commands.runBackground("cd /project/backend && node index.js");

  // Install frontend dependencies & start
  console.log("⚙️  Installing frontend dependencies…");
  const frontendInstall = await client.commands.run("cd /project/frontend && npm install");
  console.log(frontendInstall.slice(-200));

  console.log("🚀 Starting frontend dev server…");
  await client.commands.runBackground("cd /project/frontend && npx vite --host 0.0.0.0");

  // Give servers a moment to boot
  await new Promise((r) => setTimeout(r, 5000));

  // Gather preview URLs from sandbox ports
  const ports = await client.ports.getAll();
  const urls = ports.map((p: { host: string; port: number }) =>
    p.host ? `https://${p.host}` : `https://${sandbox.id}-${p.port}.csb.app`
  );

  console.log("\n🌐 Preview URLs:");
  urls.forEach((u: string) => console.log(`   ${u}`));

  // Disconnect (sandbox stays running)
  await client.disconnect();

  return { sandboxId: sandbox.id, urls };
}
