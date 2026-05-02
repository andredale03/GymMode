import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Trash2, Loader, X } from 'lucide-react';

export default function WorkoutBuilder({ client, trainerId, onSaved, onCancel, existingWorkout, existingExercises }) {
  const isEditing = !!existingWorkout;

  const [title, setTitle] = useState(existingWorkout?.titolo || '');
  const [date, setDate] = useState(existingWorkout?.data || new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState(
    existingExercises?.map((ex) => ({
      name: ex.nome,
      gif_url: ex.gif_url || '',
      sets: ex.serie || '3',
      reps: ex.ripetizioni || '10',
      rest: ex.recupero || '90 secondi',
      notes: ex.note || '',
    })) || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const searchExercises = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://wger.de/api/v2/exercise/?format=json&language=2&limit=6&name=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      const results = (data.results || []).map((ex) => ({ name: ex.name || searchQuery, gif_url: '' }));
      setSearchResults(results.length > 0 ? results : [{ name: searchQuery, gif_url: '' }]);
    } catch {
      setSearchResults([{ name: searchQuery, gif_url: '' }]);
    }
    setSearchLoading(false);
  };

  const addExercise = (ex) => {
    setExercises((prev) => [
      ...prev,
      { name: ex.name, gif_url: ex.gif_url, sets: '3', reps: '10', rest: '90 secondi', notes: '' },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateExercise = (index, field, value) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  };

  const removeExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Inserisci un titolo per la scheda.'); return; }
    if (exercises.length === 0) { setError('Aggiungi almeno un esercizio.'); return; }
    setError(null);
    setSaving(true);

    const buildPayload = (workoutId) =>
      exercises.map((ex) => ({
        id_workout: workoutId,
        nome: ex.name,
        gif_url: ex.gif_url,
        serie: ex.sets,
        ripetizioni: ex.reps,
        recupero: ex.rest,
        note: ex.notes,
      }));

    if (isEditing) {
      // 1. Aggiorna titolo e data
      const { error: wErr } = await supabase
        .from('workouts')
        .update({ titolo: title.trim(), data: date })
        .eq('id', existingWorkout.id);

      if (wErr) { setError(`Errore: ${wErr.message}`); setSaving(false); return; }

      // 2. Elimina vecchi esercizi e re-inserisce
      await supabase.from('exercises').delete().eq('id_workout', existingWorkout.id);
      const { error: exErr } = await supabase.from('exercises').insert(buildPayload(existingWorkout.id));
      if (exErr) { setError(`Errore esercizi: ${exErr.message}`); setSaving(false); return; }

      setSaving(false);
      onSaved({ ...existingWorkout, titolo: title.trim(), data: date }, true);

    } else {
      // 1. Crea nuova scheda
      const { data: workout, error: wErr } = await supabase
        .from('workouts')
        .insert({ titolo: title.trim(), data: date, id_cliente: client.id, trainer_id: trainerId })
        .select()
        .single();

      if (wErr) { setError(`Errore scheda: ${wErr.message} (${wErr.code})`); setSaving(false); return; }

      // 2. Crea gli esercizi
      const { error: exErr } = await supabase.from('exercises').insert(buildPayload(workout.id));
      if (exErr) { setError(`Errore esercizi: ${exErr.message} (${exErr.code})`); setSaving(false); return; }

      setSaving(false);
      onSaved(workout, false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.2 }}>{isEditing ? 'Modifica Scheda' : 'Nuova Scheda'}</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>per {client.nome}</p>
        </div>
        <button onClick={onCancel} className="btn btn-outline" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} />
        </button>
      </div>

      {/* Titolo + Data */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Titolo scheda (es. Giorno 1 – Full Body)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="input-field"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {/* Ricerca esercizi */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search className="text-secondary" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} size={16} />
            <input
              type="text"
              className="input-field"
              placeholder="Cerca o scrivi nome esercizio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchExercises()}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button className="btn btn-outline" onClick={searchExercises} disabled={searchLoading} style={{ whiteSpace: 'nowrap' }}>
            {searchLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Cerca'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="minimal-panel" style={{ padding: '0.5rem', borderRadius: '16px', marginTop: '0.5rem' }}>
            {searchResults.map((ex, i) => (
              <button
                key={i}
                onClick={() => addExercise(ex)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.85rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '12px', textAlign: 'left', transition: 'background 0.15s', fontSize: '0.95rem', fontWeight: 500 }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} className="text-secondary" />
                </div>
                {ex.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista esercizi */}
      {exercises.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {exercises.map((ex, i) => (
            <div key={i} className="animate-slide-up" style={{ padding: '1.25rem', background: 'var(--bg-main)', borderRadius: '16px', animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{i + 1}</div>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>{ex.name}</span>
                </div>
                <button onClick={() => removeExercise(i)} style={{ background: 'var(--bg-card)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[['sets', 'Serie'], ['reps', 'Rip.'], ['rest', 'Recupero']].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-secondary" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem', fontWeight: 600, paddingLeft: '0.25rem' }}>{label}</label>
                    <input
                      type="text"
                      className="input-field"
                      value={ex[field]}
                      onChange={(e) => updateExercise(i, field, e.target.value)}
                      style={{ padding: '0.6rem 0.75rem', fontSize: '0.95rem', background: 'var(--bg-card)' }}
                    />
                  </div>
                ))}
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Note (opzionale)"
                value={ex.notes}
                onChange={(e) => updateExercise(i, 'notes', e.target.value)}
                style={{ padding: '0.6rem 0.75rem', fontSize: '0.9rem', marginTop: '0.5rem', background: 'var(--bg-card)' }}
              />
            </div>
          ))}

        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.85rem' }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : isEditing ? 'Salva Modifiche' : 'Salva Scheda'}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
