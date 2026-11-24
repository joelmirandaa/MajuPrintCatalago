import { useEffect, useRef, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
  /** "lateral" desliza da direita (gaveta); "central" é um modal comum. */
  formato?: 'central' | 'lateral';
}

const FOCAVEIS = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** Modal acessível: fecha com Esc e ao tocar fora, prende o foco e bloqueia a rolagem da página. */
export function Modal({ aberto, aoFechar, titulo, children, formato = 'central' }: Props) {
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    painel.current?.querySelector<HTMLElement>(FOCAVEIS)?.focus();
    const teclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
      if (e.key !== 'Tab' || !painel.current) return;
      const els = [...painel.current.querySelectorAll<HTMLElement>(FOCAVEIS)];
      const primeiro = els[0];
      const ultimo = els[els.length - 1];
      if (!primeiro || !ultimo) return;
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', teclado);
    return () => {
      document.removeEventListener('keydown', teclado);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  const lateral = formato === 'lateral';
  return (
    <div className="fixed inset-0 z-50 flex" role="presentation">
      <div className="absolute inset-0 bg-secundaria/50" onClick={aoFechar} aria-hidden />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={
          lateral
            ? 'relative ml-auto flex h-full w-full max-w-md animate-deslizar flex-col bg-white shadow-elevado'
            : 'relative m-auto flex max-h-[92vh] w-[calc(100%-32px)] max-w-lg animate-surgir flex-col overflow-hidden rounded-xl bg-white shadow-elevado'
        }
      >
        <div className="flex items-center justify-between gap-2 border-b border-borda px-4 py-3">
          <h2 className="text-xl md:text-2xl">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-fundo-secao"
          >
            <X size={24} weight="bold" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
