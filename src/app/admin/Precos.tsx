import { useEffect, useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { formatarCentavos, textoParaCentavos } from '../../compartilhado/dinheiro';
import type { CatalogoAdminResposta, Papel, Preco, Tamanho } from '../../compartilhado/tipos';
import { admin } from '../api';
import { Alerta } from '../componentes/Alerta';
import { Botao } from '../componentes/Botao';
import { Carregando, EstadoErro } from '../componentes/Estados';
import { useCarregar } from '../util/useCarregar';

const chave = (modeloId: number | null, t: number, p: number) => `${modeloId ?? 'base'}:${t}:${p}`;
const paraTexto = (c: number) => (c / 100).toFixed(2).replace('.', ',');

// ---------- Tabela de preços ----------

function TabelaPrecos({ dados, aoSalvar }: { dados: CatalogoAdminResposta; aoSalvar: () => void }) {
  const [escopo, setEscopo] = useState<number | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    const inicial: Record<string, string> = {};
    for (const p of dados.precos) inicial[chave(p.modeloId, p.tamanhoId, p.papelId)] = paraTexto(p.valorCentavos);
    setValores(inicial);
  }, [dados.precos]);

  async function salvar() {
    setMensagem(null);
    const precos: Preco[] = [];
    for (const [k, texto] of Object.entries(valores)) {
      if (!texto.trim()) continue;
      const centavos = textoParaCentavos(texto);
      const [m, t, p] = k.split(':');
      if (centavos === null) {
        setMensagem({ tipo: 'erro', texto: `Valor inválido: "${texto}"` });
        return;
      }
      const tamanhoId = Number(t);
      const papelId = Number(p);
      // Ignora preços de tamanhos/papéis que foram apagados.
      if (!dados.tamanhos.some((x) => x.id === tamanhoId) || !dados.papeis.some((x) => x.id === papelId)) continue;
      const modeloId = m === 'base' ? null : Number(m);
      if (modeloId !== null && !dados.modelos.some((x) => x.id === modeloId)) continue;
      precos.push({ modeloId, tamanhoId, papelId, valorCentavos: centavos });
    }
    setSalvando(true);
    try {
      await admin.salvarPrecos(precos);
      setMensagem({ tipo: 'sucesso', texto: 'Preços salvos!' });
      aoSalvar();
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao salvar' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="cartao space-y-4 p-4 md:p-6" aria-labelledby="t-tabela">
      <h2 id="t-tabela" className="text-xl md:text-2xl">
        Tabela de preços
      </h2>
      <div>
        <label htmlFor="escopo" className="mb-1 block font-bold text-secundaria">
          Editar preços de
        </label>
        <select id="escopo" className="campo" value={escopo ?? ''} onChange={(e) => setEscopo(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Preço base (todos os modelos)</option>
          {dados.modelos.map((m) => (
            <option key={m.id} value={m.id}>
              Só para: {m.nome}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-texto-suave">
          {escopo === null
            ? 'Deixe vazio para tornar a combinação indisponível.'
            : 'Deixe vazio para usar o preço base (mostrado em cinza).'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="rounded-tl-md bg-fundo-secao p-2 font-bold">Tamanho</th>
              {dados.papeis.map((p, i) => (
                <th key={p.id} className={`bg-fundo-secao p-2 font-bold ${i === dados.papeis.length - 1 ? 'rounded-tr-md' : ''}`}>
                  {p.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.tamanhos.map((t, linha) => (
              <tr key={t.id} className={linha % 2 ? 'bg-fundo-alternado' : 'bg-white'}>
                <th scope="row" className="p-2 font-bold">
                  {t.nome}
                </th>
                {dados.papeis.map((p) => {
                  const k = chave(escopo, t.id, p.id);
                  const base = valores[chave(null, t.id, p.id)];
                  return (
                    <td key={p.id} className="p-1.5">
                      <label className="sr-only" htmlFor={k}>
                        Preço {t.nome} {p.nome}
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave">R$</span>
                        <input
                          id={k}
                          inputMode="decimal"
                          className="campo pl-10"
                          value={valores[k] ?? ''}
                          placeholder={escopo !== null && base ? base : '—'}
                          onChange={(e) => setValores({ ...valores, [k]: e.target.value })}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mensagem && <Alerta tipo={mensagem.tipo}>{mensagem.texto}</Alerta>}
      <Botao carregando={salvando} textoCarregando="Salvando..." onClick={() => void salvar()}>
        Salvar tabela
      </Botao>
    </section>
  );
}

// ---------- Tamanhos e papéis ----------

function ListaTamanhos({ tamanhos, aoMudar }: { tamanhos: Tamanho[]; aoMudar: () => void }) {
  const [novo, setNovo] = useState({ nome: '', larguraCm: '', alturaCm: '' });
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: () => Promise<unknown>) {
    setErro(null);
    try {
      await acao();
      aoMudar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
    }
  }
  const numero = (s: string) => (s.trim() ? Number(s.replace(',', '.')) || null : null);

  return (
    <section className="cartao space-y-3 p-4 md:p-6" aria-labelledby="t-tamanhos">
      <h2 id="t-tamanhos" className="text-xl md:text-2xl">
        Tamanhos
      </h2>
      <ul className="divide-y divide-borda">
        {tamanhos.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className={`flex-1 font-bold ${t.ativo ? '' : 'text-texto-suave line-through'}`}>
              {t.nome}
              {t.larguraCm && t.alturaCm ? <span className="ml-2 font-normal text-texto-suave">{t.larguraCm}×{t.alturaCm} cm</span> : null}
            </span>
            <Botao tamanho="pequeno" variante="fantasma" onClick={() => void executar(() => admin.salvarTamanho({ ...t, ativo: !t.ativo }, t.id))}>
              {t.ativo ? 'Desativar' : 'Ativar'}
            </Botao>
            <button
              type="button"
              aria-label={`Apagar tamanho ${t.nome}`}
              onClick={() => window.confirm(`Apagar o tamanho ${t.nome} e seus preços?`) && void executar(() => admin.apagarTamanho(t.id))}
              className="grid h-11 w-11 place-items-center rounded-full text-erro hover:bg-erro/10"
            >
              <Trash size={20} weight="bold" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_100px_100px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!novo.nome.trim()) return;
          void executar(async () => {
            await admin.salvarTamanho({
              nome: novo.nome.trim(),
              larguraCm: numero(novo.larguraCm),
              alturaCm: numero(novo.alturaCm),
              ordem: tamanhos.length + 1,
              ativo: true,
            });
            setNovo({ nome: '', larguraCm: '', alturaCm: '' });
          });
        }}
      >
        <input aria-label="Nome do tamanho" className="campo col-span-2 sm:col-span-1" placeholder="Nome (ex.: 10×15)" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} maxLength={40} />
        <input aria-label="Largura em cm" className="campo" inputMode="decimal" placeholder="Larg. cm" value={novo.larguraCm} onChange={(e) => setNovo({ ...novo, larguraCm: e.target.value })} />
        <input aria-label="Altura em cm" className="campo" inputMode="decimal" placeholder="Alt. cm" value={novo.alturaCm} onChange={(e) => setNovo({ ...novo, alturaCm: e.target.value })} />
        <Botao type="submit" className="col-span-2 sm:col-span-1" disabled={!novo.nome.trim()} icone={<Plus size={20} weight="bold" aria-hidden />}>
          Adicionar
        </Botao>
      </form>
      <p className="text-sm text-texto-suave">Largura e altura são usadas no aviso de qualidade da foto.</p>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
    </section>
  );
}

function ListaPapeis({ papeis, aoMudar }: { papeis: Papel[]; aoMudar: () => void }) {
  const [novo, setNovo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  async function executar(acao: () => Promise<unknown>) {
    setErro(null);
    try {
      await acao();
      aoMudar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
    }
  }
  return (
    <section className="cartao space-y-3 p-4 md:p-6" aria-labelledby="t-papeis">
      <h2 id="t-papeis" className="text-xl md:text-2xl">
        Papéis
      </h2>
      <ul className="divide-y divide-borda">
        {papeis.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className={`flex-1 font-bold ${p.ativo ? '' : 'text-texto-suave line-through'}`}>{p.nome}</span>
            <Botao tamanho="pequeno" variante="fantasma" onClick={() => void executar(() => admin.salvarPapel({ ...p, ativo: !p.ativo }, p.id))}>
              {p.ativo ? 'Desativar' : 'Ativar'}
            </Botao>
            <button
              type="button"
              aria-label={`Apagar papel ${p.nome}`}
              onClick={() => window.confirm(`Apagar o papel ${p.nome} e seus preços?`) && void executar(() => admin.apagarPapel(p.id))}
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
          if (!novo.trim()) return;
          void executar(async () => {
            await admin.salvarPapel({ nome: novo.trim(), ordem: papeis.length + 1, ativo: true });
            setNovo('');
          });
        }}
      >
        <input aria-label="Nome do papel" className="campo" placeholder="Nome (ex.: Fotográfico)" value={novo} onChange={(e) => setNovo(e.target.value)} maxLength={60} />
        <Botao type="submit" disabled={!novo.trim()} icone={<Plus size={20} weight="bold" aria-hidden />}>
          Adicionar
        </Botao>
      </form>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
    </section>
  );
}

export default function Precos() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => admin.catalogo(), []);
  if (carregando && !dados) return <Carregando />;
  if (erro || !dados) return <EstadoErro mensagem={erro ?? 'Erro'} aoTentarDeNovo={() => void recarregar()} />;
  const menor = dados.precos.filter((p) => p.modeloId === null).reduce<number | null>((m, p) => (m === null || p.valorCentavos < m ? p.valorCentavos : m), null);
  return (
    <div className="space-y-6">
      <div>
        <h1>Preços</h1>
        {menor !== null && <p className="text-texto-suave">Menor preço base: {formatarCentavos(menor)}</p>}
      </div>
      <TabelaPrecos dados={dados} aoSalvar={() => void recarregar()} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ListaTamanhos tamanhos={dados.tamanhos} aoMudar={() => void recarregar()} />
        <ListaPapeis papeis={dados.papeis} aoMudar={() => void recarregar()} />
      </div>
    </div>
  );
}
