import React, { useState, useEffect, useContext, useRef } from 'react';
import { Navbar, Nav, Form, FormControl, Dropdown, Image, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const CustomNavbar = ({ onSearch }) => {
    const navigate = useNavigate();
    const { isLoggedIn, userRole, setIsLoggedIn } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [allMovies, setAllMovies] = useState([]);
    const searchRef = useRef(null);

    // Fetch all movies on component mount
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await api.get('/movies');
                setAllMovies(response.data);
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        };

        fetchMovies();
    }, []);

    // Update suggestions based on search term
    useEffect(() => {
        if (searchTerm.length > 1) {
            const filteredSuggestions = allMovies.filter(movie =>
                movie.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, allMovies]);

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleLogoutClick = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSuggestionClick = (movieId) => {
        navigate(`/movie/${movieId}`);
        setSearchTerm('');
        setSuggestions([]);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchTerm);
        }
        searchRef.current.blur();
        setSuggestions([]);
    };

    const handleBlur = () => {
        setSuggestions([]);
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand href="/">MovieApp</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
                    <Form className="mx-auto" style={{ position: 'relative', width: '50%' }} onSubmit={handleFormSubmit}>
                        <FormControl
                            ref={searchRef}
                            type="text"
                            placeholder="Search"
                            className="mr-sm-2"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onBlur={handleBlur}
                            style={{ width: '100%' }}
                        />
                        <Dropdown.Menu show={suggestions.length > 0} style={{ width: '100%', position: 'absolute', top: '100%', zIndex: 1000 }}>
                            {suggestions.map((suggestion) => (
                                <Dropdown.Item
                                    key={suggestion._id}
                                    onClick={() => handleSuggestionClick(suggestion._id)}
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <Image
                                        src={suggestion.pictureUrl || 'https://via.placeholder.com/50'}
                                        thumbnail
                                        width={50}
                                        height={75}
                                        className="mr-3"
                                    />
                                    {suggestion.name}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Form>
                    <Nav>
                        {isLoggedIn ? (
                            <Dropdown alignRight>
                                <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                                    <FontAwesomeIcon icon={faUserCircle} size="2x" />
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {userRole === 'admin' ? (
                                        <>
                                            <Dropdown.Item onClick={() => navigate('/admin')}>Admin</Dropdown.Item>
                                            <Dropdown.Item onClick={handleLogoutClick}>Logout</Dropdown.Item>
                                        </>
                                    ) : (
                                        <>
                                            <Dropdown.Item onClick={() => navigate('/reservation-history')}>Reservation History</Dropdown.Item>
                                            <Dropdown.Item onClick={handleLogoutClick}>Logout</Dropdown.Item>
                                        </>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <Nav.Link onClick={handleLoginClick}>
                                <FontAwesomeIcon icon={faUserCircle} size="2x" />
                            </Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default CustomNavbar;