/**
 * Downloads the readiness report PDF. Uses the browser's native download
 * mechanism (a temporary link) rather than fetch+blob — since the session
 * cookie is httpOnly, a direct navigation to this same-origin URL already
 * sends it automatically, and the backend's Content-Disposition header
 * triggers the browser's save dialog on its own.
 */
export function downloadReadinessReport() {
  const link = document.createElement('a');
  link.href = '/api/reports/readiness';
  link.download = 'prepwise-readiness-report.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
