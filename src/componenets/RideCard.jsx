import React from 'react';
import './RideCard.css';

const RideCard = ({ ride, onRequest, disabled }) => {
  return (
    <div className="ride-card">
      <div className="ride-info">
        <h3>{ride.driverName}</h3>
        <p><strong>From:</strong> {ride.startAddress}</p>
        <p><strong>To:</strong> {ride.endAddress}</p>
        <p><strong>Departure:</strong> {new Date(ride.startTime).toLocaleString()}</p>
        <p><strong>Price:</strong> ${ride.fare}</p>
        <p><strong>Seats:</strong> {ride.availableSeats}</p>
      </div>
      <button 
        onClick={onRequest} 
        disabled={disabled}
        className="request-btn"
      >
        {disabled ? 'Requesting...' : 'Request Ride'}
      </button>
    </div>
  );
};

export default RideCard;