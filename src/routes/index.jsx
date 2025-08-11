import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import ConsultaOS from "../pages/ConsultaOS";
import AdminLogin from "../pages/AdminLogin";
import AdminSmartDashboard from "../pages/AdminSmartDashboard";
import WorkshopDashboard from "../pages/WorkshopDashboard";
import CustomerList from "../pages/CustomerList";
import ServicesManagement from "../pages/ServicesManagement";
import ReportsManagement from "../pages/ReportsManagement";
import ReceiptsManagement from "../pages/ReceiptsManagement";
import ServiceOrdersPage from "../pages/ServiceOrdersPage";
import ManageReceiptsPage from "../pages/ManageReceiptsPage";
import NewOrder from "../pages/NewOrder"; // Adicione esta importação
import HomeManagement from "../pages/HomeManagement";
import NewCustomer from "../pages/NewCustomer";
import ServicoRapido from "../pages/ServicoRapido";
import MechanicsManagement from "../pages/MechanicsManagement";
import HistoricoMecanico from "../pages/HistoricoMecanico";
import PrivateRoute from "../components/PrivateRoute";
import Mecanicos from "../pages/Mecanicos";
// import
import ProductsPublic from "@/pages/ProductsPublic";





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
        <AdminSmartDashboard />
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
    path: "/admin/orders/new", // Adicione esta nova rota
    element: (
      <PrivateRoute>
        <NewOrder />
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
    path: "/admin/customers/new",
    element: (
      <PrivateRoute>
        <NewCustomer />
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
    path: "/admin/servico-rapido",
    element: (
      <PrivateRoute>
        <ServicoRapido />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/mecanicos",
    element: (
      <PrivateRoute>
        <MechanicsManagement />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/mecanicos/:id",
    element: (
      <PrivateRoute>
        <HistoricoMecanico />
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
  {
    path: "/admin/receipts",
    element: (
      <PrivateRoute>
        <ReceiptsManagement />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/home",
    element: (
      <PrivateRoute>
        <HomeManagement />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/service-orders",
    element: (
      <PrivateRoute>
        <ServiceOrdersPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/manage-receipts",
    element: (
      <PrivateRoute>
        <ManageReceiptsPage />
      </PrivateRoute>
    ),
  },
  {
  path: "/admin/mecanicos",
  element: (
    <PrivateRoute>
      <Mecanicos />
    </PrivateRoute>
  ),
},
{
  path: "/admin/historico-mecanico/:mecanicoId",
  element: (
    <PrivateRoute>
      <HistoricoMecanico />
    </PrivateRoute>
  ),
},
{ path: "/produtos", 
  element: <ProductsPublic /> },

]);
