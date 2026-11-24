import { NavLink, Outlet } from 'react-router-dom';
import { Gear, Package, SquaresFour, Tag } from '@phosphor-icons/react';

const LINKS = [
  { para: '/admin', rotulo: 'Pedidos', icone: Package, fim: true },
  { para: '/admin/modelos', rotulo: 'Modelos', icone: SquaresFour, fim: false },
  { para: '/admin/precos', rotulo: 'Preços', icone: Tag, fim: false },
  { para: '/admin/config', rotulo: 'Config', icone: Gear, fim: false },
];

export default function LayoutAdmin() {
  return (
    <div className="min-h-dvh bg-fundo-secao">
      <header className="bg-secundaria">
        <div className="mx-auto flex h-16 max-w-conteudo items-center justify-between px-4 md:px-8">
          <a href="/admin" className="flex items-center gap-3">
            <img src="/logo-recortada.webp" alt="Maju Print" width={96} height={96} className="h-12 w-auto" />
            <span className="font-pincel text-2xl text-fundo-secao">painel</span>
          </a>
          <a href="/" className="text-sm font-bold text-fundo-secao underline">
            Ver catálogo
          </a>
        </div>
      </header>
      <nav aria-label="Painel" className="sticky top-0 z-30 border-b border-borda bg-white">
        <div className="mx-auto flex max-w-conteudo overflow-x-auto px-2 md:px-6">
          {LINKS.map(({ para, rotulo, icone: Icone, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              className={({ isActive }) =>
                `flex h-12 shrink-0 items-center gap-2 border-b-[3px] px-4 font-bold ${
                  isActive ? 'border-primaria text-secundaria' : 'border-transparent text-texto-suave hover:text-secundaria'
                }`
              }
            >
              <Icone size={20} weight="bold" aria-hidden />
              {rotulo}
            </NavLink>
          ))}
        </div>
      </nav>
      <main id="conteudo" className="mx-auto max-w-conteudo px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
