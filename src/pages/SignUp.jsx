import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signupUser, loginUser } from "../api/authService";
import "../styles/SignUp.css";

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "passenger",
    licenseNumber: "",
    carPlate: "",
    carModel: "",
    phoneNumber: ""
  });

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { accounts, addAccount, switchAccount } = useAuth();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoginMode) {
      // Signup validation
      if (formData.password.length < 8) {
        showPopup("Password must be at least 8 characters long.");
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
        if (!formData.carPlate.trim()) {
          showPopup("Please enter your car plate number.");
          return;
        }
        if (!formData.carModel.trim()) {
          showPopup("Please enter your car model.");
          return;
        }
        if (!formData.phoneNumber.trim()) {
          showPopup("Please enter your phone number.");
          return;
        }
      }
    }

    try {
      if (isLoginMode) {
        // Login flow with updated user info extraction
        const {
          token,
          role,
          userId,
          fullName,
          licenseNumber,
          carPlate,
          carModel,
          phoneNumber,
        } = await loginUser({
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem("token", token);
        localStorage.setItem("userRole", role);
        console.log("User ID:", userId);
        localStorage.setItem("userId", userId);

        const existingAccount = accounts.find(
          (acc) => acc.email === formData.email
        );

        if (existingAccount) {
          switchAccount(existingAccount.id);
        } else {
          const newId = addAccount({
            email: formData.email,
            fullName: fullName || formData.fullName || "",
            token,
            role,
            userId,
            licenseNumber,
            carPlate,
            carModel,
            phoneNumber,
          });
          switchAccount(newId);
        }

        showPopup("Login successful! Redirecting...", () => navigate("/"));
        return;
      }

      // Signup flow
      const signupData = {
        Name: formData.fullName,
        Email: formData.email,
        Password: formData.password,
        Role: formData.role,
      };

      if (formData.role === "driver") {
        signupData.LicenseNumber = formData.licenseNumber;
        signupData.CarPlate = formData.carPlate;
        signupData.CarModel = formData.carModel;
        signupData.PhoneNumber = formData.phoneNumber;
      }

      await signupUser(signupData);

      // Automatically login after signup
      const { token, role, userId } = await loginUser({
        email: formData.email,
        password: formData.password,

      });

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      const parsedUserId = Number(userId);
if (!parsedUserId || isNaN(parsedUserId) || parsedUserId < 1) {
  throw new Error("Invalid user ID received from server.");
}
console.log("User ID:", parsedUserId);
localStorage.setItem("userId", parsedUserId);
      

      const newId = addAccount({
        email: formData.email,
        fullName: formData.fullName,
        token,
        role,
        userId,
        licenseNumber: formData.licenseNumber,
        carPlate: formData.carPlate,
        carModel: formData.carModel,
        phoneNumber: formData.phoneNumber
      });

      switchAccount(newId);
      showPopup("Signup successful! Redirecting...", () => navigate("/"));
    } catch (err) {
      showPopup(err?.message || "Signup failed.");
    }
  };

  return (
    <div className="signup-container">
      <h2>{isLoginMode ? "Log In to Your Account" : "Create an Account"}</h2>

      <form onSubmit={handleSubmit} className="signup-form">
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
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="role-selection">
              <div
                className={`role-option ${
                  formData.role === "passenger" ? "selected" : ""
                }`}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: "passenger" }))
                }
              >
                <div className="icon">🧍</div>
                <div className="label">Passenger</div>
              </div>
              <div
                className={`role-option ${
                  formData.role === "driver" ? "selected" : ""
                }`}
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
                <input
                  type="text"
                  name="carPlate"
                  placeholder="Car Plate Number"
                  value={formData.carPlate}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="carModel"
                  placeholder="Car Model"
                  value={formData.carModel}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </>
            )}
          </>
        )}

        <button type="submit" className="btn">
          {isLoginMode ? "Log In" : "Sign Up"}
        </button>
      </form>

      <p>
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
