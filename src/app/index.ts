try {
    if (process.env.NO_UPDATE !== "true") {
        await import("./updater");
    } else {
        console.log("[VoidTube-quick-updater] Update disabled. Skipping...");
    }
} catch (err) {
    console.error(err);
} finally {
    try {
        const arg0 = process.argv[0];
        const isDev = ["election", "node"].includes(arg0);
        const args = process.argv.slice(isDev ? 2 : 1);
        
        const script = await import("../shared/script");
        const code = await script.run(args);
        if (code > 0) process.exit(code);
        if (code == -1) process.exit(0);
        await import("./app");
    } catch {
        await import("./app");
    }
}

export {};