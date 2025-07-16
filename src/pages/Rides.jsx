import React, { useState, useEffect } from "react";
import "../styles/Rides.css";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../fix-leaflet-icon";

const defaultCenter = [33.8938, 35.5018]; // Beirut

const LocationIcon = ({ color }) => (
  <svg
    className="input-icon"
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
  </svg>
);

const Rides = () => {
  const [center, setCenter] = useState(defaultCenter);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const [rideRequested, setRideRequested] = useState(false);
  const [rideInfo, setRideInfo] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { activeAccount, addRideHistory } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeAccount) navigate("/signup");
  }, [activeAccount, navigate]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => console.log("Geolocation denied, using default.")
    );
  }, []);

  const clearStart = () => {
    setStartLocation("");
    setStartCoords(null);
    setRideRequested(false);
    setRouteCoords([]);
    setErrorMsg("");
  };

  const clearEnd = () => {
    setEndLocation("");
    setEndCoords(null);
    setRideRequested(false);
    setRouteCoords([]);
    setErrorMsg("");
  };

  const geocodeAddress = async (address) => {
    const apiKey = "YOUR_GEOAPIFY_API_KEY"; // Replace with your Geoapify API key
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        address
      )}&limit=1&apiKey=${apiKey}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      return [lat, lon];
    } else {
      throw new Error(`Address not found: ${address}`);
    }
  };

  const handleRequestRide = async () => {
    setErrorMsg("");
    setLoading(true);
    setRideRequested(false);
    setRouteCoords([]);
    setRideInfo(null);

    try {
      if (!startLocation || !endLocation) {
        setErrorMsg("Please enter both start and end locations.");
        setLoading(false);
        return;
      }

      const start = await geocodeAddress(startLocation);
      setStartCoords(start);

      const end = await geocodeAddress(endLocation);
      setEndCoords(end);

      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        setErrorMsg("No route found.");
        setLoading(false);
        return;
      }

      const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
      setRouteCoords(coords);

      const distanceKm = data.routes[0].distance / 1000;
      const fare = `$${(distanceKm * 0.5).toFixed(2)}`;

      const newRide = {
        id: Date.now(),
        startLocation,
        endLocation,
        fare,
        driver: "John Smith",
        estimatedTime: "~5 mins",
        date: new Date().toLocaleString(),
      };

      setRideInfo(newRide);
      setRideRequested(true);
      addRideHistory(newRide);
    } catch (error) {
      setErrorMsg(error.message || "Failed to get route info, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rides-page-container">
      <h2 className="rides-title">Request a Ride</h2>

      <form
        className="rides-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleRequestRide();
        }}
        noValidate
      >
        <div className="input-wrapper">
          <LocationIcon color="#2563eb" />
          <input
            id="startLocation"
            type="text"
            placeholder="Start Location"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            aria-label="Start Location"
            required
          />
          {startLocation && (
            <button
              type="button"
              onClick={clearStart}
              className="clear-btn"
              aria-label="Clear start location"
            >
              &times;
            </button>
          )}
          <label htmlFor="startLocation">Start Location</label>
        </div>

        <div className="input-wrapper">
          <LocationIcon color="#ef4444" />
          <input
            id="endLocation"
            type="text"
            placeholder="End Location"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            aria-label="End Location"
            required
          />
          {endLocation && (
            <button
              type="button"
              onClick={clearEnd}
              className="clear-btn"
              aria-label="Clear end location"
            >
              &times;
            </button>
          )}
          <label htmlFor="endLocation">End Location</label>
        </div>

        {errorMsg && (
          <p className="error-message" role="alert">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="rides-btn"
          disabled={loading || !startLocation || !endLocation}
          aria-busy={loading}
        >
          {loading ? "Requesting..." : "Request Ride"}
        </button>
      </form>

      <div className="map-wrapper" role="region" aria-label="Ride route map">
        <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
          />
          {startCoords && (
            <Marker position={startCoords}>
              <Popup>Start Location: {startLocation}</Popup>
            </Marker>
          )}
          {endCoords && (
            <Marker position={endCoords}>
              <Popup>End Location: {endLocation}</Popup>
            </Marker>
          )}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#2563eb" weight={5} />}
        </MapContainer>
      </div>

      {rideRequested && rideInfo && (
        <div className="ride-confirmation" role="alert" aria-live="polite">
          <h3>Ride Confirmed</h3>
          <p><strong>Start Location:</strong> {rideInfo.startLocation}</p>
          <p><strong>End Location:</strong> {rideInfo.endLocation}</p>
          <p><strong>Driver:</strong> {rideInfo.driver}</p>
          <p><strong>Fare:</strong> {rideInfo.fare}</p>
          <p><strong>ETA:</strong> {rideInfo.estimatedTime}</p>
          <p><strong>Date:</strong> {rideInfo.date}</p>
        </div>
      )}
    </div>
  );
};

export default Rides;
