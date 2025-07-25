import React, { useState, useEffect } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const backendUrl = "https://localhost:7221"; // Replace with your actual backend URL

const slides = [
  {
    title: "Smart Travel, Simplified",
    subtitle: "Join Poolify and make every trip count with shared rides and savings.",
  },
  {
    title: "Save Money, Save Time",
    subtitle: "Connect with nearby drivers and passengers effortlessly.",
  },
  {
    title: "Eco-Friendly Commuting",
    subtitle: "Reduce your carbon footprint by sharing rides every day.",
  },
  {
    title: "Community on the Go",
    subtitle: "Meet new people while traveling smarter and greener.",
  },
];

const initialTestimonials = [
  {
    text: "Poolify saved me so much money on my daily commute! Highly recommend it.",
    author: "John D.",
    rate: 5,
    id: "default1",
  },
  {
    text: "Easy to use and reliable. The best carpooling app I’ve tried so far.",
    author: "Sarah K.",
    rate: 4,
    id: "default2",
  },
  {
    text: "Connecting with fellow commuters has never been easier. Love Poolify!",
    author: "Michael P.",
    rate: 5,
    id: "default3",
  },
];

// StarRating component for both readOnly and interactive ratings
function StarRating({ rating, setRating, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div
      className="star-rating"
      style={{ cursor: readOnly ? "default" : "pointer" }}
      aria-label={readOnly ? `Rating: ${rating} out of 5 stars` : "Rate this service"}
      role={readOnly ? "img" : undefined}
    >
      {stars.map((star) => (
        <span
          key={star}
          style={{
            color: star <= rating ? "#ffc107" : "#e4e5e9",
            fontSize: "1.5rem",
            userSelect: "none",
            transition: "color 0.2s",
          }}
          onClick={() => !readOnly && setRating(star)}
          role={readOnly ? undefined : "button"}
          tabIndex={readOnly ? undefined : 0}
          onKeyDown={(e) => {
            if (!readOnly && (e.key === "Enter" || e.key === " ")) {
              setRating(star);
            }
          }}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const { isLoggedIn, role, activeAccount } = useAuth();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [backendFeedbacks, setBackendFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({ text: "", author: "", rate: 5 });
  const [index, setIndex] = useState(0);

  const visibleCount = 3;
  const minForCarousel = 5;

  const feedbacks = [...initialTestimonials, ...backendFeedbacks];
  const maxIndex = Math.max(0, feedbacks.length - visibleCount);
  const showCarousel = feedbacks.length >= minForCarousel;

  // Slide carousel auto-rotation
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  // Fetch feedbacks from backend API
  useEffect(() => {
    fetch(`${backendUrl}/api/feedbacks`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((f) => ({
          text: f.comment,
          author: f.author?.trim() || f.user?.name || "Anonymous",
          rate: f.rate,
          id: f.feedbackId,
        }));
        setBackendFeedbacks(mapped);
      })
      .catch(console.error);
  }, []);

  // Navigation handler based on user login & role
  const handleRedirect = (path) => {
    if (!isLoggedIn) return navigate("/signup");
    if (path === "/postride" && role !== "driver") {
      alert("Only drivers can post rides.");
      return;
    }
    navigate(path);
  };

  // Form input change handler
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setNewFeedback((prev) => ({
      ...prev,
      [name]: name === "rate" ? parseInt(value) : value,
    }));
  };

  // Star rating click handler
  const handleRatingChange = (rate) => {
    setNewFeedback((prev) => ({ ...prev, rate }));
  };

  // Submit new feedback to backend
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();

    const comment = newFeedback.text.trim();
    if (comment.length < 10) {
      alert("Feedback must be at least 10 characters.");
      return;
    }

    const author =
      newFeedback.author?.trim() || (isLoggedIn ? activeAccount?.name : null) || "Anonymous";

    const payload = {
      comment,
      rate: newFeedback.rate,
      author,
    };

    fetch(`${backendUrl}/api/feedbacks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to submit feedback");
        }
        return res.json();
      })
      .then((savedFeedback) => {
        const mapped = {
          text: savedFeedback.comment,
          author: savedFeedback.author || author || "Anonymous",
          rate: savedFeedback.rate,
          id: savedFeedback.feedbackId,
        };
        setBackendFeedbacks((prev) => [...prev, mapped]);
        setNewFeedback({ text: "", author: "", rate: 5 });
      })
      .catch((err) => alert(err.message));
  };

  // Slice feedbacks for carousel view
  const visibleFeedbacks = showCarousel
    ? feedbacks.slice(index, index + visibleCount)
    : feedbacks;

  return (
    <>
      <div className="home-container">
        {/* Hero slideshow */}
        <section className="hero slideshow" aria-label="Homepage slides">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`slide${i === currentSlide ? " active" : ""}`}
              aria-hidden={i !== currentSlide}
            >
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <div className="hero-buttons">
                <button className="btn" onClick={() => handleRedirect("/rides")}>
                  Find a Ride
                </button>
                {role === "driver" && (
                  <button className="btn success" onClick={() => handleRedirect("/postride")}>
                    Post a Ride
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Why Choose Poolify?</h2>
          <div className="features">
            <div className="feature">
              <h3 className="feature-title">Affordable</h3>
              <p className="feature-text">Share costs and save money on every trip.</p>
            </div>
            <div className="feature">
              <h3 className="feature-title">Convenient</h3>
              <p className="feature-text">Easily find or offer rides anytime, anywhere.</p>
            </div>
            <div className="feature">
              <h3 className="feature-title">Eco-Friendly</h3>
              <p className="feature-text">Reduce traffic and carbon footprint together.</p>
            </div>
          </div>
        </section>
      </div>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Sign Up</h3>
            <p className="step-text">Create a free account in seconds to get started.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">Find or Post a Ride</h3>
            <p className="step-text">Browse available rides or offer your own.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Connect & Travel</h3>
            <p className="step-text">Chat with your ride partner and enjoy a safe trip.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" aria-label="User feedback and testimonials">
        <h2 className="section-title">Feedbacks</h2>

        <div
          className="carousel-container"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}
        >
          {showCarousel && (
            <button
              className="carousel-arrow left"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Previous testimonials"
            >
              ‹
            </button>
          )}

          <div
            className="carousel-track"
            style={{ display: "flex", gap: "2rem", justifyContent: "center", overflowX: "auto" }}
          >
            {visibleFeedbacks.map((f, idx) => (
              <div
                className="testimonial card"
                key={f.id || idx}
                style={{ flex: "0 0 220px", maxWidth: "220px", minWidth: "180px", margin: "0 auto" }}
              >
                <p className="testimonial-text">“{f.text}”</p>
                <p className="testimonial-author">— {f.author}</p>
                <StarRating rating={f.rate} readOnly={true} />
              </div>
            ))}
          </div>

          {showCarousel && (
            <button
              className="carousel-arrow right"
              onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
              disabled={index === maxIndex}
              aria-label="Next testimonials"
            >
              ›
            </button>
          )}
        </div>

        {/* Feedback submission form */}
        {isLoggedIn ? (
          <form className="feedback-form" onSubmit={handleFeedbackSubmit} noValidate>
            <h3 className="form-heading">Leave Your Feedback</h3>

            <div className="form-group">
              <textarea
                name="text"
                placeholder="Your feedback..."
                value={newFeedback.text}
                onChange={handleFeedbackChange}
                maxLength={300}
                required
                aria-required="true"
                aria-describedby="feedback-desc"
              />
              <div id="feedback-desc" className="char-count" aria-live="polite">
                {newFeedback.text.length} / 300
              </div>
            </div>

            <div className="form-group">
              <input
                type="text"
                name="author"
                placeholder="Your name (optional)"
                value={newFeedback.author}
                onChange={handleFeedbackChange}
                aria-label="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rate">Rate:</label>
              <StarRating rating={newFeedback.rate} setRating={handleRatingChange} />
            </div>

            <button
              type="submit"
              className="btn submit"
              disabled={newFeedback.text.trim().length < 10}
              aria-disabled={newFeedback.text.trim().length < 10}
            >
              Submit
            </button>
          </form>
        ) : (
          <div className="feedback-logged-out-prompt">
            <p>
              Please{" "}
              <button className="link-button" onClick={() => navigate("/signup")}>
                sign up or log in
              </button>{" "}
              to leave your feedback.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
