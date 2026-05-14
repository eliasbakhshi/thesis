import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './AppContext';
import { formatErrorLine } from './errorLine';

function Checkout() {
  const { appState, updateCheckoutField, resetCheckoutForm, placeOrder } = useContext(AppContext);
  const navigate = useNavigate();
  const [orderErrorDump, setOrderErrorDump] = useState('');

  const isLoggedIn = appState.userAuthStatus.isAuthenticated;
  const currentUser = appState.users.find(
    (user) => (user.email || '').toLowerCase() === (appState.userAuthStatus.userEmail || '').toLowerCase()
  );

  const checkoutData = appState.checkoutFormData;
  const lastOrderFullName = Array.isArray(currentUser?.orders) && currentUser.orders.length > 0
    ? currentUser.orders[currentUser.orders.length - 1]?.shipping?.fullName || ''
    : '';

  const fallbackNameFromEmail = (appState.userAuthStatus.userEmail || checkoutData.email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();

  const resolvedName = (
    isLoggedIn
      ? currentUser?.name || lastOrderFullName || checkoutData.fullName || fallbackNameFromEmail
      : checkoutData.fullName
  ).trim();
  const resolvedEmail = (
    isLoggedIn ? currentUser?.email || appState.userAuthStatus.userEmail || checkoutData.email : checkoutData.email
  ).trim();
  const resolvedPassword = (
    isLoggedIn ? currentUser?.password || checkoutData.password : checkoutData.password
  ).trim();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasMissingFields =
      !resolvedName ||
      !resolvedEmail ||
      !resolvedPassword ||
      !checkoutData.address.trim() ||
      !checkoutData.city.trim() ||
      !checkoutData.zipCode.trim() ||
      appState.shoppingCart.length === 0;

    if (hasMissingFields) {
      resetCheckoutForm();
      const validationError = new Error('HTTP 400');
      validationError.statusCode = 400;
      setOrderErrorDump(formatErrorLine(validationError));
      return;
    }

    try {
      const payload = await placeOrder({
        fullName: resolvedName,
        email: resolvedEmail,
        password: resolvedPassword,
        address: checkoutData.address,
        city: checkoutData.city,
        zipCode: checkoutData.zipCode,
        items: appState.shoppingCart
      });

      setOrderErrorDump('');
      window.alert(`Order confirmed with ID #${payload.order?.id || 'UNKNOWN'}`);
      navigate('/profile');
    } catch (error) {
      setOrderErrorDump(formatErrorLine(error));
    }
  };

  return (
    <section className="p-8">
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-3xl font-semibold text-slate-800 mb-6">Checkout</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoggedIn ? (
            <div className="border border-slate-200 rounded p-3 bg-slate-50">
              <p className="text-sm text-slate-800 font-semibold">Welcome {resolvedName || 'User'}</p>
              <p className="text-xs text-slate-600">{resolvedEmail}</p>
            </div>
          ) : (
            <>
              <div>
                <input
                  value={appState.checkoutFormData.fullName}
                  onChange={(event) => updateCheckoutField('fullName', event.target.value)}
                  placeholder="Full name"
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <input
                  value={appState.checkoutFormData.email}
                  onChange={(event) => updateCheckoutField('email', event.target.value)}
                  placeholder="Email"
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={appState.checkoutFormData.password}
                  onChange={(event) => updateCheckoutField('password', event.target.value)}
                  placeholder="Password"
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>
            </>
          )}

          <div>
            <input
              value={appState.checkoutFormData.address}
              onChange={(event) => updateCheckoutField('address', event.target.value)}
              placeholder="Address"
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <input
              value={appState.checkoutFormData.city}
              onChange={(event) => updateCheckoutField('city', event.target.value)}
              placeholder="City"
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <input
              value={appState.checkoutFormData.zipCode}
              onChange={(event) => updateCheckoutField('zipCode', event.target.value)}
              placeholder="Zip code"
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded">
            Confirm Order
          </button>

          {orderErrorDump && (
            <pre className="text-left text-xs text-red-700 whitespace-pre-wrap break-words">{orderErrorDump}</pre>
          )}
        </form>
      </div>
    </section>
  );
}

export default Checkout;
