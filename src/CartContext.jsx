import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { calculateSecurityDeposit } from './mockData';
import { getRentalHistoryId } from './rentalUtils';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const DEFAULT_DAYS = 3;
const CART_KEY = 'gearRentCart';
const RENTED_ITEMS_KEY = 'gearRentRentedItems';
const RENTAL_HISTORY_KEY = 'gearRentRentalHistory';
const DELETED_RENTAL_HISTORY_KEY = 'gearRentDeletedRentalHistory';

function readStoredArray(key) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function getAccountStorageKey(key, email) {
  return `${key}:${email || 'guest'}`;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const accountEmail = user?.email?.trim().toLowerCase() || 'guest';
  const storageKeys = useMemo(() => ({
    cart: getAccountStorageKey(CART_KEY, accountEmail),
    rentedItems: getAccountStorageKey(RENTED_ITEMS_KEY, accountEmail),
    rentalHistory: getAccountStorageKey(RENTAL_HISTORY_KEY, accountEmail),
    deletedRentalHistory: getAccountStorageKey(DELETED_RENTAL_HISTORY_KEY, accountEmail),
  }), [accountEmail]);
  const [items, setItems] = useState(() => readStoredArray(storageKeys.cart));
  const [rentedItems, setRentedItems] = useState(() => readStoredArray(storageKeys.rentedItems));
  const [rentalHistory, setRentalHistory] = useState(() => readStoredArray(storageKeys.rentalHistory));
  const [deletedRentalHistoryIds, setDeletedRentalHistoryIds] = useState(() => readStoredArray(storageKeys.deletedRentalHistory));
  const [loadedAccountEmail, setLoadedAccountEmail] = useState(accountEmail);

  useEffect(() => {
    setItems(readStoredArray(storageKeys.cart));
    setRentedItems(readStoredArray(storageKeys.rentedItems));
    setRentalHistory(readStoredArray(storageKeys.rentalHistory));
    setDeletedRentalHistoryIds(readStoredArray(storageKeys.deletedRentalHistory));
    setLoadedAccountEmail(accountEmail);
  }, [accountEmail, storageKeys]);

  useEffect(() => {
    if (loadedAccountEmail !== accountEmail) return;
    window.localStorage.setItem(storageKeys.cart, JSON.stringify(items));
  }, [items, accountEmail, loadedAccountEmail, storageKeys.cart]);

  useEffect(() => {
    if (loadedAccountEmail !== accountEmail) return;
    window.localStorage.setItem(storageKeys.rentedItems, JSON.stringify(rentedItems));
  }, [rentedItems, accountEmail, loadedAccountEmail, storageKeys.rentedItems]);

  useEffect(() => {
    if (loadedAccountEmail !== accountEmail) return;
    window.localStorage.setItem(storageKeys.rentalHistory, JSON.stringify(rentalHistory));
  }, [rentalHistory, accountEmail, loadedAccountEmail, storageKeys.rentalHistory]);

  useEffect(() => {
    if (loadedAccountEmail !== accountEmail) return;
    window.localStorage.setItem(storageKeys.deletedRentalHistory, JSON.stringify(deletedRentalHistoryIds));
  }, [deletedRentalHistoryIds, accountEmail, loadedAccountEmail, storageKeys.deletedRentalHistory]);

  const addItem = useCallback((product, days = DEFAULT_DAYS) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, days: i.days + days } : i
        );
      }
      return [...prev, { product, days }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateItemDays = useCallback((productId, days) => {
    setItems((prev) => prev.map((item) => (
      item.product.id === productId ? { ...item, days } : item
    )));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const completeRental = useCallback((rentalItems) => {
    const rentedAt = Date.now();
    const renterEmail = user?.email?.trim().toLowerCase() || '';
    setRentedItems((prev) => [...prev, ...rentalItems.map((item) => ({
      ...item,
      renterEmail,
      rentedAt,
      paidAt: rentedAt,
      returnAt: rentedAt + item.days * 86400000,
      rentalAmount: item.product.price * item.days,
      securityDeposit: calculateSecurityDeposit(item.product.price),
      depositStatus: 'held',
      depositHeldAt: rentedAt,
      refundableAmount: item.product.price * item.days + calculateSecurityDeposit(item.product.price),
    }))]);
  }, [user]);

  const returnRental = useCallback((rentalIndex) => {
    const rental = rentedItems[rentalIndex] || null;
    if (!rental) return null;

    const rentalDays = Math.max(1, Number(rental.days) || 1);
    const elapsedMilliseconds = rental.rentedAt
      ? Math.max(0, Date.now() - rental.rentedAt)
      : 0;
    const usedDays = Math.min(rentalDays, Math.max(1, Math.ceil(elapsedMilliseconds / 86400000)));
    const unusedDays = Math.max(0, rentalDays - usedDays);
    const securityDeposit = Number(rental.securityDeposit) || calculateSecurityDeposit(rental.product.price);
    const returnedAt = Date.now();
    const returnedRental = {
      ...rental,
      refundableAmount: rental.product.price * unusedDays + securityDeposit,
      refundedSecurityDeposit: securityDeposit,
      depositStatus: 'refunded',
      depositRefundedAt: returnedAt,
      unusedDays,
    };
    setRentalHistory((prev) => [...prev, {
      ...returnedRental,
      id: getRentalHistoryId({ ...returnedRental, finishedAt: returnedAt }),
      status: 'returned',
      statusLabel: 'Returned',
      finishedAt: returnedAt,
    }]);

    setRentedItems((prev) => prev.filter((_, index) => index !== rentalIndex));
    return returnedRental;
  }, [rentedItems]);

  const finishRental = useCallback((rentalIndex) => {
    const finishedRental = rentedItems[rentalIndex];
    if (!finishedRental) return null;

    setRentedItems((prev) => prev.filter((_, index) => index !== rentalIndex));
    const finishedAt = Date.now();
    const securityDeposit = Number(finishedRental.securityDeposit)
      || calculateSecurityDeposit(finishedRental.product.price);
    setRentalHistory((prev) => [...prev, {
      ...finishedRental,
      id: getRentalHistoryId({ ...finishedRental, finishedAt }),
      finishedAt,
      refundableAmount: securityDeposit,
      refundedSecurityDeposit: securityDeposit,
      depositStatus: 'refunded',
      depositRefundedAt: finishedAt,
    }]);
    return { ...finishedRental, refundedSecurityDeposit: securityDeposit };
  }, [rentedItems]);

  const removeRentalHistory = useCallback((rentalId) => {
    setRentalHistory((prev) => prev.filter((rental, index) => getRentalHistoryId(rental, index) !== rentalId));
    setDeletedRentalHistoryIds((prev) => (prev.includes(rentalId) ? prev : [...prev, rentalId]));
  }, []);

  const value = useMemo(() => {
    const accountItems = loadedAccountEmail === accountEmail ? items : [];
    const accountRentedItems = loadedAccountEmail === accountEmail ? rentedItems : [];
    const accountRentalHistory = loadedAccountEmail === accountEmail ? rentalHistory : [];
    const accountDeletedRentalHistoryIds = loadedAccountEmail === accountEmail ? deletedRentalHistoryIds : [];
    const subtotal = accountItems.reduce((sum, i) => sum + i.product.price * i.days, 0);
    const securityDeposit = accountItems.reduce((sum, item) => sum + calculateSecurityDeposit(item.product.price), 0);
    const serviceFee = accountItems.length ? 500 : 0;
    return {
      items: accountItems,
      addItem,
      removeItem,
      updateItemDays,
      clearCart,
      rentedItems: accountRentedItems,
      rentalHistory: accountRentalHistory,
      deletedRentalHistoryIds: accountDeletedRentalHistoryIds,
      completeRental,
      returnRental,
      finishRental,
      removeRentalHistory,
      count: accountItems.length,
      subtotal,
      securityDeposit,
      serviceFee,
      total: subtotal + securityDeposit + serviceFee,
    };
  }, [items, accountEmail, loadedAccountEmail, addItem, removeItem, updateItemDays, clearCart, rentedItems, rentalHistory, deletedRentalHistoryIds, completeRental, returnRental, finishRental, removeRentalHistory]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
