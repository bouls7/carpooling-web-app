import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/AccountSelection.css";

export default function AccountSelection() {
  const { accounts } = useAuth();
  const navigate = useNavigate();

  if (accounts.length === 0) {
    return (
      <main className="account-selection-container">
        <div className="card">
          <p className="no-accounts">No accounts available. Please add an account first.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="account-selection-container">
      <div className="card">
        <h1 className="title">Select an Account</h1>
        <ul className="accounts-list">
          {accounts.map((acc) => (
            <li key={acc.id}>
              <button
                className="account-select-btn"
                onClick={() => navigate(`/account-info/${acc.id}`)}
              >
                <span className="username">{acc.username}</span>
                <span className="email">{acc.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
