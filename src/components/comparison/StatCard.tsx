import type { ProfileId } from '../../types';
import { PROFILES } from '../../constants/profiles';

interface StatCardProps {
  label: string;
  emilValue: string;
  nikolaValue: string;
  winner?: ProfileId;
}

function CrownIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill={color}>
      <path d="M2 19h20v2H2v-2zM2 17l4-8 6 4 4-6 4 7-1 3H3l-1-1z" />
    </svg>
  );
}

export function StatCard({ label, emilValue, nikolaValue, winner }: StatCardProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Emil */}
        <div className="flex-1 text-center">
          <div className="text-[10px] font-semibold text-white/35 mb-1.5 uppercase tracking-wide">
            {PROFILES.emil.nickname}
          </div>
          <div
            className="text-2xl font-black tabular-nums transition-colors"
            style={{ color: winner === 'emil' ? PROFILES.emil.accent : 'rgba(255,255,255,0.25)' }}
          >
            {emilValue}
          </div>
          {winner === 'emil' && (
            <div className="flex justify-center mt-1">
              <CrownIcon color="#F59E0B" />
            </div>
          )}
        </div>

        {/* VS */}
        <div className="text-white/15 font-black text-sm px-2">VS</div>

        {/* Nikola */}
        <div className="flex-1 text-center">
          <div className="text-[10px] font-semibold text-white/35 mb-1.5 uppercase tracking-wide">
            {PROFILES.nikola.nickname}
          </div>
          <div
            className="text-2xl font-black tabular-nums transition-colors"
            style={{ color: winner === 'nikola' ? PROFILES.nikola.accent : 'rgba(255,255,255,0.25)' }}
          >
            {nikolaValue}
          </div>
          {winner === 'nikola' && (
            <div className="flex justify-center mt-1">
              <CrownIcon color="#F59E0B" />
            </div>
          )}
        </div>
      </div>
      <div className="text-center text-xs text-white/30 font-medium">{label}</div>
    </div>
  );
}
