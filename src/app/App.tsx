import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Carregando } from './componentes/Estados';
import { LayoutLoja } from './componentes/LayoutLoja';
import Catalogo from './paginas/Catalogo';

// Telas fora do fluxo inicial são carregadas sob demanda (o celular baixa menos no primeiro acesso).
const Modelo = lazy(() => import('./paginas/Modelo'));
const Personalizado = lazy(() => import('./paginas/Personalizado'));
const Finalizar = lazy(() => import('./paginas/Finalizar'));
const Enviado = lazy(() => import('./paginas/Enviado'));
const NaoEncontrado = lazy(() => import('./paginas/NaoEncontrado'));
const LayoutAdmin = lazy(() => import('./admin/LayoutAdmin'));
const Pedidos = lazy(() => import('./admin/Pedidos'));
const Pedido = lazy(() => import('./admin/Pedido'));
const Modelos = lazy(() => import('./admin/Modelos'));
const Precos = lazy(() => import('./admin/Precos'));
const Config = lazy(() => import('./admin/Config'));

export default function App() {
  return (
    <Suspense fallback={<Carregando />}>
      <Routes>
        <Route element={<LayoutLoja />}>
          <Route index element={<Catalogo />} />
          <Route path="modelo/:id" element={<Modelo />} />
          <Route path="personalizado" element={<Personalizado />} />
          <Route path="finalizar" element={<Finalizar />} />
          <Route path="enviado" element={<Enviado />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Route>
        <Route path="admin" element={<LayoutAdmin />}>
          <Route index element={<Pedidos />} />
          <Route path="pedidos/:codigo" element={<Pedido />} />
          <Route path="modelos" element={<Modelos />} />
          <Route path="precos" element={<Precos />} />
          <Route path="config" element={<Config />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
