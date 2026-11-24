# GUIA DE DESIGN E PADRÃO VISUAL — MAJU PRINT

> Documento de referência para definir a identidade visual, a estrutura das interfaces e os padrões de componentes do projeto Maju Print.
>
> As cores foram medidas diretamente nos pixels da logo oficial. Os campos marcados como **[A definir]** dependem de informações institucionais que só a dona da marca pode confirmar e não foram inventados.

## 1. IDENTIFICAÇÃO DO PROJETO

- Nome do projeto: Maju Print
- Descrição: Marca de impressão e produtos personalizados. **[A definir: lista exata de produtos e serviços]**
- Objetivo principal: Apresentar os produtos, transmitir confiança e levar o cliente a pedir orçamento ou comprar (ex.: contato via WhatsApp).
- Público-alvo: **[A definir]** — sugestão coerente com a marca: famílias, festas e eventos, presentes personalizados e pequenos negócios.
- Localização ou região de atuação: **[A definir]**
- Tipo de aplicação: (X) Site ( ) Sistema Web ( ) SaaS ( ) Aplicativo ( ) Outro — com possível evolução para loja online.
- Tecnologias utilizadas: **[A definir]**
- Frameworks e bibliotecas: **[A definir]**
- Responsável pelo projeto: **[A definir]**

## 2. IDENTIDADE VISUAL

- Nome da marca: Maju Print
- Slogan: **[A definir]**
- Descrição da identidade: Marca alegre, calorosa e próxima, com uma pessoa real por trás de cada pedido. A mascote (mulher negra, de cabelo cacheado volumoso, sorriso largo e brincos de argola dourados) representa a criadora e dá rosto humano à marca. O laranja transmite energia e criatividade; o marrom traz aconchego e personalidade.
- Personalidade visual: ( ) Moderna ( ) Minimalista ( ) Corporativa ( ) Tecnológica (X) Acolhedora (X) Outro: Divertida / Artesanal
- Logo oficial: `logo-maju-print-circular.jpg` (versão circular laranja) e `logo-maju-print-recortada.png` (versão sem fundo). **[Confirmar nomes e localização dos arquivos no projeto]**
- Variações da logo:

| Versão | Quando usar | Fundos permitidos |
|---|---|---|
| Circular laranja (fundo laranja, letras brancas) | Avatar de redes sociais, favicon, selo, rodapé | Branco, creme ou fotos claras |
| Recortada (letras brancas, sem fundo) | Cabeçalho escuro, banners, sobre fotos | Marrom cacau, laranja ou fotos escuras |
| Mascote isolada (só o rosto) | Ícone do app, estados vazios, mensagens de sucesso/erro, loading | Qualquer fundo da paleta |

- Regras de utilização:
  - Nunca distorcer, girar, esticar, recolorir ou aplicar sombras, brilhos e contornos extras na logo.
  - Área de respiro mínima ao redor da logo: a altura da palavra "PRINT".
  - Tamanho mínimo: 48 px de diâmetro (circular) e 96 px de largura (recortada).
  - A versão recortada com letras brancas nunca deve ser aplicada sobre fundo branco ou creme.
  - Usar sempre arquivos em alta resolução (preferencialmente SVG ou PNG com transparência).
- Elementos visuais que devem ser preservados: a mascote, o coração entre "Ma" e "ju", as letras arredondadas e grossas, o "PRINT" em marrom com traço de pincel, o contorno branco ao redor da mascote.
- Elementos que devem ser evitados: visual frio ou corporativo, cantos retos e duros, azul ou cinza como cor principal, fotos genéricas de banco de imagens, excesso de laranja em grandes áreas de texto.

## 3. PALETA DE CORES

