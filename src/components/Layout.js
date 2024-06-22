import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isVisible, setIsVisible] = useState(true);

    const toggleSidebarVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div className="d-flex">
            <Sidebar isVisible={isVisible} toggleSidebarVisibility={toggleSidebarVisibility} />
            <Container fluid className="p-0">
                <Outlet />
            </Container>
        </div>
    );
};

export default Layout;