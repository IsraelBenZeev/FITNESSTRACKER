/**
 * Privacy policy and terms of service — BodyBuddy-Client/app/privacy-policy.tsx + ui/PrivacyPolicyCard
 * + ui/PrivacyPolicyContent. Same `legal_documents` rows as the app; HE/EN toggle; "what changed" links
 * jump to their section. Routes: /privacy-policy and /terms-of-service.
 */
import { useRef, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Sparkles } from 'lucide-react'
import { bb } from '../../lib/supabaseBodyBuddy'
import { ActionButton, CloseButton, Loading } from '../workouts/ui/primitives'

type LegalType = 'privacy_policy' | 'terms_of_service'
type Lang = 'he' | 'en'

interface Section { title: string; body: string[]; items?: string[] }
interface LegalDoc {
  version: string
  content_he: Section[]
  content_en: Section[]
  created_at: string
  changes_summary_he: string[] | null
  changes_summary_en: string[] | null
}

const PRIVACY_POLICY_URL = 'https://bodybuddy.fitness/privecypolicy/'
const SECTION_REF_RE = /(?:Section|סעיף)\s+(\d+)/g

function useLegalDocument(type: LegalType) {
  return useQuery({
    queryKey: ['legal', type],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<LegalDoc> => {
      const { data, error } = await bb()
        .from('legal_documents')
        .select('version, content_he, content_en, created_at, changes_summary_he, changes_summary_en')
        .eq('document_type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error) throw error
      return data as LegalDoc
    },
  })
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function LegalPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tab: LegalType = pathname.startsWith('/terms') ? 'terms_of_service' : 'privacy_policy'
  const privacy = useLegalDocument('privacy_policy')
  const terms = useLegalDocument('terms_of_service')
  const active = tab === 'privacy_policy' ? privacy : terms

  const close = () => (window.history.length > 1 ? navigate(-1) : navigate('/profile', { replace: true }))
  const setTab = (t: LegalType) => navigate(t === 'privacy_policy' ? '/privacy-policy' : '/terms-of-service', { replace: true })

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black/90 px-6 py-6">
      <div className="flex w-full max-w-[560px] flex-col gap-3">
        <div role="tablist" className="flex self-center overflow-hidden rounded-full border border-white/10 bg-white/5">
          {([['privacy_policy', 'מדיניות פרטיות'], ['terms_of_service', 'תנאי שימוש']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`typo-caption-bold min-h-[36px] px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-500 ${tab === key ? 'bg-lime-500/20 text-lime-300' : 'text-background-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Fixed height (75% of the screen), so the card doesn't jump between tabs, languages and loading */}
        <section aria-labelledby="legal-title" className="flex h-[75dvh] w-full flex-col overflow-hidden rounded-3xl border border-lime-500/30 bg-background-900">
          <header className="flex items-center justify-between border-b border-white/10 p-4">
            <span className="h-11 w-11" aria-hidden />
            <h1 id="legal-title" className="typo-h3 text-heading">{tab === 'privacy_policy' ? 'מדיניות פרטיות' : 'תנאי שימוש'}</h1>
            <CloseButton onPress={close} label="סגור" />
          </header>
          <LegalContent key={tab} data={active.data} isLoading={active.isLoading} isError={active.isError} />
        </section>
      </div>
    </div>
  )
}

function LegalContent({ data, isLoading, isError }: { data?: LegalDoc; isLoading: boolean; isError: boolean }) {
  const [lang, setLang] = useState<Lang>('he')
  const scrollRef = useRef<HTMLDivElement>(null)

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Loading size={56} /></div>

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
        <p className="typo-body text-center text-background-400">לא ניתן לטעון כרגע את מדיניות הפרטיות. נסה שוב מאוחר יותר.</p>
        <ActionButton variant="outline" size="sm" icon={ExternalLink} label="צפה במדיניות הפרטיות באתר" onPress={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener')} />
      </div>
    )
  }

  const sections = lang === 'he' ? data.content_he : data.content_en
  const changes = lang === 'he' ? data.changes_summary_he : data.changes_summary_en
  const dir = lang === 'he' ? 'rtl' : 'ltr'

  const scrollToSection = (n: number) => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-section="${n}"]`)
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: Math.max(el.offsetTop - 12, 0), behavior: 'smooth' })
  }

  const renderChange = (text: string): ReactNode[] => {
    const parts: ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    SECTION_REF_RE.lastIndex = 0
    while ((m = SECTION_REF_RE.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index))
      const n = Number(m[1])
      parts.push(
        <button key={m.index} type="button" onClick={() => scrollToSection(n)} aria-label={`עבור לסעיף ${n}`} className="text-lime-300 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500">
          {m[0]}
        </button>,
      )
      last = SECTION_REF_RE.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <p className="typo-caption text-background-400">{data.created_at ? `גרסה ${data.version} · עודכן ב-${formatDate(data.created_at)}` : `גרסה ${data.version}`}</p>
        <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/5">
          {(['he', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              aria-label={l === 'he' ? 'הצג בעברית' : 'Show in English'}
              className={`typo-caption-bold min-h-[32px] px-3 py-1 ${lang === l ? 'bg-lime-500/20 text-lime-300' : 'text-background-400'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} dir={dir} className="relative flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-4">
        {changes && changes.length > 0 && (
          <div className="w-full rounded-3xl border border-lime-500/40 bg-lime-500/[0.12] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-500/20 text-lime-300"><Sparkles size={14} /></span>
              <h2 className="typo-body-primary text-lime-300">{lang === 'en' ? "What's new in this version" : 'מה השתנה בגרסה זו'}</h2>
            </div>
            <ul className="flex flex-col gap-1.5">
              {changes.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lime-300" />
                  <p className="typo-label flex-1 leading-5 text-background-400">{renderChange(c)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {sections?.map((s, i) => (
          <article key={i} data-section={i + 1} className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden className="typo-caption-bold flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-lime-500/40 bg-lime-500/15 text-lime-300">{i + 1}</span>
              <h2 className="typo-h4 text-heading">{s.title}</h2>
              <span aria-hidden className="h-px flex-1 bg-lime-500/40" />
            </div>
            {s.body.map((p, j) => <p key={j} className="typo-label mb-2 leading-5 text-background-400">{p}</p>)}
            {s.items && (
              <ul className="mt-1 flex flex-col gap-1.5">
                {s.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lime-500" />
                    <p className="typo-label flex-1 leading-5 text-background-400">{it}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
