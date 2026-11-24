import { Heart, InstagramLogo, Phone, WhatsappLogo } from '@phosphor-icons/react';

// Contatos oficiais da Maju Print exibidos no rodapé (GuiaDesign.md, seção 15).
const TELEFONE_EXIBICAO = '(91) 9257-6159';
const TELEFONE_DIGITOS = '559192576159';
const INSTAGRAM_URL = 'https://www.instagram.com/majuprint/';
const INSTAGRAM_USUARIO = '@majuprint';

const linkContato =
  'inline-flex min-h-11 items-center gap-2 rounded-pilula font-bold text-fundo-secao transition-colors duration-200 hover:text-primaria';

/**
 * Rodapé da loja: fundo marrom cacau com faixa laranja de 4 px, logo recortada,
 * contatos (telefone, WhatsApp, Instagram) e créditos.
 * `folgaBarraCarrinho` reserva espaço para a barra fixa do carrinho no celular.
 */
export function Rodape({ folgaBarraCarrinho = false }: { folgaBarraCarrinho?: boolean }) {
  return (
    <footer
      className={`border-t-4 border-primaria bg-secundaria text-fundo-secao ${
        folgaBarraCarrinho
          ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0'
          : 'pb-[env(safe-area-inset-bottom)]'
      }`}
    >
      <div className="mx-auto max-w-conteudo px-4 py-8 md:px-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <img src="/logo-recortada.webp" alt="Maju Print" width={96} height={96} loading="lazy" className="h-24 w-24" />

          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <ul className="flex flex-col items-center gap-1 sm:flex-row sm:gap-6">
              <li>
                <a href={`tel:+${TELEFONE_DIGITOS}`} className={linkContato}>
                  <Phone size={20} weight="bold" aria-hidden />
                  <span>
                    <span className="sr-only">Telefone: </span>
                    {TELEFONE_EXIBICAO}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkContato}
                  aria-label={`Instagram ${INSTAGRAM_USUARIO} (abre em nova aba)`}
                >
                  <InstagramLogo size={20} weight="bold" aria-hidden />
                  {INSTAGRAM_USUARIO}
                </a>
              </li>
            </ul>

            <a
              href={`https://wa.me/${TELEFONE_DIGITOS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-pilula bg-primaria px-6 font-bold text-secundaria transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-primaria-hover active:scale-[0.97]"
              aria-label="Conversar no WhatsApp (abre em nova aba)"
            >
              <WhatsappLogo size={24} weight="bold" aria-hidden />
              Chamar no WhatsApp
            </a>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-fundo-secao/15 pt-4 text-sm text-fundo-secao/80 md:justify-start">
          Desenvolvido por Joel M. Miranda
          <Heart size={14} weight="fill" aria-hidden className="text-primaria" />
        </p>
      </div>
    </footer>
  );
}
