import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'alternativo' | 'fantasma' | 'perigo';
type Tamanho = 'pequeno' | 'padrao' | 'destaque';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-primaria text-secundaria hover:bg-primaria-hover',
  secundario: 'border-2 border-secundaria bg-transparent text-secundaria hover:bg-fundo-secao',
  alternativo: 'bg-primaria-escura text-white hover:brightness-95',
  fantasma: 'bg-transparent text-secundaria hover:bg-fundo-secao',
  perigo: 'border-2 border-erro bg-white text-erro hover:bg-erro/10',
};

const TAMANHOS: Record<Tamanho, string> = {
  pequeno: 'h-11 px-4 text-[15px]',
  padrao: 'h-12 px-6',
  destaque: 'h-14 px-8 text-lg',
};

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-current border-r-transparent ${className}`}
    />
  );
}

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  textoCarregando?: string;
  icone?: ReactNode;
  larguraTotal?: boolean;
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Botao(
  {
    variante = 'primario',
    tamanho = 'padrao',
    carregando = false,
    textoCarregando = 'Enviando...',
    icone,
    larguraTotal = false,
    className = '',
    disabled,
    children,
    type = 'button',
    ...resto
  },
  ref,
) {
  const desabilitado = disabled || carregando;
  return (
    <button
      ref={ref}
      type={type}
      disabled={desabilitado}
      aria-busy={carregando || undefined}
      className={[
        'inline-flex select-none items-center justify-center gap-2 rounded-pilula font-bold',
        'transition-[transform,box-shadow,background-color] duration-200 ease-mola',
        'enabled:hover:-translate-y-0.5 enabled:hover:shadow-elevado enabled:active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        desabilitado && !carregando ? '!border-0 !bg-borda !text-texto-suave' : VARIANTES[variante],
        TAMANHOS[tamanho],
        larguraTotal ? 'w-full' : '',
        className,
      ].join(' ')}
      {...resto}
    >
      {carregando ? <Spinner className="text-secundaria" /> : icone}
      <span>{carregando ? textoCarregando : children}</span>
    </button>
  );
});
