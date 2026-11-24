// Upload de uma foto com barra de progresso, troca e remoção.
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowClockwise, ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react';
import { LIMITES } from '../../compartilhado/esquemas';
import { ErroApi, enviarFoto, removerFoto } from '../api';
import type { FotoEnviada } from '../loja/carrinho';
import { formatarBytes, lerInfoImagem, tipoDoArquivo } from '../util/imagem';
import { Botao } from './Botao';

interface Props {
  rotulo: string;
  ajuda?: string;
  valor: FotoEnviada | null;
  aoMudar: (foto: FotoEnviada | null) => void;
  /** Avisa o pai enquanto há envio em andamento (para desabilitar "Adicionar"). */
  aoMudarEnviando?: (enviando: boolean) => void;
}

type Estado =
  | { fase: 'ocioso' }
  | { fase: 'enviando'; progresso: number; nome: string; miniatura: string | null }
  | { fase: 'erro'; mensagem: string; arquivo?: File };

const ACEITAR = '.jpg,.jpeg,.png,.heic,.heif,.webp,' + LIMITES.tiposFoto.join(',');

export function UploadFoto({ rotulo, ajuda, valor, aoMudar, aoMudarEnviando }: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const cancelamento = useRef<AbortController | null>(null);
  const [estado, setEstado] = useState<Estado>({ fase: 'ocioso' });

  useEffect(() => () => cancelamento.current?.abort(), []);
  useEffect(() => aoMudarEnviando?.(estado.fase === 'enviando'), [estado.fase, aoMudarEnviando]);

  async function enviar(arquivo: File) {
    const tipo = tipoDoArquivo(arquivo);
    if (!tipo) {
      setEstado({ fase: 'erro', mensagem: 'Formato não aceito. Envie JPG, PNG, HEIC ou WEBP.' });
      return;
    }
    if (arquivo.size > LIMITES.bytesPorFoto) {
      setEstado({ fase: 'erro', mensagem: `A foto tem ${formatarBytes(arquivo.size)}. O máximo é 25 MB.` });
      return;
    }
    const info = await lerInfoImagem(arquivo);
    const controle = new AbortController();
    cancelamento.current = controle;
    setEstado({ fase: 'enviando', progresso: 0, nome: arquivo.name, miniatura: info.miniatura });
    try {
      const { uploadId } = await enviarFoto({
        arquivo,
        tipo,
        largura: info.largura,
        altura: info.altura,
        sinal: controle.signal,
        aoProgredir: (p) =>
          setEstado((e) => (e.fase === 'enviando' ? { ...e, progresso: p } : e)),
      });
      const anterior = valor;
      aoMudar({
        uploadId,
        nome: arquivo.name,
        largura: info.largura,
        altura: info.altura,
        miniatura: info.miniatura,
        enviadaEm: Date.now(),
      });
      setEstado({ fase: 'ocioso' });
      // Trocou de foto: remove a anterior do servidor.
      if (anterior) removerFoto(anterior.uploadId).catch(() => undefined);
    } catch (e) {
      if (e instanceof ErroApi && e.status === -1) {
        setEstado({ fase: 'ocioso' });
        return;
      }
      setEstado({ fase: 'erro', mensagem: e instanceof Error ? e.message : 'Falha no envio', arquivo });
    } finally {
      cancelamento.current = null;
    }
  }

  function escolher() {
    entrada.current?.click();
  }

  function remover() {
    if (valor) removerFoto(valor.uploadId).catch(() => undefined);
    aoMudar(null);
  }

  const enviando = estado.fase === 'enviando';
  const miniatura = enviando ? estado.miniatura : valor?.miniatura;

  return (
    <div>
      <p id={`${id}-rotulo`} className="mb-2 font-bold text-secundaria">
        {rotulo}
      </p>
      <input
        ref={entrada}
        id={id}
        type="file"
        accept={ACEITAR}
        className="sr-only"
        aria-labelledby={`${id}-rotulo`}
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = '';
          if (arquivo) void enviar(arquivo);
        }}
      />

      {!valor && !enviando ? (
        <button
          type="button"
          onClick={escolher}
          className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-borda-campo bg-fundo-secao px-4 py-6 text-center transition-colors hover:border-primaria"
        >
          <UploadSimple size={32} weight="bold" className="text-primaria-escura" aria-hidden />
          <span className="font-bold text-secundaria">Escolher foto</span>
          {ajuda && <span className="text-sm text-texto-suave">{ajuda}</span>}
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border-2 border-borda bg-white p-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-fundo-secao">
            {miniatura ? (
              <img src={miniatura} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageSquare size={28} weight="duotone" className="text-texto-suave" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-secundaria">{enviando ? estado.nome : valor?.nome}</p>
            {enviando ? (
              <div aria-live="polite">
                <div
                  className="mt-2 h-2 overflow-hidden rounded-pilula bg-borda"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(estado.progresso * 100)}
                  aria-label="Progresso do envio"
                >
                  <div
                    className="h-full rounded-pilula bg-primaria transition-[width] duration-200"
                    style={{ width: `${Math.round(estado.progresso * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-texto-suave">Enviando... {Math.round(estado.progresso * 100)}%</p>
              </div>
            ) : (
              <p className="text-sm text-sucesso">Foto enviada ✓</p>
            )}
          </div>
          {enviando ? (
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => cancelamento.current?.abort()}>
              Cancelar
            </Botao>
          ) : (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={escolher}
                aria-label="Trocar foto"
                className="grid h-11 w-11 place-items-center rounded-full text-secundaria hover:bg-fundo-secao"
              >
                <ArrowClockwise size={22} weight="bold" />
              </button>
              <button
                type="button"
                onClick={remover}
                aria-label="Remover foto"
                className="grid h-11 w-11 place-items-center rounded-full text-erro hover:bg-erro/10"
              >
                <Trash size={22} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}

      {estado.fase === 'erro' && (
        <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-erro">
          <span>{estado.mensagem}</span>
          {estado.arquivo && (
            <button
              type="button"
              className="font-bold underline"
              onClick={() => estado.arquivo && void enviar(estado.arquivo)}
            >
              Tentar de novo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
