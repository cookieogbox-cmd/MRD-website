export type FeedItem = {
  id: string;
  title: string;
  description: string;
  date: string | null;
  audioUrl: string | null;
  coverUrl: string | null;
  status: string;
};

const BASE = process.env.NEXT_PUBLIC_HERCULES_FEED_BASE!; // e.g. https://your-app.convex.site

export async function getEpisodes(): Promise<FeedItem[]> {
  const res = await fetch(`${BASE}/feed/episodes`);
  const data = await res.json();
  return data.items;
}

export async function getUpcoming(): Promise<FeedItem[]> {
  const res = await fetch(`${BASE}/feed/upcoming`);
  const data = await res.json();
  return data.items;
}

export async function getAll(): Promise<{ episodes: FeedItem[]; upcoming: FeedItem[] }> {
  const res = await fetch(`${BASE}/feed/all`);
  return res.json();
}