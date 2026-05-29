import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { colors, fonts, radius, components } from '../design';

const nativeGoogleSignIn = () => {
  return new Promise((resolve, reject) => {
    window._googleSignInResolve = (idToken) => { resolve(idToken); cleanup(); };
    window._googleSignInReject = (err) => { reject(err); cleanup(); };
    const cleanup = () => { delete window._googleSignInResolve; delete window._googleSignInReject; };
    window.webkit.messageHandlers.googleSignIn.postMessage({});
  });
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfterAuth = (fallback) => {
    const pendingInvite = localStorage.getItem('rihlah_pending_invite');
    if (pendingInvite && fallback !== '/onboarding') {
      localStorage.removeItem('rihlah_pending_invite');
      window.location.href = `/join/${pendingInvite}`;
    } else {
      // Full reload ensures onAuthStateChanged has fired and
      // UserContext has currentUser set before routes evaluate.
      window.location.href = fallback;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.onboardingComplete) {
          redirectAfterAuth('/onboarding');
        } else {
          redirectAfterAuth('/destinations');
        }
      } else {
        redirectAfterAuth('/onboarding');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      let result;

      if (Capacitor.isNativePlatform()) {
        const idToken = await nativeGoogleSignIn();
        const credential = GoogleAuthProvider.credential(idToken);
        result = await signInWithCredential(auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        result = await signInWithPopup(auth, provider);
      }

      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          name: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          createdAt: new Date().toISOString(),
          onboardingComplete: false
        });
        redirectAfterAuth('/onboarding');
      } else {
        const userData = userDoc.data();
        if (!userData.onboardingComplete) {
          redirectAfterAuth('/onboarding');
        } else {
          redirectAfterAuth('/destinations');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/logo192.png" alt="Rihlah" style={styles.logoImg} />
        </div>

        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Continue your journey</p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          style={styles.googleBtn}
          disabled={loading}
        >
          <svg style={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine}></span>
        </div>

        <form onSubmit={handleEmailLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bg,
    padding: '20px',
  },
  card: {
    background: colors.surface,
    padding: '48px',
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    width: '100%',
    maxWidth: '440px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  logoImg: {
    width: 'min(140px, 35vw)',
    height: 'auto',
    borderRadius: '8px',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '26px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '15px',
    color: colors.textSecondary,
    marginBottom: '32px',
    textAlign: 'center',
  },
  error: {
    background: colors.errorBg,
    color: colors.error,
    padding: '12px 16px',
    borderRadius: radius.sm,
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fecaca',
  },
  googleBtn: {
    width: '100%',
    padding: '14px',
    background: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.sm,
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  googleIcon: {
    width: '20px',
    height: '20px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: colors.border,
  },
  dividerText: {
    fontSize: '14px',
    color: colors.textMuted,
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    ...components.input,
  },
  submitBtn: {
    ...components.btnPrimary,
    marginTop: '8px',
    fontSize: '16px',
    padding: '16px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '15px',
    color: colors.textSecondary,
  },
  link: {
    color: colors.text,
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Login;
