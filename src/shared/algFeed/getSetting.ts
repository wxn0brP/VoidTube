import db from "#db";

export async function getSetting<T=any>(name: string, defaultValue?: T) {
    const setting = await db.user.findOne("settings", { _id: "alg_" + name });
    return setting ? setting.v : defaultValue;
}