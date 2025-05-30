try {
    if (process.env.NO_UPDATE !== "true") {
        await import("./updater");
    } else {
        console.log("[VoidTube-quick-updater] Update disabled. Skipping...");
    }
} catch (err) {
    console.error(err);
} finally {
    await import("./app");
}

export {};