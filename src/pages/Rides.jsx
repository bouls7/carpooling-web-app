import React, { useState, useEffect } from "react";
import "../styles/Rides.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../fix-leaflet-icon";

const defaultCenter = [33.8938, 35.5018]; // Beirut

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const Rides = () => {
  const LOCATIONIQ_API_KEY = "pk.04ae3b424787d702be2274b38a10e158";

  const [center, setCenter] = useState(defaultCenter);
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [nearbyRides, setNearbyRides] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loadingRides, setLoadingRides] = useState(false);

  const { activeAccount, addRideHistory } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeAccount) navigate("/signup");
  }, [activeAccount, navigate]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCenter = [pos.coords.latitude, pos.coords.longitude];
        setCenter(newCenter);
        setStartCoords(newCenter);
        reverseGeocode(newCenter[0], newCenter[1]);
      },
      () => console.log("Geolocation denied, using default.")
    );
  }, []);

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`
      );
      if (!response.ok) throw new Error("Failed to get address from coordinates");

      const data = await response.json();
      const addressParts = data.address || {};
      const formattedAddress = `${addressParts.road || ""} ${
        addressParts.neighbourhood || ""
      }, ${
        addressParts.city || addressParts.town || addressParts.village || ""
      }, ${addressParts.state || ""}, ${addressParts.country || ""}`
        .replace(/\s+/g, " ")
        .trim();

      setStartLocation(
        formattedAddress ||
        data.display_name ||
        `${lat.toFixed(5)}, ${lon.toFixed(5)}`
      );
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  const fetchDropoffSuggestionsDebounced = React.useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) return;

      try {
        setLoadingSuggestions(true);
        setErrorMsg("");

        const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
          query
        )}&countrycodes=LB&limit=5&format=json`;

        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API request failed with status ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response format from API");

        const suggestions = data.map((item) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));

        setEndSuggestions(suggestions);
        setIsSuggestionsVisible(suggestions.length > 0);
      } catch (error) {
        setErrorMsg("Could not load location suggestions. Please wait a few seconds.");
        setEndSuggestions([]);
        setIsSuggestionsVisible(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 1000),
    []
  );

  const handleEndLocationChange = (e) => {
    const value = e.target.value;
    setEndLocation(value);
    setEndCoords(null);
    setSelectedRide(null);

    if (value.trim().length > 1) {
      fetchDropoffSuggestionsDebounced(value.trim());
    } else {
      setEndSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setEndLocation(suggestion.display_name);
    const newEndCoords = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    setEndCoords(newEndCoords);
    setIsSuggestionsVisible(false);
    setErrorMsg("");
    
    // Fetch rides near the start location
    await fetchNearbyRides(newEndCoords);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setStartCoords([lat, lon]);
        setCenter([lat, lon]);
        await reverseGeocode(lat, lon);
        await fetchNearbyRides([lat, lon]);
        setLoadingLocation(false);
      },
      (error) => {
        setErrorMsg("Unable to retrieve your location: " + error.message);
        setLoadingLocation(false);
      }
    );
  };

  const fetchNearbyRides = async (coords) => {
    if (!coords) return;
    
    try {
      setLoadingRides(true);
      const res = await fetch(
        `https://localhost:7221/api/rides?nearLat=${coords[0]}&nearLon=${coords[1]}&radius=5` // 5km radius
      );
      const data = await res.json();
      setNearbyRides(data);
    } catch (err) {
      console.error("Nearby rides fetch error:", err);
      setNearbyRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  const handleRequestRide = async (ride) => {
    if (!activeAccount) {
      navigate("/signup");
      return;
    }

    try {
      setErrorMsg("");
      setSelectedRide(ride);

      // In a real app, you would send this request to your backend
      const res = await fetch("https://localhost:7221/api/rides/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: ride.id,
          passengerId: activeAccount.id,
          startLocation,
          endLocation,
          startCoords,
          endCoords,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to request ride");
      }

      const result = await res.json();
      alert(`Ride requested successfully! Driver contact: ${ride.driverPhone}`);
      addRideHistory(result.ride);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const clearEnd = () => {
    setEndLocation("");
    setEndCoords(null);
    setEndSuggestions([]);
    setIsSuggestionsVisible(false);
    setSelectedRide(null);
    setErrorMsg("");
  };

  return (
    <div className="rides-page-container">
      <div className="rides-card">
        <h2 className="rides-title">Find Available Rides</h2>

        <form className="rides-form" noValidate autoComplete="off">
          <div className="form-group">
            <label className="form-label">Pickup Location</label>
            <div className="location-input-group">
              <input
                type="text"
                className="form-input"
                placeholder="Current location will appear here"
                value={startLocation}
                readOnly
                aria-label="Start Location"
                required
              />
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={loadingLocation}
                className="location-btn"
              >
                {loadingLocation ? (
                  <span className="spinner"></span>
                ) : (
                  <svg className="location-icon" viewBox="0 0 24 24">
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dropoff Location</label>
            <div className="suggestions-container">
              <div className="location-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter dropoff location (e.g., Hamra, Beirut)"
                  value={endLocation}
                  onChange={handleEndLocationChange}
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
              </div>
              {loadingSuggestions && (
                <div className="suggestions-loading">Searching for locations...</div>
              )}
              {isSuggestionsVisible && endSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {endSuggestions.map((item) => (
                    <li
                      key={item.place_id}
                      onClick={() => handleSuggestionClick(item)}
                      className="suggestion-item"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="error-message" role="alert">
              {errorMsg}
            </div>
          )}
        </form>

        {loadingRides ? (
          <div className="loading-rides">Loading available rides...</div>
        ) : nearbyRides.length > 0 ? (
          <div className="available-rides">
            <h3>Available Rides Near You</h3>
            <div className="rides-list">
              {nearbyRides.map((ride) => (
                <div 
                  key={ride.id} 
                  className={`ride-card ${selectedRide?.id === ride.id ? 'selected' : ''}`}
                >
                  <div className="ride-info">
                    <h4>{ride.driverName}</h4>
                    <p><strong>From:</strong> {ride.startAddress}</p>
                    <p><strong>To:</strong> {ride.endAddress}</p>
                    <p><strong>Departure:</strong> {new Date(ride.startTime).toLocaleString()}</p>
                    <p><strong>Price:</strong> ${ride.fare}</p>
                    <p><strong>Seats:</strong> {ride.availableSeats}</p>
                    <p><strong>Car:</strong> {ride.carModel} ({ride.carColor})</p>
                  </div>
                  <button
                    onClick={() => handleRequestRide(ride)}
                    className="request-btn"
                    disabled={selectedRide !== null}
                  >
                    {selectedRide?.id === ride.id ? "Requested" : "Request Ride"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : endCoords && !loadingRides ? (
          <div className="no-rides">No available rides found for this route</div>
        ) : null}
      </div>

      <div className="map-container">
        <MapContainer 
          center={center} 
          zoom={13} 
          className="map"
          style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
          />

          {startCoords && (
            <Marker position={startCoords}>
              <Popup>Your Location: {startLocation}</Popup>
            </Marker>
          )}
          {endCoords && (
            <Marker position={endCoords}>
              <Popup>Destination: {endLocation}</Popup>
            </Marker>
          )}

          {nearbyRides.map((ride) => (
            <Marker 
              key={ride.id} 
              position={[ride.startLat, ride.startLon]}
              eventHandlers={{
                click: () => setSelectedRide(ride),
              }}
            >
              <Popup>
                <div className="popup-content">
                  <h4>Available Ride</h4>
                  <p><strong>Driver:</strong> {ride.driverName}</p>
                  <p><strong>To:</strong> {ride.endAddress}</p>
                  <p><strong>Price:</strong> ${ride.fare}</p>
                  <p><strong>Seats:</strong> {ride.availableSeats}</p>
                  <button 
                    onClick={() => handleRequestRide(ride)}
                    disabled={selectedRide !== null}
                  >
                    Request Ride
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Rides;