| Aplicação | Nome da cor | Código HEX |
|---|---|---|
| Cor principal | Laranja Maju (fundo da logo) | #FD6A07 |
| Cor secundária | Marrom Cacau ("PRINT" e contornos) | #3A1C0C |
| Cor de destaque | Dourado Argola (brincos da mascote) | #E9A93B |
| Cor de fundo | Branco | #FFFFFF |
| Fundo de seções | Creme Maju | #FFF5EB |
| Texto principal | Marrom Cacau | #3A1C0C |
| Texto secundário | Marrom Canela | #7A5646 |
| Bordas | Areia | #F0DCCB |
| Sucesso | Verde Folha | #1F7A4D |
| Alerta | Âmbar | #9A6700 |
| Erro | Vermelho | #B42318 |
| Informação | Azul | #1F5FA8 |

Cor auxiliar: **Laranja Tijolo #C2410C** — versão escurecida do laranja, para links, preços e botões com texto branco.

**Contrastes verificados (WCAG):**

| Combinação | Contraste | Uso |
|---|---|---|
| Marrom #3A1C0C sobre branco | 15,5:1 | Todo texto corrido |
| Marrom #3A1C0C sobre Laranja Maju #FD6A07 | 5,4:1 | Botão principal, faixas laranja |
| Branco sobre Laranja Tijolo #C2410C | 5,2:1 | Botão alternativo com texto branco |
| Laranja Tijolo #C2410C sobre branco | 5,2:1 | Links e preços |
| Canela #7A5646 sobre creme #FFF5EB | 6,0:1 | Texto secundário em seções |
| Branco sobre Laranja Maju #FD6A07 | 2,9:1 | **Proibido para textos** — apenas logo e títulos acima de 32 px em negrito |

Regras adicionais:
- Contraste mínimo: 4,5:1 para textos e 3:1 para ícones e bordas de campos (WCAG 2.1 AA).
- Utilização de gradientes: evitar. Se necessário, apenas #FD6A07 → #FF8A3D em banners grandes.
- Modo escuro: (X) Sim ( ) Não — opcional. Fundo #3A1C0C, superfícies #4A2615, texto #FFF5EB, Laranja Maju mantido como destaque.
- Outras regras: proporção de uso aproximada de 60% branco/creme, 25% marrom, 10% laranja e 5% dourado. O laranja chama atenção justamente por ser usado com moderação.

## 4. TIPOGRAFIA

- Fonte principal (textos): **Nunito** — arredondada e legível, conversa com as letras da logo.
- Fonte secundária (detalhes e selos): **Caveat Brush** — traço de pincel, remete ao "PRINT" da logo. Uso pontual (selos, destaques curtos, assinaturas), nunca em textos longos.
- Fonte para títulos: **Fredoka** — letras grossas e arredondadas, a mais próxima do "Maju" da logo.
- Peso dos títulos: 600 (SemiBold) a 700 (Bold).
- Peso dos textos: 400 (Regular); 700 para ênfase.
- Tamanho dos títulos: H1 40 px (desktop) / 30 px (celular); H2 32 / 24 px; H3 24 / 20 px; H4 20 / 18 px.
- Tamanho dos textos: 16 px (mínimo absoluto 16 px no celular).
- Tamanho dos textos auxiliares: 14 px (legendas, rótulos, notas); nunca abaixo de 12 px.
- Altura das linhas: 1,2 nos títulos; 1,6 nos textos.
- Fontes locais ou externas: Google Fonts (gratuitas). Preferir hospedagem local em produção para desempenho, com `font-display: swap`.
- Regras adicionais: máximo de 3 famílias; títulos em marrom cacau; evitar texto todo em caixa alta, exceto em selos curtos; comprimento ideal de linha entre 60 e 75 caracteres.

> Observação: as fontes da logo são desenhos próprios. As fontes acima são equivalentes livres escolhidas por semelhança; a logo continua sendo usada sempre como imagem.

## 5. ESTILO DOS COMPONENTES

**Botões**
- Estilo: formato "pílula", amigável e arredondado.
  - Primário: fundo Laranja Maju #FD6A07, texto Marrom Cacau #3A1C0C, Nunito 700.
  - Secundário: fundo transparente, borda 2 px #3A1C0C, texto #3A1C0C.
  - Alternativo (sobre fundos claros quando precisar de texto branco): fundo #C2410C, texto #FFFFFF.
  - WhatsApp/contato: segue o primário, com ícone do WhatsApp.
