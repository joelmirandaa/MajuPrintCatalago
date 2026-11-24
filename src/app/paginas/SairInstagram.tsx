// Tela exibida dentro do navegador do Instagram/Facebook (estrutura.md, seção 10.3).
import { useEffect, useState } from 'react';
import { ArrowUpRight, CopySimple, DotsThree } from '@phosphor-icons/react';
import { ehAndroid, linkIntentChrome, linkSafari } from '../util/instagram';

export default function SairInstagram() {
  const url = new URL(window.location.href);
  const android = ehAndroid();
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (android) window.location.href = linkIntentChrome(url);
    // Executa só uma vez ao abrir.
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url.href);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 bg-fundo-secao px-6 py-10 text-center">
      {!android && (
        <div className="absolute right-4 top-3 flex flex-col items-end text-primaria-escura" aria-hidden>
          <DotsThree size={36} weight="bold" />
          <ArrowUpRight size={48} weight="bold" className="-mt-1 mr-6 rotate-[-10deg]" />
        </div>
      )}
      <img src="/logo.webp" alt="Maju Print" width={120} height={120} />
      <h1 className="text-[26px]">Abra no seu navegador</h1>
      {android ? (
        <>
          <p className="max-w-sm text-texto-suave">
            Para enviar suas fotos com qualidade, o catálogo abre no Chrome. Se não abriu sozinho, toque no botão.
          </p>
          <a
            href={linkIntentChrome(url)}
            className="inline-flex h-14 items-center rounded-pilula bg-primaria px-8 text-lg font-bold text-secundaria"
          >
            Abrir no Chrome
          </a>
        </>
      ) : (
        <>
          <p className="max-w-sm text-lg text-secundaria">
            Toque em <strong>⋯</strong> e depois em <strong>Abrir no navegador</strong>.
          </p>
          <p className="max-w-sm text-texto-suave">Assim suas fotos são enviadas em qualidade original.</p>
          <a
            href={linkSafari(url)}
            className="inline-flex h-14 items-center rounded-pilula bg-primaria px-8 text-lg font-bold text-secundaria"
          >
            Tentar abrir no Safari
          </a>
        </>
      )}
      <button
        type="button"
        onClick={copiar}
        className="inline-flex h-12 items-center gap-2 rounded-pilula border-2 border-secundaria px-6 font-bold text-secundaria"
      >
        <CopySimple size={22} weight="bold" aria-hidden />
        {copiado ? 'Link copiado!' : 'Copiar link'}
      </button>
    </main>
  );
}
