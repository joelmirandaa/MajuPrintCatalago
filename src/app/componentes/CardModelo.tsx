import { Link } from 'react-router-dom';
import { Image as IconeImagem } from '@phosphor-icons/react';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import type { Modelo } from '../../compartilhado/tipos';
import { urlImagemModelo } from '../api';

export function ImagemModelo({ modelo, className = '' }: { modelo: Pick<Modelo, 'nome' | 'imagemKey'>; className?: string }) {
  const url = urlImagemModelo(modelo.imagemKey);
  if (!url) {
    return (
      <div className={`grid place-items-center bg-fundo-secao text-borda-campo ${className}`} aria-hidden>
        <IconeImagem size={48} weight="duotone" />
      </div>
    );
  }
  return <img src={url} alt={modelo.nome} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}

export function CardModelo({ modelo, aPartirDe }: { modelo: Modelo; aPartirDe: number | null }) {
  return (
    <Link
      to={`/modelo/${modelo.id}`}
      className="cartao group flex flex-col p-2 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-elevado md:p-3"
    >
      <div className="relative overflow-hidden rounded-md">
        <ImagemModelo
          modelo={modelo}
          className="aspect-square w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!modelo.disponivel && (
          <span className="absolute left-2 top-2 rounded-pilula bg-destaque px-3 py-0.5 font-pincel text-lg text-secundaria">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-2">
        <h3 className="line-clamp-2 text-base md:text-lg">{modelo.nome}</h3>
        <p className="mt-auto pt-1 text-sm text-texto-suave">
          {aPartirDe !== null ? (
            <>
              a partir de <strong className="text-base text-primaria-escura">{formatarCentavos(aPartirDe)}</strong>
            </>
          ) : (
            'sob consulta'
          )}
        </p>
      </div>
    </Link>
  );
}

export function SkeletonCards({ quantidade = 6 }: { quantidade?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="cartao p-2 md:p-3">
          <div className="skeleton aspect-square w-full" />
          <div className="skeleton mt-3 h-4 w-3/4" />
          <div className="skeleton mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
