import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const AdminPage = () => {
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const toggleSidebarVisibility = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    return (
        <div className="admin-page">
            <Sidebar isVisible={isSidebarVisible} toggleSidebarVisibility={toggleSidebarVisibility} />
            <div className={`content ${isSidebarVisible ? 'content-with-sidebar' : 'content-full'}`}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminPage;
