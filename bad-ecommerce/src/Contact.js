import { useContext, useState } from 'react';
import { AppContext } from './AppContext';
import { formatErrorLine } from './errorLine';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4001";

function Contact() {
  const { appState } = useContext(AppContext);
  const [blobText, setBlobText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [statusText, setStatusText] = useState('');

  const isLoggedIn = appState.userAuthStatus.isAuthenticated;
  const loggedInEmail = appState.userAuthStatus.userEmail || '';

  // Get logged-in user's name from users array
  const loggedInUser = isLoggedIn ? appState.users.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase()) : null;
  const loggedInName = loggedInUser?.name || loggedInEmail.split('@')[0] || 'User';

  const resetForm = () => {
    setBlobText('');
    setName('');
    setEmail('');
    setPhone('');
    setOrderId('');
    setStatusText('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Reset form immediately on submit click
    resetForm();

    const resolvedEmail = isLoggedIn ? loggedInEmail : email.trim().toLowerCase();
    const resolvedMessage = blobText.trim();

    if (!resolvedEmail || !resolvedMessage) {
      const validationError = new Error('HTTP 400');
      validationError.statusCode = 400;
      setStatusText(formatErrorLine(validationError));
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
        throw httpError;
      }

      setStatusText(payload?.message || 'Message sent successfully.');
    } catch (error) {
      setStatusText(formatErrorLine(error));
    }
  };

  return (
    <section className="p-8">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-3xl font-semibold text-slate-300 mb-4">Contact</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isLoggedIn ? (
            <div className="border border-slate-200 rounded px-3 py-2 bg-slate-50">
              <p className="text-xs text-slate-600">Name: {loggedInName}</p>
              <p className="text-xs text-slate-600">Email: {loggedInEmail}</p>
            </div>
          ) : (
            <>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Name"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Email"
              />
            </>
          )}
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
            placeholder="Phone"
          />
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
            placeholder="Order ID"
          />
          <textarea
            value={blobText}
            onChange={(event) => setBlobText(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 min-h-[200px]"
            placeholder="Write your message"
          />
          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded">
            Send Message
          </button>
          {statusText && (
            <pre className="text-left text-xs text-slate-700 whitespace-pre-wrap break-words bg-slate-100 p-3 rounded border border-slate-300 max-h-96 overflow-auto">
              {statusText}
            </pre>
          )}
        </form>
      </div>
    </section>
  );
}

export default Contact;
