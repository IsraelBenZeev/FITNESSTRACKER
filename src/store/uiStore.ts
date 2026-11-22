import { useSyncExternalStore } from 'react'

/**
 * Global UI feedback store — the web twin of the app's `useUIStore`.
 * Anyone can call `triggerFeedback('נשמר', 'success')`; <GlobalFeedback /> shows the card.
 */
export type FeedbackType = 'success' | 'failed'

export interface UIState {
  isFeedbackVisible: boolean
  message: string
  type: FeedbackType | null
  /** Bumps on every trigger, so the same message twice still restarts the card */
  feedbackId: number
}

let state: UIState = { isFeedbackVisible: false, message: '', type: null, feedbackId: 0 }
const listeners = new Set<() => void>()

function set(next: Partial<UIState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export function triggerFeedback(message: string, type: FeedbackType) {
  set({ isFeedbackVisible: true, message, type, feedbackId: state.feedbackId + 1 })
}

export function hideFeedback() {
  set({ isFeedbackVisible: false, message: '', type: null })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useUIStore(): UIState & { triggerFeedback: typeof triggerFeedback; hideFeedback: typeof hideFeedback } {
  const s = useSyncExternalStore(subscribe, () => state)
  return { ...s, triggerFeedback, hideFeedback }
}
