import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import AuthContext from './context/AuthContext';
import CustomNavbar from './components/CustomNavbar';
import Main from './components/Main';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';
import MovieManagement from './pages/MovieManagement';
import CinemaManagement from './pages/CinemaManagement';
import RoomManagement from './pages/RoomManagement';
import SessionManagement from './pages/SessionManagement';
import AdminReservationManagement from './pages/AdminReservationManagement';
import ReservationHistory from './pages/ReservationHistory';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminRoute = ({ isLoggedIn, userRole, children }) => {
    return isLoggedIn && userRole === 'admin' ? children : <Navigate to="/login" />;
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { isLoggedIn, userRole, setIsLoggedIn, setUserRole } = useContext(AuthContext);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setIsLoggedIn(true);
                setUserRole(decodedToken.role);
            } catch (error) {
                console.error('Token decoding failed:', error);
                setIsLoggedIn(false);
                setUserRole('');
            }
        }
    }, [setIsLoggedIn, setUserRole]);

    return (
        <Router>
            <CustomNavbar onSearch={setSearchTerm} />
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/admin" element={<AdminRoute isLoggedIn={isLoggedIn} userRole={userRole}><AdminPage /></AdminRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="movies" element={<MovieManagement searchTerm={searchTerm} />} />
                    <Route path="cinema" element={<CinemaManagement searchTerm={searchTerm}/>} />
                    <Route path="room" element={<RoomManagement searchTerm={searchTerm}/>} />
                    <Route path="session" element={<SessionManagement searchTerm={searchTerm}/>} />
                    <Route path="manage-reservations" element={<AdminReservationManagement />} />
                </Route>
                <Route path="/reservation-history" element={<ReservationHistory searchTerm={searchTerm}/>} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default App;