- Bordas: raio de 999 px (pílula).
- Altura: 48 px (padrão), 40 px (pequeno), 56 px (destaque).
- Cores: conforme a paleta acima.
- Efeitos ao passar o mouse: escurecer o fundo (#E85F00 no primário), elevar 2 px e reforçar a sombra; transição de 200 ms.
- Estado de carregamento: spinner circular marrom à esquerda, texto "Enviando..." e botão bloqueado.
- Estado desabilitado: fundo #F0DCCB, texto #7A5646, opacidade 0,6, cursor `not-allowed`.

**Cartões**
- Estilo: fundo branco sobre seções creme, foto do produto no topo, título em Fredoka, preço em Laranja Tijolo.
- Arredondamento: 20 px (imagem interna com 16 px).
- Sombras: `0 4px 14px rgba(58, 28, 12, 0.08)`; no hover, `0 8px 24px rgba(58, 28, 12, 0.14)`.
- Espaçamento interno: 16 px (celular) / 24 px (desktop).
- Comportamento responsivo: 1 coluna no celular, 2 no tablet, 3 ou 4 no desktop; a altura acompanha o conteúdo, com botões alinhados na base.

**Campos e formulários**
- Estilo dos campos: fundo branco, rótulo acima do campo, texto de exemplo em #7A5646.
- Altura: 48 px (textarea com mínimo de 120 px).
- Bordas: 1,5 px #E3C7B2, raio de 12 px.
- Foco: borda 2 px #FD6A07 e halo `0 0 0 4px rgba(253, 106, 7, 0.2)`.
- Mensagens de erro: texto 14 px #B42318 abaixo do campo, ícone de alerta e borda vermelha.
- Mensagens de sucesso: borda #1F7A4D e ícone de check; após o envio, mostrar a mascote com a mensagem de confirmação.

**Ícones**
- Biblioteca: **Phosphor Icons** (estilo "Bold" ou "Duotone" — traços arredondados que combinam com a logo). Alternativa: Lucide.
- Estilo: traço arredondado, cantos suaves; cor marrom cacau ou laranja.
- Tamanho padrão: 24 px (20 px em textos, 32 px em destaques).
- Regras de utilização: não misturar bibliotecas; o ícone sempre acompanha texto ou `aria-label`; o coração da logo pode ser usado como ícone decorativo (favoritos, selos).

**Outros componentes**
- Modais: fundo branco, raio de 24 px, sobreposição `rgba(58, 28, 12, 0.5)`, botão de fechar no canto superior direito, fecha com Esc.
- Tabelas: cabeçalho em fundo creme e texto marrom 700, linhas alternadas branco/#FFFAF5; no celular, viram cartões empilhados.
- Alertas: fundo claro da cor do estado (10% de opacidade), borda esquerda de 4 px na cor do estado, ícone e texto marrom.
- Dropdowns: mesmo estilo dos campos, lista com raio de 12 px e sombra; item ativo em creme com texto laranja tijolo.
- Paginação: botões circulares de 40 px; página atual em Laranja Maju com texto marrom.
- Abas: texto marrom; aba ativa com sublinhado de 3 px em Laranja Maju arredondado.
- Tooltips: fundo marrom cacau, texto creme 14 px, raio de 8 px.
- Skeleton Loading: blocos em #F5E6D8 com brilho animado suave, mesmo formato dos cartões.
- Badges/selos (ex.: "Novo", "Mais vendido"): fundo dourado #E9A93B, texto marrom, fonte Caveat Brush ou Nunito 700, formato pílula.

## 6. ESTRUTURA DE NAVEGAÇÃO

**Desktop**
- Logo: versão circular à esquerda, 56 px de diâmetro, com link para a página inicial.
- Menu principal: Início · Produtos · Como funciona · Sobre · Contato. **[Ajustar conforme as páginas definidas]**
- Links: Nunito 600, 16 px, marrom; link ativo com sublinhado laranja.
- Botões de destaque: "Fazer orçamento" (botão primário) à direita.
- Posição do menu: cabeçalho horizontal no topo, fundo branco.
- Comportamento ao rolar a página: cabeçalho fixo; reduz de 80 px para 64 px de altura e ganha sombra suave após 80 px de rolagem.

**Tablet**
- Tipo de navegação: cabeçalho com logo e menu hambúrguer; botão "Orçamento" visível.
- Organização dos menus: painel lateral à direita com os mesmos links.

**Celular**
- Tipo de menu: hambúrguer à direita, painel em tela cheia com fundo creme.
- Menu compacto: logo circular de 44 px à esquerda e ícone do menu à direita.
- Atalhos principais: botão flutuante do WhatsApp no canto inferior direito (56 px, Laranja Maju).
- Comportamento de abertura e fechamento: desliza da direita em 250 ms; fecha no X, ao tocar fora, na tecla Esc ou ao escolher um link; bloqueia a rolagem da página enquanto aberto.

## 7. ESTRUTURA DAS PÁGINAS

> As páginas abaixo são uma estrutura sugerida para um site de produtos personalizados. Os conteúdos reais (produtos, preços, textos institucionais) estão marcados como **[A definir]**.

**Página: Início**

- Objetivo: apresentar a marca e levar ao orçamento.
- Público: visitantes novos vindos das redes sociais e da busca.
- Título principal: **[A definir]** — exemplo de tom: "Personalizados feitos com carinho para o seu momento".
- Descrição: frase curta sobre o que a Maju Print faz.
- Seções: Hero (título, descrição, botão e mascote) → Categorias de produtos → Destaques → Como funciona (3 passos) → Depoimentos → Chamada final para orçamento.
- Componentes: cabeçalho, botões, cartões de categoria e produto, passos numerados, depoimentos, rodapé.
- Botões e ações: "Fazer orçamento", "Ver produtos", WhatsApp.
- Imagens e ilustrações: mascote no hero; fotos reais dos produtos.
- Informações que devem aparecer: o que a marca faz, como pedir, formas de contato.
- Comportamentos e interações: animação suave de entrada das seções; cartões com hover.
- Estados de carregamento: skeleton nos cartões de produto.
- Estados vazios: sem destaques cadastrados → seção oculta.
- Estados de erro: falha ao carregar produtos → mensagem amigável com a mascote e botão "Tentar novamente".
- Regras específicas: o botão de orçamento deve aparecer sem rolar a tela, no celular e no desktop.

**Página: Produtos**

- Objetivo: mostrar o catálogo e facilitar a escolha.
- Público: clientes interessados em um produto específico.
- Título principal: "Nossos produtos".
- Descrição: **[A definir]**
- Seções: filtros por categoria → grade de produtos.
- Componentes: abas ou chips de filtro, cartões de produto, paginação.
- Botões e ações: "Ver detalhes", "Pedir orçamento".
- Imagens e ilustrações: fotos reais em proporção 1:1.
- Informações que devem aparecer: nome, foto, a partir de quanto custa (se houver preço público) e prazo médio. **[A definir]**
- Comportamentos e interações: filtro sem recarregar a página.
- Estados de carregamento: skeleton da grade.
- Estados vazios: "Nenhum produto nesta categoria ainda" com a mascote.
- Estados de erro: mensagem amigável e botão "Tentar novamente".
- Regras específicas: todos os cartões com a mesma proporção de imagem.

**Página: Detalhe do produto**

- Objetivo: tirar dúvidas e converter em pedido.
- Público: cliente decidido ou quase decidido.
- Título principal: nome do produto.
- Descrição: materiais, tamanhos, opções de personalização. **[A definir]**
- Seções: galeria → informações e opções → como personalizar → produtos relacionados.
- Componentes: galeria, seletores, botões, cartões relacionados.
- Botões e ações: "Pedir pelo WhatsApp" (envia mensagem pré-preenchida com o nome do produto).
- Imagens e ilustrações: 3 a 6 fotos reais, incluindo uma em uso.
- Informações que devem aparecer: preço ou "sob consulta", prazo, quantidade mínima. **[A definir]**
- Comportamentos e interações: galeria deslizável no celular; zoom no desktop.
- Estados de carregamento: skeleton da galeria e do texto.
- Estados vazios: produto indisponível → selo "Indisponível" e sugestões.
- Estados de erro: produto não encontrado → página 404 com a mascote.
- Regras específicas: botão de pedido fixo na base da tela no celular.

**Página: Sobre**

- Objetivo: criar conexão com a pessoa por trás da marca.
- Público: clientes que querem conhecer quem faz.
- Título principal: "Prazer, eu sou a Maju" **[confirmar nome e história]**
- Descrição: **[A definir — história real da marca]**
- Seções: história → valores → foto real da criadora e do ateliê (opcional).
- Componentes: texto, imagens, botão.
- Botões e ações: "Fale comigo".
- Imagens e ilustrações: mascote + fotos reais (se autorizadas).
- Informações que devem aparecer: **[A definir]**
- Comportamentos e interações: animações discretas.
- Estados de carregamento: não se aplica (conteúdo estático).
- Estados vazios: não se aplica.
- Estados de erro: não se aplica.
- Regras específicas: não inventar história, datas ou números institucionais.

**Página: Contato / Orçamento**

- Objetivo: receber pedidos de orçamento.
- Público: clientes prontos para pedir.
- Título principal: "Vamos criar juntas?" **[ajustar ao tom desejado]**
- Descrição: explica o que informar no pedido.
- Seções: formulário → canais de contato → horário de atendimento.
- Componentes: campos (nome, WhatsApp, produto, quantidade, data desejada, mensagem), botão, links de redes.
- Botões e ações: "Enviar pedido", "Chamar no WhatsApp".
- Imagens e ilustrações: mascote acenando.
- Informações que devem aparecer: WhatsApp, Instagram, e-mail, horário. **[A definir]**
- Comportamentos e interações: validação ao sair do campo; máscara de telefone.
- Estados de carregamento: botão com spinner "Enviando...".
- Estados vazios: não se aplica.
- Estados de erro: mensagem por campo + aviso geral se o envio falhar, oferecendo o WhatsApp como alternativa.
- Regras específicas: após o envio, mensagem de sucesso com a mascote e o prazo de resposta.

## 8. LAYOUT E ORGANIZAÇÃO

- Largura máxima do conteúdo: 1200 px.
- Sistema de grid: 12 colunas no desktop, 8 no tablet, 4 no celular; espaçamento entre colunas de 24 px (16 px no celular).
- Espaçamento padrão: escala de 8 px (4, 8, 16, 24, 32, 48, 64, 96).
- Margens: 16 px nas laterais (celular), 32 px (tablet), automáticas acima de 1200 px.
- Alinhamento: textos alinhados à esquerda; hero e chamadas finais podem ser centralizados.
- Largura do menu lateral: não se aplica no desktop; painel do tablet com 320 px.
- Altura do cabeçalho: 80 px (desktop), 64 px ao rolar e no celular.
- Altura do rodapé: variável conforme o conteúdo (mínimo de 240 px no desktop).
- Organização das seções: espaçamento vertical de 96 px no desktop e 64 px no celular; alternar fundo branco e creme entre seções.
- Padrão de containers: `.container` centralizado com largura máxima de 1200 px e preenchimento lateral responsivo.
- Regras de posicionamento: botão do WhatsApp fixo no canto inferior direito, a 16 px das bordas, sem cobrir botões de ação.

**Elementos decorativos derivados da logo:** corações pequenos e formas orgânicas arredondadas (manchas) em laranja ou dourado, com baixa opacidade, nos cantos das seções. Usar com moderação.

## 9. RESPONSIVIDADE

**Celular**
- Largura de referência: 360 px a 430 px (testar a partir de 320 px).
- Organização dos componentes: empilhados verticalmente; imagens antes do texto nos cartões.
- Quantidade de colunas: 1 (2 em grades de categorias pequenas).
- Comportamento dos botões: largura total em formulários e chamadas principais; altura mínima de 48 px.
- Navegação: menu hambúrguer + botão flutuante do WhatsApp.

**Tablet**
- Largura de referência: 768 px a 1024 px.
- Organização dos componentes: grades de 2 colunas; hero com texto e imagem lado a lado a partir de 900 px.
- Quantidade de colunas: 2.

**Desktop**
- Largura de referência: 1280 px a 1440 px (conteúdo limitado a 1200 px).
- Organização dos componentes: grades de 3 ou 4 colunas; hero em duas colunas.
- Quantidade de colunas: 3 a 4.

Regras gerais:
- Evitar rolagem horizontal.
- Preservar proporções das imagens.
- Adaptar tabelas e formulários.
- Garantir áreas de toque confortáveis (mínimo de 44 × 44 px).
- Testar em diferentes resoluções.

## 10. ACESSIBILIDADE

- HTML semântico: usar `header`, `nav`, `main`, `section`, `article` e `footer`; um único `h1` por página e hierarquia de títulos em ordem.
- Navegação por teclado: todos os elementos interativos acessíveis com Tab; link "Pular para o conteúdo" no topo; modais e menu prendem o foco enquanto abertos.
- Indicador de foco: contorno de 3 px #C2410C com afastamento de 2 px, sempre visível (`:focus-visible`).
- Textos alternativos: descrição real em todas as imagens de produto; logo com `alt="Maju Print"`; elementos decorativos com `alt=""`.
- Contraste: mínimo de 4,5:1 nos textos (ver seção 3); nunca texto branco sobre #FD6A07.
- Rótulos dos formulários: `label` visível em todos os campos; o texto de exemplo não substitui o rótulo.
- Mensagens acessíveis: erros ligados ao campo por `aria-describedby`; avisos de envio em `aria-live="polite"`.
- Compatibilidade com leitores de tela: testar com NVDA (Windows) e TalkBack (Android); ícones sozinhos com `aria-label`.
- Outras exigências: não depender apenas da cor para transmitir informação; respeitar o zoom de até 200% sem quebrar o layout.

## 11. ANIMAÇÕES E INTERAÇÕES

- Estilo das animações: leves, alegres e com "molinha" suave, nunca exageradas.
- Transições: `ease-out` para entradas; `cubic-bezier(0.34, 1.56, 0.64, 1)` (leve quique) em botões e corações.
- Duração: 150–250 ms em interações; 300–500 ms em entradas de seções.
- Efeitos de hover: botões elevam 2 px; cartões elevam 4 px e a imagem amplia 3%.
- Feedback visual: o botão "afunda" levemente ao clicar (`scale(0.97)`); confirmações com ícone de check.
- Loading: spinner circular marrom/laranja; em telas inteiras, a mascote com um coração pulsando.
- Skeleton: blocos creme com brilho deslizante (1,5 s em repetição).
- Microinterações: coração que "pulsa" ao favoritar ou concluir um pedido; mascote que aparece em mensagens de sucesso.
- Restrições de animação: respeitar `prefers-reduced-motion` (desativar movimentos e manter só mudanças de opacidade); sem animações piscando mais de 3 vezes por segundo; sem rolagem sequestrada ou paralaxe pesado.

## 12. IMAGENS E RECURSOS VISUAIS

- Estilo das imagens: fotos reais dos produtos, bem iluminadas, com luz natural, tons quentes e fundos claros (branco, creme ou madeira clara).
- Estilo das ilustrações: seguir o traço da mascote — cartoon com contorno marrom, cores quentes, formas arredondadas.
- Formato preferencial: WebP (fotos), SVG (logo, ícones, ilustrações), PNG com transparência quando o SVG não existir.
- Proporções: 1:1 nos cartões de produto; 4:3 na galeria; 16:9 em banners.
- Tratamento de imagens: correção leve de cor puxando para tons quentes; sem filtros pesados; manter as cores reais do produto.
- Utilização de vídeos: curtos (até 30 s), mostrando o processo de produção; sem som automático; com controles.
- Origem dos recursos: fotos próprias dos produtos; mascote e logo oficiais da marca. **[Confirmar se existem outras ilustrações da mascote]**
- Regras de otimização: largura máxima de 1600 px; peso alvo abaixo de 200 KB por foto; `loading="lazy"` abaixo da dobra; `srcset` para tamanhos responsivos.
- Elementos que não devem ser utilizados: fotos genéricas de banco de imagens, imagens pixeladas, alterações na mascote, outras mascotes ou personagens que concorram com ela.

## 13. PRIVACIDADE E EXIBIÇÃO DE DADOS

- Informações públicas: produtos, fotos de produtos, canais de contato comerciais, horário de atendimento.
- Informações privadas: nome, telefone, endereço e pedidos dos clientes.
- Dados que exigem autorização: fotos de clientes, depoimentos com nome ou foto, fotos de crianças em produtos personalizados (exigem autorização dos responsáveis).
- Regras de exibição: depoimentos só com autorização; exibir apenas primeiro nome e cidade quando autorizado; seguir a LGPD.
- Dados fictícios para demonstração: usar nomes e textos claramente marcados como exemplo durante o desenvolvimento; nunca publicar depoimentos fictícios como reais.
- Restrições específicas: o formulário deve informar para que os dados serão usados; não coletar dados além do necessário para o orçamento.

## 14. TOM DE VOZ E TEXTOS

- Personalidade da comunicação: próxima, carinhosa, animada e confiável — como conversar com uma amiga talentosa.
- Linguagem: português brasileiro, simples e direto.
- Formalidade: informal com respeito; "você" no lugar de "o cliente". **[Confirmar se a marca fala em primeira pessoa, como "eu", ou como "a gente"]**
- Termos preferenciais: "feito com carinho", "personalizado", "do seu jeito", "seu momento", "orçamento", "fale comigo".
- Termos que devem ser evitados: jargões técnicos de gráfica sem explicação, linguagem corporativa ("prezado cliente", "solicitamos"), promessas de prazo que não podem ser cumpridas.
- Exemplos de títulos:
  - "Personalizados feitos com carinho"
  - "Do seu jeito, com a cara da sua festa"
  - "Como funciona? É simples!"
- Exemplos de mensagens:
  - Sucesso: "Pedido recebido! Em breve te chamo para conversar sobre os detalhes."
  - Erro: "Ops, algo deu errado no envio. Tenta de novo ou me chama no WhatsApp?"
  - Vazio: "Ainda não tem nada aqui, mas logo, logo vai ter novidade!"
- Padrão de notificações: frase curta, começando pelo resultado; tom positivo; sempre indicar o próximo passo.

## 15. RODAPÉ

- Logo: versão recortada (letras brancas) sobre fundo marrom cacau #3A1C0C.
- Informações institucionais: nome da marca, CNPJ e cidade. **[A definir]**
- Links: Início, Produtos, Como funciona, Sobre, Contato.
- Contatos: WhatsApp, e-mail. **[A definir]**
- Redes sociais: Instagram e outras. **[A definir]** — ícones em creme com hover em Laranja Maju.
- Políticas: Política de Privacidade, Trocas e Devoluções, Prazos de produção. **[A definir]**
- Créditos: "© [ano] Maju Print. Todos os direitos reservados."
- Elementos adicionais: faixa laranja fina (4 px) no topo do rodapé; pequeno coração decorativo ao lado da assinatura.

## 16. REFERÊNCIAS VISUAIS

- Sites de referência: **[A definir]**
- Interfaces de inspiração: sites de marcas artesanais e de papelaria personalizada com visual alegre, muito espaço em branco e fotos reais. **[A definir exemplos concretos]**
- Prints ou imagens: logo circular laranja e logo recortada (arquivos enviados).
- Componentes que devem servir de referência: a própria logo — formas arredondadas, contraste laranja/branco/marrom e o coração como detalhe.
- Elementos que devem ser reproduzidos: cantos arredondados, o coração como elemento gráfico, o contorno branco da mascote, tons quentes.
- Elementos que não devem ser reproduzidos: identidades visuais de outras marcas, personagens de terceiros.

## 17. REGRAS DE IMPLEMENTAÇÃO

- Preservar a identidade visual definida neste documento.
- Reutilizar componentes para manter consistência entre páginas.
- Não criar estilos diferentes para componentes que possuem a mesma função.
- Não modificar a logo oficial.
- Não inventar cores, fontes ou elementos fora do padrão sem necessidade.
- Preservar as funcionalidades existentes.
- Priorizar responsividade e acessibilidade.
- Evitar dependências desnecessárias.
- Manter o código organizado e reutilizável.
- Respeitar a arquitetura e as tecnologias definidas para o projeto.

**Tokens de design (referência CSS):**

```css
:root {
  /* Cores */
  --color-primary: #FD6A07;        /* Laranja Maju */
  --color-primary-hover: #E85F00;
  --color-primary-dark: #C2410C;   /* Laranja Tijolo: links e texto */
  --color-secondary: #3A1C0C;      /* Marrom Cacau */
  --color-accent: #E9A93B;         /* Dourado Argola */
  --color-bg: #FFFFFF;
  --color-bg-section: #FFF5EB;     /* Creme Maju */
  --color-text: #3A1C0C;
  --color-text-muted: #7A5646;     /* Marrom Canela */
  --color-border: #F0DCCB;         /* Areia */
  --color-success: #1F7A4D;
  --color-warning: #9A6700;
  --color-error: #B42318;
  --color-info: #1F5FA8;

  /* Tipografia */
  --font-heading: 'Fredoka', 'Nunito', sans-serif;
  --font-body: 'Nunito', system-ui, sans-serif;
  --font-accent: 'Caveat Brush', cursive;

  /* Raios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Sombras */
  --shadow-sm: 0 4px 14px rgba(58, 28, 12, 0.08);
  --shadow-md: 0 8px 24px rgba(58, 28, 12, 0.14);
  --focus-ring: 0 0 0 4px rgba(253, 106, 7, 0.2);

  /* Espaçamento (base 8px) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 16px; --space-4: 24px;
  --space-5: 32px; --space-6: 48px; --space-7: 64px; --space-8: 96px;

  /* Layout */
  --container-max: 1200px;
  --header-height: 80px;
  --transition: 200ms ease-out;
}
```

## 18. CRITÉRIOS DE APROVAÇÃO

- [ ] Identidade visual aplicada corretamente.
- [ ] Logo preservada.
- [ ] Paleta de cores respeitada.
- [ ] Tipografia consistente.
- [ ] Componentes padronizados.
- [ ] Navegação funcional.
- [ ] Layout responsivo.
- [ ] Acessibilidade verificada.
- [ ] Formulários e interações funcionando.
- [ ] Imagens otimizadas.
- [ ] Consistência visual entre páginas.
- [ ] Compatibilidade com as tecnologias do projeto.
- [ ] Nenhum texto branco aplicado sobre o Laranja Maju #FD6A07.
- [ ] Mascote usada sem alterações.

---

## 19. INSTRUÇÃO FINAL PARA O AGENTE DE IA

Este documento representa a especificação visual oficial do projeto.

Antes de implementar qualquer interface:

1. Analise integralmente este guia.
2. Examine a arquitetura e os arquivos existentes.
3. Identifique os componentes que podem ser reutilizados.
4. Implemente o layout seguindo as definições estabelecidas.
5. Mantenha consistência visual em todas as páginas.
6. Não invente elementos visuais que contrariem as especificações.
7. Teste a interface em dispositivos móveis e desktops.
8. Confira todos os critérios de aprovação.

Em caso de informação não preenchida, utilize uma solução coerente com a identidade visual existente, sem inventar características institucionais.

**Resultado esperado:** uma interface consistente, organizada, responsiva e fiel à identidade visual definida para o projeto.
