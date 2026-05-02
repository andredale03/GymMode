import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { loginTrainer, loginClient, error, setError } = useAuth();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isClient) {
      const ok = await loginClient(pin);
      if (ok) navigate('/workout');
    } else {
      const ok = await loginTrainer(email, password);
      if (ok) navigate('/admin');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccessMsg('Account creato! Ora puoi accedere con le stesse credenziali.');
      setIsRegister(false);
    }
    setLoading(false);
  };

  const switchTab = (toClient) => {
    setIsClient(toClient);
    setError(null);
    setSuccessMsg(null);
    setIsRegister(false);
    setEmail('');
    setPassword('');
    setPin('');
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="minimal-panel animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '50%' }}>
            <Dumbbell className="text-primary" size={28} />
          </div>
        </div>
        <h1 className="mb-1" style={{ fontSize: '1.75rem' }}>GymMode</h1>
        <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>La tua evoluzione inizia qui.</p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            type="button"
            style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', background: isClient ? 'var(--bg-card)' : 'transparent', border: 'none', color: isClient ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: 500 }}
            onClick={() => switchTab(true)}
          >
            Cliente
          </button>
          <button
            type="button"
            style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', background: !isClient ? 'var(--bg-card)' : 'transparent', border: 'none', color: !isClient ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: 500 }}
            onClick={() => switchTab(false)}
          >
            Trainer
          </button>
        </div>

        {/* Form Cliente */}
        {isClient && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="PIN Personale"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              maxLength={10}
            />
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Accedi'}
            </button>
          </form>
        )}

        {/* Form Trainer: Login */}
        {!isClient && !isRegister && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input type="email" className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" className="input-field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
            {successMsg && <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: 0 }}>{successMsg}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Accedi'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}
            >
              Non hai un account? Registrati
            </button>
          </form>
        )}

        {/* Form Trainer: Registrazione */}
        {!isClient && isRegister && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Crea il tuo account trainer</p>
            <input type="email" className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" className="input-field" placeholder="Password (min. 6 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
            {successMsg && <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: 0 }}>{successMsg}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }} disabled={loading}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Crea Account'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}
            >
              Hai già un account? Accedi
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
