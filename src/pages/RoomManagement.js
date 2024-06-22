import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const RoomManagement = ({ searchTerm }) => {
    const { token } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        uid: '',
        cinemaUid: '',
        name: '',
        seats: 0
    });
    const [error, setError] = useState('');

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
                for (const cinema of cinemaResponse.data) {
                    const roomResponse = await api.get(`/cinema/${cinema.uid}/rooms`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    allRooms.push(...roomResponse.data);
                }
                setRooms(allRooms);
                setFilteredRooms(allRooms);
            } catch (error) {
                console.error('Error fetching cinemas and rooms:', error);
            }
        };

        fetchCinemasAndRooms();
    }, [token]);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const filtered = rooms.filter(room =>
                room.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredRooms(filtered);
        } else {
            setFilteredRooms(rooms);
        }
    }, [searchTerm, rooms]);

    const handleEditClick = (room) => {
        setFormData({
            uid: room.uid,
            cinemaUid: room.cinemaUid,
            name: room.name || '',
            seats: room.seats || 0
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDeleteClick = async (uid, cinemaUid) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await api.delete(`/cinema/${cinemaUid}/rooms/${uid}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setRooms(rooms.filter(room => room.uid !== uid));
                setFilteredRooms(filteredRooms.filter(room => room.uid !== uid));
            } catch (error) {
                console.error('Error deleting room:', error);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: name === 'seats' ? parseInt(value, 10) : value
        }));
    };

    const validateForm = () => {
        const { name, seats } = formData;

        if (name.trim().length === 0 || name.trim().length > 128) {
            return 'Name must be between 1 and 128 characters.';
        }

        if (isNaN(seats) || seats <= 0) {
            return 'Seats must be a positive integer.';
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

        const { uid, cinemaUid, name, seats } = formData;

        const roomData = {
            cinemaUid,
            name,
            seats
        };

        try {
            let response;
            if (isEditMode) {
                response = await api.put(`/cinema/${cinemaUid}/rooms/${uid}`, roomData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                response = await api.post(`/cinema/${cinemaUid}/rooms`, roomData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            const updatedRooms = isEditMode
                ? rooms.map(room => (room.uid === uid ? response.data : room))
                : [...rooms, response.data];
            setRooms(updatedRooms);
            setFilteredRooms(updatedRooms);
            setShowModal(false);
        } catch (error) {
            console.error('Error updating room:', error);
            setError('Error updating room');
        }
    };

    const handleAddClick = () => {
        setFormData({
            uid: '',
            cinemaUid: '',
            name: '',
            seats: 0
        });
        setIsEditMode(false);
        setShowModal(true);
    };

    return (
        <div className="container mt-5">
            <h2>Room Management</h2>
            <Button variant="primary" onClick={handleAddClick} className="mb-3">
                <FontAwesomeIcon icon={faPlus} /> Add Room
            </Button>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Cinema</th>
                        <th>Name</th>
                        <th>Seats</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(filteredRooms) && filteredRooms.map((room) => (
                        <tr key={room.uid}>
                            <td>{cinemas.find(cinema => cinema.uid === room.cinemaUid)?.name || 'Unknown'}</td>
                            <td>{room.name}</td>
                            <td>{room.seats}</td>
                            <td>
                                <Button
                                    variant="warning"
                                    onClick={() => handleEditClick(room)}
                                    className="mr-2"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleDeleteClick(room.uid, room.cinemaUid)}
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
                    <Modal.Title>{isEditMode ? 'Edit Room' : 'Add Room'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formRoomCinema">
                            <Form.Label>Cinema</Form.Label>
                            <Form.Control
                                as="select"
                                name="cinemaUid"
                                value={formData.cinemaUid || ''}
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
                        <Form.Group controlId="formRoomName">
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
                        <Form.Group controlId="formRoomSeats">
                            <Form.Label>Seats</Form.Label>
                            <Form.Control
                                type="number"
                                name="seats"
                                value={formData.seats || 0}
                                onChange={handleInputChange}
                                required
                                min={1}
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

export default RoomManagement;