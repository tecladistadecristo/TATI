import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PlansPage from "./pages/plans/PlansPage";
import AdminPage from "./pages/admin/AdminPage";
import InstitutionRegisterPage from "./pages/institution/InstitutionRegisterPage";
import ChurchPanelPage from "./pages/institution/ChurchPanelPage";
import SchoolPanelPage from "./pages/institution/SchoolPanelPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PerfilPublicoPage from "./pages/public/PerfilPublicoPage";
import DiarioCrisePage from "./pages/diario/DiarioCrisePage";
import AgendaPage from "./pages/AgendaPage";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import CareTimelinePage from "./pages/CareTimelinePage/CareTimelinePage";
import CarePatternsPage from "./pages/CarePatternsPage/CarePatternsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        <Route path="/perfil-publico" element={<PerfilPublicoPage />} />
        <Route path="/publico/:id" element={<PerfilPublicoPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/linha-do-tempo/:childId"
          element={
            <ProtectedRoute>
              <CareTimelinePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/care-patterns"
          element={
            <ProtectedRoute>
              <CarePatternsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <AgendaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pagamento"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cadastro-institucional"
          element={
            <ProtectedRoute>
              <InstitutionRegisterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/painel-igreja"
          element={
            <ProtectedRoute>
              <ChurchPanelPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/painel-escola"
          element={
            <ProtectedRoute>
              <SchoolPanelPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/diario-crise"
          element={
            <ProtectedRoute>
              <DiarioCrisePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;