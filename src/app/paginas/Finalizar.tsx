import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, PixLogo, WhatsappLogo } from '@phosphor-icons/react';
import { esquemaCliente } from '../../compartilhado/esquemas';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import type { FormaPagamento } from '../../compartilhado/tipos';
import { ErroApi, criarPedido } from '../api';
import { Alerta } from '../componentes/Alerta';
import { AreaTexto, Campo, CampoCelular } from '../componentes/Campo';
import { Botao } from '../componentes/Botao';
import { EstadoVazio } from '../componentes/Estados';
import { fotoVencida, nomeTamanhoItem, paraItemPedido, totalCarrinho, useCarrinho } from '../loja/carrinho';
import { useCatalogo } from '../loja/catalogo';

export const CHAVE_ENVIADO = 'majuprint-enviado';

type Erros = Partial<Record<'nome' | 'telefone' | 'endereco' | 'pagamento', string>>;

export default function Finalizar() {
  const navegar = useNavigate();
  const dados = useCatalogo((s) => s.dados);
  const itens = useCarrinho((s) => s.itens);
  const limpar = useCarrinho((s) => s.limpar);
  const marcarFotosExpiradas = useCarrinho((s) => s.marcarFotosExpiradas);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [pagamento, setPagamento] = useState<FormaPagamento | null>(null);
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!dados) return null;
  if (itens.length === 0) {
    return (
      <EstadoVazio titulo="Seu carrinho está vazio">
        <Link to="/" className="font-bold text-primaria-escura underline">
          Ver o catálogo
        </Link>
      </EstadoVazio>
    );
  }

  const total = totalCarrinho(itens, dados.precos);
  const vencidas = itens.some((i) => fotoVencida(i));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);
    const r = esquemaCliente.safeParse({
      nome,
      telefone,
      endereco,
      pagamento: pagamento ?? undefined,
      observacao: observacao || undefined,
    });
    if (!r.success) {
      const novos: Erros = {};
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as keyof Erros;
        novos[campo] ??= issue.message;
      }
      setErros(novos);
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const resultado = await criarPedido({ cliente: r.data, itens: itens.map(paraItemPedido) });
      sessionStorage.setItem(CHAVE_ENVIADO, JSON.stringify(resultado));
      limpar();
      navegar('/enviado', { replace: true });
      window.location.href = resultado.linkWhatsapp;
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 409) {
        const detalhes = erro.detalhes as { uploadsInvalidos?: string[] } | undefined;
        if (detalhes?.uploadsInvalidos) marcarFotosExpiradas(detalhes.uploadsInvalidos);
      }
      setErroGeral(erro instanceof Error ? erro.message : 'Ops, algo deu errado no envio.');
    } finally {
      setEnviando(false);
    }
  }

  const botaoPagamento = (valor: FormaPagamento, rotulo: string, icone: JSX.Element) => (
    <button
      type="button"
      role="radio"
      aria-checked={pagamento === valor}
      onClick={() => {
        setPagamento(valor);
        setErros((e) => ({ ...e, pagamento: undefined }));
      }}
      className={`flex h-16 flex-1 items-center justify-center gap-2 rounded-lg border-2 font-bold transition-colors ${
        pagamento === valor ? 'border-primaria bg-primaria/10 text-secundaria' : 'border-borda bg-white text-secundaria hover:border-primaria'
      }`}
    >
      {icone}
      {rotulo}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/" className="inline-flex h-11 items-center gap-1 font-bold text-primaria-escura">
        <ArrowLeft size={20} weight="bold" aria-hidden /> Continuar escolhendo
      </Link>
      <h1>Finalizar pedido</h1>

      <section aria-labelledby="titulo-resumo" className="cartao p-4 md:p-6">
        <h2 id="titulo-resumo" className="text-xl md:text-2xl">
          Resumo
        </h2>
        <ul className="mt-2 divide-y divide-borda">
          {itens.map((item, i) => {
            const t = nomeTamanhoItem(item, dados.tamanhos);
            const p = dados.papeis.find((x) => x.id === item.papelId)?.nome;
            const v = total.linhas[i]?.subtotalCentavos ?? null;
            return (
              <li key={item.idLocal} className="flex justify-between gap-3 py-2 text-[15px]">
                <span>
                  <strong className="text-secundaria">{item.modeloNome}</strong>
                  <span className="block text-texto-suave">
                    {t} · {p} · {item.quantidade} un.
                  </span>
                </span>
                <span className="shrink-0 font-bold text-primaria-escura">{v === null ? 'a orçar' : formatarCentavos(v)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between border-t border-borda pt-3">
          <span className="font-bold">Subtotal</span>
          <span className="font-titulo text-2xl font-semibold text-primaria-escura">
            {formatarCentavos(total.subtotalCentavos)}
          </span>
        </div>
        {total.temAOrcar && <p className="text-sm text-texto-suave">+ itens personalizados a orçar</p>}
        <p className="mt-2 text-sm text-texto-suave">O frete e o link de pagamento são combinados pelo WhatsApp.</p>
      </section>

      {vencidas && (
        <Alerta tipo="erro">
          Algumas fotos expiraram. Abra o carrinho, remova os itens marcados e adicione de novo.
        </Alerta>
      )}

      <form onSubmit={enviar} noValidate className="cartao space-y-4 p-4 md:p-6">
        <h2 className="text-xl md:text-2xl">Seus dados</h2>
        <Campo
          rotulo="Nome"
          autoComplete="name"
          maxLength={120}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erros.nome}
        />
        <CampoCelular
          rotulo="WhatsApp"
          valor={telefone}
          aoMudar={(v) => {
            setTelefone(v);
            if (erros.telefone) setErros({ ...erros, telefone: undefined });
          }}
          erro={erros.telefone}
        />
        <AreaTexto
          rotulo="Endereço de entrega"
          autoComplete="street-address"
          placeholder="Rua, número, bairro, cidade e ponto de referência"
          maxLength={400}
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          erro={erros.endereco}
        />
        <fieldset>
          <legend className="mb-2 font-bold text-secundaria">Forma de pagamento</legend>
          <div role="radiogroup" className="flex gap-3" aria-describedby={erros.pagamento ? 'erro-pagamento' : undefined}>
            {botaoPagamento('pix', 'Pix', <PixLogo size={26} weight="bold" aria-hidden />)}
            {botaoPagamento('cartao', 'Cartão', <CreditCard size={26} weight="bold" aria-hidden />)}
          </div>
          {erros.pagamento && (
            <p id="erro-pagamento" className="mt-1 text-sm text-erro">
              {erros.pagamento}
            </p>
          )}
          <p className="mt-2 text-sm text-texto-suave">Nada é cobrado agora: o link de pagamento é enviado pelo WhatsApp.</p>
        </fieldset>
        <AreaTexto
          rotulo="Observação (opcional)"
          maxLength={1000}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
        <p className="text-sm text-texto-suave">
          Seus dados e fotos são usados só para produzir e entregar o pedido, e são apagados após a entrega.
        </p>
        <div aria-live="polite">{erroGeral && <Alerta tipo="erro">{erroGeral}</Alerta>}</div>
        <Botao
          type="submit"
          larguraTotal
          tamanho="destaque"
          carregando={enviando}
          disabled={vencidas}
          icone={<WhatsappLogo size={24} weight="bold" aria-hidden />}
        >
          Salvar e enviar pelo WhatsApp
        </Botao>
      </form>
    </div>
  );
}
