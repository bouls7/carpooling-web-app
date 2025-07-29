import React, { useState, useEffect, useCallback } from "react";
import "../styles/Rides.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import "../fix-leaflet-icon";

const defaultCenter = [33.8938, 35.5018]; // Beirut coordinates

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const Rides = () => {
  const LOCATIONIQ_API_KEY = "pk.04ae3b424787d702be2274b38a10e158";

  // State management
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
  const [lastRefresh, setLastRefresh] = useState(null);
  const [useManualPickup, setUseManualPickup] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [isStartSuggestionsVisible, setIsStartSuggestionsVisible] = useState(false);
  const [loadingStartSuggestions, setLoadingStartSuggestions] = useState(false);
  const [requestedRides, setRequestedRides] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();

  // Test user data
  const testUser = {
    id: 1,
    name: "Test Passenger",
    phone: "+96170123456",
    email: "test@example.com"
  };

  useEffect(() => {
    fetchUserRequestedRides();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!startCoords) return;
    const autoRefreshTimer = setInterval(() => {
      fetchNearbyRides(startCoords);
    }, 120000);
    return () => clearInterval(autoRefreshTimer);
  }, [startCoords]);

  const fetchUserRequestedRides = async () => {
    try {
      const res = await fetch(
        `https://localhost:7221/api/Rides/` 
      //  https://localhost:7221/api/rides/userrequests?passengerId=1
      );
      if (!res.ok) throw new Error("Failed to fetch your ride requests");
      const data = await res.json();
      setRequestedRides(data);
    } catch (err) {
      console.error(err);
      setRequestedRides([]);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`
      );
      if (!response.ok) throw new Error("Failed to get address from coordinates");

      const data = await response.json();
      const addressParts = data.address || {};
      const formattedAddress = [
        addressParts.road,
        addressParts.neighbourhood,
        addressParts.city || addressParts.town || addressParts.village,
        addressParts.state,
        addressParts.country
      ].filter(Boolean).join(", ");

      const finalAddress = formattedAddress || data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      setStartLocation(finalAddress);
      return finalAddress;
    } catch (error) {
      console.error("Reverse geocode error:", error);
      const fallbackAddress = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      setStartLocation(fallbackAddress);
      return fallbackAddress;
    }
  };

  const fetchDropoffSuggestionsDebounced = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) return;
      try {
        setLoadingSuggestions(true);
        setErrorMsg("");
        const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&countrycodes=LB&limit=5&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API request failed`);
        const data = await res.json();
        const suggestions = data.map(item => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));
        setEndSuggestions(suggestions);
        setIsSuggestionsVisible(suggestions.length > 0);
      } catch (error) {
        setErrorMsg("Could not load location suggestions. Please try again.");
        setEndSuggestions([]);
        setIsSuggestionsVisible(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500),
    []
  );

  const fetchStartSuggestionsDebounced = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) return;
      try {
        setLoadingStartSuggestions(true);
        const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&countrycodes=LB&limit=5&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API request failed`);
        const data = await res.json();
        const suggestions = data.map(item => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));
        setStartSuggestions(suggestions);
        setIsStartSuggestionsVisible(suggestions.length > 0);
      } catch (error) {
        setStartSuggestions([]);
        setIsStartSuggestionsVisible(false);
      } finally {
        setLoadingStartSuggestions(false);
      }
    }, 500),
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

  const handleStartLocationChange = (e) => {
    const value = e.target.value;
    setStartLocation(value);
    setStartCoords(null);
    setSelectedRide(null);
    if (value.trim().length > 1) {
      fetchStartSuggestionsDebounced(value.trim());
    } else {
      setStartSuggestions([]);
      setIsStartSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setEndLocation(suggestion.display_name);
    setEndCoords([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setIsSuggestionsVisible(false);
    setErrorMsg("");
  };

  const handleStartSuggestionClick = async (suggestion) => {
    setStartLocation(suggestion.display_name);
    const newStartCoords = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    setStartCoords(newStartCoords);
    setCenter(newStartCoords);
    setIsStartSuggestionsVisible(false);
    setErrorMsg("");
    await fetchNearbyRides(newStartCoords);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        const coords = [lat, lon];

        if (accuracy > 100) {
          const useAnyway = window.confirm(
            `GPS accuracy is poor (±${accuracy.toFixed(0)}m). Continue anyway?`
          );
          if (!useAnyway) {
            setUseManualPickup(true);
            setLoadingLocation(false);
            return;
          }
        }

        setStartCoords(coords);
        setCenter(coords);
        await reverseGeocode(lat, lon);
        await fetchNearbyRides(coords);
        setUseManualPickup(false);
        setLoadingLocation(false);
      },
      (error) => {
        const errorMessages = {
          [error.PERMISSION_DENIED]: "Location access denied by user.",
          [error.POSITION_UNAVAILABLE]: "Location information unavailable.",
          [error.TIMEOUT]: "Location request timed out."
        };
        const errorMessage = `Unable to retrieve location: ${errorMessages[error.code] || error.message}`;
        
        if (window.confirm(`${errorMessage} Enter location manually?`)) {
          setUseManualPickup(true);
        } else {
          setErrorMsg(errorMessage);
        }
        setLoadingLocation(false);
      },
      options
    );
  };

  const fetchNearbyRides = async (coords) => {
    if (!coords) return;
    try {
      setLoadingRides(true);
      const res = await fetch(
        `https://localhost:7221/api/rides?nearLat=${coords[0]}&nearLon=${coords[1]}&radius=5`
      );
      if (!res.ok) throw new Error("Failed to fetch nearby rides");
      const data = await res.json();
      setNearbyRides(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Nearby rides fetch error:", err);
      setErrorMsg("Failed to load nearby rides. Please try again.");
      setNearbyRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  const parseDepartureTime = (departureTime) => {
    if (!departureTime) return new Date();
    
    if (departureTime instanceof Date) return departureTime;
    
    if (typeof departureTime === 'string') {
      if (departureTime.includes('T')) {
        return new Date(departureTime);
      }
      if (departureTime.includes(' ')) {
        return new Date(departureTime.replace(' ', 'T'));
      }
    }
    
    return new Date(departureTime);
  };

  const handleRequestRide = async (ride) => {
  try {
    const requestPayload = {
      rideId: ride.id,  // camelCase (check backend expectations)
      userId: 6,        // camelCase (check backend expectations)
      // Remove status/requestTime if backend handles them
    };

    const res = await fetch("https://localhost:7221/api/Pooling/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      // Clone the response before reading it
      const errorResponse = res.clone();
      let errorMessage;
      
      try {
        // Try parsing as JSON first
        const errorData = await errorResponse.json();
        errorMessage = errorData.message || "Failed to request ride";
      } catch {
        // Fallback to plain text if JSON parsing fails
        errorMessage = await res.text();
      }
      
      throw new Error(errorMessage);
    }

    const result = await res.json();
    alert("Ride requested successfully!");
    // Update UI state...
  } catch (error) {
    console.error("Ride request error:", error);
    setErrorMsg(error.message);
  }
};
  const handleCancelRide = async (ride) => {
    if (!window.confirm("Are you sure you want to cancel this ride request?")) {
      return;
    }

    try {
      const cancelPayload = {
        rideId: ride.id,
        passengerId: 1, // Hardcoded ID
        increaseSeats: true
      };

      const res = await fetch("https://localhost:7221/api/rides/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cancelPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to cancel ride");
      }

      const result = await res.json();

      alert("Ride request cancelled successfully");
      
      // Update local state
      setRequestedRides(prev => prev.filter(id => id !== ride.id));
      
      // Update the ride in nearbyRides to reflect increased seats
      setNearbyRides(prevRides => 
        prevRides.map(r => 
          r.id === ride.id 
            ? { ...r, availableSeats: r.availableSeats + 1 }
            : r
        )
      );

      // Refresh nearby rides to get updated data from server
      setTimeout(() => {
        fetchNearbyRides(startCoords);
      }, 1000);

    } catch (error) {
      console.error("Cancel ride error:", error);
      setErrorMsg(error.message || "Failed to cancel ride. Please try again.");
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

  const clearStart = () => {
    setStartLocation("");
    setStartCoords(null);
    setStartSuggestions([]);
    setIsStartSuggestionsVisible(false);
    setSelectedRide(null);
    setNearbyRides([]);
    setLastRefresh(null);
    setErrorMsg("");
  };

  const handleRefreshRides = () => startCoords && fetchNearbyRides(startCoords);
  const toggleManualPickup = () => {
    setUseManualPickup(!useManualPickup);
    if (!useManualPickup) clearStart();
  };

  const requestedRidesSet = new Set(requestedRides);

  return (
    <div className="rides-page-container">
      <div className="rides-card">
        <div className="rides-header">
          <h2 className="rides-title">Find Available Rides</h2>
          {lastRefresh && (
            <div className="refresh-info">
              <small>Last refreshed: {lastRefresh.toLocaleTimeString()}</small>
              <button
                onClick={handleRefreshRides}
                disabled={loadingRides}
                className="refresh-btn"
              >
                {loadingRides ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          )}
        </div>

        <form className="rides-form" noValidate autoComplete="off">
          <div className="form-group">
            <label className="form-label">Pickup Location</label>
            
            <div style={{ marginBottom: '10px' }}>
              <button
                type="button"
                onClick={toggleManualPickup}
                className={`toggle-mode-btn ${useManualPickup ? 'manual' : 'gps'}`}
              >
                {useManualPickup ? 'Switch to GPS' : 'Enter Manually'}
              </button>
            </div>

            {!useManualPickup ? (
              <div className="location-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Click the button to detect your location"
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
                  title="Get current location using GPS"
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
            ) : (
              <div className="suggestions-container">
                <div className="location-input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter pickup location (e.g., Hamra, Beirut)"
                    value={startLocation}
                    onChange={handleStartLocationChange}
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
                </div>
                {loadingStartSuggestions && (
                  <div className="suggestions-loading">Searching for locations...</div>
                )}
                {isStartSuggestionsVisible && startSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {startSuggestions.map((item) => (
                      <li
                        key={item.place_id}
                        onClick={() => handleStartSuggestionClick(item)}
                        className="suggestion-item"
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
          
          {startCoords && (
            <div className="rides-found-info">
              {nearbyRides.length} ride(s) found near your location
              {nearbyRides.length > 0 && (
                <span className="auto-refresh-info">• Auto-refreshing every 2 minutes</span>
              )}
            </div>
          )}
        </form>
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

          {nearbyRides.map((ride) => {
            const rideDepartureTime = parseDepartureTime(ride.departureTime);
            const rideHasStarted = rideDepartureTime.getTime() < currentTime.getTime();
            const isRequested = requestedRidesSet.has(ride.id);

            return (
              <Marker
                key={ride.id}
                position={[ride.startLat, ride.startLon]}
                eventHandlers={{ click: () => setSelectedRide(ride) }}
              >
                <Popup>
                  <div className="popup-content">
                    <h4>Available Ride</h4>
                    <p><strong>Driver:</strong> {ride.driverName}</p>
                    <p><strong>Phone:</strong> {ride.driverPhone || "Not provided"}</p>
                    <p><strong>Car Model:</strong> {ride.carModel || "Not specified"}</p>
                    <p><strong>Car Plate:</strong> {ride.carPlate || "Not specified"}</p>
                    <p><strong>From:</strong> {ride.startAddress}</p>
                    <p><strong>To:</strong> {ride.endAddress}</p>
                    <p><strong>Price:</strong> ${ride.fare}</p>
                    <p><strong>Seats:</strong> {ride.availableSeats}</p>
                    <p><strong>Departure:</strong> {rideDepartureTime.toLocaleString()}</p>

                    {ride.pickupComment && (
                      <div className="pickup-comment">
                        <p className="pickup-comment-title">📍 Pickup Instructions:</p>
                        <p className="pickup-comment-text">{ride.pickupComment}</p>
                      </div>
                    )}

                    {!rideHasStarted && !isRequested && (
                      <button
                        onClick={() => handleRequestRide(ride)}
                        className="request-btn"
                      >
                        Request Ride
                      </button>
                    )}

                    {!rideHasStarted && isRequested && (
                      <button
                        onClick={() => handleCancelRide(ride)}
                        className="cancel-btn"
                      >
                        Cancel Request
                      </button>
                    )}

                    {rideHasStarted && (
                      <button className="request-btn" disabled>
                        Not Available
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default Rides;