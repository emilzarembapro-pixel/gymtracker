import React, { useRef, useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { usePRStore } from '../../stores/prStore';
import { useExerciseStore } from '../../stores/exerciseStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { todayISO } from '../../utils/dates';

interface BackupData {
  version: 1;
  exportedAt: string;
  workouts: { emil: unknown[]; nikola: unknown[] };
  prs: { emil: unknown[]; nikola: unknown[] };
  customExercises: unknown[];
  settings: unknown;
}

function estimateStorageKB(): number {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('gym_')) {
      total += (localStorage.getItem(key) ?? '').length;
    }
  }
  return Math.round(total / 1024 * 10) / 10;
}

export function ExportImport() {
  const historyStore = useHistoryStore();
  const prStore = usePRStore();
  const exerciseStore = useExerciseStore();
  const settings = useSettingsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState('');
  const storageKB = estimateStorageKB();

  const handleExport = () => {
    const data: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workouts: {
        emil: historyStore.getForProfile('emil'),
        nikola: historyStore.getForProfile('nikola'),
      },
      prs: {
        emil: prStore.getAllForProfile('emil'),
        nikola: prStore.getAllForProfile('nikola'),
      },
      customExercises: exerciseStore.exercises.filter(e => e.isCustom),
      settings: {
        timerEnabled: settings.timerEnabled,
        timerDuration: settings.timerDuration,
        theme: settings.theme,
        pinnedExercises: settings.pinnedExercises,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-tracker-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as BackupData;
        if (parsed.version !== 1) {
          setImportError('Nieznana wersja pliku kopii zapasowej.');
          return;
        }
        setImportData(parsed);
        setImportModal(true);
        setImportError('');
      } catch {
        setImportError('Błąd parsowania pliku JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importData) return;
    // Write to localStorage directly
    localStorage.setItem('gym_workouts_emil', JSON.stringify(importData.workouts.emil));
    localStorage.setItem('gym_workouts_nikola', JSON.stringify(importData.workouts.nikola));
    localStorage.setItem('gym_prs_emil', JSON.stringify(importData.prs.emil));
    localStorage.setItem('gym_prs_nikola', JSON.stringify(importData.prs.nikola));
    localStorage.setItem('gym_custom_exercises', JSON.stringify(importData.customExercises));
    localStorage.setItem('gym_settings', JSON.stringify(importData.settings));
    setImportModal(false);
    // Reload to apply
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Storage usage */}
      <div className="bg-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Użyte miejsce (gym data)</span>
          <span className="text-slate-200 font-medium">{storageKB} KB / ~5 000 KB</span>
        </div>
        <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full"
            style={{ width: `${Math.min(100, (storageKB / 5000) * 100)}%` }}
          />
        </div>
      </div>

      {/* Export */}
      <Button variant="secondary" fullWidth onClick={handleExport}>
        📦 Eksportuj dane (JSON)
      </Button>

      {/* Import */}
      <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
        📂 Importuj dane z pliku
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />
      {importError && <p className="text-red-400 text-sm">{importError}</p>}

      {/* Import confirmation modal */}
      <Modal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        title="Importuj dane"
      >
        {importData && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">Plik zawiera:</p>
            <div className="bg-slate-800 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Treningi Emil</span>
                <span className="text-slate-200">{(importData.workouts.emil as unknown[]).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Treningi Nikola</span>
                <span className="text-slate-200">{(importData.workouts.nikola as unknown[]).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Własne ćwiczenia</span>
                <span className="text-slate-200">{(importData.customExercises as unknown[]).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Eksportowano</span>
                <span className="text-slate-200">{new Date(importData.exportedAt).toLocaleString('pl-PL')}</span>
              </div>
            </div>
            <p className="text-red-400 text-sm font-medium">
              ⚠️ Obecne dane zostaną zastąpione. Operacja jest nieodwracalna.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" fullWidth onClick={handleImportConfirm}>
                Zastąp dane
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setImportModal(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
