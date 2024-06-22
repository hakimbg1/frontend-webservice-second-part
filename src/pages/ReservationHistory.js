import React, { useEffect, useState, useContext } from 'react';
import { Table, Alert } from 'react-bootstrap';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const ReservationHistory = () => {
    const { token } = useContext(AuthContext);
    const [reservations, setReservations] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch the username from the token
                const authResponse = await api.post('/auth/verify', {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const username = authResponse.data.username;

                // Fetch reservations for the username
                const reservationsResponse = await api.get(`/reservations/username/${username}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const reservationsData = reservationsResponse.data;

                // Fetch movies and rooms details
                const moviePromises = reservationsData.map(reservation => api.get(`/movies/${reservation.movieUid}`));
                const roomPromises = reservationsData.map(reservation => api.get(`/cinema/${reservation.room}/rooms/${reservation.room}`));

                const movies = await Promise.all(moviePromises);
                const rooms = await Promise.all(roomPromises);

                // Create a mapping for movie and room details
                const movieMap = {};
                const roomMap = {};
                const cinemaUids = new Set();

                movies.forEach(movie => {
                    movieMap[movie.data.uid] = movie.data.name;
                });

                rooms.forEach(room => {
                    roomMap[room.data.uid] = room.data;
                    cinemaUids.add(room.data.cinemaUid);
                });

                // Fetch cinemas details
                const cinemaPromises = Array.from(cinemaUids).map(cinemaUid => api.get(`/cinema/${cinemaUid}`));
                const cinemas = await Promise.all(cinemaPromises);

                const cinemaMap = {};
                cinemas.forEach(cinema => {
                    cinemaMap[cinema.data.uid] = cinema.data.name;
                });

                // Map the fetched details to the reservations
                const updatedReservations = reservationsData.map(reservation => ({
                    ...reservation,
                    movieName: movieMap[reservation.movieUid],
                    roomName: roomMap[reservation.room].name,
                    cinemaName: cinemaMap[roomMap[reservation.room].cinemaUid]
                }));

                setReservations(updatedReservations);
            } catch (error) {
                console.error('Error fetching reservation details:', error);
                setError('Error fetching reservation details. Please try again later.');
            }
        };

        fetchDetails();
    }, [token]);

    return (
        <div className="container mt-5">
            <h2>Reservation History</h2>
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
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((reservation) => (
                            <tr key={reservation.uid}>
                                <td>{reservation.movieName}</td>
                                <td>{new Date(reservation.expiresAt).toLocaleString()}</td>
                                <td>{reservation.cinemaName}</td>
                                <td>{reservation.roomName}</td>
                                <td>{reservation.nbSeats}</td>
                                <td>{reservation.status}</td>
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

export default ReservationHistory;