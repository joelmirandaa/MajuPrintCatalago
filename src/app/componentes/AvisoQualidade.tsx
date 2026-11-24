// Aviso de qualidade da foto (estrutura.md, seção 10.2). Nunca bloqueia o envio.
import { Info } from '@phosphor-icons/react';
import { resolucaoSuficiente } from '../../compartilhado/qualidade';
import type { Tamanho } from '../../compartilhado/tipos';
import { Alerta } from './Alerta';

export function TextoQualidade({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <p className="flex gap-2 text-sm text-texto-suave">
      <Info size={20} weight="bold" className="mt-0.5 shrink-0 text-primaria-escura" aria-hidden />
      {texto}
    </p>
  );
}

export function AvisoQualidade({
  largura,
  altura,
  tamanho,
}: {
  largura: number | null;
  altura: number | null;
  tamanho: Tamanho | undefined;
}) {
  if (!tamanho || resolucaoSuficiente(largura, altura, tamanho.larguraCm, tamanho.alturaCm)) return null;
  return (
    <Alerta tipo="alerta">
      Essa foto pode ficar sem nitidez no tamanho {tamanho.nome}. Se tiver, envie uma versão em maior qualidade.
    </Alerta>
  );
}
