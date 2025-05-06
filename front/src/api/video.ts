import { fetchVQL } from ".";

export async function searchVideo(title: string, size: number) {
    return await fetchVQL(`api search! s.q = "${title.replace("\n", " ")}" s.size = ${size}`);
}