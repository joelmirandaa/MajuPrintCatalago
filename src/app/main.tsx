import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/caveat-brush/400.css';
import './index.css';
import App from './App';
import SairInstagram from './paginas/SairInstagram';
import { ehNavegadorInterno } from './util/instagram';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Elemento #raiz não encontrado');

// A cliente não acessa o catálogo pelo navegador interno do Instagram (estrutura.md, seção 10.3).
// O painel admin continua acessível para a equipe.
const bloquear = ehNavegadorInterno() && !window.location.pathname.startsWith('/admin');

createRoot(raiz).render(
  <StrictMode>
    {bloquear ? (
      <SairInstagram />
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
);
