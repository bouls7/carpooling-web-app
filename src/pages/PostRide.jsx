import React, { useState } from "react";
import "../styles/PostRide.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PostRide() {
  const { isLoggedIn, activeAccount, addRideHistory } = useAuth();
  const navigate = useNavigate();

  const [rideData, setRideData] = useState({
    pickup: "",
    dropoff: "",
    date: "",
    time: "",
    seats: "",
    price: "",
    carModel: "",
    licensePlate: "",
    driverPhone: activeAccount?.phone || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRideData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate("/signup");
      return;
    }

    const newRide = {
      ...rideData,
      price: parseFloat(rideData.price),
      seats: parseInt(rideData.seats, 10),
      id: Date.now(),
      driver: activeAccount.fullName,
    };

    addRideHistory(newRide);
    alert("Ride posted successfully!");
    setRideData({
      pickup: "",
      dropoff: "",
      date: "",
      time: "",
      seats: "",
      price: "",
      carModel: "",
      licensePlate: "",
      driverPhone: activeAccount?.phone || "",
    });
  };

  return (
    <div className="post-ride-container">
      <h2 className="post-ride-title">Post a Ride</h2>
      <form onSubmit={handleSubmit} className="post-ride-form">
        <label>Pickup Location</label>
        <input
          type="text"
          name="pickup"
          placeholder="e.g., Beirut"
          value={rideData.pickup}
          onChange={handleChange}
          required
        />

        <label>Dropoff Location</label>
        <input
          type="text"
          name="dropoff"
          placeholder="e.g., Jounieh"
          value={rideData.dropoff}
          onChange={handleChange}
          required
        />

        <label>Date</label>
        <input
          type="date"
          name="date"
          value={rideData.date}
          onChange={handleChange}
          required
        />

        <label>Time</label>
        <input
          type="time"
          name="time"
          value={rideData.time}
          onChange={handleChange}
          required
        />

        <label>Available Seats</label>
        <input
          type="number"
          name="seats"
          placeholder="e.g., 3"
          value={rideData.seats}
          onChange={handleChange}
          required
          min="1"
        />

        <label>Price (USD)</label>
        <input
          type="number"
          name="price"
          placeholder="e.g., 15.50"
          value={rideData.price}
          onChange={handleChange}
          required
          step="0.01"
          min="0"
        />

        <label>Car Model</label>
        <input
          type="text"
          name="carModel"
          placeholder="e.g., Toyota Corolla"
          value={rideData.carModel}
          onChange={handleChange}
          required
        />

        <label>License Plate</label>
        <input
          type="text"
          name="licensePlate"
          placeholder="e.g., B123456"
          value={rideData.licensePlate}
          onChange={handleChange}
          required
        />

        <label>Phone (optional)</label>
        <input
          type="tel"
          name="driverPhone"
          placeholder="e.g., +961 70 123 456"
          value={rideData.driverPhone}
          onChange={handleChange}
        />

        <button type="submit" className="post-ride-btn">
          Post Ride
        </button>
      </form>
    </div>
  );
}
