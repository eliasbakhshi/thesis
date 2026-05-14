import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppContext } from './AppContext';

function Login() {
  const { loginUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

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

  const validateForm = (nextEmail, nextPassword) => ({
    email: validateEmail(nextEmail),
    password: validatePassword(nextPassword)
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
      return '400: Please enter a valid email and password.';
    }
    if (statusCode === 401) {
      return '401: Invalid email or password.';
    }
    return `${statusCode}: Login failed. Please try again.`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(email, password);
    setErrors(nextErrors);
    setTouched({
      email: true,
      password: true
    });

    if (nextErrors.email || nextErrors.password) {
      toast.error('400: Please fix the highlighted fields.');
      return;
    }

    try {
      await loginUser(email.trim(), password.trim());
      setEmail('');
      setPassword('');
      setErrors({
        email: '',
        password: ''
      });
      setTouched({
        email: false,
        password: false
      });
      navigate('/profile');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  return (
    <section className="p-8">
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            placeholder="Password"
            required
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[17px] text-slate-900 placeholder:text-slate-500"
          />
          {touched.password && errors.password ? (
            <p className="text-left text-xs text-red-700">{errors.password}</p>
          ) : null}
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
