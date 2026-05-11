import { useProfileStore } from '../../stores/profileStore';
import { PROFILES } from '../../constants/profiles';

export function ProfileSwitch({ compact = false }: { compact?: boolean }) {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const setProfile = useProfileStore(s => s.setProfile);
  const p = PROFILES[activeProfile];
  const otherProfile = activeProfile === 'emil' ? 'nikola' : 'emil';
  const op = PROFILES[otherProfile];

  return (
    <button
      onClick={() => setProfile(otherProfile)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 999,
        padding: compact ? '6px 12px 6px 6px' : '7px 14px 7px 7px',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})`,
        display: 'grid', placeItems: 'center',
        color: '#fff', fontSize: 13, fontWeight: 700,
        boxShadow: `0 0 0 2px #0A0A0A, 0 0 0 3.5px ${p.soft2}`,
        overflow: 'hidden',
      }}>
        {p.avatar
          ? <img src={p.avatar} alt={p.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : p.fullName[0]
        }
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.01em' }}>{p.fullName}</span>
        <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', fontWeight: 500 }}>{op.fullName}</span>
        <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </span>
    </button>
  );
}
