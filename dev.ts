const args = process.argv.slice(2);
const script = await import("./src/shared/script");
const code = await script.run(args);
if (code > 0) process.exit(code);
if (code == -1) process.exit(0);
await import("./src/server/index");

export {};