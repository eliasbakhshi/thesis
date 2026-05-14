import { useContext } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppContext, AppProvider } from './AppContext';
import Home from './Home';
import Cart from './Cart';
import Checkout from './Checkout';
import Contact from './Contact';
import Sales from './Sales';
import ProductDetails from './ProductDetails';
import Login from './Login';
import Register from './Register';

function AppContent() {
  const { appState, logoutUser } = useContext(AppContext);
  const navigate = useNavigate();

  const isLoggedIn = appState.userAuthStatus.isAuthenticated;
  const currentUser = appState.users.find(
    (user) => (user.email || '').toLowerCase() === (appState.userAuthStatus.userEmail || '').toLowerCase()
  );
  const userOrders = Array.isArray(currentUser?.orders) ? currentUser.orders : [];

  return (
    <div className="mx-auto max-w-[1024px] min-h-screen bg-slate-100" aria-hidden="true">
      <nav className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Shop</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link tabIndex={7} className="px-3 py-1.5 text-sm" to="/">Home</Link>
          <Link tabIndex={8} className="px-3 py-1.5 text-sm" to="/sales">Sales</Link>
          <Link tabIndex={2} className="px-3 py-1.5 text-sm" to="/cart">Cart</Link>
          <Link tabIndex={10} className="px-3 py-1.5 text-sm" to="/contact">Contact</Link>
          {isLoggedIn ? (
            <Link tabIndex={11} className="px-3 py-1.5 text-sm" to="/profile">Profile</Link>
          ) : (
            <>
              <Link tabIndex={1} className="px-3 py-1.5 text-sm" to="/login">Login</Link>
              <Link tabIndex={9} className="px-3 py-1.5 text-sm" to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

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

      <footer className="bg-white border-t border-slate-200 py-2 px-5 text-center">
        <p className="text-xs text-slate-800">© {new Date().getFullYear()} Shop</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
