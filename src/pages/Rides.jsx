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

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const Rides = () => {
  const apiKey = "b20fbcf917ef4227ba363e7b7db7515b"; 

  const [center, setCenter] = useState(defaultCenter);

  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  const [routeCoords, setRouteCoords] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [nearbyRides, setNearbyRides] = useState([]);

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

  // Fetch autocomplete suggestions
const fetchSuggestions = async (query, setSuggestions) => {
  if (!query) {
    setSuggestions([]);
    return;
  }

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
    query
  )}&limit=5&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    // FIX: Geoapify uses `results`, not `features`
    const filteredResults = (data.results || []).filter(
      (place) => place && place.properties && place.properties.formatted
    );
    setSuggestions(filteredResults);
  } catch (err) {
    console.error("Autocomplete fetch error:", err);
    setSuggestions([]);
  }
};


  const debouncedFetchStartSuggestions = debounce(
    (val) => fetchSuggestions(val, setStartSuggestions),
    300
  );
  const debouncedFetchEndSuggestions = debounce(
    (val) => fetchSuggestions(val, setEndSuggestions),
    300
  );

  // Geocode address to coords
  const geocodeAddress = async (address) => {
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

  // Fetch nearby rides from backend (mocked here)
  useEffect(() => {
    if (!startCoords) return;

    async function fetchNearbyRides() {
      try {
        // Replace with your backend API endpoint:
        const res = await fetch(
          `/api/rides?nearLat=${startCoords[0]}&nearLon=${startCoords[1]}`
        );
        const data = await res.json();
        setNearbyRides(data);
      } catch (err) {
        console.error("Nearby rides fetch error:", err);
        setNearbyRides([]);
      }
    }

    fetchNearbyRides();
  }, [startCoords]);

  // Handle ride request button
  const handleRequestRide = async () => {
    setErrorMsg("");
    setLoading(true);
    setRouteCoords([]);
    try {
      if (!startLocation || !endLocation) {
        setErrorMsg("Please enter both start and end locations.");
        setLoading(false);
        return;
      }

      let start = startCoords;
      let end = endCoords;

      if (!start) {
        start = await geocodeAddress(startLocation);
        setStartCoords(start);
      }
      if (!end) {
        end = await geocodeAddress(endLocation);
        setEndCoords(end);
      }

      // Geoapify routing API (CORS friendly)
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start[0]},${start[1]}|${end[0]},${end[1]}&mode=drive&apiKey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.features || data.features.length === 0) {
        setErrorMsg("No route found.");
        setLoading(false);
        return;
      }

      const coords = data.features[0].geometry.coordinates.map((c) => [c[1], c[0]]);
      setRouteCoords(coords);

      // Add ride history (optional)
      addRideHistory({
        id: Date.now(),
        startLocation,
        endLocation,
        fare: `$${(data.features[0].properties.distance / 1000 * 0.5).toFixed(2)}`,
        driver: "John Smith",
        estimatedTime: "~5 mins",
        date: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error("Route fetch error:", error);
      setErrorMsg(error.message || "Failed to get route info, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearStart = () => {
    setStartLocation("");
    setStartCoords(null);
    setStartSuggestions([]);
    setRouteCoords([]);
    setErrorMsg("");
  };
  const clearEnd = () => {
    setEndLocation("");
    setEndCoords(null);
    setEndSuggestions([]);
    setRouteCoords([]);
    setErrorMsg("");
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
        autoComplete="off"
      >
        <div className="input-wrapper" style={{ position: "relative" }}>
          <LocationIcon color="#2563eb" />
          <input
            id="startLocation"
            type="text"
            placeholder="Start Location"
            value={startLocation}
            onChange={(e) => {
              setStartLocation(e.target.value);
              setStartCoords(null);
              debouncedFetchStartSuggestions(e.target.value);
            }}
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

          {startSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {startSuggestions.map((place) => (
                <li
                  key={place.properties.place_id}
                  onClick={() => {
                    setStartLocation(place.properties.formatted);
                    setStartCoords([place.properties.lat, place.properties.lon]);
                    setStartSuggestions([]);
                    setRouteCoords([]);
                    setErrorMsg("");
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setStartLocation(place.properties.formatted);
                      setStartCoords([place.properties.lat, place.properties.lon]);
                      setStartSuggestions([]);
                      setRouteCoords([]);
                      setErrorMsg("");
                    }
                  }}
                >
                  {place.properties.formatted}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="input-wrapper" style={{ position: "relative" }}>
          <LocationIcon color="#ef4444" />
          <input
            id="endLocation"
            type="text"
            placeholder="End Location"
            value={endLocation}
            onChange={(e) => {
              setEndLocation(e.target.value);
              setEndCoords(null);
              debouncedFetchEndSuggestions(e.target.value);
            }}
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

          {endSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {endSuggestions.map((place) => (
                <li
                  key={place.properties.place_id}
                  onClick={() => {
                    setEndLocation(place.properties.formatted);
                    setEndCoords([place.properties.lat, place.properties.lon]);
                    setEndSuggestions([]);
                    setRouteCoords([]);
                    setErrorMsg("");
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEndLocation(place.properties.formatted);
                      setEndCoords([place.properties.lat, place.properties.lon]);
                      setEndSuggestions([]);
                      setRouteCoords([]);
                      setErrorMsg("");
                    }
                  }}
                >
                  {place.properties.formatted}
                </li>
              ))}
            </ul>
          )}
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
          {/* Suggestion markers with low opacity */}
          {startSuggestions.map((place) => (
            <Marker
              key={"start-" + place.properties.place_id}
              position={[place.properties.lat, place.properties.lon]}
              opacity={0.5}
            >
              <Popup>{place.properties.formatted}</Popup>
            </Marker>
          ))}
          {endSuggestions.map((place) => (
            <Marker
              key={"end-" + place.properties.place_id}
              position={[place.properties.lat, place.properties.lon]}
              opacity={0.5}
            >
              <Popup>{place.properties.formatted}</Popup>
            </Marker>
          ))}

          {/* Selected start and end markers */}
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

          {/* Route polyline */}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#2563eb" weight={5} />}

          {/* Nearby posted rides markers */}
          {nearbyRides.map((ride) => (
            <Marker
              key={ride.id}
              position={[ride.startCoords.lat, ride.startCoords.lon]}
            >
              <Popup>
                <div>
                  <strong>Driver:</strong> {ride.driverName} <br />
                  <strong>Car:</strong> {ride.carModel} <br />
                  <strong>Price:</strong> ${ride.price} <br />
                  <strong>Seats:</strong> {ride.seats}
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
