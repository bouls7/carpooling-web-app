import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAuthToken, setActiveAccountId, accounts, setAccounts } = useAuth();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);

        // OPTIONAL: You can fetch user info here or decode token to get user id/email.
        // For demo, let's set the activeAccountId by matching email in stored accounts.
        let user = accounts.find(acc => acc.email === email);

        // If user not in local accounts, add it with id from token or generated
        if (!user) {
          const newAccount = { id: Date.now(), email, rideHistory: [] };
          setAccounts((prev) => [...prev, newAccount]);
          setActiveAccountId(newAccount.id);
        } else {
          setActiveAccountId(user.id);
        }

        setError("");
        navigate("/"); // Redirect to home or rides page after login
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default Login;
