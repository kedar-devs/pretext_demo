/** Public-folder asset URL; respects Vite `base` (e.g. GitHub Pages subpath). */
export function publicUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${normalized}`
}
