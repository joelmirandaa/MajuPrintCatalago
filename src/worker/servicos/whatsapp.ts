// Mensagem do pedido e link wa.me (estrutura.md, seção 9).
import { formatarCentavos } from '../utils/dinheiro';

export interface DadosMensagem {
  codigo: string;
  nome: string;
  telefone: string;
  endereco: string;
  pagamento: 'pix' | 'cartao';
  observacao?: string | null;
  subtotalCentavos: number;
  temAOrcar: boolean;
  itens: {
    modeloNome: string;
    tamanhoNome: string;
    papelNome: string;
    quantidade: number;
    subtotalCentavos: number | null;
    descricao?: string | null;
  }[];
  linkPainel: string;
}

/** (91) 91234-5678 — aceita números com ou sem o 55. */
export function formatarTelefone(digitos: string): string {
  const d = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}

export function montarMensagem(d: DadosMensagem): string {
  const linhas: string[] = [
    `*Novo pedido #${d.codigo}*`,
    '',
    `*Cliente:* ${d.nome}`,
    `*WhatsApp:* ${formatarTelefone(d.telefone)}`,
    `*Endereço:* ${d.endereco}`,
    '',
    '*Itens:*',
  ];
  d.itens.forEach((item, i) => {
    const valor = item.subtotalCentavos === null ? 'a orçar' : formatarCentavos(item.subtotalCentavos);
    linhas.push(
      `${i + 1}) ${item.modeloNome} — ${item.tamanhoNome} — ${item.papelNome} — ${item.quantidade} un. — ${valor}`,
    );
    if (item.descricao) linhas.push(`   Obs.: ${item.descricao}`);
  });
  linhas.push('');
  linhas.push(`*Subtotal:* ${formatarCentavos(d.subtotalCentavos)}${d.temAOrcar ? ' (+ itens a orçar)' : ''}`);
  linhas.push(`*Pagamento:* ${d.pagamento === 'pix' ? 'Pix' : 'Cartão'}`);
  if (d.observacao) linhas.push(`*Observação:* ${d.observacao}`);
  linhas.push('');
  linhas.push(`Ver pedido e fotos: ${d.linkPainel}`);
  return linhas.join('\n');
}

/** Sem número configurado, o link abre o WhatsApp para a cliente escolher o contato. */
export function montarLinkWhatsapp(numero: string, mensagem: string): string {
  const digitos = numero.replace(/\D/g, '');
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}
