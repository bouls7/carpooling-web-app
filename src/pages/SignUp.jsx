import React, { useState } from "react";
import Tesseract from "tesseract.js";
import "../styles/SignUp.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signupUser, loginUser } from "../api/authService";

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "passenger",
    licenseNumber: "",
    idScan: null,
  });

  const [ocrText, setOcrText] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { accounts, activeAccount, addAccount, switchAccount } = useAuth();

  const showPopup = (message, callback = null) => {
    setPopupMessage(message);
    setTimeout(() => {
      setPopupMessage("");
      if (callback) callback();
    }, 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, idScan: file }));
    setIsOcrProcessing(true);
    setOcrText("");

    Tesseract.recognize(file, "eng", {})
      .then(({ data: { text } }) => {
        setOcrText(text);
        setIsOcrProcessing(false);

        if (!text.toLowerCase().includes(formData.licenseNumber.toLowerCase())) {
          alert("Warning: License number not detected in the uploaded ID scan.");
        }
      })
      .catch(() => {
        setIsOcrProcessing(false);
        alert("Failed to process ID scan. Try uploading a clearer image.");
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      showPopup("Password must be at least 8 characters long.");
      return;
    }

    if (isLoginMode) {
      try {
        const token = await loginUser({
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem("token", token);

        const existingAccount = accounts.find(
          (acc) => acc.email === formData.email
        );

        if (existingAccount) {
          switchAccount(existingAccount.id);
        } else {
          const newId = addAccount({
            email: formData.email,
            fullName: formData.fullName || "",
            token,
            role: "passenger",
          });
          switchAccount(newId);
        }

        showPopup("Login successful! Redirecting...", () => navigate("/"));
      } catch (err) {
        showPopup(
          err?.response?.data?.message ||
            err.message ||
            "Login failed. Please check credentials."
        );
      }
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
      showPopup("Full Name must contain only letters and spaces.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showPopup("Passwords do not match.");
      return;
    }

    if (formData.role === "driver") {
      if (!formData.licenseNumber.trim()) {
        showPopup("Please enter your license number.");
        return;
      }
      if (!formData.idScan) {
        showPopup("Please upload a scan of your ID.");
        return;
      }
      if (isOcrProcessing) {
        showPopup("Please wait for OCR to finish processing.");
        return;
      }
      if (
        ocrText &&
        !ocrText.toLowerCase().includes(formData.licenseNumber.toLowerCase())
      ) {
        const proceed = window.confirm(
          "License number not found in ID scan. Do you want to proceed anyway?"
        );
        if (!proceed) return;
      }
    }

    try {
      await signupUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      const token = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", token);

      const newId = addAccount({
        email: formData.email,
        fullName: formData.fullName,
        token,
        role: formData.role,
      });
      switchAccount(newId);

      showPopup("Signup successful! Redirecting...", () => navigate("/"));
    } catch (err) {
      showPopup(
        err?.response?.data?.message || err.message || "Signup failed."
      );
    }
  };

  return (
    <div className="signup-container">
      <h2>{isLoginMode ? "Log In to Your Account" : "Create an Account"}</h2>

      <form
        onSubmit={handleSubmit}
        className="signup-form"
        encType="multipart/form-data"
      >
        {!isLoginMode && (
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span
            className="eye-icon"
            onClick={() => setShowPassword((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {!isLoginMode && (
          <>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                role="button"
                tabIndex={0}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="role-selection">
              <div
                className={`role-option ${formData.role === "passenger" ? "selected" : ""}`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: "passenger" }))
                }
              >
                <div className="icon">🧍</div>
                <div className="label">Passenger</div>
              </div>
              <div
                className={`role-option ${formData.role === "driver" ? "selected" : ""}`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: "driver" }))
                }
              >
                <div className="icon">🚗</div>
                <div className="label">Driver</div>
              </div>
            </div>

            {formData.role === "driver" && (
              <>
                <input
                  type="text"
                  name="licenseNumber"
                  placeholder="Driver License Number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />

                <label className="file-label">
                  Upload ID Scan
                  <input
                    type="file"
                    name="idScan"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </>
            )}
          </>
        )}

        <button type="submit" className="btn">
          {isLoginMode ? "Log In" : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: "12px" }}>
        {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          onClick={() => setIsLoginMode((prev) => !prev)}
          className="toggle-link"
        >
          {isLoginMode ? "Sign Up" : "Log In"}
        </span>
      </p>

      {popupMessage && <div className="popup">{popupMessage}</div>}
    </div>
  );
}
