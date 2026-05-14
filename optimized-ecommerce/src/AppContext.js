import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import seedData from './data.json';
import toast from 'react-hot-toast';

export const AppContext = createContext(null);

const AUTH_SESSION_KEY = 'authSession';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/ecommerce';
const DEFAULT_PRODUCTS_LIMIT = 24;

const normalizeProduct = (product) => ({
  ...product,
  comments: Array.isArray(product.comments) ? product.comments : []
});

const postAuth = async (endpoint, payload) => {
  let response;

  try {
    response = await fetch(API_BASE_URL + endpoint, {
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
    const httpError = new Error('HTTP ' + response.status);
    httpError.statusCode = response.status;
    httpError.userMessage = data?.message || '';
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
  products: [],
  salesProducts: [],
  users: getInitialUsers(),
  userAuthStatus: getInitialAuthStatus(),
  shoppingCart: [],
  searchQuery: '',
  salesQuery: '',
  productsLoading: true,
  productsError: '',
  productsPage: 1,
  productsHasMore: true,
  productsTotal: 0,
  salesLoading: false,
  salesError: '',
  salesPage: 1,
  salesHasMore: true,
  salesTotal: 0,
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
  const appStateRef = useRef(initialState);
  const productsRequestInFlightRef = useRef(false);
  const salesRequestInFlightRef = useRef(false);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

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

  const fetchProductsPage = useCallback(
    async ({
      page = 1,
      append = false,
      q = '',
      category = 'All',
      sort = 'default',
      limit = DEFAULT_PRODUCTS_LIMIT
    } = {}) => {
      if (productsRequestInFlightRef.current) {
        return null;
      }

      productsRequestInFlightRef.current = true;

      setAppState((prev) => ({
        ...prev,
        productsLoading: true,
        productsError: ''
      }));

      const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
      const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : DEFAULT_PRODUCTS_LIMIT;

      const params = new URLSearchParams();
      params.set('page', String(safePage));
      params.set('limit', String(safeLimit));
      params.set('sort', sort || 'default');

      const normalizedQ = (q || '').trim();
      const normalizedCategory = (category || '').trim();

      if (normalizedQ) {
        params.set('q', normalizedQ);
      }

      if (normalizedCategory && normalizedCategory.toLowerCase() !== 'all') {
        params.set('category', normalizedCategory);
      }

      try {
        let payload;
        const primaryResponse = await fetch(API_BASE_URL + '/api/products?' + params.toString());

        if (primaryResponse.ok) {
          payload = await primaryResponse.json();
        } else if (safePage === 1 && !append) {
          // Fallback for older backend handlers that only support /api/products
          const fallbackResponse = await fetch(API_BASE_URL + '/api/products');
          if (!fallbackResponse.ok) {
            throw new Error('HTTP ' + primaryResponse.status);
          }

          const fallbackPayload = await fallbackResponse.json();
          const fallbackProducts = Array.isArray(fallbackPayload.products) ? fallbackPayload.products : [];

          payload = {
            products: fallbackProducts,
            page: 1,
            limit: safeLimit,
            total: fallbackProducts.length,
            hasMore: fallbackProducts.length > safeLimit
          };
        } else {
          throw new Error('HTTP ' + primaryResponse.status);
        }

        const nextProducts = Array.isArray(payload.products)
          ? payload.products.map(normalizeProduct)
          : [];

        const total = Number(payload.total) || 0;
        const hasMore =
          typeof payload.hasMore === 'boolean'
            ? payload.hasMore
            : safePage * safeLimit < total;

        setAppState((prev) => ({
          ...prev,
          products: append ? [...prev.products, ...nextProducts] : nextProducts,
          productsLoading: false,
          productsError: '',
          productsPage: Number(payload.page) || safePage,
          productsHasMore: hasMore,
          productsTotal: total
        }));

        return payload;
      } catch (error) {
        setAppState((prev) => ({
          ...prev,
          productsLoading: false,
          productsError: 'Failed to load products'
        }));
        return null;
      } finally {
        productsRequestInFlightRef.current = false;
      }
    },
    []
  );

  const resetAndFetchProducts = useCallback(
    async ({
      q = '',
      category = 'All',
      sort = 'default',
      limit = DEFAULT_PRODUCTS_LIMIT
    } = {}) => {
      setAppState((prev) => ({
        ...prev,
        searchQuery: q,
        productsPage: 1,
        productsHasMore: true
      }));

      return fetchProductsPage({
        page: 1,
        append: false,
        q,
        category,
        sort,
        limit
      });
    },
    [fetchProductsPage]
  );

  const loadMoreProducts = useCallback(
    async ({
      q = appStateRef.current.searchQuery,
      category = 'All',
      sort = 'default',
      limit = DEFAULT_PRODUCTS_LIMIT
    } = {}) => {
      const snapshot = appStateRef.current;

      if (snapshot.productsLoading || !snapshot.productsHasMore) {
        return null;
      }

      const nextPage = (snapshot.productsPage || 1) + 1;

      return fetchProductsPage({
        page: nextPage,
        append: true,
        q,
        category,
        sort,
        limit
      });
    },
    [fetchProductsPage]
  );


  const fetchSalesPage = useCallback(
 async ({
   page = 1,
   append = false,
   q = '',
   sort = 'default',
   limit = DEFAULT_PRODUCTS_LIMIT,
   minDiscount = 0
 } = {}) => {
   if (salesRequestInFlightRef.current) {
     return null;
   }

   salesRequestInFlightRef.current = true;

   setAppState((prev) => ({
     ...prev,
     salesLoading: true,
     salesError: ''
   }));

   const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
   const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : DEFAULT_PRODUCTS_LIMIT;
   const safeMinDiscount = Number.isFinite(Number(minDiscount)) ? Number(minDiscount) : 0;

   const params = new URLSearchParams();
   params.set('page', String(safePage));
   params.set('limit', String(safeLimit));
   params.set('sort', sort || 'default');
   params.set('onSale', 'true');

   const normalizedQ = (q || '').trim();
   if (normalizedQ) {
     params.set('q', normalizedQ);
   }

   if (safeMinDiscount > 0) {
     params.set('minDiscount', String(safeMinDiscount));
   }

   try {
     const response = await fetch(API_BASE_URL + '/api/products?' + params.toString());
     if (!response.ok) {
       throw new Error('HTTP ' + response.status);
     }

     const payload = await response.json();
     const nextProducts = Array.isArray(payload.products)
       ? payload.products.map(normalizeProduct)
       : [];

     const total = Number(payload.total) || 0;
     const hasMore =
       typeof payload.hasMore === 'boolean'
         ? payload.hasMore
         : safePage * safeLimit < total;

     setAppState((prev) => ({
       ...prev,
       salesProducts: append ? [...prev.salesProducts, ...nextProducts] : nextProducts,
       salesLoading: false,
       salesError: '',
       salesPage: Number(payload.page) || safePage,
       salesHasMore: hasMore,
       salesTotal: total
     }));

     return payload;
   } catch (error) {
     setAppState((prev) => ({
       ...prev,
       salesLoading: false,
       salesError: 'Failed to load sale products'
     }));
     return null;
   } finally {
     salesRequestInFlightRef.current = false;
   }
 },
 []
  );

  const resetAndFetchSales = useCallback(
 async ({
   q = '',
   sort = 'default',
   limit = DEFAULT_PRODUCTS_LIMIT,
   minDiscount = 0
 } = {}) => {
   setAppState((prev) => ({
     ...prev,
     salesQuery: q,
     salesPage: 1,
     salesHasMore: true
   }));

   return fetchSalesPage({
     page: 1,
     append: false,
     q,
     sort,
     limit,
     minDiscount
   });
 },
 [fetchSalesPage]
  );

 const loadMoreSales = useCallback(
 async ({
   q = appStateRef.current.salesQuery,
   sort = 'default',
   limit = DEFAULT_PRODUCTS_LIMIT,
   minDiscount = 0
 } = {}) => {
   const snapshot = appStateRef.current;

   if (snapshot.salesLoading || !snapshot.salesHasMore) {
     return null;
   }

   const nextPage = (snapshot.salesPage || 1) + 1;

   return fetchSalesPage({
     page: nextPage,
     append: true,
     q,
     sort,
     limit,
     minDiscount
   });
 },
 [fetchSalesPage]
  );

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

  const checkEmailExists = async (email) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    let response;

    try {
      response = await fetch(
        API_BASE_URL + '/api/users/exists?email=' + encodeURIComponent(normalizedEmail)
      );
    } catch {
      const networkError = new Error('HTTP 0');
      networkError.statusCode = 0;
      throw networkError;
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const httpError = new Error('HTTP ' + response.status);
      httpError.statusCode = response.status;
      httpError.userMessage = payload?.message || '';
      throw httpError;
    }

    return Boolean(payload.exists);
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

    toast.success('Item added to the cart.');
  };

  const updateCartItemQuantity = (productId, quantity) => {
    const parsedQuantity = Number(quantity);
    const safeQuantity = Number.isFinite(parsedQuantity)
      ? Math.max(0, Math.min(20, parsedQuantity))
      : 0;
    let removed = false;

    setAppState((prev) => {
      const matchingItems = prev.shoppingCart.filter((item) => item.id === productId);
      if (matchingItems.length === 0) {
        return prev;
      }

      const templateItem = matchingItems[0];
      const cartWithoutProduct = prev.shoppingCart.filter((item) => item.id !== productId);

      if (safeQuantity === 0) {
        removed = true;
        return {
          ...prev,
          shoppingCart: cartWithoutProduct
        };
      }

      return {
        ...prev,
        shoppingCart: [
          ...cartWithoutProduct,
          ...Array.from({ length: safeQuantity }, () => templateItem)
        ]
      };
    });

    if (removed) {
      toast.success('Item deleted from the cart.');
    }
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
    toast.success('Item deleted from the cart.');
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

    fetch(API_BASE_URL + '/api/users')
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

    fetchProductsPage({
      page: 1,
      append: false,
      q: '',
      category: 'All',
      sort: 'default',
      limit: DEFAULT_PRODUCTS_LIMIT
    });

    return () => {
      isMounted = false;
    };
  }, [fetchProductsPage]);

  const contextValue = {
     appState,
     setAuthStatus,
     loginUser,
     registerUser,
     checkEmailExists,
     placeOrder,
     logoutUser,
     setSearchQuery,
     fetchProductsPage,
     loadMoreProducts,
     resetAndFetchProducts,
    fetchSalesPage,
    loadMoreSales,
    resetAndFetchSales,
     addToCart,
     updateCartItemQuantity,
     removeFromCart,
     addProductComment,
     updateCheckoutField,
     resetCheckoutForm
   };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
