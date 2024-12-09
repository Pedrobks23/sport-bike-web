import ConsultaOS from '../pages/ConsultaOS';
import Home from '../pages/Home';

import { createBrowserRouter } from "react-router-dom";


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/consulta',
    element: <ConsultaOS />
  },
]);