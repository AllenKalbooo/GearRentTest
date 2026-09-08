import { createContext, useCallback, useContext, useState } from 'react';

const AuthContext = createContext(null);

const AUTH_KEY = 'gearRentAuthenticated';
const USER_KEY = 'gearRentUser';
const ACCOUNTS_KEY = 'gearRentAccounts';
const PENDING_SIGNUP_KEY = 'gearRentPendingSignup';

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function readAccounts() {
  try {
    const storedAccounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || 'null');
    if (Array.isArray(storedAccounts)) return storedAccounts;

    const legacyUser = JSON.parse(window.localStorage.getItem(USER_KEY) || 'null');
    if (!legacyUser || typeof legacyUser !== 'object') return [];
    const migratedAccounts = [legacyUser];
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(migratedAccounts));
    return migratedAccounts;
  } catch {
    return [];
  }
}

function readUser() {
  try {
    const storedUser = JSON.parse(window.localStorage.getItem(USER_KEY) || 'null');
    if (!storedUser || typeof storedUser !== 'object') return null;
    if (storedUser.createdAt) return storedUser;

    const migratedUser = { ...storedUser, createdAt: Date.now() };
    window.localStorage.setItem(USER_KEY, JSON.stringify(migratedUser));
    return migratedUser;
  } catch {
    return null;
  }
}

function readAuthenticated() {
  try {
    return window.localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

function readPendingSignup() {
  try {
    return JSON.parse(window.sessionStorage.getItem(PENDING_SIGNUP_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthenticated);
  const [user, setUser] = useState(readUser);
  const [pendingSignup, setPendingSignupState] = useState(readPendingSignup);

  const persistAccount = useCallback((userData) => {
    const accountUser = {
      ...userData,
      email: normalizeEmail(userData.email),
      createdAt: userData.createdAt || Date.now(),
      balance: Number(userData.balance) || 0,
    };

    const accounts = readAccounts();
    const accountIndex = accounts.findIndex(
      (account) => normalizeEmail(account.email) === accountUser.email
    );
    if (accountIndex >= 0) {
      accounts[accountIndex] = accountUser;
    } else {
      accounts.push(accountUser);
    }
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    window.localStorage.setItem(USER_KEY, JSON.stringify(accountUser));
    window.localStorage.setItem(AUTH_KEY, 'true');
    setUser(accountUser);
    setIsAuthenticated(true);
    return accountUser;
  }, []);

  const accountExists = useCallback((email) => {
    const normalizedEmail = normalizeEmail(email);
    return readAccounts().some((account) => normalizeEmail(account.email) === normalizedEmail);
  }, []);

  const createAccount = useCallback((userData) => {
    if (accountExists(userData.email)) return false;
    persistAccount(userData);
    return true;
  }, [accountExists, persistAccount]);

  const authenticate = useCallback((email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const account = readAccounts().find(
      (storedAccount) => normalizeEmail(storedAccount.email) === normalizedEmail
    );
    if (!account || account.password !== password) return null;

    persistAccount(account);
    return account;
  }, [persistAccount]);

  const creditAccount = useCallback((email, amount) => {
    const normalizedEmail = normalizeEmail(email);
    const creditAmount = Number(amount);
    if (!normalizedEmail || !Number.isFinite(creditAmount) || creditAmount <= 0) return false;

    const accounts = readAccounts();
    const accountIndex = accounts.findIndex(
      (account) => normalizeEmail(account.email) === normalizedEmail
    );
    if (accountIndex < 0) return false;

    const creditedAccount = {
      ...accounts[accountIndex],
      balance: Math.round(((Number(accounts[accountIndex].balance) || 0) + creditAmount) * 100) / 100,
    };
    accounts[accountIndex] = creditedAccount;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (normalizeEmail(user?.email) === normalizedEmail) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(creditedAccount));
      setUser(creditedAccount);
    }
    return true;
  }, [user]);

  const signOut = useCallback(() => {
    // Only clear the session flag — keep the saved account so signing back
    // in restores the same name, email, and membership tier.
    window.localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  // Merges and persists partial updates to the signed-in user's profile.
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      const accounts = readAccounts();
      const accountIndex = accounts.findIndex(
        (account) => normalizeEmail(account.email) === normalizeEmail(next.email)
      );
      if (accountIndex >= 0) {
        accounts[accountIndex] = next;
        window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      }
      window.localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Stashes signup details while the user picks a membership tier, mirroring
  // the old sessionStorage handoff between SignUp and Memberships.
  const setPendingSignup = useCallback((data) => {
    window.localStorage.removeItem(AUTH_KEY);
    window.sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(data));
    setIsAuthenticated(false);
    setPendingSignupState(data);
  }, []);

  const clearPendingSignup = useCallback(() => {
    window.sessionStorage.removeItem(PENDING_SIGNUP_KEY);
    setPendingSignupState(null);
  }, []);

  const value = {
    isAuthenticated,
    user,
    pendingSignup,
    accountExists,
    createAccount,
    authenticate,
    creditAccount,
    signOut,
    updateUser,
    setPendingSignup,
    clearPendingSignup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
