// Teste de ponta a ponta da API contra o servidor local (npm run dev).
// Uso: node scripts/teste-fluxo.mjs [http://localhost:5173]
// Requer .dev.vars com as chaves de TESTE do Turnstile e ADMIN_DEV_LIVRE=1.
import { readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
let falhas = 0;

function verificar(condicao, descricao, extra) {
  if (condicao) console.log(`  ✓ ${descricao}`);
  else {
    falhas++;
    console.log(`  ✗ ${descricao}`, extra ?? '');
  }
}

async function api(caminho, opcoes = {}) {
  const r = await fetch(BASE + caminho, opcoes);
  const tipo = r.headers.get('content-type') ?? '';
  return { status: r.status, corpo: tipo.includes('json') ? await r.json() : await r.arrayBuffer(), cabecalhos: r.headers };
}

const json = (corpo, token) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(corpo),
});

const foto = readFileSync(new URL('../public/logo.webp', import.meta.url));

async function enviarFoto(token, nome = 'minha foto.webp') {
  return api('/api/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/webp',
      'X-Nome-Arquivo': encodeURIComponent(nome),
      'X-Largura': '512',
      'X-Altura': '512',
    },
    body: foto,
  });
}

console.log('Catálogo');
const cat = await api('/api/catalogo');
verificar(cat.status === 200 && cat.corpo.modelos.length > 0, 'GET /api/catalogo retorna modelos');
const modelo = cat.corpo.modelos.find((m) => m.disponivel);
const esgotado = cat.corpo.modelos.find((m) => !m.disponivel);
const [t1] = cat.corpo.tamanhos;
const [p1] = cat.corpo.papeis;

