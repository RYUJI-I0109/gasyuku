export function fmtTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return 'たった今';
  if (d < 3600000) return Math.floor(d / 60000) + '分前';
  if (d < 86400000) return Math.floor(d / 3600000) + '時間前';
  return new Date(ts).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
