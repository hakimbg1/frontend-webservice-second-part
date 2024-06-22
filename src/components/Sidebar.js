import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faHome, faFilm, faBuilding, faDoorClosed, faCalendarAlt, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const Sidebar = ({ isVisible, toggleSidebarVisibility }) => {
    const location = useLocation();

    return (
        <div className={`sidebar ${isVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
            <div className="sidebar-header">
                <FontAwesomeIcon 
                    icon={isVisible ? faTimes : faBars} 
                    onClick={toggleSidebarVisibility} 
                    className="toggle-icon"
                />
                {isVisible && <h4>Admin Menu</h4>}
            </div>
            <Nav className="flex-column">
                <Nav.Item>
                    <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                        <FontAwesomeIcon icon={faHome} className="sidebar-icon" />
                        {isVisible && 'Dashboard'}
                    </Link>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/admin/movies" className={`nav-link ${location.pathname === '/admin/movies' ? 'active' : ''}`}>
                        <FontAwesomeIcon icon={faFilm} className="sidebar-icon" />
                        {isVisible && 'Movie Management'}
                    </Link>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/admin/cinema" className={`nav-link ${location.pathname === '/admin/cinema' ? 'active' : ''}`}>
                        <FontAwesomeIcon icon={faBuilding} className="sidebar-icon" />
                        {isVisible && 'Cinema'}
                    </Link>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/admin/room" className={`nav-link ${location.pathname === '/admin/room' ? 'active' : ''}`}>
                        <FontAwesomeIcon icon={faDoorClosed} className="sidebar-icon" />
                        {isVisible && 'Room'}
                    </Link>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/admin/session" className={`nav-link ${location.pathname === '/admin/session' ? 'active' : ''}`}>
                        <FontAwesomeIcon icon={faCalendarAlt} className="sidebar-icon" />
                        {isVisible && 'Session Management'}
                    </Link>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/admin/manage-reservations" className={`nav-link ${location.pathname === '/admin/manage-reservations' ? 'active' : ''}`}>
                        <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
                        {isVisible && 'Manage Reservations'}
                    </Link>
                </Nav.Item>
            </Nav>
        </div>
    );
};

export default Sidebar;