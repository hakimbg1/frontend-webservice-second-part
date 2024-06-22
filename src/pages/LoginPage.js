import React, { useState, useContext } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import api from '../api/api';
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { setIsLoggedIn, setUserRole } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { username, password });
            const token = response.data.token;
            localStorage.setItem('token', token);

            const decodedToken = jwtDecode(token);
            setIsLoggedIn(true);
            setUserRole(decodedToken.role);

            if (decodedToken.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            setError('Invalid username or password');
        }
    };

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col md="4">
                    <h2>Login</h2>
                    {error && <p className="text-danger">{error}</p>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit">
                            Login
                        </Button>
                    </Form>
                    <p className="mt-3">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;