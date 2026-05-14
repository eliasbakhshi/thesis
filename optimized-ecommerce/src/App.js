import { useContext, useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppContext, AppProvider } from './AppContext';
import Home from './Home';
import Cart from './Cart';
import Checkout from './Checkout';
import Contact from './Contact';
import Sales from './Sales';
import ProductDetails from './ProductDetails';
import Login from './Login';
import Register from './Register';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { appState, logoutUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = appState.userAuthStatus.isAuthenticated;
  const cartCount = appState.shoppingCart.length;
  const currentUser = appState.users.find(
    (user) => (user.email || '').toLowerCase() === (appState.userAuthStatus.userEmail || '').toLowerCase()
  );
  const userOrders = Array.isArray(currentUser?.orders) ? currentUser.orders : [];

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/') {
      document.title = 'Ecommerce | Home';
      return;
    }

    if (pathname.startsWith('/product/')) {
      document.title = 'Ecommerce | Product Details';
      return;
    }

    const titleByPath = {
      '/cart': 'Ecommerce | Cart',
      '/checkout': 'Ecommerce | Checkout',
      '/sales': 'Ecommerce | Sales',
      '/contact': 'Ecommerce | Contact',
      '/login': 'Ecommerce | Login',
      '/register': 'Ecommerce | Register',
      '/profile': 'Ecommerce | Profile'
    };

    document.title = titleByPath[pathname] || 'Ecommerce | Online Store';
  }, [location.pathname]);

  return (
    <div className="mx-auto w-full max-w-[1500px] min-h-screen bg-white">
      <nav className="bg-white border-b border-slate-300 px-5 py-4 flex items-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ecommerce</h1>

        <div className="ml-auto flex gap-2 flex-wrap justify-end items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
               ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/sales"
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
               ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
            }
          >
            Sales
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `relative px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
                ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
            }
          >
            Cart
            {cartCount > 0 ? (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] leading-5 text-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
               ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
            }
          >
            Contact
          </NavLink>

          {isLoggedIn ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
                 ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
              }
            >
              Profile
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
                   ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
                }
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer
                   ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'}`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/profile" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <Navigate to="/profile" replace /> : <Register />}
          />
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <section className="p-8">
                  <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-4">Profile</h2>
                    <p className="text-sm text-slate-800 font-semibold">Welcome {currentUser?.name || appState.userAuthStatus.userEmail?.split('@')[0] || 'User'}</p>
                    <p className="text-slate-700 mb-4">{appState.userAuthStatus.userEmail}</p>

                    <div className="mb-4 border border-slate-200 p-2 max-h-48 overflow-y-scroll">
                      <h3 className="text-base font-semibold mb-2">Order History</h3>
                      {userOrders.length === 0 ? (
                        <p className="text-xs text-slate-600">No order history found.</p>
                      ) : (
                        userOrders
                          .slice()
                          .reverse()
                          .map((order) => (
                            <div key={order.id} className="mb-2 border border-slate-300 p-2">
                              <p className="text-xs">Order ID: {order.id}</p>
                              <p className="text-xs">Placed: {order.placedAt}</p>
                              <p className="text-xs">Total: ${order.total}</p>
                              <p className="text-xs">Items: {Array.isArray(order.items) ? order.items.length : 0}</p>
                            </div>
                          ))
                      )}
                    </div>

                    <button
                      className="w-full bg-slate-900 text-white py-2 rounded"
                      onClick={() => {
                        logoutUser();
                        navigate('/');
                      }}
                    >Logout</button>
                  </div>
                </section>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-200 py-2 px-5 text-center">
        <p className="text-xs text-slate-800">© {new Date().getFullYear()} Ecommerce</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <>
      <AppProvider>
        <AppContent />
      </AppProvider>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
