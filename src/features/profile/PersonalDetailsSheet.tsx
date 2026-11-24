import { Smartphone } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { ACTIVITY_LEVELS, GENDER_LABELS, type Profile } from './useProfileData'

const GOAL_LABELS: Record<string, string> = { cut: 'חיטוב', bulk: 'מסה', maintain: 'איזון' }

const dmy = (iso: string | null | undefined) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/**
 * Personal details (the app's "פרטים" opens the UserSetup wizard). Read-only here for now:
 * the profile row as BodyBuddy stores it.
 */
export function PersonalDetailsSheet({ open, onClose, profile, email, fullName }: { open: boolean; onClose: () => void; profile: (Profile & { goal?: string | null }) | null; email: string | null; fullName: string }) {
  const rows: { label: string; value: string | null; ltr?: boolean }[] = [
    { label: 'שם מלא', value: fullName || null },
    { label: 'אימייל', value: email, ltr: true },
    { label: 'מגדר', value: GENDER_LABELS[profile?.gender ?? ''] ?? null },
    { label: 'תאריך לידה', value: dmy(profile?.date_of_birth) ?? (profile?.age != null ? `גיל ${profile.age}` : null) },
    { label: 'גובה', value: profile?.height != null ? `${profile.height} ס״מ` : null },
    { label: 'משקל', value: profile?.weight != null ? `${profile.weight} ק״ג` : null },
    { label: 'רמת פעילות', value: ACTIVITY_LEVELS.find((a) => a.value === profile?.activity_level)?.label ?? null },
    { label: 'מטרה', value: GOAL_LABELS[profile?.goal ?? ''] ?? null },
  ]
  return (
    <Sheet open={open} title="פרטים אישיים" onClose={onClose}>
      <div className="flex flex-col gap-4 pb-8 pt-1">
        <dl className="overflow-hidden rounded-3xl border border-white/5 bg-background-800">
          {rows.map((r, i) => (
            <div key={r.label} className={`flex min-h-[52px] items-center justify-between gap-4 px-4 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}>
              <dt className="typo-label text-background-400">{r.label}</dt>
              <dd dir={r.ltr ? 'ltr' : undefined} className={`typo-body-primary truncate ${r.value ? 'text-heading' : 'text-background-500'}`}>{r.value ?? '--'}</dd>
            </div>
          ))}
        </dl>
        <p className="typo-caption flex items-center gap-2 text-background-400">
          <Smartphone size={14} aria-hidden className="flex-shrink-0" />
          עריכת הפרטים האישיים זמינה כרגע באפליקציית BodyBuddy
        </p>
      </div>
    </Sheet>
  )
}
