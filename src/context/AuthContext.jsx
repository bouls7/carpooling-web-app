// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => {
    const storedAccounts = localStorage.getItem("accounts");
    return storedAccounts ? JSON.parse(storedAccounts) : [];
  });

  const [activeAccountId, setActiveAccountId] = useState(() => {
    const storedActiveId = localStorage.getItem("activeAccountId");
    return storedActiveId ? JSON.parse(storedActiveId) : null;
  });

  // Save accounts and activeAccountId to localStorage on change
  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("activeAccountId", JSON.stringify(activeAccountId));
  }, [activeAccountId]);

  // Find activeAccount object from accounts by activeAccountId
  const activeAccount = accounts.find(acc => acc.id === activeAccountId) || null;
  const isLoggedIn = activeAccountId !== null;

  const addRideHistory = (ride) => {
    setAccounts(prev =>
      prev.map(acc =>
        acc.id === activeAccountId
          ? {
              ...acc,
              rideHistory: [...(acc.rideHistory || []), ride],
            }
          : acc
      )
    );
  };

  // Modified: returns the new account's ID after adding
  const addAccount = (account) => {
    const newAccount = { ...account, id: Date.now(), rideHistory: [] };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    setActiveAccountId(newAccount.id);
    return newAccount.id; // <-- return ID to caller
  };

  const switchAccount = (accountId) => {
    const exists = accounts.find(acc => acc.id === accountId);
    if (exists) setActiveAccountId(accountId);
  };

  const removeAccount = (accountId) => {
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    setAccounts(updatedAccounts);

    if (activeAccountId === accountId) {
      const fallbackAccount = updatedAccounts[0]?.id || null;
      setActiveAccountId(fallbackAccount);
    }
  };

  const logoutActive = () => {
    if (activeAccountId !== null) {
      removeAccount(activeAccountId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accounts,
        activeAccount,
        activeAccountId,
        isLoggedIn,
        addAccount,
        switchAccount,
        removeAccount,
        logoutActive,
        addRideHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
