import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import DateTime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const SessionManagement = ({ searchTerm }) => {
    const { token } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [movies, setMovies] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [roomNamesMap, setRoomNamesMap] = useState({});
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        uid: '',
        movie: '',
        date: new Date(),
        cinema: '',
        roomUids: []
    });
    const [error, setError] = useState('');

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

                if (Array.isArray(cinemaResponse.data) && cinemaResponse.data.length > 0) {
                    setCinemas(cinemaResponse.data);

                    // Fetch rooms for each cinema and build room names map
                    const allRooms = [];
                    const roomMap = {};
                    for (const cinema of cinemaResponse.data) {
                        const roomResponse = await api.get(`/cinema/${cinema.uid}/rooms`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        allRooms.push(...roomResponse.data);
                        roomResponse.data.forEach(room => {
                            roomMap[room.uid] = room.name;
                        });
                    }
                    setRooms(allRooms);
                    setRoomNamesMap(roomMap);

                    // Fetch all sessions for each cinema
                    let allSessions = [];
                    for (const cinema of cinemaResponse.data) {
                        const sessionResponse = await api.get(`/cinema/${cinema.uid}/rooms/:roomUid/sceances`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        if (Array.isArray(sessionResponse.data) && sessionResponse.data.length > 0) {
                            const sessionsWithCinemaUid = sessionResponse.data.map(session => ({
                                ...session,
                                cinemaUid: cinema.uid
                            }));
                            allSessions = [...allSessions, ...sessionsWithCinemaUid];
                        }
                    }
                    setSessions(allSessions);
                    setFilteredSessions(allSessions);
                } else {
                    console.warn('No cinemas found or response format is unexpected:', cinemaResponse.data);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, [token]);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const filtered = sessions.filter(session =>
                movies.find(movie => movie.uid === session.movie)?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSessions(filtered);
        } else {
            setFilteredSessions(sessions);
        }
    }, [searchTerm, sessions, movies]);

    const handleEditClick = (session) => {
        setFormData({
            uid: session.uid,
            movie: session.movie,
            date: new Date(session.date),
            cinema: session.cinemaUid,
            roomUids: session.roomUids
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDeleteClick = async (uid) => {
        const session = sessions.find(session => session.uid === uid);
        if (!session) return;

        if (window.confirm('Are you sure you want to delete this session?')) {
            try {
                for (const roomUid of session.roomUids) {
                    await api.delete(`/cinema/${session.cinemaUid}/rooms/${roomUid}/sceances/${uid}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                }
                const updatedSessions = sessions.filter(session => session.uid !== uid);
                setSessions(updatedSessions);
                setFilteredSessions(updatedSessions);
            } catch (error) {
                console.error('Error deleting session:', error);
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

    const handleRoomSelection = (e) => {
        const selectedRoom = e.target.value;
        setFormData(prevFormData => ({
            ...prevFormData,
            roomUids: [selectedRoom]
        }));
    };

    const handleDateChange = (date) => {
        setFormData(prevFormData => ({
            ...prevFormData,
            date: date.toISOString()
        }));
    };

    const validateForm = () => {
        const { movie, date, roomUids } = formData;

        if (!movie || movie.trim().length === 0) {
            return 'Movie is required.';
        }

        if (!date || isNaN(new Date(date))) {
            return 'A valid date and time are required.';
        }

        if (roomUids.length === 0) {
            return 'At least one room must be selected.';
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

        const { uid, movie, date, roomUids, cinema } = formData;

        const sessionData = {
            movie,
            date,
            roomUids,
            cinemaUid: cinema
        };

        try {
            let response;
            if (isEditMode) {
                response = await api.put(`/cinema/${cinema}/rooms/${roomUids[0]}/sceances/${uid}`, sessionData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                response = await api.post(`/cinema/${cinema}/rooms/${roomUids[0]}/sceances`, sessionData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            const updatedSessions = isEditMode
                ? sessions.map(session => (session.uid === uid ? response.data : session))
                : [...sessions, response.data];
            setSessions(updatedSessions);
            setFilteredSessions(updatedSessions);
            setShowModal(false);
        } catch (error) {
            console.error('Error updating session:', error);
            setError('Error updating session');
        }
    };

    const handleAddClick = () => {
        setFormData({
            uid: '',
            movie: '',
            date: new Date(),
            cinema: '',
            roomUids: []
        });
        setIsEditMode(false);
        setShowModal(true);
    };

    return (
        <div className="container mt-5">
            <h2>Session Management</h2>
            <Button variant="primary" onClick={handleAddClick} className="mb-3">
                <FontAwesomeIcon icon={faPlus} /> Add Session
            </Button>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Movie</th>
                        <th>Rooms</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(filteredSessions) && filteredSessions.map((session) => {
                        const roomNames = session.roomUids.map(roomUid => {
                            const roomName = roomNamesMap[roomUid];
                            return roomName || 'Unknown';
                        }).join(', ');
                        return (
                            <tr key={session.uid}>
                                <td>{movies.find(movie => movie.uid === session.movie)?.name || 'Unknown'}</td>
                                <td>{roomNames}</td>
                                <td>{new Date(session.date).toLocaleString()}</td>
                                <td>
                                    <Button
                                        variant="warning"
                                        onClick={() => handleEditClick(session)}
                                        className="mr-2"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDeleteClick(session.uid)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Session' : 'Add Session'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formSessionMovie">
                            <Form.Label>Movie</Form.Label>
                            <Form.Control
                                as="select"
                                name="movie"
                                value={formData.movie || ''}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="" disabled>Select a movie</option>
                                {Array.isArray(movies) && movies.map(movie => (
                                    <option key={movie.uid} value={movie.uid}>
                                        {movie.name}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formSessionCinema">
                            <Form.Label>Cinema</Form.Label>
                            <Form.Control
                                as="select"
                                name="cinema"
                                value={formData.cinema || ''}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="" disabled>Select a cinema</option>
                                {Array.isArray(cinemas) && cinemas.map(cinema => (
                                    <option key={cinema.uid} value={cinema.uid}>
                                        {cinema.name}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formSessionRooms">
                            <Form.Label>Room</Form.Label>
                            <Form.Control
                                as="select"
                                name="rooms"
                                value={formData.roomUids[0] || ''}
                                onChange={handleRoomSelection}
                                required
                            >
                                <option value="" disabled>Select a room</option>
                                {rooms.filter(room => room.cinemaUid === formData.cinema).map(room => (
                                    <option key={room.uid} value={room.uid}>
                                        {room.name}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formSessionDate">
                            <Form.Label>Date and Time</Form.Label>
                            <DateTime
                                value={new Date(formData.date)}
                                onChange={handleDateChange}
                                dateFormat="YYYY-MM-DD"
                                timeFormat="HH:mm"
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

export default SessionManagement;