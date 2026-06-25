import { DEFAULT_THEME_ACCENT, THEME_STORAGE_KEY } from './theme-options'

export function ThemeBootScript() {
  const script = `
try {
  var accent = localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME_ACCENT}';
  document.documentElement.dataset.accent = accent;
} catch (_) {
  document.documentElement.dataset.accent = '${DEFAULT_THEME_ACCENT}';
}
`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
