import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import type { Categoria, Modelo } from '../../compartilhado/tipos';
import { admin, urlImagemModelo } from '../api';
import { Alerta } from '../componentes/Alerta';
import { Botao } from '../componentes/Botao';
import { AreaTexto, Campo } from '../componentes/Campo';
import { ImagemModelo } from '../componentes/CardModelo';
import { Carregando, EstadoErro, EstadoVazio } from '../componentes/Estados';
import { Modal } from '../componentes/Modal';
import { comprimirParaWebp } from '../util/imagem';
import { useCarregar } from '../util/useCarregar';

function Interruptor({ rotulo, valor, aoMudar }: { rotulo: string; valor: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" checked={valor} onChange={(e) => aoMudar(e.target.checked)} className="h-5 w-5 accent-primaria-escura" />
      <span className="font-bold text-secundaria">{rotulo}</span>
    </label>
  );
}

// ---------- Categorias ----------

function Categorias({ categorias, aoMudar }: { categorias: Categoria[]; aoMudar: () => void }) {
  const [nova, setNova] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      aoMudar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="cartao space-y-3 p-4 md:p-6" aria-labelledby="t-categorias">
      <h2 id="t-categorias" className="text-xl md:text-2xl">
        Categorias
      </h2>
      <ul className="divide-y divide-borda">
        {categorias.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className={`flex-1 font-bold ${c.ativo ? 'text-secundaria' : 'text-texto-suave line-through'}`}>{c.nome}</span>
            <Botao
              tamanho="pequeno"
              variante="fantasma"
              disabled={ocupado}
              onClick={() => {
                const nome = window.prompt('Novo nome da categoria', c.nome)?.trim();
                if (nome) void executar(() => admin.salvarCategoria({ ...c, nome }, c.id));
              }}
            >
              Renomear
            </Botao>
            <Botao
              tamanho="pequeno"
              variante="fantasma"
              disabled={ocupado}
              onClick={() => void executar(() => admin.salvarCategoria({ ...c, ativo: !c.ativo }, c.id))}
            >
              {c.ativo ? 'Ocultar' : 'Mostrar'}
            </Botao>
            <button
              type="button"
              aria-label={`Apagar categoria ${c.nome}`}
              disabled={ocupado}
              onClick={() => window.confirm(`Apagar a categoria "${c.nome}"?`) && void executar(() => admin.apagarCategoria(c.id))}
              className="grid h-11 w-11 place-items-center rounded-full text-erro hover:bg-erro/10"
            >
              <Trash size={20} weight="bold" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nova.trim()) return;
          void executar(async () => {
            await admin.salvarCategoria({ nome: nova.trim(), ordem: categorias.length + 1, ativo: true });
            setNova('');
          });
        }}
      >
        <label htmlFor="nova-categoria" className="sr-only">
          Nova categoria
        </label>
        <input id="nova-categoria" className="campo" placeholder="Nova categoria" value={nova} onChange={(e) => setNova(e.target.value)} maxLength={80} />
        <Botao type="submit" disabled={ocupado || !nova.trim()} icone={<Plus size={20} weight="bold" aria-hidden />}>
          Adicionar
        </Botao>
      </form>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
    </section>
  );
}

// ---------- Formulário de modelo ----------

interface Rascunho {
  nome: string;
  descricao: string;
  categoriaId: number | null;
  disponivel: boolean;
  ativo: boolean;
}

