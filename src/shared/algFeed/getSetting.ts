import db from "#db";

export async function getSetting<T=any>(name: string, defaultValue?: T): Promise<T> {
    const setting = await db.user.findOne<{ v: T }>("settings", { _id: "alg_" + name });
    return setting ? setting.v : defaultValue;
}