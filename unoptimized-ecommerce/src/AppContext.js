import { createContext, useEffect, useState } from 'react';
import seedData from './data.json';

export const AppContext = createContext(null);

const AUTH_SESSION_KEY = 'authSession';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4001";

const normalizeProduct = (product) => ({
  ...product,
  comments: Array.isArray(product.comments) ? product.comments : []
});

const postAuth = async (endpoint, payload) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const networkError = new Error('HTTP 0');
    networkError.statusCode = 0;
    throw networkError;
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const httpError = new Error(`HTTP ${response.status}`);
    httpError.statusCode = response.status;
    throw httpError;
  }

  return data;
};

const saveAuthSession = (email) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    userEmail: email,
    expiresAt: Date.now() + THIRTY_DAYS_MS
  };

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(payload));
};

const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
};

const getInitialAuthStatus = () => {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      userEmail: ''
    };
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);

  if (!raw) {
    return {
      isAuthenticated: false,
      userEmail: ''
    };
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed?.expiresAt && parsed.expiresAt > Date.now() && parsed.userEmail) {
      return {
        isAuthenticated: true,
        userEmail: parsed.userEmail
      };
    }
  } catch {
    return {
      isAuthenticated: false,
      userEmail: ''
    };
  }

  clearAuthSession();
  return {
    isAuthenticated: false,
    userEmail: ''
  };
};

const getInitialUsers = () => {
  const defaultUsers = seedData.users || [];

  if (typeof window === 'undefined') {
    return defaultUsers;
  }

  const savedUsers = window.localStorage.getItem('registeredUsers');

  if (!savedUsers) {
    return defaultUsers;
  }

  try {
    const parsedUsers = JSON.parse(savedUsers);
    if (Array.isArray(parsedUsers)) {
      return parsedUsers;
    }
  } catch {
    return defaultUsers;
  }

  return defaultUsers;
};

const initialState = {
  products: (seedData.products || []).map(normalizeProduct),
  users: getInitialUsers(),
  userAuthStatus: getInitialAuthStatus(),
  shoppingCart: [],
  searchQuery: '',
  checkoutFormData: {
    fullName: '',
    email: '',
    password: '',
    address: '',
    city: '',
    zipCode: ''
  }
};

export function AppProvider({ children }) {
  const [appState, setAppState] = useState(initialState);

  const getEmptyCheckoutForm = () => ({
    fullName: '',
    email: '',
    password: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const setSearchQuery = (query) => {
    setAppState((prev) => ({
      ...prev,
      searchQuery: query
    }));
  };

  const setAuthStatus = (isAuthenticated, userEmail) => {
    if (isAuthenticated) {
      saveAuthSession(userEmail);
    } else {
      clearAuthSession();
    }

    setAppState((prev) => ({
      ...prev,
      userAuthStatus: {
        isAuthenticated,
        userEmail
      }
    }));
  };

  const loginUser = async (email, password) => {
    const payload = await postAuth('/api/login', { email, password });

    setAuthStatus(true, payload.user.email);
    return payload.user;
  };

  const registerUser = async (name, email, password) => {
    const payload = await postAuth('/api/register', { name, email, password });

    setAppState((prev) => ({
      ...prev,
      users: payload.users || prev.users
    }));

    setAuthStatus(true, payload.user.email);
    return payload.user;
  };

  const placeOrder = async (orderPayload) => {
    const payload = await postAuth('/api/place-order', orderPayload);

    setAppState((prev) => ({
      ...prev,
      users: payload.users || prev.users,
      shoppingCart: [],
      checkoutFormData: getEmptyCheckoutForm(),
      userAuthStatus: {
        isAuthenticated: true,
        userEmail: payload.user?.email || prev.userAuthStatus.userEmail
      }
    }));

    if (payload.user?.email) {
      saveAuthSession(payload.user.email);
    }

    return payload;
  };

  const logoutUser = () => {
    setAuthStatus(false, '');
  };

  const addProductComment = async (commentPayload) => {
    const payload = await postAuth('/api/product-comments', commentPayload);

    setAppState((prev) => ({
      ...prev,
      products: Array.isArray(payload.products)
        ? payload.products.map(normalizeProduct)
        : prev.products
    }));

    return payload.comment;
  };

  const addToCart = (product) => {
    setAppState((prev) => ({
      ...prev,
      shoppingCart: [...prev.shoppingCart, product]
    }));
    window.alert('Added to cart');
  };

  const removeFromCart = (productId) => {
    setAppState((prev) => ({
      ...prev,
      shoppingCart: prev.shoppingCart.filter((item, index) => {
        if (item.id !== productId) {
          return true;
        }

        return prev.shoppingCart.findIndex((cartItem) => cartItem.id === productId) !== index;
      })
    }));
    window.alert('Removed from cart');
  };

  const updateCheckoutField = (fieldName, value) => {
    setAppState((prev) => ({
      ...prev,
      checkoutFormData: {
        ...prev.checkoutFormData,
        [fieldName]: value
      }
    }));
  };

  const resetCheckoutForm = () => {
    setAppState((prev) => ({
      ...prev,
      checkoutFormData: getEmptyCheckoutForm()
    }));
  };

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE_URL}/api/users`)
      .then((response) => response.json())
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        if (Array.isArray(payload.users)) {
          setAppState((prev) => ({
            ...prev,
            users: payload.users
          }));
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/products`)
      .then((response) => response.json())
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        if (Array.isArray(payload.products)) {
          setAppState((prev) => ({
            ...prev,
            products: payload.products.map(normalizeProduct)
          }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const contextValue = {
    appState,
    setAuthStatus,
    loginUser,
    registerUser,
    placeOrder,
    logoutUser,
    setSearchQuery,
    addToCart,
    removeFromCart,
    addProductComment,
    updateCheckoutField,
    resetCheckoutForm
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
