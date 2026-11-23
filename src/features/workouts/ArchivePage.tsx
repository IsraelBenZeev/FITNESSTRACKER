import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useArchivedPlans, useDeletePlanForever, useRestorePlan } from './hooks'
import { CloseButton, Loading } from './ui/primitives'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import type { Plan } from './types'

/** archive/ArchivedPlansScreen.tsx — deleted plans keep their history; restore or delete for good */
export function ArchivePage() {
  const navigate = useNavigate()
  const { data: plans, isLoading } = useArchivedPlans()
  const { mutate: restore, isPending: restoring, variables: restoringId } = useRestorePlan()
  const { mutateAsync: remove, isPending: removing } = useDeletePlanForever()
  const [toDelete, setToDelete] = useState<Plan | null>(null)

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background-1200 px-6 pb-10 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="typo-h1 text-heading">ארכיון</h1>
          <span aria-hidden className="mt-2 block h-[5px] w-[60px] rounded-[10px] bg-lime-500" />
          <p className="typo-label mt-2 text-gray-400">תוכניות שמחקת. ההיסטוריה שלהן נשמרת</p>
        </div>
        <CloseButton onPress={() => navigate('/workout')} label="חזרה לאימונים" />
      </div>

      {isLoading ? <Loading /> : !plans?.length ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/15 text-lime-500"><Archive size={30} /></span>
          <p className="typo-h4 text-heading">הארכיון ריק</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-background-850 p-4">
              <div className="min-w-0 flex-1">
                <p className="typo-h4 truncate text-heading">{p.title}</p>
                <p className="typo-caption text-gray-400">{p.exercise_ids.length} תרגילים</p>
              </div>
              <button
                type="button"
                onClick={() => restore(p.id)}
                disabled={restoring && restoringId === p.id}
                className="typo-label flex items-center gap-1.5 rounded-full border border-lime-500/45 bg-lime-500/[0.18] px-3 py-2 font-bold text-lime-300"
              >
                <RotateCcw size={16} /> שחזר
              </button>
              <button
                type="button"
                onClick={() => setToDelete(p)}
                aria-label={`מחק לצמיתות: ${p.title}`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-danger/40 bg-danger/[0.12] text-danger"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        visible={!!toDelete}
        title="מחיקה לצמיתות"
        message={`התוכנית "${toDelete?.title ?? ''}" וכל היסטוריית האימונים שלה יימחקו. לא ניתן לשחזר.`}
        confirmLabel="מחק הכול"
        isLoading={removing}
        onConfirm={async () => { if (toDelete) await remove(toDelete.id); setToDelete(null) }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
