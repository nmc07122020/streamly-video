export function shouldUsePersonalFeed(connected: boolean, videoCount: number) {
  return connected && videoCount > 0;
}

export function matchesVideoSearch(video: { title: string; creator: string; category: string }, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  if (!normalizedQuery) return true;
  return `${video.title} ${video.creator} ${video.category}`.toLocaleLowerCase("vi-VN").includes(normalizedQuery);
}
