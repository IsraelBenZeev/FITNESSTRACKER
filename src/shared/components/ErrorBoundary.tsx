import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface State {
  error: Error | null
}

/** A render error shows a message (and its details) instead of a blank screen */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating to another screen clears the error
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div role="alert" className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-3 px-6 py-16 text-center">
        <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger"><AlertTriangle size={28} /></span>
        <h1 className="font-body text-lg font-semibold text-heading">משהו השתבש במסך הזה</h1>
        <pre dir="ltr" className="max-h-48 w-full overflow-auto whitespace-pre-wrap rounded-2xl border border-border-col bg-surface p-3 text-start font-mono text-xs text-muted">
          {error.message}
          {error.stack ? `\n\n${error.stack.split('\n').slice(1, 6).join('\n')}` : ''}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-accent px-5 font-body text-sm font-semibold text-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <RotateCcw size={16} aria-hidden />
          טעינה מחדש
        </button>
      </div>
    )
  }
}
