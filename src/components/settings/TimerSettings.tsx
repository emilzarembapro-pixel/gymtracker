import { useState } from 'react';
import type { ProfileId } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../utils/cn';

interface TimerSettingsProps {
  profileId: ProfileId;
}

const PRESET_DURATIONS = [60, 90, 120, 180];

export function TimerSettings({ profileId }: TimerSettingsProps) {
  const timerEnabled = useSettingsStore(s => s.timerEnabled[profileId]);
  const timerDuration = useSettingsStore(s => s.timerDuration[profileId]);
  const setTimerEnabled = useSettingsStore(s => s.setTimerEnabled);
  const setTimerDuration = useSettingsStore(s => s.setTimerDuration);
  const [customVal, setCustomVal] = useState('');

  const handleCustomSubmit = () => {
    const val = parseInt(customVal, 10);
    if (val >= 10 && val <= 600) {
      setTimerDuration(profileId, val);
      setCustomVal('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Timer odpoczynku</div>
          <div className="text-xs text-white/35 mt-0.5">Uruchamiany po zapisaniu serii</div>
        </div>
        <button
          onClick={() => setTimerEnabled(profileId, !timerEnabled)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-all duration-300',
          )}
          style={{ background: timerEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.12)', transition: 'background 0.3s ease, box-shadow 0.3s ease' }}
          aria-label={timerEnabled ? 'Wyłącz timer' : 'Włącz timer'}
        >
          <div
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              timerEnabled ? 'translate-x-7' : 'translate-x-1',
            )}
          />
        </button>
      </div>

      {/* Duration presets */}
      {timerEnabled && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-2.5">
            Czas odpoczynku
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_DURATIONS.map(sec => (
              <button
                key={sec}
                onClick={() => setTimerDuration(profileId, sec)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  timerDuration === sec
                    ? 'text-white'
                    : 'text-white/40',
                )}
                style={timerDuration === sec ? {
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-muted))',
                  transition: 'background 0.45s ease',
                } : {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Własny (sek)"
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              className="flex-1 text-white placeholder-white/25 rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                caretColor: 'var(--accent)',
              }}
              onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
            />
            <button
              onClick={handleCustomSubmit}
              className="px-4 py-2.5 text-white rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-muted))', transition: 'background 0.45s ease' }}
            >
              Ustaw
            </button>
          </div>
          <p className="text-xs text-white/25 mt-1.5">Aktualnie: {timerDuration}s</p>
        </div>
      )}
    </div>
  );
}
