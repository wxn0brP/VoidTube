import { fetchVQL } from "../vql";

export default async function (...args: any[]) {
    const text = args.join(" ");
    const res = await fetchVQL(text);
    console.log(res);
    return -1;
}