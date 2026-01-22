export async function run(args: string[]): Promise<number> {
    if (args.length == 0) return;
    if (args[0] === ".") return;
    try {
        const { default: runScript } = await import(`./scripts/${args[0]}.js`);
        return await runScript(args.slice(1));
    } catch (err) {
        console.error(err);
        return 0;
    }
}