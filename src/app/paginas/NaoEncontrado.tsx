import { Link } from 'react-router-dom';
import { EstadoVazio } from '../componentes/Estados';

export default function NaoEncontrado() {
  return (
    <EstadoVazio titulo="Essa página não existe">
      <Link to="/" className="font-bold text-primaria-escura underline">
        Voltar ao catálogo
      </Link>
    </EstadoVazio>
  );
}
