import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminReservationManagement = () => {
    const { token } = useContext(AuthContext);
    const { movieUid } = useParams();
    const [reservations, setReservations] = useState([]);
    const [error, setError] = useState('');
    const [movies, setMovies] = useState({});
    const [rooms, setRooms] = useState({});
    const [cinemas, setCinemas] = useState({});

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                // Fetch all cinemas first
                const cinemaResponse = await api.get(`/cinema`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const cinemasData = cinemaResponse.data.reduce((acc, cinema) => {
                    acc[cinema.uid] = cinema.name;
                    return acc;
                }, {});
                setCinemas(cinemasData);

                // Fetch all rooms
                const roomPromises = Object.keys(cinemasData).map(cinemaUid =>
                    api.get(`/cinema/${cinemaUid}/rooms`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                );
                const roomResponses = await Promise.all(roomPromises);
                const roomsData = roomResponses.reduce((acc, res) => {
                    res.data.forEach(room => {
                        acc[room.uid] = room;
                    });
                    return acc;
                }, {});
                setRooms(roomsData);

                // Fetch reservations
                const reservationsResponse = await api.get(`/movie/${movieUid}/reservations`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const reservationsData = reservationsResponse.data;
                setReservations(reservationsData);

                // Fetch movies
                const moviePromises = reservationsData.map(reservation =>
                    api.get(`/movies/${reservation.movieUid}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                );
                const movieResponses = await Promise.all(moviePromises);
                const moviesData = movieResponses.reduce((acc, res) => {
                    acc[res.data.uid] = res.data.name;
                    return acc;
                }, {});
                setMovies(moviesData);
            } catch (error) {
                console.error('Error fetching reservations:', error);
                setError('Error fetching reservations. Please try again later.');
            }
        };

        fetchReservations();
    }, [token, movieUid]);

    const handleConfirmReservation = async (uid) => {
        try {
            await api.post(`/reservations/${uid}/confirm`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setReservations(reservations.map(reservation =>
                reservation.uid === uid ? { ...reservation, status: 'confirmed' } : reservation
            ));
        } catch (error) {
            console.error('Error confirming reservation:', error);
            setError('Error confirming reservation. Please try again later.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Admin Reservation Management for Movie UID: {movieUid}</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {reservations.length > 0 ? (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Movie</th>
                            <th>Session Date</th>
                            <th>Cinema</th>
                            <th>Room</th>
                            <th>Seats</th>
                            <th>Status</th>
                            <th>Username</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((reservation) => (
                            <tr key={reservation.uid}>
                                <td>{movies[reservation.movieUid]}</td>
                                <td>{new Date(reservation.expiresAt).toLocaleString()}</td>
                                <td>{cinemas[rooms[reservation.room]?.cinemaUid]}</td>
                                <td>{rooms[reservation.room]?.name}</td>
                                <td>{reservation.nbSeats}</td>
                                <td>{reservation.status}</td>
                                <td>{reservation.username}</td>
                                <td>
                                    {reservation.status !== 'confirmed' && (
                                        <Button variant="success" onClick={() => handleConfirmReservation(reservation.uid)}>
                                            Confirm
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <p>No reservations found.</p>
            )}
        </div>
    );
};

export default AdminReservationManagement;