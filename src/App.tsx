import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import CadastroPet from './pages/CadastroPet';
import EditarPet from './pages/EditarPet';
import QRCodePet from './pages/QRCodePet';
import PetPublic from './pages/PetPublic';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/cadastrar-pet"
          element={
            <PrivateRoute>
              <CadastroPet />
            </PrivateRoute>
          }
        />
        <Route
          path="/editar-pet/:id"
          element={
            <PrivateRoute>
              <EditarPet />
            </PrivateRoute>
          }
        />
        <Route
          path="/pet/:id"
          element={
            <PrivateRoute>
              <QRCodePet />
            </PrivateRoute>
          }
        />
        <Route path="/pet/public/:id" element={<PetPublic />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;