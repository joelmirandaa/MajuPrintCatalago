import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { precoAPartirDe } from '../../compartilhado/calculo';
import { CardModelo, SkeletonCards } from '../componentes/CardModelo';
import { EstadoVazio } from '../componentes/Estados';
import { useCatalogo } from '../loja/catalogo';

export default function Catalogo() {
  const dados = useCatalogo((s) => s.dados);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  const modelos = useMemo(
    () => (dados?.modelos ?? []).filter((m) => categoriaId === null || m.categoriaId === categoriaId),
    [dados, categoriaId],
  );
  const tamanhoIds = dados?.tamanhos.map((t) => t.id) ?? [];
  const papelIds = dados?.papeis.map((p) => p.id) ?? [];
  // Só mostra categorias que têm modelos.
  const categorias = (dados?.categorias ?? []).filter((c) => dados?.modelos.some((m) => m.categoriaId === c.id));

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-cartao md:p-6">
        <img src="/mascote.webp" alt="" width={88} height={78} className="h-auto w-[72px] shrink-0 md:w-[88px]" />
        <div>
          <h1 className="text-[26px] md:text-[34px]">Personalizados feitos com carinho</h1>
          <p className="mt-1 text-texto-suave">
            {dados?.config.textoBoasVindas || 'Escolha seu modelo, envie sua foto e a gente imprime do seu jeito.'}
          </p>
        </div>
      </section>

      {categorias.length > 0 && (
        <nav aria-label="Categorias" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 pb-1">
            <button
              type="button"
              aria-pressed={categoriaId === null}
              onClick={() => setCategoriaId(null)}
              className={`chip ${categoriaId === null ? 'chip-ativo' : 'bg-white'}`}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={categoriaId === c.id}
                onClick={() => setCategoriaId(c.id)}
                className={`chip ${categoriaId === c.id ? 'chip-ativo' : 'bg-white'}`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </nav>
      )}

      <Link
        to="/personalizado"
        className="flex items-center gap-4 rounded-xl border-2 border-dashed border-primaria bg-white p-4 transition-shadow hover:shadow-elevado"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-destaque/30 text-primaria-escura">
          <Sparkle size={26} weight="fill" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-titulo text-lg font-semibold text-secundaria">Quero um modelo personalizado</span>
          <span className="block text-sm text-texto-suave">Envie sua foto e um modelo que você viu por aí</span>
        </span>
        <ArrowRight size={24} weight="bold" className="text-primaria-escura" aria-hidden />
      </Link>

      {!dados ? (
        <SkeletonCards />
      ) : modelos.length === 0 ? (
        <EstadoVazio titulo="Ainda não tem nada aqui, mas logo, logo vai ter novidade!" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {modelos.map((m) => (
            <CardModelo key={m.id} modelo={m} aPartirDe={precoAPartirDe(dados.precos, m.id, tamanhoIds, papelIds)} />
          ))}
        </div>
      )}
    </div>
  );
}