function FormModelo({
  modelo,
  categorias,
  proximaOrdem,
  aoSalvar,
}: {
  modelo: Modelo | null;
  categorias: Categoria[];
  proximaOrdem: number;
  aoSalvar: () => void;
}) {
  const [r, setR] = useState<Rascunho>({
    nome: modelo?.nome ?? '',
    descricao: modelo?.descricao ?? '',
    categoriaId: modelo?.categoriaId ?? categorias[0]?.id ?? null,
    disponivel: modelo?.disponivel ?? true,
    ativo: modelo?.ativo ?? true,
  });
  const [imagem, setImagem] = useState<Blob | null>(null);
  const [previa, setPrevia] = useState<string | null>(urlImagemModelo(modelo?.imagemKey ?? null));
  const [comprimindo, setComprimindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => () => {
    if (previa?.startsWith('blob:')) URL.revokeObjectURL(previa);
  }, [previa]);

  async function escolherImagem(arquivo: File) {
    setComprimindo(true);
    setErro(null);
    try {
      const webp = await comprimirParaWebp(arquivo);
      setImagem(webp);
      setPrevia(URL.createObjectURL(webp));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler a imagem');
    } finally {
      setComprimindo(false);
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!r.nome.trim()) {
      setErro('Informe o nome do modelo');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const salvo = await admin.salvarModelo(
        {
          nome: r.nome.trim(),
          descricao: r.descricao.trim() || null,
          categoriaId: r.categoriaId,
          disponivel: r.disponivel,
          ativo: r.ativo,
          ordem: modelo?.ordem ?? proximaOrdem,
        },
        modelo?.id,
      );
      if (imagem) await admin.enviarImagemModelo(salvo.id, imagem);
      aoSalvar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4 p-4">
      <div>
        <p className="mb-2 font-bold text-secundaria">Foto do modelo</p>
        <div className="flex items-center gap-3">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-fundo-secao">
            {previa && <img src={previa} alt="Prévia" className="h-full w-full object-cover" />}
          </div>
          <label className="inline-flex h-12 cursor-pointer items-center rounded-pilula border-2 border-secundaria px-5 font-bold text-secundaria hover:bg-fundo-secao">
            {comprimindo ? 'Comprimindo...' : previa ? 'Trocar foto' : 'Escolher foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void escolherImagem(f);
              }}
            />
          </label>
        </div>
        <p className="mt-1 text-sm text-texto-suave">Convertida para WebP (máx. 1600 px) no seu navegador antes de enviar.</p>
      </div>
      <Campo rotulo="Nome" value={r.nome} maxLength={120} onChange={(e) => setR({ ...r, nome: e.target.value })} />
      <AreaTexto rotulo="Descrição" value={r.descricao} maxLength={1000} onChange={(e) => setR({ ...r, descricao: e.target.value })} />
      <div>
        <label htmlFor="categoria" className="mb-1 block font-bold text-secundaria">
          Categoria
        </label>
        <select
          id="categoria"
          className="campo"
          value={r.categoriaId ?? ''}
          onChange={(e) => setR({ ...r, categoriaId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <Interruptor rotulo="Disponível (desmarque para “Esgotado”)" valor={r.disponivel} aoMudar={(v) => setR({ ...r, disponivel: v })} />
      <Interruptor rotulo="Visível no catálogo" valor={r.ativo} aoMudar={(v) => setR({ ...r, ativo: v })} />
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      <Botao type="submit" larguraTotal carregando={salvando} textoCarregando="Salvando..." disabled={comprimindo}>
        Salvar modelo
      </Botao>
    </form>
  );
}

// ---------- Página ----------

export default function Modelos() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => admin.catalogo(), []);
  const [editando, setEditando] = useState<Modelo | null | 'novo'>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  if (carregando && !dados) return <Carregando />;
  if (erro || !dados) return <EstadoErro mensagem={erro ?? 'Erro'} aoTentarDeNovo={() => void recarregar()} />;

  const nomeCategoria = (id: number | null) => dados.categorias.find((c) => c.id === id)?.nome ?? 'Sem categoria';

  async function mover(indice: number, direcao: -1 | 1) {
    if (!dados) return;
    const ids = dados.modelos.map((m) => m.id);
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[indice], ids[alvo]] = [ids[alvo]!, ids[indice]!];
    try {
      await admin.ordenarModelos(ids);
      await recarregar();
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Erro ao reordenar');
    }
  }

  async function apagar(m: Modelo) {
    if (!window.confirm(`Apagar o modelo "${m.nome}"? Pedidos antigos não são afetados.`)) return;
    try {
      await admin.apagarModelo(m.id);
      await recarregar();
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Erro ao apagar');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Modelos</h1>
        <Botao icone={<Plus size={20} weight="bold" aria-hidden />} onClick={() => setEditando('novo')}>
          Novo modelo
        </Botao>
      </div>
      {erroAcao && <Alerta tipo="erro">{erroAcao}</Alerta>}

      <section className="cartao p-2 md:p-4" aria-label="Lista de modelos">
        {dados.modelos.length === 0 ? (
          <EstadoVazio titulo="Nenhum modelo cadastrado ainda" />
        ) : (
          <ul className="divide-y divide-borda">
            {dados.modelos.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 p-2">
                <ImagemModelo modelo={m} className="h-16 w-16 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-secundaria">{m.nome}</p>
                  <p className="text-sm text-texto-suave">{nomeCategoria(m.categoriaId)}</p>
                  <div className="mt-1 flex gap-1">
                    {!m.disponivel && <span className="rounded-pilula bg-destaque px-2 text-sm font-bold">Esgotado</span>}
                    {!m.ativo && <span className="rounded-pilula bg-borda px-2 text-sm font-bold text-texto-suave">Oculto</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <button type="button" aria-label={`Subir ${m.nome}`} disabled={i === 0} onClick={() => void mover(i, -1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-fundo-secao disabled:opacity-30">
                    <ArrowUp size={20} weight="bold" />
                  </button>
                  <button type="button" aria-label={`Descer ${m.nome}`} disabled={i === dados.modelos.length - 1} onClick={() => void mover(i, 1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-fundo-secao disabled:opacity-30">
                    <ArrowDown size={20} weight="bold" />
                  </button>
                  <button type="button" aria-label={`Editar ${m.nome}`} onClick={() => setEditando(m)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-fundo-secao">
                    <PencilSimple size={20} weight="bold" />
                  </button>
                  <button type="button" aria-label={`Apagar ${m.nome}`} onClick={() => void apagar(m)} className="grid h-11 w-11 place-items-center rounded-full text-erro hover:bg-erro/10">
                    <Trash size={20} weight="bold" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Categorias categorias={dados.categorias} aoMudar={() => void recarregar()} />

      <Modal aberto={editando !== null} aoFechar={() => setEditando(null)} titulo={editando === 'novo' ? 'Novo modelo' : 'Editar modelo'}>
        {editando !== null && (
          <FormModelo
            key={editando === 'novo' ? 'novo' : editando.id}
            modelo={editando === 'novo' ? null : editando}
            categorias={dados.categorias}
            proximaOrdem={dados.modelos.length + 1}
            aoSalvar={() => {
              setEditando(null);
              void recarregar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
