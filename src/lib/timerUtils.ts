/**
 * Helper to compute elapsed or total duration
 */
export function formatDuration(startStr?: string, endStr?: string): string {
  if (!startStr) return '--';
  const start = new Date(startStr).getTime();
  if (isNaN(start)) return '--';
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  if (isNaN(end)) return '--';
  
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export function getShortDuration(startStr?: string, endStr?: string): string {
  if (!startStr) return '';
  const start = new Date(startStr).getTime();
  if (isNaN(start)) return '';
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const mins = Math.floor(diffSec / 60);
  if (mins < 1) return '< 1 min';
  return `${mins} mins`;
}
