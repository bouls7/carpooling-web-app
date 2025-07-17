export const signupUser = async (userData) => {
  const response = await fetch("https://localhost:7221/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: userData.fullName, 
      email: userData.email,
      password: userData.password,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Signup failed";
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

export const loginUser = async (userData) => {
  const response = await fetch("https://localhost:7221/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Login failed";
    const resClone = response.clone(); // clone the response to read text later if needed
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = await resClone.text();
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.token;
};

