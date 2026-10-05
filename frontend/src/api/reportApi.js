/**
 * Downloads the readiness report PDF.
 *
 * In local dev, the Vite proxy makes /api/... same-origin so a plain anchor
 * link works fine. In production (Vercel frontend → Render backend) the two
 * are on different origins, so we use fetch with credentials:'include' to
 * send the httpOnly cookie, then create an object URL for the download.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function downloadReadinessReport() {
  const res = await fetch(`${API_BASE}/api/reports/readiness`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download report.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'prepwise-readiness-report.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
