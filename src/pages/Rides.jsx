import React, { useState, useEffect, useCallback, useRef, act } from "react";
import "../styles/Rides.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import "../fix-leaflet-icon";
// import * as signalR from "@microsoft/signalr";

const defaultCenter = [33.8938, 35.5018]; // Beirut coordinates

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const formatDepartureTime = (utcTimeString) => {
  if (!utcTimeString) return "Time not specified";
  
  try {
    const utcDate = new Date(utcTimeString);
    const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    
    return localDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error("Error formatting time:", e);
    return utcTimeString;
  }
};

const rideHasStarted = (departureTime) => {
  if (!departureTime) return false;
  
  try {
    const rideTime = new Date(departureTime);
    const now = new Date();
    return rideTime.getTime() < now.getTime();
  } catch (e) {
    console.error("Error checking ride status:", e);
    return false;
  }
};

const PhoneNumberDropdown = ({ phoneNumber }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!phoneNumber) return <span>Not provided</span>;

  // Clean the phone number for WhatsApp link
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  return (
    <div 
      className="phone-number-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="phone-number">{phoneNumber}</span>
      {isHovered && (
        <div className="phone-options-dropdown">
          <a 
            href={`tel:${cleanPhone}`} 
            className="phone-option"
            onClick={(e) => e.stopPropagation()}
          >
            Call
          </a>
          <a 
            href={`https://wa.me/${cleanPhone}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="phone-option"
            onClick={(e) => e.stopPropagation()}
          >
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
};

const Rides = () => {
  // Driver request modal state
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverRequests, setDriverRequests] = useState([]); // { rideId, passengerName, status, requestId }
  const [activeAccount, setActiveAccount] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const prevRequestCount = useRef(0);
  // On mount, get active account info (for driver/passenger logic)
  useEffect(() => {
    const stored = localStorage.getItem("activeAccount");
    if (stored) {
      try {
        setActiveAccount(JSON.parse(stored));
      } catch {}
    }
  }, []);
  // Fetch ride requests for driver (rides they own)
  const fetchDriverRequests = async (showNotification = true) => {
    let activeAccountId = localStorage.getItem("activeAccountId");
    activeAccountId = activeAccountId && !isNaN(Number(activeAccountId)) ? Number(activeAccountId) : null;
    const driverId = activeAccountId && activeAccountId > 0 ? activeAccountId : (activeAccount?.id || 6);
    console.log('[Polling] fetchDriverRequests called. driverId:', driverId, 'showNotification:', showNotification);
    try {
      const res = await fetch(`https://localhost:7221/api/Pooling/driverrequests?driverId=${driverId}`);
      if (!res.ok) throw new Error("Failed to fetch driver ride requests");
      const data = await res.json();
      console.log('[Polling] API response for driver requests:', data);
      setDriverRequests(data);
      // Toast notification logic
      if (showNotification && Array.isArray(data)) {
        const pendingCount = data.filter(r => r.status === "Pending").length;
        console.log('[Polling] pendingCount:', pendingCount, 'prevRequestCount:', prevRequestCount.current);
        if (pendingCount > prevRequestCount.current) {
          console.log('[Toast] Showing toast for new requests:', pendingCount);
          setToastMsg(`You have ${pendingCount} new ride request${pendingCount > 1 ? 's' : ''}!`);
          setShowToast(true);
        } else if (pendingCount < prevRequestCount.current) {
          console.log('[Toast] Pending count decreased or cleared. Hiding toast.');
          setShowToast(false);
        }
        prevRequestCount.current = pendingCount;
      }
    } catch (err) {
      setDriverRequests([]);
      console.error('[Polling] Error fetching driver requests:', err);
    }
  };
  const LOCATIONIQ_API_KEY = "pk.04ae3b424787d702be2274b38a10e158";
  const SIGNALR_HUB_URL = "https://localhost:7221/hub/rideStatus";

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
  const [requestedRides, setRequestedRides] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();
  const connectionRef = useRef(null);

  // Fetch user's requested rides
  const fetchUserRequestedRides = async () => {
    // Use the same userId logic as in handleRequestRide
    let activeAccountId = localStorage.getItem("activeAccountId");
    activeAccountId = activeAccountId && !isNaN(Number(activeAccountId)) ? Number(activeAccountId) : null;
    const UserId = activeAccountId && activeAccountId > 0 ? activeAccountId : (activeAccount?.id || 6);
    try {
      const res = await fetch(
        `https://localhost:7221/api/Pooling/userrequests?passengerId=${UserId}`
      );
      if (!res.ok) throw new Error("Failed to fetch your ride requests");
      const data = await res.json();

      const requestsMap = {};
      data.forEach(request => {
        requestsMap[request.rideId] = request.status;
      });

      setRequestedRides(requestsMap);
    } catch (err) {
      console.error(err);
      setRequestedRides({});
    }
  };

  // Reverse geocode coordinates to address string
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

  // Debounced fetch for dropoff suggestions
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

  // Debounced fetch for pickup suggestions
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

  // Get current location with geolocation API
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

  // Fetch nearby rides
  const fetchNearbyRides = async (coords) => {
    if (!coords) return;
    try {
      setLoadingRides(true);
      const res = await fetch(
        `https://localhost:7221/api/rides?nearLat=${coords[0]}&nearLon=${coords[1]}&radius=5`
      );
      if (!res.ok) throw new Error("Failed to fetch nearby rides");
      const data = await res.json();
      
      const ridesWithProperTimes = data.map(ride => ({
        ...ride,
        departureTime: ride.departureTime
      }));
      
      setNearbyRides(ridesWithProperTimes);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Nearby rides fetch error:", err);
      setErrorMsg("Failed to load nearby rides. Please try again.");
      setNearbyRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  // Request a ride
  const handleRequestRide = async (ride) => {
    let activeAccountId = localStorage.getItem("activeAccountId");
activeAccountId = activeAccountId && !isNaN(Number(activeAccountId)) ? Number(activeAccountId) : null;
const UserId = activeAccountId && activeAccountId > 0 ? activeAccountId : (activeAccount?.id || 6);
    try {
      const requestPayload = {
        rideId: ride.id,
        userId: UserId|| 6, // Fallback to 6 if no active account
      };

      const res = await fetch("https://localhost:7221/api/Pooling/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        const errorResponse = res.clone();
        let errorMessage;
        try {
          const errorData = await errorResponse.json();
          errorMessage = errorData.message || "Failed to request ride";
        } catch {
          errorMessage = await res.text();
        }
        throw new Error(errorMessage);
      }

      await res.json();
      alert("Ride requested successfully!");
      await fetchUserRequestedRides();
      if (startCoords) await fetchNearbyRides(startCoords);
    } catch (error) {
      console.error("Ride request error:", error);
      setErrorMsg(error.message);
    }
  };

  // Cancel ride request
  const handleCancelRide = async (ride) => {
    if (!window.confirm("Are you sure you want to cancel this ride request?")) {
      return;
    }
    // Use the same userId logic as in handleRequestRide
    let activeAccountId = localStorage.getItem("activeAccountId");
    activeAccountId = activeAccountId && !isNaN(Number(activeAccountId)) ? Number(activeAccountId) : null;
    const UserId = activeAccountId && activeAccountId > 0 ? activeAccountId : (activeAccount?.id || 6);
    try {
      const res = await fetch(
        `https://localhost:7221/api/Pooling/cancel?rideId=${ride.id}&userId=${UserId}`,
        { method: "DELETE", headers: { "Content-Type": "application/json" } }
      );

      if (!res.ok) {
        if (res.status === 404) throw new Error("Ride request not found");
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || `Failed to cancel ride (${res.status})`;
        } catch {
          errorMessage = `Failed to cancel ride. Server responded with status ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      try {
        await res.json();
      } catch {}

      alert("Ride request cancelled successfully");
      setRequestedRides(prevRequests => {
        const updatedRequests = { ...prevRequests };
        delete updatedRequests[ride.id];
        return updatedRequests;
      });
      await fetchUserRequestedRides();
      setNearbyRides(prevRides => 
        prevRides.map(r => 
          r.id === ride.id 
            ? { ...r, availableSeats: r.availableSeats + 1 }
            : r
        )
      );

      setTimeout(() => {
        if (startCoords) fetchNearbyRides(startCoords);
      }, 1000);

    } catch (error) {
      console.error("Cancel ride error:", error);
      setErrorMsg(error.message || "Failed to cancel ride. Please try again.");
      alert(`Error: ${error.message}`);
    }
  };

  // Clear pickup input
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

  // Clear dropoff input
  const clearEnd = () => {
    setEndLocation("");
    setEndCoords(null);
    setEndSuggestions([]);
    setIsSuggestionsVisible(false);
    setSelectedRide(null);
    setErrorMsg("");
  };

  const handleRefreshRides = () => startCoords && fetchNearbyRides(startCoords);

  const toggleManualPickup = () => {
    setUseManualPickup(!useManualPickup);
    if (!useManualPickup) clearStart();
  };

  // Poll for new driver requests every 10 seconds (if driver)
  useEffect(() => {
    if (!(activeAccount && activeAccount.role === "driver")) {
      console.log('[Polling] Not a driver or no activeAccount:', activeAccount);
      return;
    }
    let activeAccountId = localStorage.getItem("activeAccountId");
    activeAccountId = activeAccountId && !isNaN(Number(activeAccountId)) ? Number(activeAccountId) : null;
    const driverId = activeAccountId && activeAccountId > 0 ? activeAccountId : (activeAccount?.id || 6);
    console.log('[Polling] Driver polling effect started. activeAccount:', activeAccount, 'driverId:', driverId);
    fetchDriverRequests(false); // Initial fetch, no toast
    const interval = setInterval(() => {
      console.log('[Polling] Polling for driver requests... activeAccount:', activeAccount, 'driverId:', driverId);
      fetchDriverRequests();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [activeAccount]);
  // Show driver modal if driver has pending requests
  useEffect(() => {
    if (activeAccount && activeAccount.role === "driver") {
      fetchDriverRequests();
    }
  }, [activeAccount]);

  // Auto-refresh nearby rides fallback
  useEffect(() => {
    if (!startCoords) return;
    const interval = setInterval(() => {
      fetchNearbyRides(startCoords);
    }, 120000);
    return () => clearInterval(interval);
  }, [startCoords]);

  // Refresh user requests on mount
  useEffect(() => {
    fetchUserRequestedRides();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rides-page-container">
      

      {/* Toast notification for new driver requests */}
      {showToast && (
        <div style={{
          position: "fixed",
          top: 30,
          right: 30,
          zIndex: 3000,
          background: "#2563eb",
          color: "#fff",
          padding: "18px 28px",
          borderRadius: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          fontWeight: 600,
          fontSize: "1.1rem",
          cursor: "pointer",
          transition: "opacity 0.2s"
        }}
          onClick={() => { 
            console.log('[Toast] Toast clicked. Opening modal and hiding toast.');
            setShowDriverModal(true); setShowToast(false); 
          }}
        >
          {toastMsg} <span style={{marginLeft:8, textDecoration:'underline'}}>View</span>
          <span style={{marginLeft:16, fontWeight:400, fontSize:'0.95em'}}>Click to view</span>
        </div>
      )}

      {/* Driver notification modal */}
      {showDriverModal && activeAccount && activeAccount.role === "driver" && (
        <div className="driver-modal-overlay" onClick={() => setShowDriverModal(false)}>
          <div className="driver-modal" onClick={e => e.stopPropagation()}>
            <h3>Incoming Ride Requests</h3>
            {driverRequests.length === 0 ? (
              <p>No pending requests.</p>
            ) : (
              <ul className="driver-requests-list">
                {driverRequests.map(req => (
                  <li key={req.requestId} className="driver-request-item">
                    <span><strong>Passenger:</strong> {req.passengerName}</span>
                    <span><strong>Status:</strong> {req.status}</span>
                    <button
                      onClick={() => handleDriverRespond(req.requestId, "Accepted")}
                      disabled={req.status !== "Pending"}
                      className="accept-btn"
                    >Accept</button>
                    <button
                      onClick={() => handleDriverRespond(req.requestId, "Rejected")}
                      disabled={req.status !== "Pending"}
                      className="reject-btn"
                    >Reject</button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowDriverModal(false)} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}

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
                  className={`location-btn ${loadingLocation ? 'loading' : ''}`}
                  title="Get current location using GPS"
                >
                  {loadingLocation ? (
                    <span className="spinner"></span>
                  ) : (
                    <>
                      <svg className="location-icon" viewBox="0 0 24 24">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6c-1.1 0-2 .9-2 2v2.07A7.998 7.998 0 0 0 4.07 10H2c-1.1 0-2 .9-2 2v0c0 1.1.9 2 2 2h2.07a7.998 7.998 0 0 0 5.93 5.93V20c0 1.1.9 2 2 2v0c1.1 0 2-.9 2-2v-2.07a7.998 7.998 0 0 0 5.93-5.93H22c1.1 0 2-.9 2-2v0c0-1.1-.9-2-2-2h-2.07a7.998 7.998 0 0 0-5.93-5.93V4c0-1.1-.9-2-2-2z"></path>
                      </svg>
                      <span className="btn-text">Get Location</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="suggestions-container">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter pickup location manually"
                  value={startLocation}
                  onChange={handleStartLocationChange}
                  aria-label="Start Location"
                  required
                />
                {isStartSuggestionsVisible && (
                  <ul className="suggestions-list">
                    {loadingStartSuggestions ? (
                      <li className="suggestions-loading">Searching for locations...</li>
                    ) : (
                      startSuggestions.map(item => (
                        <li
                          key={item.place_id}
                          onClick={() => handleStartSuggestionClick(item)}
                          className="suggestion-item"
                        >
                          {item.display_name}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            )}
            {startLocation && useManualPickup && (
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

          <div className="form-group">
            <label className="form-label">Dropoff Location</label>
            <div className="suggestions-container">
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
              {isSuggestionsVisible && (
                <ul className="suggestions-list">
                  {loadingSuggestions ? (
                    <li className="suggestions-loading">Searching for locations...</li>
                  ) : (
                    endSuggestions.map((item) => (
                      <li
                        key={item.place_id}
                        onClick={() => handleSuggestionClick(item)}
                        className="suggestion-item"
                      >
                        {item.display_name}
                      </li>
                    ))
                  )}
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
            const formattedTime = formatDepartureTime(ride.departureTime);
            const hasStarted = rideHasStarted(ride.departureTime);
            const requestStatus = requestedRides[ride.id];

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
                    <p><strong>Phone:</strong> <PhoneNumberDropdown phoneNumber={ride.driverPhone} /></p>
                    <p><strong>Car Model:</strong> {ride.carModel || "Not specified"}</p>
                    <p><strong>Car Plate:</strong> {ride.carPlate || "Not specified"}</p>
                    <p><strong>From:</strong> {ride.startAddress}</p>
                    <p><strong>To:</strong> {ride.endAddress}</p>
                    <p><strong>Price:</strong> ${ride.fare}</p>
                    <p><strong>Seats:</strong> {ride.availableSeats}</p>
                    <p><strong>Departure:</strong> {formattedTime}</p>

                    {ride.pickupComment && (
                      <div className="pickup-comment">
                        <p className="pickup-comment-title">📍 Pickup Instructions:</p>
                        <p className="pickup-comment-text">{ride.pickupComment}</p>
                      </div>
                    )}

                    {!hasStarted ? (
                      <div className="popup-buttons">
                        <button
                          onClick={() => handleRequestRide(ride)}
                          className="request-btn"
                          disabled={requestStatus === "Pending" || ride.availableSeats <= 0}
                        >
                          {requestStatus === "Pending" ? "Request Pending" : "Request Ride"}
                        </button>
                        <button
                          onClick={() => handleCancelRide(ride)}
                          className="cancel-btn"
                          disabled={!requestStatus || requestStatus !== "Pending"}
                        >
                          Cancel Request
                        </button>
                      </div>
                    ) : (
                      <button className="request-btn" disabled>
                        Ride Started
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