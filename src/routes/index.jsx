import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import ConsultaOS from '../pages/ConsultaOS';
import AdminLogin from '../pages/AdminLogin';
import Admin from '../pages/Admin';
import WorkshopDashboard from '../pages/WorkshopDashboard';

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
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin',
    element: <Admin />  
  },
  {
    path: '/admin/orders',
    element: <WorkshopDashboard />
  }

]);