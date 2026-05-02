import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // trainer (Supabase Auth)
  const [clientData, setClientData] = useState(null); // cliente (PIN login)
  const [role, setRole] = useState(null);       // 'admin' | 'client'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recupera la sessione trainer al caricamento
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setRole('admin');
      }
      setLoading(false);
    };
    getSession();

    // Listener per cambi di sessione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setRole('admin');
      } else {
        setUser(null);
        setRole(null); // Reset del ruolo al logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login Trainer (Supabase Auth)
  const loginTrainer = async (email, password) => {
    setError(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Email o password errati.');
      return false;
    }
    setUser(data.user);
    setRole('admin');
    return true;
  };

  // Login Cliente (PIN)
  const loginClient = async (pin) => {
    setError(null);
    const { data, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .eq('pin', pin)
      .single();

    if (dbError || !data) {
      setError('PIN non valido.');
      return false;
    }
    setClientData(data);
    setRole('client');
    setUser({ id: data.id, email: data.nome }); // usiamo user come flag "loggato"
    return true;
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClientData(null);
    setRole(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, clientData, role, loading, error, setError, loginTrainer, loginClient, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
