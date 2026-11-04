import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Changing this (for example the route) clears a previous error. */
  resetKey?: string
}

/** Stops one broken screen from blanking the whole app, and gives a way back. */
export class ErrorBoundary extends Component<Props, { error: Error | null; key?: string }> {
  state: { error: Error | null; key?: string } = {
    error: null,
    key: this.props.resetKey,
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: { error: Error | null; key?: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="screen welcome">
        <h1>Something went wrong on this screen</h1>
        <p className="muted">Nothing has been lost. Your family's data is safe. You can go back to Today, or try this screen again.</p>
        <p className="note bad">{this.state.error.message}</p>
        <button type="button" className="btn primary big block" onClick={() => (location.hash = '#/')}>
          Back to Today
        </button>
        <button type="button" className="btn block" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    )
  }
}
