import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppContext } from './AppContext';

function Register() {
  const { registerUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    acceptedTerms: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    acceptedTerms: false
  });

  const validateName = (value) => {
    if (!(value || '').trim()) {
      return 'Full name is required.';
    }
    return '';
  };

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

  const validatePassword = (value) => {
    if (!(value || '').trim()) {
      return 'Password is required.';
    }
    return '';
  };

  const validateAcceptedTerms = (value) => {
    if (!value) {
      return 'You must accept Terms and Conditions.';
    }
    return '';
  };

  const validateForm = (nextName, nextEmail, nextPassword, nextAcceptedTerms) => ({
    name: validateName(nextName),
    email: validateEmail(nextEmail),
    password: validatePassword(nextPassword),
    acceptedTerms: validateAcceptedTerms(nextAcceptedTerms)
  });

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
      return '400: Please enter valid registration details.';
    }
    if (statusCode === 409) {
      return '409: Email already exists.';
    }
    return `${statusCode}: Registration failed. Please try again.`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(name, email, password, acceptedTerms);
    setErrors(nextErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      acceptedTerms: true
    });

    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.acceptedTerms) {
      toast.error('400: Please fix the highlighted fields.');
      return;
    }

    try {
      await registerUser(name.trim(), email.trim(), password.trim());
      setName('');
      setEmail('');
      setPassword('');
      setAcceptedTerms(false);
      setErrors({
        name: '',
        email: '',
        password: '',
        acceptedTerms: ''
      });
      setTouched({
        name: false,
        email: false,
        password: false,
        acceptedTerms: false
      });
      navigate('/profile');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  return (
    <section className="p-8">
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={name}
            placeholder="Full Name"
            required
            onChange={(event) => setName(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900 placeholder:text-slate-500"
          />
          {touched.name && errors.name ? (
            <p className="text-left text-xs text-red-700">{errors.name}</p>
          ) : null}
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            placeholder="Email"
            required
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900 placeholder:text-slate-500"
          />
          {touched.email && errors.email ? (
            <p className="text-left text-xs text-red-700">{errors.email}</p>
          ) : null}
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            placeholder="Password"
            required
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900 placeholder:text-slate-500"
          />
          {touched.password && errors.password ? (
            <p className="text-left text-xs text-red-700">{errors.password}</p>
          ) : null}
          <div className="flex items-start gap-3">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              required
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border border-slate-400 accent-slate-900 cursor-pointer shrink-0"
            />
            <label htmlFor="accept-terms" className="text-sm text-slate-800 select-none cursor-pointer">
              I accept Terms and Conditions
            </label>
          </div>
          {touched.acceptedTerms && errors.acceptedTerms ? (
            <p className="text-left text-xs text-red-700">{errors.acceptedTerms}</p>
          ) : null}
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded font-semibold"
          >Register</button>
        </form>
      </div>
    </section>
  );
}

export default Register;
