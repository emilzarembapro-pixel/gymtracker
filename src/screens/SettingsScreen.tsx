import { useState } from 'react';
import { useExerciseStore } from '../stores/exerciseStore';
import { TimerSettings } from '../components/settings/TimerSettings';
import { ExportImport } from '../components/settings/ExportImport';
import { CustomExerciseForm } from '../components/settings/CustomExerciseForm';
import { PROFILE_ID } from '../constants/profiles';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 flex-shrink-0">
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export function SettingsScreen() {
  const exercises = useExerciseStore(s => s.exercises);
  const deleteCustomExercise = useExerciseStore(s => s.deleteCustomExercise);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const customExercises = exercises.filter(e => e.isCustom);

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <h1 className="text-2xl font-black text-white">Ustawienia</h1>

      {/* Timer */}
      <div>
        <SectionHeader title="Timer odpoczynku" />
        <div className="glass-card p-4">
          <TimerSettings profileId={PROFILE_ID} />
        </div>
      </div>

      {/* Custom exercises */}
      <div>
        <SectionHeader title="Własne ćwiczenia" />
        {customExercises.length > 0 && (
          <div className="space-y-2 mb-3">
            {customExercises.map(ex => (
              <div
                key={ex.id}
                className="glass-card flex items-center justify-between px-4 py-3.5"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{ex.name}</div>
                  <div className="text-xs text-white/35 mt-0.5">{ex.nameEn} · {ex.category}</div>
                </div>
                <button
                  onClick={() => deleteCustomExercise(ex.id)}
                  className="p-2 text-white/25 hover:text-red-400 transition-colors"
                  aria-label="Usuń ćwiczenie"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {showCustomForm ? (
          <div className="glass-card p-4">
            <CustomExerciseForm onCreated={() => setShowCustomForm(false)} />
            <button
              onClick={() => setShowCustomForm(false)}
              className="w-full text-center text-sm text-white/35 mt-4"
            >
              Anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-semibold transition-colors"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.35)',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)';
              (e.target as HTMLButtonElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
              (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            + Dodaj własne ćwiczenie
          </button>
        )}
      </div>

      {/* Data */}
      <div>
        <SectionHeader title="Dane" />
        <ExportImport />
      </div>

      {/* App info */}
      <div className="text-center pt-2">
        <p className="text-xs text-white/20">Gym Tracker v1.0</p>
        <p className="text-xs text-white/12 mt-1">100% lokalnie · Brak backendu</p>
      </div>
    </div>
  );
}
