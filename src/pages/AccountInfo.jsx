import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/AccountInfo.css";

export default function AccountInfo() {
  const { id } = useParams();
  const { accounts, logoutActive } = useAuth();
  const navigate = useNavigate();

  const account = accounts.find((acc) => String(acc.id) === String(id));

  if (!account) {
    return (
      <main className="account-info-container">
        <p>Account not found.</p>
      </main>
    );
  }

  const handleLogout = () => {
    logoutActive();
    setTimeout(() => {
      if (accounts.length > 1) {
        navigate("/accounts");
      } else {
        navigate("/signup");
      }
    }, 100);
  };

  return (
    <main className="account-info-container">
      <h1>Account Information</h1>
      <div className="account-detail">
        <strong>Full Name:</strong> {account.fullName || "N/A"}
      </div>
      <div className="account-detail">
        <strong>Email:</strong> {account.email}
      </div>
      <div className="account-detail">
        <strong>Role:</strong> {account.role}
      </div>

      {account.role === "driver" && (
        <>
          <div className="account-detail">
            <strong>Phone Number:</strong> {account.phoneNumber || "N/A"}
          </div>
          <div className="account-detail">
            <strong>License Number:</strong> {account.licenseNumber || "N/A"}
          </div>
          <div className="account-detail">
            <strong>Car Plate:</strong> {account.carPlate || "N/A"}
          </div>
          <div className="account-detail">
            <strong>Car Model:</strong> {account.carModel || "N/A"}
          </div>
          {account.idScan && (
            <div className="account-detail">
              <strong>ID Scan:</strong>{" "}
              {typeof account.idScan === "string" ? (
                <a href={account.idScan} target="_blank" rel="noreferrer">
                  View uploaded document
                </a>
              ) : (
                <span>File uploaded (preview unavailable)</span>
              )}
            </div>
          )}
        </>
      )}

      <button
        onClick={handleLogout}
        className="logout-button"
        aria-label="Logout this account"
      >
        Logout This Account
      </button>
    </main>
  );
}