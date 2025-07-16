import React, { useState, useEffect } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

// Default testimonials
const initialTestimonials = [
  { text: "Poolify saved me so much money on my daily commute! Highly recommend it.", author: "John D." },
  { text: "Easy to use and reliable. The best carpooling app I’ve tried so far.", author: "Sarah K." },
  { text: "Connecting with fellow commuters has never been easier. Love Poolify!", author: "Michael P." }
];

export default function Home() {
  const { isLoggedIn, role } = useAuth();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);

  const [feedbacks, setFeedbacks] = useState(initialTestimonials);
  const [newFeedback, setNewFeedback] = useState({ text: "", author: "" });
  const [index, setIndex] = useState(0);

  const visibleCount = 3;
  const minForCarousel = 5;
  const maxIndex = Math.max(0, feedbacks.length - visibleCount);
  const showCarousel = feedbacks.length >= minForCarousel;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleRedirect = (path) => {
    if (!isLoggedIn) return navigate("/signup");
    if (path === "/postride" && role !== "driver") {
      alert("Only drivers can post rides.");
      return;
    }
    navigate(path);
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setNewFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    const text = newFeedback.text.trim();
    const author = newFeedback.author.trim() || "Anonymous";

    if (text.length < 10) {
      alert("Feedback must be at least 10 characters.");
      return;
    }

    const updated = [...feedbacks, { text, author }];
    setFeedbacks(updated);
    setNewFeedback({ text: "", author: "" });

    // Scroll to last feedback
    if (updated.length >= minForCarousel) {
      const newIndex = Math.max(0, updated.length - visibleCount);
      setIndex(newIndex);
    }
  };

  const visibleFeedbacks = showCarousel
    ? feedbacks.slice(index, index + visibleCount)
    : feedbacks;

  return (
    <>
      <div className="home-container">
        {/* Hero Section - Slideshow */}
        <section className="hero slideshow">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`slide${i === currentSlide ? " active" : ""}`}
              aria-hidden={i !== currentSlide}
            >
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <div className="hero-buttons">
                <button className="btn" onClick={() => handleRedirect("/rides")}>Find a Ride</button>
                {role === "driver" && (
                  <button className="btn success" onClick={() => handleRedirect("/postride")}>Post a Ride</button>
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

      {/* Testimonials Carousel & Feedback Form */}
      <section className="testimonials-section">
        <h2 className="section-title">Feedbacks</h2>
        <div
          className="carousel-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
        >
          {showCarousel && (
            <button
              className="carousel-arrow left"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
            >‹</button>
          )}

          <div
            className="carousel-track"
            style={{ display: 'flex', gap: '2rem', justifyContent: 'center', overflowX: 'auto' }}
          >
            {visibleFeedbacks.map((f, idx) => (
              <div
                className="testimonial card"
                key={index + idx}
                style={{ flex: "0 0 220px", maxWidth: "220px", minWidth: "180px", margin: "0 auto" }}
              >
                <p className="testimonial-text">“{f.text}”</p>
                <p className="testimonial-author">— {f.author}</p>
              </div>
            ))}
          </div>

          {showCarousel && (
            <button
              className="carousel-arrow right"
              onClick={() => setIndex(i => Math.min(maxIndex, i + 1))}
              disabled={index === maxIndex}
            >›</button>
          )}
        </div>

        <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
          <h3 className="form-heading">Leave Your Feedback</h3>
          <div className="form-group">
            <textarea
              name="text"
              placeholder="Your feedback..."
              value={newFeedback.text}
              onChange={handleFeedbackChange}
              maxLength={300}
              required
            />
            <div className="char-count">{newFeedback.text.length} / 300</div>
          </div>
          <div className="form-group">
            <input
              type="text"
              name="author"
              placeholder="Your name"
              value={newFeedback.author}
              onChange={handleFeedbackChange}
            />
          </div>
          <button
            type="submit"
            className="btn submit"
            disabled={!isLoggedIn || newFeedback.text.trim().length < 10}
          >
            Submit
          </button>
          {!isLoggedIn && (
            <p style={{ color: "#dc3545", marginTop: "0.75rem", fontSize: "0.95rem" }}>
              You must be logged in to submit feedback.
            </p>
          )}
        </form>
      </section>
    </>
  );
}
