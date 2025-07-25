// src/api/authService.js

export const signupUser = async (userData) => {
  const response = await fetch('https://localhost:7221/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Signup failed');
  }

  return await response.json();
};

export const loginUser = async (credentials) => {
  const response = await fetch('https://localhost:7221/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();

  localStorage.setItem("token", data.token);
  localStorage.setItem("userRole", data.user.role);
  localStorage.setItem("userId", data.user.id);

  return {
    token: data.token,
    role: data.user.role,
    userId: data.user.id,
    driverInfo: data.user.driverInfo || null
  };
};
