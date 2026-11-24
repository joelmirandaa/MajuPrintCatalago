// Sessão anônima pós-Turnstile. O token fica no localStorage para que as fotos do carrinho
// continuem vinculadas à mesma sessão depois de recarregar a página.
import { criarSessao } from '../api';
import { useCatalogo } from '../loja/catalogo';

const CHAVE = 'majuprint-sessao';
const MARGEM_MS = 5 * 60 * 1000;

interface SessaoSalva {
  token: string;
  expiraEm: number;
}

function lerSalva(): SessaoSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as SessaoSalva) : null;
  } catch {
    return null;
  }
}

/** Marca a sessão como expirada, mas guarda o token para renovar mantendo o mesmo ID. */
export function invalidarSessao(): void {
  const salva = lerSalva();
  if (salva) localStorage.setItem(CHAVE, JSON.stringify({ ...salva, expiraEm: 0 }));
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opcoes: {
          sitekey: string;
          appearance?: 'always' | 'execute' | 'interaction-only';
          language?: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

let carregandoScript: Promise<void> | null = null;

function carregarTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  carregandoScript ??= new Promise<void>((resolver, rejeitar) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolver();
    s.onerror = () => {
      carregandoScript = null;
      rejeitar(new Error('Não foi possível carregar a verificação anti-robô. Confira sua conexão.'));
    };
    document.head.appendChild(s);
  });
  return carregandoScript;
}

/** Mostra o Turnstile (normalmente invisível; só aparece se precisar de interação) e devolve o token. */
async function executarTurnstile(siteKey: string): Promise<string> {
  await carregarTurnstile();
  const ts = window.turnstile;
  if (!ts) throw new Error('Verificação anti-robô indisponível');
  const caixa = document.createElement('div');
  caixa.setAttribute('role', 'dialog');
  caixa.setAttribute('aria-label', 'Verificação de segurança');
  caixa.className = 'fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4';
  document.body.appendChild(caixa);
  return new Promise<string>((resolver, rejeitar) => {
    const finalizar = (acao: () => void) => {
      try {
        ts.remove(id);
      } catch {
        /* já removido */
      }
      caixa.remove();
      acao();
    };
    const id = ts.render(caixa, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      language: 'pt-br',
      callback: (token) => finalizar(() => resolver(token)),
      'error-callback': () =>
        finalizar(() => rejeitar(new Error('Não foi possível confirmar que você não é um robô. Tente de novo.'))),
      'expired-callback': () => finalizar(() => rejeitar(new Error('A verificação expirou. Tente de novo.'))),
    });
  });
}

let emAndamento: Promise<string> | null = null;

export function obterTokenSessao(): Promise<string> {
  const salva = lerSalva();
  if (salva && salva.expiraEm - MARGEM_MS > Date.now()) return Promise.resolve(salva.token);
  emAndamento ??= (async () => {
    const siteKey = useCatalogo.getState().dados?.turnstileSiteKey;
    if (!siteKey) throw new Error('Catálogo ainda não carregado');
    const turnstileToken = await executarTurnstile(siteKey);
    const nova = await criarSessao(turnstileToken, salva?.token);
    localStorage.setItem(CHAVE, JSON.stringify(nova));
    return nova.token;
  })().finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}
