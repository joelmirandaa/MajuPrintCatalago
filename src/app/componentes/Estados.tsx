// Estados de tela inteira: carregando, erro e vazio — sempre com a mascote (GuiaDesign.md).
import type { ReactNode } from 'react';
import { Heart } from '@phosphor-icons/react';
import { Botao } from './Botao';

export function Mascote({ tamanho = 120, className = '' }: { tamanho?: number; className?: string }) {
  return <img src="/mascote.webp" alt="" width={tamanho} height={Math.round(tamanho * 0.885)} className={className} />;
}

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="relative">
        <Mascote tamanho={96} />
        <Heart
          size={28}
          weight="fill"
          aria-hidden
          className="absolute -right-2 -top-1 animate-pulsar text-primaria"
        />
      </div>
      <p className="text-texto-suave">{texto}</p>
    </div>
  );
}

export function EstadoErro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
      <Mascote tamanho={110} />
      <div>
        <h2 className="text-xl md:text-2xl">Ops, algo deu errado</h2>
        <p className="mt-1 text-texto-suave">{mensagem}</p>
      </div>
      {aoTentarDeNovo && (
        <Botao variante="secundario" onClick={aoTentarDeNovo}>
          Tentar novamente
        </Botao>
      )}
    </div>
  );
}

export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Mascote tamanho={96} />
      <p className="font-titulo text-xl text-secundaria">{titulo}</p>
      {children}
    </div>
  );
}
