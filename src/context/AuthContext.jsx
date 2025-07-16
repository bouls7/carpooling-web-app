// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]); // Array of user accounts
  const [activeAccountId, setActiveAccountId] = useState(null); // Active user ID

  // Load accounts from localStorage
  useEffect(() => {
    const storedAccounts = JSON.parse(localStorage.getItem("accounts")) || [];
    const storedActiveId = JSON.parse(localStorage.getItem("activeAccountId"));
    setAccounts(storedAccounts);
    setActiveAccountId(storedActiveId);
  }, []);

  // Save accounts to localStorage on change
  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
    localStorage.setItem("activeAccountId", JSON.stringify(activeAccountId));
  }, [accounts, activeAccountId]);

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

  const addAccount = (account) => {
    const newAccount = { ...account, id: Date.now(), rideHistory: [] };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    setActiveAccountId(newAccount.id);
  };

  const switchAccount = (accountId) => {
    const exists = accounts.find(acc => acc.id === accountId);
    if (exists) setActiveAccountId(accountId);
  };

  const removeAccount = (accountId) => {
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    setAccounts(updatedAccounts);

    // If the removed account was the active one, try to switch to another
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
