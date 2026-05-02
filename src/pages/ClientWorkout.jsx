import { useState, useEffect } from 'react';
import { LogOut, Loader, ChevronRight, ArrowLeft, Dumbbell, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ClientWorkout() {
  const { clientData, logout } = useAuth();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('id_cliente', clientData.id)
        .order('data', { ascending: false });
      setWorkouts(data || []);
      setLoading(false);
    };
    fetchWorkouts();
  }, [clientData.id]);

  const handleSelectWorkout = async (workout) => {
    setSelectedWorkout(workout);
    setCompleted(false);
    setExercisesLoading(true);
    setExercises([]);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('id_workout', workout.id);
    setExercises(data || []);
    setExercisesLoading(false);
  };

  // ── LOADING ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="client-workout__centered">
        <Loader size={28} className="animate-spin text-secondary" />
      </div>
    );
  }

  // ── COMPLETATO ────────────────────────────────────────────
  if (completed) {
    return (
      <div className="client-workout animate-scale-in items-center justify-center text-center p-4">
        <div 
          className="flex-center mb-4" 
          style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)', boxShadow: '0 0 0 10px rgba(16, 185, 129, 0.1)' }}
        >
          <CheckCircle size={48} className="text-success" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bravissimo!</h2>
        <p className="text-secondary mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
          Hai completato la scheda di oggi,<br /><strong className="text-primary">{clientData.nome}</strong>. Continua così!
        </p>
        <div className="flex-col gap-4" style={{ width: '100%', maxWidth: '300px' }}>
          <button className="btn btn-primary w-full justify-center" onClick={() => setCompleted(false)}>
            Rivedi la scheda
          </button>
          <button className="btn btn-outline w-full justify-center" onClick={() => setSelectedWorkout(null)}>
            Altre schede
          </button>
        </div>
      </div>
    );
  }

  // ── LISTA SCHEDE ──────────────────────────────────────────
  if (!selectedWorkout) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';

    return (
      <div className="client-workout animate-fade-in">
        {/* Header fisso */}
        <div className="client-workout__header">
          <div className="flex items-center gap-3">
            <div className="avatar-circle">
              {clientData.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{greeting},</div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>{clientData.nome}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>

        {/* Lista scrollabile */}
        <div className="client-workout__scroll-area">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>Le tue schede</h2>
          {workouts.length === 0 ? (
            <div className="client-workout__empty">
              <div className="flex-center mb-4" style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-card)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Dumbbell size={32} className="text-accent" />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nessuna scheda</h3>
              <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                Il tuo trainer non ha ancora<br />assegnato nessuna scheda.
              </p>
            </div>
          ) : (
            workouts.map((w, i) => (
              <button
                key={w.id}
                className="workout-card animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => handleSelectWorkout(w)}
              >
                <div className="flex-col" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>{w.titolo}</div>
                  <div className="text-secondary flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
                    {new Date(w.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-main)' }}>
                  <ChevronRight size={20} className="text-accent" />
                </div>
              </button>
            ))
          )}
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
        </div>
      </div>
    );
  }

  // ── DETTAGLIO SCHEDA ──────────────────────────────────────
  return (
    <div className="client-workout animate-fade-in">
      {/* Header */}
      <div className="client-workout__header client-workout__header--detailed">
        <div className="flex justify-between items-center w-full">
          <button 
            className="icon-btn"
            onClick={() => setSelectedWorkout(null)}
          >
            <ArrowLeft size={20} />
          </button>
          <button className="icon-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
        <div style={{ paddingLeft: '0.25rem', marginTop: '0.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '0.25rem' }}>{selectedWorkout.titolo}</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            {new Date(selectedWorkout.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Contenuto scrollabile */}
      <div className="client-workout__scroll-area client-workout__scroll-area--padded">
        {exercisesLoading ? (
          <div className="flex-center p-4" style={{ height: '100%' }}>
            <Loader size={32} className="animate-spin text-accent" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="client-workout__empty">
            <p className="text-secondary">Nessun esercizio in questa scheda.</p>
          </div>
        ) : (
          exercises.map((ex, index) => (
            <div key={ex.id} className="exercise-card animate-slide-up" style={{ animationDelay: `${index * 0.08}s` }}>
              {/* Header esercizio */}
              <div className="flex items-start gap-4 mb-4">
                <div className="number-badge">{index + 1}</div>
                <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{ex.nome}</h3>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: ex.note ? '1.25rem' : 0 }}>
                {[['Serie', ex.serie], ['Rip.', ex.ripetizioni], ['Riposo', ex.recupero]].map(([label, val]) => (
                  <div key={label} className="stat-box">
                    <div className="text-secondary" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Note */}
              {ex.note && (
                <div style={{ paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                      {ex.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
      </div>

      {/* Bottone fisso in basso */}
      {!exercisesLoading && exercises.length > 0 && (
        <div className="client-workout__bottom-bar">
          <div className="animate-slide-up" style={{ animationDelay: '0.2s', width: '100%' }}>
            <button className="btn btn-primary w-full justify-center" style={{ padding: '1.1rem' }} onClick={() => setCompleted(true)}>
              <CheckCircle size={22} /> Completa Allenamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
