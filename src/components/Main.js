import React, { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import MovieCard from './MovieCard';
import { Container, Row, Col, Pagination, Dropdown, DropdownButton } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const Main = () => {
    const { isLoggedIn, userRole, token } = useContext(AuthContext);
    const [movies, setMovies] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState('name');
    const moviesPerPage = 12;

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const movieResponse = await api.get('/movies', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMovies(movieResponse.data);

                const cinemaResponse = await api.get('/cinema', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (Array.isArray(cinemaResponse.data)) {
                    const allCinemas = cinemaResponse.data;

                    let allSessions = [];
                    const sessionSet = new Set();

                    for (const cinema of allCinemas) {
                        const sessionResponse = await api.get(`/cinema/${cinema.uid}/rooms/:roomUid/sceances`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        const sessionsWithCinemaUid = sessionResponse.data.map(session => ({
                            ...session,
                            cinemaUid: cinema.uid
                        }));
                        sessionsWithCinemaUid.forEach(session => {
                            if (!sessionSet.has(session.uid)) {
                                allSessions.push(session);
                                sessionSet.add(session.uid);
                            }
                        });
                    }
                    setSessions(allSessions);
                } else {
                    console.error('Unexpected response format for cinemas:', cinemaResponse.data);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, [token]);

    const sortMovies = (movies, option) => {
        switch (option) {
            case 'name':
                return [...movies].sort((a, b) => a.name.localeCompare(b.name));
            case 'updatedAt':
                return [...movies].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            default:
                return movies;
        }
    };

    // Calculate the current movies to display
    const indexOfLastMovie = currentPage * moviesPerPage;
    const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
    const sortedMovies = sortMovies(movies, sortOption);
    const currentMovies = sortedMovies.slice(indexOfFirstMovie, indexOfLastMovie);

    const totalPages = Math.ceil(movies.length / moviesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPaginationItems = () => {
        const items = [];
        const maxPageItems = 10;
        let startPage = Math.max(currentPage - Math.floor(maxPageItems / 2), 1);
        let endPage = Math.min(startPage + maxPageItems - 1, totalPages);

        if (endPage - startPage < maxPageItems) {
            startPage = Math.max(endPage - maxPageItems + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
                    {i}
                </Pagination.Item>
            );
        }

        return (
            <>
                <Pagination.First onClick={() => handlePageChange(1)} />
                <Pagination.Prev onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)} />
                {startPage > 1 && <Pagination.Ellipsis />}
                {items}
                {endPage < totalPages && <Pagination.Ellipsis />}
                <Pagination.Next onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} />
            </>
        );
    };

    const handleSortChange = (option) => {
        setSortOption(option);
        setCurrentPage(1);
    };

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Movies</h2>
                <DropdownButton id="dropdown-basic-button" title="Sort By" onSelect={handleSortChange}>
                    <Dropdown.Item eventKey="name">Name</Dropdown.Item>
                    <Dropdown.Item eventKey="updatedAt">Updated At</Dropdown.Item>
                </DropdownButton>
            </div>
            {currentMovies.length > 0 ? (
                <Row>
                    {currentMovies.map((movie) => (
                        <Col key={movie._id} xs={12} sm={6} md={3}>
                            <MovieCard
                                movie={movie}
                                sessions={sessions.filter(session => session.movie === movie.uid)}
                                isLoggedIn={isLoggedIn}
                                userRole={userRole}
                                token={token}
                            />
                        </Col>
                    ))}
                </Row>
            ) : (
                <Row>
                    <Col>
                        <p>No movies found.</p>
                    </Col>
                </Row>
            )}
            <div className="d-flex justify-content-center mt-3">
                <Pagination>{renderPaginationItems()}</Pagination>
            </div>
        </Container>
    );
};

export default Main;