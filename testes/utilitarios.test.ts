import { describe, expect, it } from 'vitest';
import { formatarCentavos, textoParaCentavos } from '../src/compartilhado/dinheiro';
import { esquemaPedido } from '../src/compartilhado/esquemas';
import { resolucaoSuficiente } from '../src/compartilhado/qualidade';
import { ehNavegadorInterno, linkIntentChrome } from '../src/app/util/instagram';
import { mascararTelefone } from '../src/app/util/telefone';
import { formatarTelefone, montarLinkWhatsapp, montarMensagem } from '../src/worker/servicos/whatsapp';
import { gerarCodigoPedido, sanitizarNomeArquivo } from '../src/worker/utils/ids';

const nbsp = (s: string) => s.replace(/ /g, ' ');

describe('dinheiro', () => {
  it('formata centavos em reais', () => {
    expect(nbsp(formatarCentavos(2500))).toBe('R$ 25,00');
    expect(nbsp(formatarCentavos(123456))).toBe('R$ 1.234,56');
  });
  it('converte texto em centavos', () => {
    expect(textoParaCentavos('12,50')).toBe(1250);
    expect(textoParaCentavos('R$ 1.234,5')).toBe(123450);
    expect(textoParaCentavos('abc')).toBeNull();
  });
});

describe('qualidade', () => {
  it('alerta abaixo de ~150 DPI', () => {
    // 20×30 cm a 150 DPI ≈ 1181×1772 px
    expect(resolucaoSuficiente(1200, 1800, 20, 30)).toBe(true);
    expect(resolucaoSuficiente(800, 1200, 20, 30)).toBe(false);
    // orientação invertida também vale
    expect(resolucaoSuficiente(1800, 1200, 20, 30)).toBe(true);
    // sem dados: não alerta
    expect(resolucaoSuficiente(null, null, 20, 30)).toBe(true);
  });
});

describe('esquemaPedido', () => {
  const base = {
    cliente: { nome: 'Maria', telefone: '(91) 91234-5678', endereco: 'Rua A, 1', pagamento: 'pix' },
    itens: [{ tipo: 'catalogo', modeloId: 1, tamanhoId: 1, papelId: 1, quantidade: 2, uploadId: 'a'.repeat(22) }],
  };
  it('aceita pedido válido e normaliza o telefone', () => {
    const r = esquemaPedido.parse(base);
    expect(r.cliente.telefone).toBe('91912345678');
  });
  it('rejeita foto repetida em dois itens', () => {
    const r = esquemaPedido.safeParse({ ...base, itens: [base.itens[0], base.itens[0]] });
    expect(r.success).toBe(false);
  });
  it('rejeita mais de 20 fotos', () => {
    const itens = Array.from({ length: 21 }, (_, i) => ({ ...base.itens[0], uploadId: `foto${String(i).padStart(18, '0')}` }));
    expect(esquemaPedido.safeParse({ ...base, itens }).success).toBe(false);
  });
  it('rejeita telefone curto e pagamento inválido', () => {
    expect(esquemaPedido.safeParse({ ...base, cliente: { ...base.cliente, telefone: '1234' } }).success).toBe(false);
    expect(esquemaPedido.safeParse({ ...base, cliente: { ...base.cliente, pagamento: 'boleto' } }).success).toBe(false);
  });
});

describe('whatsapp', () => {
  it('monta a mensagem no formato combinado', () => {
    const msg = nbsp(
      montarMensagem({
        codigo: 'A7K2-9QX',
        nome: 'Maria Silva',
        telefone: '91912345678',
        endereco: 'Rua tal, 123',
        pagamento: 'pix',
        subtotalCentavos: 2500,
        temAOrcar: true,
        itens: [
          { modeloNome: 'Polaroid', tamanhoNome: '10×15', papelNome: 'Fotográfico', quantidade: 5, subtotalCentavos: 2500 },
          { modeloNome: 'Personalizado', tamanhoNome: '20×30', papelNome: 'Adesivo', quantidade: 1, subtotalCentavos: null, descricao: 'fundo rosa' },
        ],
        linkPainel: 'https://exemplo.dev/admin/pedidos/A7K2-9QX',
      }),
    );
    expect(msg).toContain('*Novo pedido #A7K2-9QX*');
    expect(msg).toContain('*WhatsApp:* (91) 91234-5678');
    expect(msg).toContain('1) Polaroid — 10×15 — Fotográfico — 5 un. — R$ 25,00');
    expect(msg).toContain('2) Personalizado — 20×30 — Adesivo — 1 un. — a orçar');
    expect(msg).toContain('   Obs.: fundo rosa');
    expect(msg).toContain('*Subtotal:* R$ 25,00 (+ itens a orçar)');
    expect(msg).toContain('*Pagamento:* Pix');
    expect(msg).toContain('Ver pedido e fotos: https://exemplo.dev/admin/pedidos/A7K2-9QX');
  });
  it('gera link wa.me codificado', () => {
    expect(montarLinkWhatsapp('+55 (91) 90000-0000', 'Olá & tchau')).toBe('https://wa.me/5591900000000?text=Ol%C3%A1%20%26%20tchau');
  });
  it('formata telefone', () => {
    expect(formatarTelefone('9133334444')).toBe('(91) 3333-4444');
  });
});

describe('ids', () => {
  it('gera código legível no formato XXXX-XXX', () => {
    for (let i = 0; i < 50; i++) expect(gerarCodigoPedido()).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{3}$/);
  });
  it('sanitiza nomes de arquivo', () => {
    expect(sanitizarNomeArquivo('Foto Maçã (1).HEIC')).toBe('Foto_Maca_1_.HEIC');
    expect(sanitizarNomeArquivo('../../etc/passwd')).toBe('etc_passwd');
  });
});

describe('front-end', () => {
  it('detecta navegador do Instagram', () => {
    expect(ehNavegadorInterno('Mozilla/5.0 (iPhone) Instagram 300.0')).toBe(true);
    expect(ehNavegadorInterno('Mozilla/5.0 [FBAN/FBIOS;FBAV/400]')).toBe(true);
    expect(ehNavegadorInterno('Mozilla/5.0 (Linux; Android 14) Chrome/130')).toBe(false);
  });
  it('monta intent do Chrome', () => {
    expect(linkIntentChrome(new URL('https://loja.dev/modelo/3?x=1'))).toMatch(
      /^intent:\/\/loja\.dev\/modelo\/3\?x=1#Intent;scheme=https;package=com\.android\.chrome;S\.browser_fallback_url=https%3A%2F%2Floja\.dev%2Fmodelo%2F3%3Fx%3D1;end$/,
    );
  });
  it('mascara telefone', () => {
    expect(mascararTelefone('91912345678')).toBe('(91) 91234-5678');
    expect(mascararTelefone('9133')).toBe('(91) 33');
  });
});
