import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import ConsultaOS from "../pages/ConsultaOS";
import AdminLogin from "../pages/AdminLogin";
import Admin from "../pages/Admin";
import WorkshopDashboard from "../pages/WorkshopDashboard";
import CustomerList from "../pages/CustomerList";
import ServicesManagement from "../pages/ServicesManagement";
import ReportsManagement from "../pages/ReportsManagement";
import PrivateRoute from "../components/PrivateRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/consulta",
    element: <ConsultaOS />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: (
      <PrivateRoute>
        <Admin />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/orders",
    element: (
      <PrivateRoute>
        <WorkshopDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/customers",
    element: (
      <PrivateRoute>
        <CustomerList />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/services",
    element: (
      <PrivateRoute>
        <ServicesManagement />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/reports",
    element: (
      <PrivateRoute>
        <ReportsManagement />
      </PrivateRoute>
    ),
  },
]);
