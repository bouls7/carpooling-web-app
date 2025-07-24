import React from 'react';
import './RideDetailsModal.css';

const RideDetailsModal = ({ ride, onRequest, onClose, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Ride Details</h2>
        <div className="ride-details">
          <p><strong>Driver:</strong> {ride.driverName}</p>
          <p><strong>From:</strong> {ride.startAddress}</p>
          <p><strong>To:</strong> {ride.endAddress}</p>
          <p><strong>Departure:</strong> {new Date(ride.startTime).toLocaleString()}</p>
          <p><strong>Price:</strong> ${ride.fare}</p>
          <p><strong>Car:</strong> {ride.carModel} ({ride.carColor})</p>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={onRequest} 
            disabled={loading}
            className="confirm-btn"
          >
            {loading ? 'Processing...' : 'Confirm Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideDetailsModal; 