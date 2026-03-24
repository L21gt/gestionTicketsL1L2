import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Componente de orden superior (HOC) para proteger rutas privadas
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    // Si hay token, renderiza el componente; si no, redirige al login
    return token ? children : <Navigate to="/" />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Ruta pública */}
                <Route path="/" element={<Login />} />
                
                {/* Ruta privada */}
                <Route 
                    path="/dashboard" 
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;