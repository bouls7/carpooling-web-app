// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import facebookIcon from "../assets/facebook.png";
import twitterIcon from "../assets/twitter.png";
import instagramIcon from "../assets/instagram.png";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p>© 2025 Poolify. All rights reserved.</p>
        </div>
        <div className="footer-center">
          <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
        </div>
        <div className="footer-right">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
            <img src={facebookIcon} alt="Facebook" width="30" height="30" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-icon">
            <img src={twitterIcon} alt="Twitter" width="30" height="30" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon">
            <img src={instagramIcon} alt="Instagram" width="30" height="30" />
          </a>
        </div>
      </div>
    </footer>
  );
}
