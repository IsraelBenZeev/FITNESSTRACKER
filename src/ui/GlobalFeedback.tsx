import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useUIStore } from '../store/uiStore'
import { FeedbackCard } from './FeedbackCard'

/** Mounted once at the root. Shows the card from the UI store and hides it after ~2s, like the app. */
export function GlobalFeedback() {
  const { isFeedbackVisible, message, type, feedbackId, hideFeedback } = useUIStore()

  useEffect(() => {
    if (!isFeedbackVisible) return
    const timer = setTimeout(hideFeedback, 2050)
    return () => clearTimeout(timer)
  }, [isFeedbackVisible, feedbackId, hideFeedback])

  if (!isFeedbackVisible || !type) return null

  return ReactDOM.createPortal(
    // pointer-events-none: taps go through the card to the page
    <div className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-bg/20">
      <FeedbackCard key={feedbackId} type={type} message={message} />
    </div>,
    document.body,
  )
}
