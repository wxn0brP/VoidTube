try {
    await import("./updater");
} catch (err) {
    console.error(err);
} finally {
    await import("./app");
}

export {};