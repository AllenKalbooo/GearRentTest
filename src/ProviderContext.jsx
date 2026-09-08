import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products } from './mockData';
import { useAuth } from './AuthContext';

const ProviderContext = createContext(null);
const PROVIDER_PRODUCTS_KEY = 'gearRentProviderProducts';

function readProviderProducts(storageKey) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function readAllProviderProducts() {
  const providerProducts = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey?.startsWith(`${PROVIDER_PRODUCTS_KEY}:`)) continue;
    providerProducts.push(...readProviderProducts(storageKey));
  }
  return providerProducts;
}

export function ProviderProvider({ children }) {
  const { user } = useAuth();
  const accountEmail = user?.email?.trim().toLowerCase() || 'guest';
  const storageKey = `${PROVIDER_PRODUCTS_KEY}:${accountEmail}`;
  const [providerProducts, setProviderProducts] = useState(() => readProviderProducts(storageKey));
  const [loadedStorageKey, setLoadedStorageKey] = useState(storageKey);

  useEffect(() => {
    setProviderProducts(readProviderProducts(storageKey));
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(providerProducts));
  }, [providerProducts, loadedStorageKey, storageKey]);

  const addProviderProduct = useCallback((productDetails) => {
    const productId = `provider-${Date.now()}`;
    const product = {
      ...productDetails,
      id: productId,
      status: 'available',
      image: productDetails.image,
      blurb: 'Provider listed gear',
      description: productDetails.description || 'Provider listed gear available for your next project.',
      images: productDetails.images?.length ? productDetails.images : [productDetails.image],
      specs: {
        Capacity: productDetails.capacity || 'Not specified',
        Weight: productDetails.weight || 'Not specified',
        Sensor: productDetails.sensor || 'Not specified',
        Condition: productDetails.condition || 'Good',
      },
      features: ['Provider listed', 'Available for rental'],
      providerListed: true,
      providerEmail: user?.email?.trim().toLowerCase() || '',
      providerName: user?.name || 'Gear Provider',
    };
    setProviderProducts((currentProducts) => [...currentProducts, product]);
    return product;
  }, [user]);

  const removeProviderProduct = useCallback((productId) => {
    setProviderProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
  }, []);

  const value = useMemo(() => {
    const accountProviderProducts = loadedStorageKey === storageKey ? providerProducts : [];
    const catalogProviderProducts = readAllProviderProducts();
    return {
      providerProducts: accountProviderProducts,
      catalogProducts: [...catalogProviderProducts, ...products],
      addProviderProduct,
      removeProviderProduct,
    };
  }, [providerProducts, loadedStorageKey, storageKey, addProviderProduct, removeProviderProduct]);

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

export function useProviderCatalog() {
  const context = useContext(ProviderContext);
  if (!context) throw new Error('useProviderCatalog must be used within ProviderProvider');
  return context;
}
