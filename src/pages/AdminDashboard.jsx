import { useState, useEffect } from 'react';
import { LogOut, User, Plus, ChevronRight, Loader, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ClientModal from '../components/ClientModal';
import WorkoutBuilder from '../components/WorkoutBuilder';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Carica lista clienti
  useEffect(() => {
    const fetchClients = async () => {
      setClientsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', user.id)
        .order('nome');
      if (!error) setClients(data || []);
      setClientsLoading(false);
    };
    fetchClients();
  }, [user.id]);

  // Carica schede del cliente selezionato
  useEffect(() => {
    if (!selectedClient) return;
    setSelectedWorkout(null);
    setWorkoutExercises([]);
    const fetchWorkouts = async () => {
      setWorkoutsLoading(true);
      setWorkouts([]);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id_cliente', selectedClient.id)
        .order('data', { ascending: false });
      if (!error) setWorkouts(data || []);
      setWorkoutsLoading(false);
    };
    fetchWorkouts();
  }, [selectedClient]);

  // Apre dettaglio scheda e carica esercizi
  const handleSelectWorkout = async (workout) => {
    setSelectedWorkout(workout);
    setExercisesLoading(true);
    setWorkoutExercises([]);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('id_workout', workout.id);
    setWorkoutExercises(data || []);
    setExercisesLoading(false);
  };

  // Elimina scheda (gli esercizi vengono eliminati a cascata)
  const handleDeleteWorkout = async (workoutId) => {
    if (!confirm('Sei sicuro di voler eliminare questa scheda?')) return;
    await supabase.from('workouts').delete().eq('id', workoutId);
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    setSelectedWorkout(null);
    setWorkoutExercises([]);
  };

  const handleClientCreated = (newClient) => {
    setClients((prev) => [...prev, newClient].sort((a, b) => a.nome.localeCompare(b.nome)));
  };

  const handleWorkoutSaved = (savedWorkout, isEditing) => {
    if (isEditing) {
      setWorkouts((prev) => prev.map((w) => w.id === savedWorkout.id ? savedWorkout : w));
      setSelectedWorkout(savedWorkout);
      // Ricarica gli esercizi aggiornati
      handleSelectWorkout(savedWorkout);
    } else {
      setWorkouts((prev) => [savedWorkout, ...prev]);
    }
    setShowBuilder(false);
    setEditingWorkout(null);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1200px' }}>
      {/* Header */}
      <header className="flex items-center justify-between mb-4" style={{ background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
          <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '14px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h1 className="mb-1" style={{ fontSize: '1.25rem', lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Trainer Dashboard</h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ flexShrink: 0, padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={18} /> <span className="desktop-only" style={{ paddingRight: '0.25rem' }}>Esci</span>
        </button>
      </header>

      <div className="dashboard-grid">

        {/* Colonna clienti */}
        <section className={`minimal-panel ${selectedClient ? 'desktop-only' : ''}`} style={{ padding: '1.5rem' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '1.25rem' }}>Clienti</h2>
            <button className="btn btn-primary" onClick={() => setShowClientModal(true)} style={{ padding: '0.5rem', borderRadius: '12px' }}>
              <Plus size={18} />
            </button>
          </div>

          {clientsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader size={24} className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '12px' }}>
              <User size={32} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
              <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0 }}>Nessun cliente ancora.<br />Clicca + per aggiungerne uno.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => { setSelectedClient(client); setShowBuilder(false); }}
                  className="animate-slide-up"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem',
                    background: selectedClient?.id === client.id ? 'var(--accent-light)' : 'var(--bg-main)',
                    border: selectedClient?.id === client.id ? '2px solid var(--accent)' : '2px solid transparent', 
                    borderRadius: '16px', cursor: 'pointer', width: '100%',
                    color: 'var(--text-primary)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: selectedClient?.id === client.id ? 'var(--accent)' : 'var(--bg-card)', color: selectedClient?.id === client.id ? '#fff' : 'var(--text-secondary)', padding: '0.6rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <User size={18} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: selectedClient?.id === client.id ? 'var(--accent-hover)' : 'inherit' }}>{client.nome}</div>
                      <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>PIN: <strong style={{ letterSpacing: '0.05em' }}>{client.pin}</strong></div>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: selectedClient?.id === client.id ? 'var(--accent)' : 'var(--text-secondary)' }} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Colonna destra */}
        <section className={`${!selectedClient ? 'desktop-only' : ''} animate-fade-in`}>
          {!selectedClient ? (
            <div className="minimal-panel" style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'rgba(255, 255, 255, 0.5)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <User size={32} className="text-secondary" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nessun cliente selezionato</h3>
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>Seleziona un cliente dalla lista a sinistra per visualizzare e gestire le sue schede di allenamento.</p>
            </div>

          ) : showBuilder ? (
            <div className="minimal-panel" style={{ padding: '1.5rem' }}>
              {/* Back button for mobile */}
              <button onClick={() => setSelectedClient(null)} className="btn btn-outline mobile-only" style={{ padding: '0.5rem 1rem', marginBottom: '1rem', borderRadius: '12px' }}>
                <ArrowLeft size={16} /> Torna ai clienti
              </button>
              <WorkoutBuilder
                client={selectedClient}
                trainerId={user.id}
                onSaved={handleWorkoutSaved}
                onCancel={() => { setShowBuilder(false); setEditingWorkout(null); }}
                existingWorkout={editingWorkout}
                existingExercises={editingWorkout ? workoutExercises : undefined}
              />
            </div>

          ) : selectedWorkout ? (
            /* Vista dettaglio scheda */
            <div className="minimal-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setSelectedWorkout(null); setWorkoutExercises([]); }}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', borderRadius: '12px' }}
                >
                  <ArrowLeft size={16} />
                </button>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, lineHeight: 1.2 }}>{selectedWorkout.titolo}</h2>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {new Date(selectedWorkout.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => { setEditingWorkout(selectedWorkout); setShowBuilder(true); }}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', borderRadius: '12px' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(selectedWorkout.id)}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', borderRadius: '12px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {exercisesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader size={24} className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : workoutExercises.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '16px' }}>
                  <p className="text-secondary" style={{ margin: 0, fontSize: '0.95rem' }}>Nessun esercizio in questa scheda.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workoutExercises.map((ex, i) => (
                    <div key={ex.id} className="animate-slide-up" style={{ padding: '1.25rem', background: 'var(--bg-main)', borderRadius: '16px', animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{i + 1}</div>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>{ex.nome}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {[['Serie', ex.serie], ['Ripetizioni', ex.ripetizioni], ['Recupero', ex.recupero]].map(([label, val]) => (
                          <div key={label} style={{ background: 'var(--bg-card)', padding: '0.6rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <div className="text-secondary" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem', fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {ex.note && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                          <span>💡</span>
                          <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{ex.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : (
            /* Lista schede del cliente */
            <div className="minimal-panel" style={{ padding: '1.5rem' }}>
              <div className="flex items-center justify-between mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={() => setSelectedClient(null)} className="btn btn-outline mobile-only" style={{ padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedClient.nome}</h2>
                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Schede assegnate</p>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowBuilder(true)} style={{ padding: '0.6rem 1rem', borderRadius: '12px' }}>
                  <Plus size={16} /> <span className="desktop-only" style={{ marginLeft: '0.25rem' }}>Nuova</span>
                </button>
              </div>

              {workoutsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader size={24} className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : workouts.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '16px' }}>
                  <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0 }}>Nessuna scheda ancora.<br />Creane una con il tasto +</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {workouts.map((w, i) => (
                    <button
                      key={w.id}
                      className="animate-slide-up"
                      onClick={() => handleSelectWorkout(w)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1.25rem', border: '2px solid transparent', borderRadius: '16px',
                        background: 'var(--bg-main)', cursor: 'pointer', color: 'var(--text-primary)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', width: '100%', textAlign: 'left',
                        animationDelay: `${i * 0.05}s`
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                      onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>{w.titolo}</div>
                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                          {new Date(w.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={18} className="text-secondary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {showClientModal && (
        <ClientModal onClose={() => setShowClientModal(false)} onCreated={handleClientCreated} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
