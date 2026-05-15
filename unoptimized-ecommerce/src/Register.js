import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './AppContext';
import { formatErrorLine } from './errorLine';

function Register() {
  const { registerUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [machineError, setMachineError] = useState('');

  return (
    <section className="p-8">
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Register</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            try {
              await registerUser(name, email, password);
              setMachineError('');
              setName('');
              setEmail('');
              setPassword('');
              setAcceptedTerms(false);
              navigate('/profile');
            } catch (error) {
              setMachineError(formatErrorLine(error));
              setName('');
              setEmail('');
              setPassword('');
              setAcceptedTerms(false);
            }
          }}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            value={name}
            placeholder="Full Name"
            onChange={(event) => setName(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
          <input
            type="text"
            name="email"
            autoComplete="email"
            value={email}
            placeholder="Email"
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
          <input
            type="text"
            name="password"
            autoComplete="new-password"
            value={password}
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="w-2 h-2"
            />
            <span>Accept Terms and Conditions</span>
          </div>

          {machineError && (
            <pre className="text-left text-xs text-red-700 whitespace-pre-wrap break-words">{machineError}</pre>
          )}

          <button
            type="submit"
            disabled={!acceptedTerms}
            className="w-full bg-slate-900 text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >Register</button>
        </form>
      </div>
    </section>
  );
}

export default Register;
