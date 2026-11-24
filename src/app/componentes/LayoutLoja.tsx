import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useCarrinho } from '../loja/carrinho';
import { useCatalogo } from '../loja/catalogo';
import { BarraCarrinho } from './BarraCarrinho';
import { CarrinhoGaveta, CarrinhoLateral } from './Carrinho';
import { Carregando, EstadoErro } from './Estados';
import { Rodape } from './Rodape';
import { Topo } from './Topo';

/** Rotas em que o carrinho (barra/lateral) não aparece. */
const SEM_CARRINHO = ['/finalizar', '/enviado'];

export function LayoutLoja() {
  const { estado, erro, carregar } = useCatalogo();
  const { pathname } = useLocation();
  const comCarrinho = !SEM_CARRINHO.includes(pathname);
  // A barra fixa do carrinho (celular) só aparece com itens; o rodapé reserva espaço para ela.
  const temItens = useCarrinho((s) => s.itens.length > 0);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-fundo-secao">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-pilula bg-secundaria px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <Topo mostrarCarrinho={comCarrinho} />
      <div
        className={`mx-auto w-full max-w-conteudo flex-1 px-4 pb-12 pt-4 md:px-8 ${
          comCarrinho ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8' : ''
        }`}
      >
        <main id="conteudo" className="min-w-0">
          {estado === 'erro' ? (
            <EstadoErro mensagem={erro ?? 'Não foi possível carregar o catálogo.'} aoTentarDeNovo={() => void carregar(true)} />
          ) : estado !== 'pronto' && pathname !== '/' ? (
            <Carregando />
          ) : (
            <Outlet />
          )}
        </main>
        {comCarrinho && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 h-[calc(100dvh-7.5rem)]">
              <CarrinhoLateral />
            </div>
          </aside>
        )}
      </div>
      <Rodape folgaBarraCarrinho={comCarrinho && temItens} />
      {comCarrinho && (
        <>
          <BarraCarrinho />
          <CarrinhoGaveta />
        </>
      )}
    </div>
  );
}
