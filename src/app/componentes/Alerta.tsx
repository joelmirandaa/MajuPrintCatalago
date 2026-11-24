import type { ReactNode } from 'react';
import { CheckCircle, Info, Warning, WarningCircle } from '@phosphor-icons/react';

type Tipo = 'sucesso' | 'alerta' | 'erro' | 'info';

const ESTILOS: Record<Tipo, { caixa: string; icone: ReactNode }> = {
  sucesso: { caixa: 'border-sucesso bg-sucesso/10', icone: <CheckCircle size={22} weight="bold" className="text-sucesso" /> },
  alerta: { caixa: 'border-alerta bg-alerta/10', icone: <Warning size={22} weight="bold" className="text-alerta" /> },
  erro: { caixa: 'border-erro bg-erro/10', icone: <WarningCircle size={22} weight="bold" className="text-erro" /> },
  info: { caixa: 'border-info bg-info/10', icone: <Info size={22} weight="bold" className="text-info" /> },
};

export function Alerta({ tipo, children, className = '' }: { tipo: Tipo; children: ReactNode; className?: string }) {
  const e = ESTILOS[tipo];
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-md border-l-4 p-3 text-secundaria ${e.caixa} ${className}`}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        {e.icone}
      </span>
      <div className="min-w-0 flex-1 text-[15px]">{children}</div>
    </div>
  );
}
