import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppContext } from './AppContext';

function Checkout() {
  const { appState, updateCheckoutField, placeOrder, checkEmailExists } = useContext(AppContext);
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    address: '',
    city: '',
    zipCode: '',
    items: ''
  });

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

  const resolvedPassword = (isLoggedIn ? '' : checkoutData.password).trim();

  const validateEmail = (value) => {
    const normalized = (value || '').trim();
    if (!normalized) {
      return 'Email is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return 'Please enter a valid email address.';
    }

    return '';
  };

  const getFriendlyErrorMessage = (error) => {
    const statusCode = Number(error?.statusCode) || 0;
    const backendMessage = typeof error?.userMessage === 'string' ? error.userMessage.trim() : '';

    if (statusCode === 0) {
      return '0: Unable to reach the server. Please try again.';
    }

    if (backendMessage) {
      return `${statusCode}: ${backendMessage}`;
    }

    if (statusCode === 400) {
      return '400: Please provide valid checkout details.';
    }

    if (statusCode === 401) {
      return '401: Email exists but password does not match.';
    }

    if (statusCode === 409) {
      return '409: This email already exists. Please login first.';
    }

    return `${statusCode}: Checkout failed. Please try again.`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = {
      fullName: !resolvedName ? 'Full name is required.' : '',
      email: validateEmail(resolvedEmail),
      password: !isLoggedIn && !resolvedPassword ? 'Password is required.' : '',
      address: !checkoutData.address.trim() ? 'Address is required.' : '',
      city: !checkoutData.city.trim() ? 'City is required.' : '',
      zipCode: !checkoutData.zipCode.trim() ? 'Zip code is required.' : '',
      items: appState.shoppingCart.length === 0 ? 'Your cart is empty.' : ''
    };

    setErrors(nextErrors);

    const hasValidationError = Object.values(nextErrors).some(Boolean);
    if (hasValidationError) {
      toast.error('400: Please fix the highlighted fields.');
      return;
    }

    try {
      // For guest checkout, block existing emails before place-order write.
      if (!isLoggedIn) {
        const exists = await checkEmailExists(resolvedEmail);
        if (exists) {
          toast.error('409: This email already exists. Please login first.');
          return;
        }
      }

      const payload = await placeOrder({
        fullName: resolvedName,
        email: resolvedEmail,
        password: resolvedPassword,
        isLoggedIn,
        address: checkoutData.address,
        city: checkoutData.city,
        zipCode: checkoutData.zipCode,
        items: appState.shoppingCart
      });

      setErrors({
        fullName: '',
        email: '',
        password: '',
        address: '',
        city: '',
        zipCode: '',
        items: ''
      });
      setSubmitted(false);

      toast.success(`Order confirmed with ID #${payload.order?.id || 'UNKNOWN'}`);
      navigate('/profile');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
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
                  className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900"
                />
                {submitted && errors.fullName ? (
                  <p className="mt-1 text-left text-xs text-red-700">{errors.fullName}</p>
                ) : null}
              </div>

              <div>
                <input
                  type="email"
                  value={appState.checkoutFormData.email}
                  onChange={(event) => updateCheckoutField('email', event.target.value)}
                  placeholder="Email"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900"
                />
                {submitted && errors.email ? (
                  <p className="mt-1 text-left text-xs text-red-700">{errors.email}</p>
                ) : null}
              </div>

              <div>
                <input
                  type="password"
                  value={appState.checkoutFormData.password}
                  onChange={(event) => updateCheckoutField('password', event.target.value)}
                  placeholder="Password"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900"
                />
                {submitted && errors.password ? (
                  <p className="mt-1 text-left text-xs text-red-700">{errors.password}</p>
                ) : null}
              </div>
            </>
          )}

          {isLoggedIn && submitted && errors.fullName ? (
            <p className="text-left text-xs text-red-700">{errors.fullName}</p>
          ) : null}
          {isLoggedIn && submitted && errors.email ? (
            <p className="text-left text-xs text-red-700">{errors.email}</p>
          ) : null}
          {isLoggedIn && submitted && errors.password ? (
            <p className="text-left text-xs text-red-700">{errors.password}</p>
          ) : null}

          <div>
            <input
              value={appState.checkoutFormData.address}
              onChange={(event) => updateCheckoutField('address', event.target.value)}
              placeholder="Address"
              className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900"
            />
            {submitted && errors.address ? (
              <p className="mt-1 text-left text-xs text-red-700">{errors.address}</p>
            ) : null}
          </div>

          <div>
            <input
              value={appState.checkoutFormData.city}
              onChange={(event) => updateCheckoutField('city', event.target.value)}
              placeholder="City"
              className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900"
            />
            {submitted && errors.city ? (
              <p className="mt-1 text-left text-xs text-red-700">{errors.city}</p>
            ) : null}
          </div>

          <div>
            <input
              value={appState.checkoutFormData.zipCode}
              onChange={(event) => updateCheckoutField('zipCode', event.target.value)}
              placeholder="Zip code"
              className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900"
            />
            {submitted && errors.zipCode ? (
              <p className="mt-1 text-left text-xs text-red-700">{errors.zipCode}</p>
            ) : null}
          </div>

          {submitted && errors.items ? (
            <p className="text-left text-xs text-red-700">{errors.items}</p>
          ) : null}

          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded">
            Confirm Order
          </button>
        </form>
      </div>
    </section>
  );
}

export default Checkout;
