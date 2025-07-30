import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUserCircle, FaUserPlus } from "react-icons/fa";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const { activeAccount, accounts, logoutActive } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        !event.target.closest(".account-switcher") &&
        !event.target.closest(".account-dropdown-menu")
      ) {
        setAccountsOpen(false);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleAddAccount = () => {
    setAccountsOpen(false);
    navigate("/signup");
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <img src={logo} alt="CarPool Logo" className="logo-img" />
        <span className="logo-text">Poolify</span>
      </div>

      <div
        className={`hamburger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        <div />
        <div />
        <div />
      </div>

      <ul className={`nav-links ${isOpen ? "open" : ""}`}>
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Home
          </NavLink>
        </li>

        {activeAccount && (
          <>
            <li>
              <NavLink
                to="/rides"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Rides
              </NavLink>
            </li>

            {activeAccount.role === "driver" && (
              <li>
                <NavLink
                  to="/postride"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Post Ride
                </NavLink>
              </li>
            )}

            {activeAccount.role === "admin" && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Admin Dashboard
                </NavLink>
              </li>
            )}
          </>
        )}

        {activeAccount ? (
          <li className="account-switcher account-dropdown">
            <button
              className="account-icon-button"
              onClick={() => setAccountsOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={accountsOpen}
            >
              <FaUserCircle size={24} />
            </button>

            {accountsOpen && (
              <ul className="account-dropdown-menu" role="menu">
                <li>
                  <button
                    className="account-dropdown-item"
                    onClick={() => {
                      navigate("/accounts");
                      setAccountsOpen(false);
                    }}
                    role="menuitem"
                  >
                    View Account Info
                  </button>
                </li>

                <li>
                  <button
                    className="account-dropdown-item"
                    onClick={handleAddAccount}
                    role="menuitem"
                  >
                    <FaUserPlus />
                    Add New Account
                  </button>
                </li>

                <li>
                  <button
                    className="account-dropdown-item logout-btn"
                    onClick={() => {
                      logoutActive();
                      setAccountsOpen(false);
                      navigate("/");
                    }}
                    role="menuitem"
                  >
                    Logout Current Account
                  </button>
                </li>
              </ul>
            )}
          </li>
        ) : (
          <li>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Sign Up
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
