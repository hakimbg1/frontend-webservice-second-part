import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Image, Alert, DropdownButton, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const MovieManagement = ({ searchTerm }) => {
    const { token } = useContext(AuthContext);
    const [movies, setMovies] = useState([]);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sortOption, setSortOption] = useState('updatedAt');
    const [formData, setFormData] = useState({
        uid: '',
        name: '',
        description: '',
        rate: 0,
        duration: 0,
        pictureUrl: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await api.get('/movies');
                setMovies(response.data);
                setFilteredMovies(response.data);
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        };

        fetchMovies();
    }, []);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const filtered = movies.filter(movie =>
                movie.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredMovies(filtered);
        } else {
            sortMovies(sortOption, movies);
        }
    }, [searchTerm, movies]);

    useEffect(() => {
        sortMovies(sortOption, filteredMovies);
    }, [sortOption]);

    const sortMovies = (option, moviesToSort) => {
        const sortedMovies = [...moviesToSort];
        if (option === 'name') {
            sortedMovies.sort((a, b) => a.name.localeCompare(b.name));
        } else if (option === 'createdAt') {
            sortedMovies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (option === 'updatedAt') {
            sortedMovies.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        setFilteredMovies(sortedMovies);
    };

    const handleSortChange = (option) => {
        setSortOption(option);
        sortMovies(option, filteredMovies);
    };

    const handleEditClick = (movie) => {
        setFormData({
            uid: movie.uid,
            name: movie.name || '',
            description: movie.description || '',
            rate: movie.rate || 0,
            duration: movie.duration || 0,
            pictureUrl: movie.pictureUrl || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDeleteClick = async (uid) => {
        if (window.confirm('Are you sure you want to delete this movie?')) {
            try {
                await api.delete(`/movies/${uid}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMovies(movies.filter(movie => movie.uid !== uid));
                setFilteredMovies(filteredMovies.filter(movie => movie.uid !== uid));
            } catch (error) {
                console.error('Error deleting movie:', error);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value
        }));
    };

    const validateForm = () => {
        const { name, description, rate, duration } = formData;

        if (name.trim().length === 0 || name.trim().length > 128) {
            return 'Name must be between 1 and 128 characters.';
        }

        if (description.trim().length === 0 || description.trim().length > 4096) {
            return 'Description must be between 1 and 4096 characters.';
        }

        if (isNaN(rate) || rate < 1 || rate > 5) {
            return 'Rate must be an integer between 1 and 5.';
        }

        if (isNaN(duration) || duration <= 0 || duration > 240) {
            return 'Duration must be an integer between 1 and 240.';
        }

        return '';
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const { uid, name, description, rate, duration, pictureUrl } = formData;

        const movieData = {
            name,
            description,
            rate,
            duration,
            pictureUrl
        };


        try {
            let response;
            if (isEditMode) {
                response = await api.put(`/movies/${uid}`, movieData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                response = await api.post('/movies', movieData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            const updatedMovies = isEditMode
                ? movies.map(movie => (movie.uid === uid ? response.data : movie))
                : [...movies, response.data];
            setMovies(updatedMovies);
            setFilteredMovies(updatedMovies);
            setShowModal(false);
        } catch (error) {
            console.error('Error updating movie:', error);
            setError('Error updating movie');
        }
    };

    const handleAddClick = () => {
        setFormData({
            uid: '',
            name: '',
            description: '',
            rate: 0,
            duration: 0,
            pictureUrl: ''
        });
        setIsEditMode(false);
        setShowModal(true);
    };

    return (
        <div className="container mt-5">
            <h2>Movie Management</h2>
            <Button variant="primary" onClick={handleAddClick} className="mb-3">
                <FontAwesomeIcon icon={faPlus} /> Add Movie
            </Button>
            <DropdownButton id="dropdown-basic-button" title={`Sort by: ${sortOption}`} onSelect={handleSortChange} className="mb-3">
                <Dropdown.Item eventKey="name">Name</Dropdown.Item>
                <Dropdown.Item eventKey="createdAt">Last Created</Dropdown.Item>
                <Dropdown.Item eventKey="updatedAt">Last Updated</Dropdown.Item>
            </DropdownButton>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Picture</th>
                        <th>Name</th>
                        <th>Rate</th>
                        <th>Duration</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMovies.map((movie) => (
                        <tr key={movie.uid}>
                            <td>
                                <Image src={movie.pictureUrl} alt={movie.name} style={{ width: '50px' }} />
                            </td>
                            <td>{movie.name}</td>
                            <td>{movie.rate}</td>
                            <td>{movie.duration} minutes</td>
                            <td>
                                <Button
                                    variant="warning"
                                    onClick={() => handleEditClick(movie)}
                                    className="mr-2"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleDeleteClick(movie.uid)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Movie' : 'Add Movie'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formMovieName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleInputChange}
                                required
                                maxLength={128}
                            />
                        </Form.Group>
                        <Form.Group controlId="formMovieDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description || ''}
                                onChange={handleInputChange}
                                required
                                maxLength={4096}
                            />
                        </Form.Group>
                        <Form.Group controlId="formMovieRate">
                            <Form.Label>Rate</Form.Label>
                            <Form.Control
                                type="number"
                                name="rate"
                                value={formData.rate || 0}
                                onChange={handleInputChange}
                                required
                                min={1}
                                max={5}
                            />
                        </Form.Group>
                        <Form.Group controlId="formMovieDuration">
                            <Form.Label>Duration</Form.Label>
                            <Form.Control
                                type="number"
                                name="duration"
                                value={formData.duration || 0}
                                onChange={handleInputChange}
                                required
                                min={1}
                                max={240}
                            />
                        </Form.Group>
                        <Form.Group controlId="formMoviePictureUrl">
                            <Form.Label>Picture URL</Form.Label>
                            <Form.Control
                                type="text"
                                name="pictureUrl"
                                value={formData.pictureUrl || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Button variant="primary" type="submit" className="mt-3">
                            Save Changes
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default MovieManagement;