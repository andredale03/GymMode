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
      <div style={styles.centered}>
        <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }} />
        <style>{spinCSS}</style>
      </div>
    );
  }

  // ── COMPLETATO ────────────────────────────────────────────
  if (completed) {
    return (
      <div style={{ ...styles.screen, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }} className="animate-scale-in">
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 0 0 10px rgba(16, 185, 129, 0.1)' }}>
          <CheckCircle size={48} style={{ color: 'var(--success)' }} />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Bravissimo!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '3rem', lineHeight: 1.5 }}>
          Hai completato la scheda di oggi,<br /><strong style={{ color: 'var(--text-primary)' }}>{clientData.nome}</strong>. Continua così!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
          <button style={styles.btnPrimary} onClick={() => setCompleted(false)}>
            Rivedi la scheda
          </button>
          <button style={styles.btnOutline} onClick={() => setSelectedWorkout(null)}>
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
      <div style={styles.screen} className="animate-fade-in">
        {/* Header fisso */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={styles.avatarCircle}>
              {clientData.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{greeting},</div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>{clientData.nome}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>

        {/* Lista scrollabile */}
        <div style={styles.scrollArea}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>Le tue schede</h2>
          {workouts.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Dumbbell size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nessuna scheda</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Il tuo trainer non ha ancora<br />assegnato nessuna scheda.
              </p>
            </div>
          ) : (
            workouts.map((w, i) => (
              <button
                key={w.id}
                style={{ ...styles.workoutCard, animationDelay: `${i * 0.05}s` }}
                className="animate-slide-up"
                onClick={() => handleSelectWorkout(w)}
                onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>{w.titolo}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {new Date(w.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={20} style={{ color: 'var(--accent)' }} />
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
    <div style={styles.screen} className="animate-fade-in">
      {/* Header */}
      <div style={{ ...styles.header, flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {new Date(selectedWorkout.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Contenuto scrollabile */}
      <div style={{ ...styles.scrollArea, paddingBottom: '120px' }}>
        {exercisesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          </div>
        ) : exercises.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: 'var(--text-secondary)' }}>Nessun esercizio in questa scheda.</p>
          </div>
        ) : (
          exercises.map((ex, index) => (
            <div key={ex.id} style={{ ...styles.exerciseCard, animationDelay: `${index * 0.08}s` }} className="animate-slide-up">
              {/* Header esercizio */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={styles.numberBadge}>{index + 1}</div>
                <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{ex.nome}</h3>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: ex.note ? '1.25rem' : 0 }}>
                {[['Serie', ex.serie], ['Rip.', ex.ripetizioni], ['Riposo', ex.recupero]].map(([label, val]) => (
                  <div key={label} style={styles.statBox}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Note */}
              {ex.note && (
                <div style={{ paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
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
        <div style={styles.bottomBar}>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s', width: '100%' }}>
            <button style={{ ...styles.btnPrimary, width: '100%', padding: '1.1rem' }} onClick={() => setCompleted(true)}>
              <CheckCircle size={22} /> Completa Allenamento
            </button>
          </div>
        </div>
      )}

      <style>{spinCSS}</style>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const styles = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: 'var(--bg-main)',
    maxWidth: '480px',
    margin: '0 auto',
    boxShadow: '0 0 40px rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  centered: {
    height: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-main)',
  },
  header: {
    background: 'rgba(248, 250, 252, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    padding: 'calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  workoutCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.25rem',
    background: 'var(--bg-card)',
    border: '2px solid transparent',
    borderRadius: '20px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    color: 'var(--text-primary)',
    minHeight: '84px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    WebkitTapHighlightColor: 'transparent',
  },
  exerciseCard: {
    background: 'var(--bg-card)',
    border: '1px solid transparent',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  },
  statBox: {
    background: 'var(--bg-main)',
    borderRadius: '14px',
    padding: '0.85rem 0.5rem',
    textAlign: 'center',
  },
  numberBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'var(--accent)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
  },
  avatarCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '16px',
    background: 'var(--accent)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
  },
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    padding: `1rem 1.5rem calc(env(safe-area-inset-bottom, 0px) + 1rem)`,
    background: 'rgba(248, 250, 252, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(226, 232, 240, 0.8)',
    zIndex: 20,
  },
  btnPrimary: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    padding: '1rem 1.5rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '1.05rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
    WebkitTapHighlightColor: 'transparent',
  },
  btnOutline: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '16px',
    padding: '1rem 1.5rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '1.05rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    WebkitTapHighlightColor: 'transparent',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1.5rem',
    textAlign: 'center',
    flex: 1,
  },
};

const spinCSS = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
