import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';

const CinemaManagement = ({ searchTerm }) => {
    const { token } = useContext(AuthContext);
    const [cinemas, setCinemas] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [filteredCinemas, setFilteredCinemas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        uid: '',
        name: ''
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

                if (Array.isArray(cinemaResponse.data)) {
                    setCinemas(cinemaResponse.data);
                    setFilteredCinemas(cinemaResponse.data);

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
                } else {
                    console.error('Expected an array from cinema API, received:', cinemaResponse.data);
                }
            } catch (error) {
                console.error('Error fetching cinemas and rooms:', error);
            }
        };

        fetchCinemasAndRooms();
    }, [token]);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const filtered = cinemas.filter(cinema =>
                cinema.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCinemas(filtered);
        } else {
            setFilteredCinemas(cinemas);
        }
    }, [searchTerm, cinemas]);

    const handleEditClick = (cinema) => {
        setFormData({
            uid: cinema.uid,
            name: cinema.name || ''
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleDeleteClick = async (cinemaUid) => {
        const attachedRooms = rooms.filter(room => room.cinemaUid === cinemaUid);

        if (attachedRooms.length > 0) {
            if (!window.confirm(`This cinema has ${attachedRooms.length} attached rooms. Do you want to delete them too?`)) {
                return;
            }
        }

        try {
            for (const room of attachedRooms) {
                await api.delete(`/cinema/${cinemaUid}/rooms/${room.uid}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            await api.delete(`/cinema/${cinemaUid}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCinemas(cinemas.filter(cinema => cinema.uid !== cinemaUid));
            setFilteredCinemas(filteredCinemas.filter(cinema => cinema.uid !== cinemaUid));
            setRooms(rooms.filter(room => room.cinemaUid !== cinemaUid));
        } catch (error) {
            console.error('Error deleting cinema and its rooms:', error);
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
        const { name } = formData;

        if (name.trim().length === 0 || name.trim().length > 128) {
            return 'Name must be between 1 and 128 characters.';
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

        const { uid, name } = formData;

        const cinemaData = {
            name
        };


        try {
            let response;
            if (isEditMode) {
                response = await api.put(`/cinema/${uid}`, cinemaData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                response = await api.post('/cinema', cinemaData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            const updatedCinemas = isEditMode
                ? cinemas.map(cinema => (cinema.uid === uid ? response.data : cinema))
                : [...cinemas, response.data];
            setCinemas(updatedCinemas);
            setFilteredCinemas(updatedCinemas);
            setShowModal(false);
        } catch (error) {
            console.error('Error updating cinema:', error);
            setError('Error updating cinema');
        }
    };

    const handleAddClick = () => {
        setFormData({
            uid: '',
            name: ''
        });
        setIsEditMode(false);
        setShowModal(true);
    };

    return (
        <div className="container mt-5">
            <h2>Cinema Management</h2>
            <Button variant="primary" onClick={handleAddClick} className="mb-3">
                <FontAwesomeIcon icon={faPlus} /> Add Cinema
            </Button>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Rooms</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(filteredCinemas) && filteredCinemas.map((cinema) => (
                        <tr key={cinema.uid}>
                            <td>{cinema.name}</td>
                            <td>
                                {rooms
                                    .filter(room => room.cinemaUid === cinema.uid)
                                    .map(room => (
                                        <div key={room.uid}>
                                            <strong>{room.name}</strong> - {room.seats} seats
                                        </div>
                                    ))}
                            </td>
                            <td>
                                <Button
                                    variant="warning"
                                    onClick={() => handleEditClick(cinema)}
                                    className="mr-2"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleDeleteClick(cinema.uid)}
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
                    <Modal.Title>{isEditMode ? 'Edit Cinema' : 'Add Cinema'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Form.Group controlId="formCinemaName">
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

export default CinemaManagement;