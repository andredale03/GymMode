import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Loader } from 'lucide-react';

export default function ClientModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Genera PIN random di 6 cifre al montaggio
  useEffect(() => {
    setPin(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  const regeneratePin = () => {
    setPin(Math.floor(100000 + Math.random() * 900000).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: dbError } = await supabase
      .from('clients')
      .insert({ nome: name.trim(), pin, trainer_id: user.id })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase error:', dbError);
      setError(`Errore: ${dbError.message} (code: ${dbError.code})`);
      setLoading(false);
      return;
    }

    onCreated(data);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="minimal-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Nuovo Cliente</h2>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Nome Cliente
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="es. Mario Rossi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              PIN di Accesso
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                style={{ fontFamily: 'monospace', letterSpacing: '0.2em', fontSize: '1.1rem' }}
              />
              <button type="button" onClick={regeneratePin} className="btn btn-outline" style={{ whiteSpace: 'nowrap', padding: '0.75rem' }}>
                ↻
              </button>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
              Condividi questo PIN con il cliente per il suo accesso.
            </p>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Crea Cliente'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
