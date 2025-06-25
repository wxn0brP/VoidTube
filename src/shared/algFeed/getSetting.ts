import db from "#db";

export async function getSetting<T=any>(name: string, defaultValue?: T) {
    const setting = await db.alg.findOne("cfg", { _id: name });
    return setting ? setting.v : defaultValue;
}