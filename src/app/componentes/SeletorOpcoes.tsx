// Tamanho, papel e quantidade (+/−).
import { useId, type ReactNode } from 'react';
import { Minus, Plus } from '@phosphor-icons/react';
import type { Papel, Tamanho } from '../../compartilhado/tipos';

interface OpcaoChip {
  id: number;
  nome: string;
  desabilitado?: boolean;
}

function GrupoChips({
  rotulo,
  opcoes,
  valor,
  aoMudar,
  extra,
}: {
  rotulo: string;
  opcoes: OpcaoChip[];
  valor: number | null;
  aoMudar: (id: number) => void;
  /** Chip adicional ao fim do grupo (ex.: "Tamanho personalizado"). */
  extra?: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend id={id} className="mb-2 font-bold text-secundaria">
        {rotulo}
      </legend>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={valor === o.id}
            disabled={o.desabilitado}
            onClick={() => aoMudar(o.id)}
            className={`chip ${valor === o.id ? 'chip-ativo' : 'bg-white hover:border-primaria'} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
          >
            {o.nome}
          </button>
        ))}
        {extra}
      </div>
    </fieldset>
  );
}

export function SeletorQuantidade({
  valor,
  aoMudar,
  rotulo = 'Quantidade',
  compacto = false,
}: {
  valor: number;
  aoMudar: (n: number) => void;
  rotulo?: string;
  compacto?: boolean;
}) {
  const id = useId();
  const tamanhoBotao = compacto ? 'h-10 w-10' : 'h-12 w-12';
  return (
    <div>
      {!compacto && (
        <label htmlFor={id} className="mb-2 block font-bold text-secundaria">
          {rotulo}
        </label>
      )}
      <div className="inline-flex items-center gap-1 rounded-pilula border-2 border-borda bg-white p-0.5">
        <button
          type="button"
          onClick={() => aoMudar(Math.max(1, valor - 1))}
          disabled={valor <= 1}
          aria-label="Diminuir quantidade"
          className={`grid ${tamanhoBotao} place-items-center rounded-full text-secundaria hover:bg-fundo-secao disabled:opacity-40`}
        >
          <Minus size={compacto ? 18 : 22} weight="bold" />
        </button>
        <input
          id={id}
          aria-label={compacto ? rotulo : undefined}
          inputMode="numeric"
          value={valor}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ''));
            if (n >= 1) aoMudar(Math.min(999, n));
          }}
          className={`${compacto ? 'w-10' : 'w-12'} bg-transparent text-center font-bold text-secundaria focus:outline-none`}
        />
        <button
          type="button"
          onClick={() => aoMudar(Math.min(999, valor + 1))}
          aria-label="Aumentar quantidade"
          className={`grid ${tamanhoBotao} place-items-center rounded-full text-secundaria hover:bg-fundo-secao`}
        >
          <Plus size={compacto ? 18 : 22} weight="bold" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  tamanhos: Tamanho[];
  papeis: Papel[];
  tamanhoId: number | null;
  papelId: number | null;
  quantidade: number;
  aoMudarTamanho: (id: number) => void;
  aoMudarPapel: (id: number) => void;
  aoMudarQuantidade: (n: number) => void;
  /** Permite desabilitar papéis sem preço para o tamanho escolhido. */
  papelDisponivel?: (papelId: number) => boolean;
  /** Habilita a opção "Tamanho personalizado"; `campos` aparece abaixo dos chips quando ela está ativa. */
  tamanhoPersonalizado?: { ativo: boolean; aoSelecionar: () => void; campos: ReactNode };
}

export function SeletorOpcoes(p: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <GrupoChips
          rotulo="Tamanho"
          opcoes={p.tamanhos}
          valor={p.tamanhoPersonalizado?.ativo ? null : p.tamanhoId}
          aoMudar={p.aoMudarTamanho}
          extra={
            p.tamanhoPersonalizado && (
              <button
                type="button"
                role="radio"
                aria-checked={p.tamanhoPersonalizado.ativo}
                onClick={p.tamanhoPersonalizado.aoSelecionar}
                className={`chip ${p.tamanhoPersonalizado.ativo ? 'chip-ativo' : 'border-dashed bg-white hover:border-primaria'}`}
              >
                Tamanho personalizado
              </button>
            )
          }
        />
        {p.tamanhoPersonalizado?.ativo && p.tamanhoPersonalizado.campos}
      </div>
      <GrupoChips
        rotulo="Papel"
        opcoes={p.papeis.map((papel) => ({ ...papel, desabilitado: p.papelDisponivel ? !p.papelDisponivel(papel.id) : false }))}
        valor={p.papelId}
        aoMudar={p.aoMudarPapel}
      />
      <SeletorQuantidade valor={p.quantidade} aoMudar={p.aoMudarQuantidade} />
    </div>
  );
}
