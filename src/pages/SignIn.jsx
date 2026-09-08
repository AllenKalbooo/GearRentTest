import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Auth.css';

export default function SignIn() {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const authenticatedUser = authenticate(email, password);

    if (!authenticatedUser) {
      setErrorMessage('The email or password is incorrect. Please try again.');
      return;
    }

    setErrorMessage('');
    navigate('/catalog');
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-visual">
          <img
            src="https://northtexasjellystone.com/wp-content/uploads/2025/05/must-have-camping-gear.jpeg"
            alt="Camping gear ready for an outdoor trip"
          />
          <div className="auth-visual-copy">
            <span className="eyebrow">Pack for the outside</span>
            <h1>Good gear makes the wild feel closer.</h1>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-heading">
            <div className="wordmark">GEAR RENT</div>
            <span className="eyebrow">Authentication Portal</span>
          </div>

          <form className="card auth-card" onSubmit={handleSubmit}>
            <h2>Access Gear</h2>

            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input name="email" id="email" type="email" placeholder="user@studio.com" required />
            </div>

            <div className="field">
              <div className="field-row">
                <label htmlFor="password" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <label className="checkbox-row" htmlFor="show-password">
                  <input
                    id="show-password"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                  />
                  Show password
                </label>
              </div>
              <input
                name="password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
              />
            </div>

            {errorMessage && (
              <p className="auth-error" role="alert">
                {errorMessage} <Link to="/signup">Create account</Link>
              </p>
            )}

            <label className="checkbox-row">
              <input type="checkbox" />
              Maintain Session
            </label>

            <button type="submit" className="btn btn-primary btn-block auth-submit">
              Authenticate →
            </button>

            <p className="auth-footer-line">
              No account? <Link to="/signup">Request Access</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