console.log('Sessão');
const semSessao = await enviarFoto('invalido');
verificar(semSessao.status === 401, 'upload sem sessão é recusado (401)');
const s = await api('/api/sessao', json({ turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' }));
verificar(s.status === 200 && s.corpo.token, 'POST /api/sessao emite token');
const token = s.corpo.token;
const renovada = await api('/api/sessao', json({ turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX', tokenAnterior: token }));
const sid = (t) => JSON.parse(Buffer.from(t.split('.')[0], 'base64url').toString()).sid;
verificar(renovada.status === 200 && sid(renovada.corpo.token) === sid(token), 'renovação mantém o mesmo ID de sessão');

console.log('Uploads');
const tipoErrado = await api('/api/uploads', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/pdf' },
  body: foto,
});
verificar(tipoErrado.status === 415, 'formato não aceito é recusado (415)');
const u1 = await enviarFoto(token);
const u2 = await enviarFoto(token, 'eu.webp');
const u3 = await enviarFoto(token, 'referencia.webp');
const u4 = await enviarFoto(token, 'desisti.webp');
verificar([u1, u2, u3, u4].every((u) => u.status === 201 && u.corpo.uploadId), 'quatro fotos enviadas (201)');
const del = await api(`/api/uploads/${u4.corpo.uploadId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
verificar(del.status === 200, 'DELETE /api/uploads/:id remove foto');

const outra = await api('/api/sessao', json({ turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' }));

console.log('Pedido');
const cliente = { nome: 'Cliente Teste', telefone: '(91) 91234-5678', endereco: 'Rua de Teste, 1', pagamento: 'pix' };
const itemCatalogo = { tipo: 'catalogo', modeloId: modelo.id, tamanhoId: t1.id, papelId: p1.id, quantidade: 3, uploadId: u1.corpo.uploadId };
const itemPers = {
  tipo: 'personalizado',
  tamanhoId: t1.id,
  papelId: p1.id,
  quantidade: 1,
  uploadIdCliente: u2.corpo.uploadId,
  uploadIdReferencia: u3.corpo.uploadId,
  descricao: 'fundo rosa',
};
const deOutraSessao = await api('/api/pedidos', json({ cliente, itens: [itemCatalogo] }, outra.corpo.token));
verificar(deOutraSessao.status === 409, 'foto de outra sessão é recusada (409)');
const comEsgotado = await api('/api/pedidos', json({ cliente, itens: [{ ...itemCatalogo, modeloId: esgotado?.id ?? 99999 }] }, token));
verificar(comEsgotado.status === 409, 'modelo esgotado é recusado (409)');
const invalido = await api('/api/pedidos', json({ cliente: { ...cliente, telefone: '12' }, itens: [itemCatalogo] }, token));
verificar(invalido.status === 400, 'telefone inválido é recusado (400)');

const ped = await api('/api/pedidos', json({ cliente, itens: [itemCatalogo, itemPers] }, token));
verificar(ped.status === 201 && /^[A-Z0-9]{4}-[A-Z0-9]{3}$/.test(ped.corpo.codigo), 'POST /api/pedidos cria pedido', ped.corpo);
const codigo = ped.corpo.codigo;
const mensagem = decodeURIComponent(ped.corpo.linkWhatsapp.split('?text=')[1] ?? '');
verificar(mensagem.includes(`#${codigo}`) && mensagem.includes('/admin/pedidos/'), 'link do WhatsApp contém código e link do painel');
verificar(mensagem.includes('a orçar'), 'item personalizado aparece como "a orçar"');
const repetido = await api('/api/pedidos', json({ cliente, itens: [itemCatalogo] }, token));
verificar(repetido.status === 409, 'fotos já usadas não podem ser reaproveitadas (409)');

console.log('Admin');
const lista = await api('/api/admin/pedidos?status=novo');
verificar(lista.status === 200 && lista.corpo.pedidos.some((p) => p.codigo === codigo), 'pedido aparece na lista de novos');
const det = await api(`/api/admin/pedidos/${codigo}`);
const precoEsperado = cat.corpo.precos.find((p) => p.modeloId === modelo.id && p.tamanhoId === t1.id && p.papelId === p1.id)
  ?? cat.corpo.precos.find((p) => p.modeloId === null && p.tamanhoId === t1.id && p.papelId === p1.id);
verificar(det.corpo.subtotalCentavos === precoEsperado.valorCentavos * 3, 'subtotal recalculado no servidor');
verificar(det.corpo.itens.length === 2 && det.corpo.itens[1].fotos.length === 2, 'itens e fotos gravados');
const fotoId = det.corpo.itens[0].fotos[0].id;
const baixada = await api(`/api/admin/fotos/${fotoId}`);
verificar(
  baixada.status === 200 && Buffer.from(baixada.corpo).equals(foto),
  'foto baixada é idêntica ao original (sem compressão)',
);
verificar((baixada.cabecalhos.get('content-disposition') ?? '').includes(codigo), 'Content-Disposition com código do pedido');

const entregue = await api(`/api/admin/pedidos/${codigo}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'entregue' }),
});
verificar(entregue.corpo.apagarEm > Date.now() + 23 * 3600e3, 'marcar entregue agenda apagar_em para +24 h');
const voltou = await api(`/api/admin/pedidos/${codigo}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'producao' }),
});
verificar(voltou.corpo.apagarEm === null, 'voltar para produção limpa apagar_em');

const cfg = await api('/api/admin/config');
verificar(cfg.status === 200 && 'whatsapp_numero' in cfg.corpo, 'GET /api/admin/config');
const imgPublica = await api('/img/catalogo/nao-existe.webp');
verificar(imgPublica.status === 404, 'imagem inexistente retorna 404');
const pedidoPorImg = await api('/img/pedidos/x.webp');
verificar(pedidoPorImg.status === 404, 'fotos de clientes não são servidas pela rota pública');

console.log('Admin — catálogo');
const enviarJson = (metodo, caminho, corpo) =>
  api(caminho, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
const novo = await enviarJson('POST', '/api/admin/modelos', {
  categoriaId: null, nome: 'Modelo de teste', descricao: null, disponivel: true, ativo: false, ordem: 99,
});
verificar(novo.status === 201 && novo.corpo.id, 'cria modelo');
const img = await api(`/api/admin/modelos/${novo.corpo.id}/imagem`, {
  method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: foto,
});
verificar(img.status === 200 && img.corpo.imagemKey?.startsWith('catalogo/'), 'envia imagem do modelo para catalogo/');
const servida = await api(`/img/${img.corpo.imagemKey}`);
verificar(
  servida.status === 200 && (servida.cabecalhos.get('cache-control') ?? '').includes('immutable'),
  'imagem do catálogo servida com cache longo',
);
const adminCat = await api('/api/admin/catalogo');
const precosAtuais = adminCat.corpo.precos;
const putPrecos = await enviarJson('PUT', '/api/admin/precos', {
  precos: [...precosAtuais, { modeloId: novo.corpo.id, tamanhoId: t1.id, papelId: p1.id, valorCentavos: 1234 }],
});
verificar(putPrecos.status === 200, 'salva tabela de preços inteira');
const duplicado = await enviarJson('PUT', '/api/admin/precos', { precos: [precosAtuais[0], precosAtuais[0]] });
verificar(duplicado.status === 400, 'recusa preço duplicado');
const apagado = await api(`/api/admin/modelos/${novo.corpo.id}`, { method: 'DELETE' });
verificar(apagado.status === 200, 'apaga modelo (e seus preços)');
const depois = await api('/api/admin/catalogo');
verificar(depois.corpo.precos.length === precosAtuais.length, 'preços do modelo apagado foram removidos');
const imgApagada = await api(`/img/${img.corpo.imagemKey}`);
verificar(imgApagada.status === 404, 'imagem do modelo apagado removida do R2');

console.log(falhas === 0 ? '\nTudo certo!' : `\n${falhas} verificação(ões) falharam`);
console.log(`Pedido de teste: ${codigo}`);
process.exit(falhas === 0 ? 0 : 1);
