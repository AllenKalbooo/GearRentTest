import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

export default function GoogleLoginButton({ text = 'signin_with' }) {
  const { loginWithGoogle } = useAuth();
  const { isLightTheme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSuccess = ({ credential }) => {
    try {
      if (!credential) throw new Error('Missing Google credential');

      const profile = jwtDecode(credential);
      if (!profile.email) throw new Error('Missing Google profile email');

      loginWithGoogle({
        name: profile.name || profile.email,
        email: profile.email,
        picture: profile.picture || '',
        role: 'renter',
      });
      setError('');
      navigate('/catalog');
    } catch {
      setError('Google sign-in could not be completed. Please try again.');
    }
  };

  return (
    <div className="auth-google-login">
      <GoogleLogin
        theme={isLightTheme ? 'outline' : 'filled_black'}
        size="medium"
        shape="rectangular"
        text={text}
        width="100%"
        onSuccess={handleSuccess}
        onError={() => setError('Google sign-in could not be completed. Please try again.')}
      />
      {error && <span className="auth-google-error" role="status">{error}</span>}
    </div>
  );
}
