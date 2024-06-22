import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Modal, Form, Image, Alert } from 'react-bootstrap';
import api from '../api/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const MovieCard = ({ movie, sessions, isLoggedIn, userRole, token }) => {
    const { name, rate, duration, pictureUrl, description, uid: movieId } = movie;

    const [showModal, setShowModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [nbSeats, setNbSeats] = useState(1);
    const [cinemas, setCinemas] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [roomNamesMap, setRoomNamesMap] = useState({});
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');

    const openSessions = sessions.filter(session => session.movie === movieId && new Date(session.date) > new Date());

    useEffect(() => {
        const fetchCinemasAndRooms = async () => {
            try {
                const cinemaResponse = await api.get('/cinema', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setCinemas(cinemaResponse.data);

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
            } catch (error) {
                console.error('Error fetching cinemas and rooms:', error);
            }
        };

        const fetchUsername = async () => {
            try {
                const response = await api.post('/auth/verify', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUsername(response.data.username);
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        };

        fetchCinemasAndRooms();
        fetchUsername();
    }, [token]);

    const handleRegisterClick = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedSession(null);
        setNbSeats(1);
        setError('');
    };

    const handleSessionChange = (e) => {
        const sessionUid = e.target.value;
        const session = openSessions.find(s => s.uid === sessionUid);
        setSelectedSession(session);
    };

    const handleSeatsChange = (e) => {
        setNbSeats(e.target.value);
    };

    const handleReservation = async () => {
        if (!selectedSession || nbSeats < 1) {
            setError('Please select a session and ensure the number of seats is at least 1.');
            return;
        }

        const reservationData = {
            movieUid: movieId,
            sceance: selectedSession.uid,
            nbSeats: parseInt(nbSeats),
            room: selectedSession.roomUids[0], // Assuming single roomUid for simplicity
            rank: 1,
            status: 'open',
            expiresAt: selectedSession.date,
            username: username
        };

        try {
            await api.post(`/movie/${movieId}/reservations`, reservationData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            alert('Reservation successful!');
            setShowModal(false);
        } catch (error) {
            console.error('Error making reservation:', error);
            setError('Reservation failed.');
        }
    };

    return (
        <Card style={{ width: '18rem' }} className="mb-4">
            <Card.Img
                variant="top"
                src={pictureUrl || 'https://via.placeholder.com/150'}
                style={{ objectFit: 'cover', height: '250px' }} // Ensure the image fits within the card
            />
            <Card.Body>
                <Card.Title>{name}</Card.Title>
                <Card.Text>
                    Rate: {rate || 'N/A'} <br />
                    Duration: {duration || 'N/A'} minutes
                </Card.Text>
                {isLoggedIn && userRole !== 'admin' && openSessions.length > 0 && (
                    <Button variant="primary" onClick={handleRegisterClick}>
                        Register
                    </Button>
                )}
            </Card.Body>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Register for {name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex">
                        <Image
                            src={pictureUrl || 'https://via.placeholder.com/150'}
                            thumbnail
                            style={{ marginRight: '20px', width: '150px', height: 'auto' }}
                        />
                        <div>
                            <h5>{name}</h5>
                            <p>Rate: {rate || 'N/A'}</p>
                            <p>Duration: {duration || 'N/A'} minutes</p>
                            <p>{description}</p>
                        </div>
                    </div>
                    <Form>
                        <Form.Group controlId="formSessions">
                            <Form.Label>Select a Session</Form.Label>
                            <Form.Control as="select" onChange={handleSessionChange}>
                                <option value="">Select...</option>
                                {openSessions.map(session => {
                                    const cinemaName = cinemas.find(cinema => cinema.uid === session.cinemaUid)?.name || 'Unknown';
                                    const roomNames = session.roomUids.map(roomUid => roomNamesMap[roomUid]).join(', ');
                                    return (
                                        <option key={session.uid} value={session.uid}>
                                            {new Date(session.date).toLocaleString()} - Cinema: {cinemaName} - Room: {roomNames}
                                        </option>
                                    );
                                })}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formSeats">
                            <Form.Label>Number of Seats</Form.Label>
                            <Form.Control type="number" value={nbSeats} onChange={handleSeatsChange} min="1" />
                        </Form.Group>
                        {error && <Alert variant="danger">{error}</Alert>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleReservation}>
                        Confirm Reservation
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default MovieCard;