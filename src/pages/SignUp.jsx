import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Auth.css';

export default function SignUp() {
  const navigate = useNavigate();
  const { accountExists, setPendingSignup } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email').trim().toLowerCase();

    if (accountExists(email)) {
      setErrorMessage('An account already exists for this email. Please log in instead.');
      return;
    }

    setErrorMessage('');
    setPendingSignup({
      name: formData.get('name').trim(),
      email,
      password: formData.get('password'),
    });
    navigate('/memberships');
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-visual">
          <img
            src="https://images.stockcake.com/public/1/d/e/1de6a029-db24-4c1b-b87b-b43f445c3af6_large/photography-gear-setup-stockcake.jpg"
            alt="Photography cameras, lenses, and prints arranged on a wooden table"
          />
          <div className="auth-visual-copy">
            <span className="eyebrow">See further</span>
            <h1>Build your kit for the next horizon.</h1>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-heading">
            <div className="wordmark">GEAR RENT</div>
            <span className="eyebrow">Authentication Portal</span>
          </div>

          <form className="card auth-card" onSubmit={handleSubmit}>
            <h2>Create Account</h2>

            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input name="name" id="name" type="text" placeholder="Jane Doe" required />
            </div>

            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input name="email" id="email" type="email" placeholder="jane@studio.com" required />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input name="password" id="password" type="password" placeholder="••••••••" required />
            </div>

            {errorMessage && <p className="auth-error" role="alert">{errorMessage} <Link to="/signin">Log in</Link></p>}

            <button type="submit" className="btn btn-primary btn-block auth-submit">
              Choose Membership →
            </button>

            <p className="auth-footer-line">
              Already have an account? <Link to="/signin">Log In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
