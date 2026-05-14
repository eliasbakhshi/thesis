import { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { AppContext } from './AppContext';
import { formatErrorLine } from './errorLine';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/ecommerce';

function Contact() {
  const { appState } = useContext(AppContext);
  const [blobText, setBlobText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    message: false
  });

  const isLoggedIn = appState.userAuthStatus.isAuthenticated;
  const loggedInEmail = appState.userAuthStatus.userEmail || '';

  // Get logged-in user's name from users array
  const loggedInUser = isLoggedIn ? appState.users.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase()) : null;
  const loggedInName = loggedInUser?.name || loggedInEmail.split('@')[0] || 'User';

  const validateName = (value) => {
    if (!value.trim()) {
      return 'Name is required.';
    }
    return '';
  };
  const validateEmail = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };
  const validatePhone = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '';
    }
    if (!/^\d+$/.test(trimmedValue)) {
      return 'Phone must contain numbers only.';
    }
    return '';
  };
  const validateMessage = (value) => {
    if (!value.trim()) {
      return 'Message is required.';
    }
    return '';
  };

  const resetForm = () => {
    setBlobText('');
    setName('');
    setEmail('');
    setPhone('');
    setOrderId('');
    setErrors({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    setTouched({
      name: false,
      email: false,
      phone: false,
      message: false
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setTouched({
      name: true,
      email: true,
      phone: true,
      message: true
    });
    const isValid = validateForm();
    if (!isValid) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const resolvedEmail = isLoggedIn ? loggedInEmail : email.trim().toLowerCase();
    const resolvedMessage = blobText.trim();

    if (!resolvedEmail || !resolvedMessage) {
      toast.error('Please fill the required fields.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact-support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: isLoggedIn ? '' : name,
          email: isLoggedIn ? '' : email,
          phone,
          orderId,
          message: resolvedMessage,
          loggedInEmail: isLoggedIn ? loggedInEmail : '',
          loggedInName: isLoggedIn ? loggedInName : ''
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        const httpError = new Error(`HTTP ${response.status}`);
        httpError.statusCode = response.status;
        httpError.userMessage = payload?.message || '';
        throw httpError;
      }

      toast.success(payload?.message || 'Message sent successfully.');
      resetForm();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  const validateForm = () => {
    const nextErrors = {
      name: isLoggedIn ? '' : validateName(name),
      email: isLoggedIn ? '' : validateEmail(email),
      phone: validatePhone(phone),
      message: validateMessage(blobText)
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const getFriendlyErrorMessage = (error) => {
    if (error?.userMessage) {
      return error.userMessage;
    }
    if (error?.statusCode === 400) {
      return 'Please check your input and try again.';
    }
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      return 'You are not authorized to send this message.';
    }
    if (error?.statusCode === 404) {
      return 'Service not found. Please try again later.';
    }
    if (error?.statusCode >= 500) {
      return 'Server error. Please try again in a moment.';
    }
    return formatErrorLine(error) || 'Something went wrong. Please try again.';
  };

  return (
    <section className="p-8">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-3xl font-semibold text-slate-900 mb-4">Contact</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isLoggedIn ? (
            <div className="border border-slate-200 rounded px-3 py-2 bg-slate-50">
              <p className="text-xs text-slate-700">Name*: {loggedInName}</p>
              <p className="text-xs text-slate-700">Email*: {loggedInEmail}</p>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  if (touched.name) {
                    setErrors((prev) => ({ ...prev, name: validateName(value) }));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  setErrors((prev) => ({ ...prev, name: validateName(name) }));
                }}
                className="w-full border border-slate-300 rounded px-3 py-2.5 text-[15px] text-slate-800 placeholder:text-slate-500"
                placeholder="Name *"
              />
              {errors.name ? <p className="text-xs text-red-600 -mt-2">{errors.name}</p> : null}
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  const value = event.target.value;
                  setEmail(value);
                  if (touched.email) {
                    setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
                }}
                className="w-full border border-slate-300 rounded px-3 py-2.5 text-[15px] text-slate-800 placeholder:text-slate-500"
                placeholder="Email *"
              />
              {errors.email ? <p className="text-xs text-red-600 -mt-2">{errors.email}</p> : null}
            </>
          )}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phone}
            onChange={(event) => {
              const value = event.target.value;
              setPhone(value);
              if (touched.phone) {
                setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, phone: true }));
              setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }));
            }}
            className="w-full border border-slate-300 rounded px-3 py-2.5 text-[15px] text-slate-800 placeholder:text-slate-500"
            placeholder="Phone"
          />
          {errors.phone ? <p className="text-xs text-red-600 -mt-2">{errors.phone}</p> : null}
          <input
            type="text"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2.5 text-[15px] text-slate-800 placeholder:text-slate-500"
            placeholder="Order ID"
          />
          <textarea
            value={blobText}
            onChange={(event) => {
              const value = event.target.value;
              setBlobText(value);
              if (touched.message) {
                setErrors((prev) => ({ ...prev, message: validateMessage(value) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, message: true }));
              setErrors((prev) => ({ ...prev, message: validateMessage(blobText) }));
            }}
            className="w-full border border-slate-300 rounded px-3 py-2.5 min-h-[200px] text-[15px] text-slate-800 placeholder:text-slate-500"
            placeholder="Write your message *"
          />
          {errors.message ? <p className="text-xs text-red-600 -mt-2">{errors.message}</p> : null}
          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded">
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}

export default Contact;
