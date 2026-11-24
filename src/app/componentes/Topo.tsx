import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from '@phosphor-icons/react';
import { useCarrinho } from '../loja/carrinho';

/** Logo à esquerda + carrinho com contador à direita. Fica fixo e ganha sombra ao rolar. */
export function Topo({ mostrarCarrinho = true }: { mostrarCarrinho?: boolean }) {
  const quantidade = useCarrinho((s) => s.itens.length);
  const abrirGaveta = useCarrinho((s) => s.abrirGaveta);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 80);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-[height,box-shadow] duration-200 ${
        rolou ? 'shadow-cartao' : ''
      }`}
    >
      <div
        className={`mx-auto flex max-w-conteudo items-center justify-between px-4 md:px-8 ${
          rolou ? 'h-16' : 'h-16 lg:h-20'
        }`}
      >
        <Link to="/" className="flex items-center gap-3 rounded-full" aria-label="Maju Print — início">
          <img
            src="/logo.webp"
            alt="Maju Print"
            width={56}
            height={56}
            className={`transition-[width,height] duration-200 ${rolou ? 'h-11 w-11' : 'h-11 w-11 lg:h-14 lg:w-14'}`}
          />
          <span className="font-pincel text-2xl text-secundaria">catálogo</span>
        </Link>
        {mostrarCarrinho && (
          <button
            type="button"
            onClick={abrirGaveta}
            className="relative grid h-12 w-12 place-items-center rounded-full text-secundaria hover:bg-fundo-secao lg:hidden"
            aria-label={`Abrir carrinho, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`}
          >
            <ShoppingBag size={28} weight="bold" />
            {quantidade > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-6 min-w-6 place-items-center rounded-pilula bg-primaria px-1.5 text-sm font-bold text-secundaria">
                {quantidade}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
