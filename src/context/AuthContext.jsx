import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Helper function to ensure consistent account structure
  const normalizeAccount = (account) => {
    const baseAccount = {
      id: account.id || 1,
      email: account.email || '',
      password: account.password || '', // Warning: Insecure - for demo only
      fullName: account.fullName || 'N/A',
      role: account.role || 'user',
      rideHistory: account.rideHistory || [],
      ...account // Preserve any additional fields
    };

    // Add driver-specific fields if role is driver
    if (baseAccount.role === 'driver') {
      return {
        ...baseAccount,
        phoneNumber: account.phoneNumber || 'N/A',
        licenseNumber: account.licenseNumber || 'N/A',
        carPlate: account.carPlate || 'N/A',
        carModel: account.carModel || 'N/A',
        idScan: account.idScan || null
      };
    }

    return baseAccount;
  };

  // Initialize state with normalized accounts
  const [accounts, setAccounts] = useState(() => {
    try {
      const storedAccounts = localStorage.getItem("accounts");
      const parsedAccounts = storedAccounts ? JSON.parse(storedAccounts) : [];
      return parsedAccounts.map(normalizeAccount);
    } catch (error) {
      console.error("Failed to parse accounts:", error);
      return [];
    }
  });

  const [activeAccountId, setActiveAccountId] = useState(() => {
    try {
      const storedActiveId = localStorage.getItem("activeAccountId");
      return storedActiveId ? JSON.parse(storedActiveId) : null;
    } catch (error) {
      console.error("Failed to parse activeAccountId:", error);
      return null;
    }
  });

  // Persist accounts to localStorage
  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  // Persist activeAccountId to localStorage
  useEffect(() => {
    localStorage.setItem("activeAccountId", activeAccountId);
  }, [activeAccountId]);

  // Get active account with fallback to normalized empty account
  const activeAccount = accounts.find((acc) => acc.id === activeAccountId) || null;

  const isLoggedIn = activeAccount !== null;
  const activeName = activeAccount?.fullName || "Anonymous";

  // Account actions
  const addRideHistory = (ride) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === activeAccountId
          ? {
              ...acc,
              rideHistory: [...(acc.rideHistory || []), ride],
            }
          : acc
      )
    );
  };

  const addAccount = (account) => {
  const newAccount = normalizeAccount({
    ...account,
    id: account.userId, // Use backend userId
    rideHistory: [],
  });
  setAccounts((prev) => [...prev, newAccount]);
  setActiveAccountId(newAccount.id);
  return newAccount.id;
};

  const switchAccount = (accountId) => {
    if (accounts.some((acc) => acc.id === accountId)) {
      setActiveAccountId(accountId);
    }
  };

  const removeAccount = (accountId) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    if (activeAccountId === accountId) {
      setActiveAccountId(accounts.length > 1 ? accounts[0].id : null);
    }
  };

  const logoutActive = () => {
    if (activeAccountId !== null) {
      removeAccount(activeAccountId);
    }
  };

  const login = (email, password) => {
    const matchedAccount = accounts.find(
      (acc) => acc.email === email && acc.password === password
    );
    if (matchedAccount) {
      setActiveAccountId(matchedAccount.id);
      return true;
    }
    return false;
  };

  const updateAccount = (accountId, updates) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? normalizeAccount({ ...acc, ...updates }) : acc
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{
        accounts,
        activeAccount,
        activeAccountId,
        isLoggedIn,
        activeName,
        addAccount,
        switchAccount,
        removeAccount,
        logoutActive,
        addRideHistory,
        login,
        updateAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);