import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import ConsultaOS from '../pages/ConsultaOS';
import AdminLogin from '../pages/AdminLogin';
import Admin from '../pages/Admin';
import WorkshopDashboard from '../pages/WorkshopDashboard';
import CustomerList from '../pages/CustomerList';
import PrivateRoute from '../components/PrivateRoute';

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
    element: <PrivateRoute><Admin /></PrivateRoute>
  },
  {
    path: '/admin/orders',
    element: <PrivateRoute><WorkshopDashboard /></PrivateRoute>
  },
  {
    path: '/admin/customers',
    element: <PrivateRoute><CustomerList /></PrivateRoute>
  }
]);