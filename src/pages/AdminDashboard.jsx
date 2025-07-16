import React from "react";

export default function AdminDashboard({ driverRequests, setDriverRequests }) {
  const approveRequest = (id) => {
    setDriverRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "approved" } : req
      )
    );
  };

  const rejectRequest = (id) => {
    setDriverRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "rejected" } : req
      )
    );
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto" }}>
      <h2>Driver Verification Dashboard</h2>
      {driverRequests.length === 0 ? (
        <p>No pending driver requests.</p>
      ) : (
        driverRequests.map(({ id, driverName, idFileURL, licenseFileURL, status }) => (
          <div
            key={id}
            style={{
              border: "1px solid #ccc",
              marginBottom: 20,
              padding: 15,
              borderRadius: 8,
            }}
          >
            <h3>{driverName}</h3>
            <p>Status: <strong>{status}</strong></p>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <h4>ID Scan</h4>
                <img
                  src={idFileURL}
                  alt="ID Scan"
                  style={{ width: 150, height: "auto", borderRadius: 4 }}
                />
              </div>
              <div>
                <h4>Driver License Scan</h4>
                <img
                  src={licenseFileURL}
                  alt="Driver License Scan"
                  style={{ width: 150, height: "auto", borderRadius: 4 }}
                />
              </div>
            </div>
            {status === "pending" && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => approveRequest(id)} style={{ marginRight: 10 }}>
                  Approve
                </button>
                <button onClick={() => rejectRequest(id)}>Reject</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
