import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import ConsultaOS from "../pages/ConsultaOS";
import AdminLogin from "../pages/AdminLogin";
import WorkshopDashboard from "../pages/WorkshopDashboard";
import CustomerList from "../pages/CustomerList";
import ServicesManagement from "../pages/ServicesManagement";
import ReportsManagement from "../pages/ReportsManagement";
import ReceiptsManagement from "../pages/ReceiptsManagement";
import ServiceOrdersPage from "../pages/ServiceOrdersPage";
import ManageReceiptsPage from "../pages/ManageReceiptsPage";
import NewOrder from "../pages/NewOrder";
import HomeManagement from "../pages/HomeManagement";
import NewCustomer from "../pages/NewCustomer";
import ServicoRapido from "../pages/ServicoRapido";
import MechanicsManagement from "../pages/MechanicsManagement";
import HistoricoMecanico from "../pages/HistoricoMecanico";
import PrivateRoute from "../components/PrivateRoute";
import Mecanicos from "../pages/Mecanicos";
import ProductsPublic from "@/pages/ProductsPublic";
import AdminLayout from "@/admin/layout/AdminLayout";
import AdminHome from "@/admin/pages/AdminHome";

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
    path: "/produtos",
    element: <ProductsPublic />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/workshop",
    element: (
      <PrivateRoute>
        <WorkshopDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <AdminHome /> },
      { path: "orders", element: <WorkshopDashboard /> },
      { path: "orders/new", element: <NewOrder /> },
      { path: "ordens/nova", element: <NewOrder /> },
      { path: "customers", element: <CustomerList /> },
      { path: "customers/new", element: <NewCustomer /> },
      { path: "services", element: <ServicesManagement /> },
      { path: "servico-rapido", element: <ServicoRapido /> },
      { path: "mecanicos", element: <MechanicsManagement /> },
      { path: "mecanicos/:id", element: <HistoricoMecanico /> },
      { path: "historico-mecanico/:mecanicoId", element: <HistoricoMecanico /> },
      { path: "home", element: <HomeManagement /> },
      { path: "reports", element: <ReportsManagement /> },
      { path: "receipts", element: <ReceiptsManagement /> },
      { path: "service-orders", element: <ServiceOrdersPage /> },
      { path: "manage-receipts", element: <ManageReceiptsPage /> },
      { path: "mecanicos/lista", element: <Mecanicos /> },
    ],
  },
]);
