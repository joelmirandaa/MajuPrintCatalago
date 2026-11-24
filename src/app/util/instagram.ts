// Detecção do navegador interno do Instagram/Facebook (estrutura.md, seção 10.3).

export function ehNavegadorInterno(ua = navigator.userAgent): boolean {
  return /Instagram|FBAN|FBAV/i.test(ua);
}

export function ehAndroid(ua = navigator.userAgent): boolean {
  return /Android/i.test(ua);
}

/** Link que abre a página atual no Chrome (Android), com retorno para a própria URL se não houver Chrome. */
export function linkIntentChrome(url: URL): string {
  const reserva = encodeURIComponent(url.href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${reserva};end`;
}

export function linkSafari(url: URL): string {
  return `x-safari-https://${url.host}${url.pathname}${url.search}`;
}
