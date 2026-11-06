const parents = new Set(['https://www.incisoriasacchetti.it', 'https://incisoriasacchetti.it', 'https://zqu2eg-72.myshopify.com']);
const fonts = new Set(['fonts.shopifycdn.com', 'cdn.shopify.com', 'www.incisoriasacchetti.it']);
export function applyTheme(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>, root = document.documentElement;
  for (const [key, variable] of Object.entries({ text: '--is-text', heading: '--is-heading', accent: '--is-accent', buttonText: '--is-button-text', background: '--is-background' })) {
    const color = t[key]; if (typeof color === 'string' && /^#[a-f\d]{6}$/i.test(color)) root.style.setProperty(variable, color);
  }
  if (typeof t.radius === 'number' && t.radius >= 0 && t.radius <= 40) root.style.setProperty('--is-radius', t.radius + 'px');
  if (typeof t.availableHeight === 'number' && Number.isFinite(t.availableHeight)) root.dataset.hostViewport = String(Math.max(240, Math.min(1400, t.availableHeight)));
  const rules: string[] = [];
  for (const [kind, name] of [['body', 'Assistant body'], ['heading', 'Assistant heading']] as const) {
    const url = t[kind + 'FontUrl'];
    if (typeof url !== 'string') continue;
    try {
      const font = new URL(url, 'https://www.incisoriasacchetti.it');
      if (font.protocol !== 'https:' || !fonts.has(font.hostname) || font.username || font.password || font.href.length > 2048) continue;
      rules.push(`@font-face{font-family:${JSON.stringify(name)};src:url(${JSON.stringify(font.href)}) format("woff2");font-display:swap;font-weight:${kind === 'body' ? 400 : 700}}`);
      root.style.setProperty(kind === 'body' ? '--is-body-font' : '--is-heading-font', JSON.stringify(name) + ', sans-serif');
    } catch { /* configurazione font ignorata, nessun URL arbitrario */ }
  }
  let style = document.getElementById('store-theme-fonts');
  if (!style) { style = document.createElement('style'); style.id = 'store-theme-fonts'; document.head.append(style); }
  style.textContent = rules.join('\n'); window.dispatchEvent(new Event('resize'));
  return true;
}
export function connectTheme(): () => void {
  const receive = (event: MessageEvent) => {
    if (event.source === window.parent && parents.has(event.origin) && event.data?.type === 'is-assistant:theme') applyTheme(event.data.theme);
  };
  window.addEventListener('message', receive);
  const notify = () => { for (const origin of parents) window.parent.postMessage({ type: 'is-assistant:resize', height: Math.ceil(document.body.scrollHeight) }, origin); };
  const observer = new ResizeObserver(notify); observer.observe(document.body);
  for (const origin of parents) window.parent.postMessage({ type: 'is-assistant:ready' }, origin);
  return () => { observer.disconnect(); window.removeEventListener('message', receive); };
}
