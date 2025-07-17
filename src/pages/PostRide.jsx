import React, { useState } from "react";
import "../styles/PostRide.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PostRide() {
  const { user, role, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [price, setPrice] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [seats, setSeats] = useState("");  // <-- new state for seats
  const [successMessage, setSuccessMessage] = useState("");

  if (!isLoggedIn || role !== "driver") {
    navigate("/signup");
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const rideData = {
      driver: {
        name: user?.name || "Anonymous Driver",
        carModel,
        carNumber,
      },
      startLocation,
      endLocation,
      price,
      seats,  // <-- include seats here
    };

    localStorage.setItem("postedRide", JSON.stringify(rideData));

    setSuccessMessage("Ride posted successfully!");
    setStartLocation("");
    setEndLocation("");
    setPrice("");
    setCarModel("");
    setCarNumber("");
    setSeats("");  // <-- reset seats field
  };

  return (
    <div className="post-ride-container">
      <h2 className="post-ride-title">Post a Ride</h2>

      <form onSubmit={handleSubmit} className="post-ride-form">
        <label htmlFor="startLocation">Start Location</label>
        <input
          id="startLocation"
          type="text"
          placeholder="e.g. Beirut"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          required
        />

        <label htmlFor="endLocation">End Location</label>
        <input
          id="endLocation"
          type="text"
          placeholder="e.g. Jounieh"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          required
        />

        <label htmlFor="price">Price ($)</label>
        <input
          id="price"
          type="number"
          placeholder="e.g. 10"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="0"
          step="0.01"
        />

        <label htmlFor="carModel">Car Model</label>
        <input
          id="carModel"
          type="text"
          placeholder="e.g. Toyota Corolla"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
          required
        />

        <label htmlFor="carNumber">Car Number</label>
        <input
          id="carNumber"
          type="text"
          placeholder="e.g. B123456"
          value={carNumber}
          onChange={(e) => setCarNumber(e.target.value)}
          required
        />

        <label htmlFor="seats">Seats Available</label>
        <input
          id="seats"
          type="number"
          placeholder="e.g. 3"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          required
          min="1"
        />

        <button type="submit" className="post-ride-btn">Submit Ride</button>

        {successMessage && <p className="post-success-msg">{successMessage}</p>}
      </form>
    </div>
  );
}
