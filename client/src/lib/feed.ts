export function shouldUsePersonalFeed(connected: boolean, videoCount: number) {
  return connected && videoCount > 0;
}
