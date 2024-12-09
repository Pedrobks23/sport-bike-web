import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Admin from '../pages/Admin';
import ConsultaOS from '../pages/ConsultaOS';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/consulta',
    element: <ConsultaOS />
  },
  {
    path: '/admin',
    element: <Admin />
  }
]);