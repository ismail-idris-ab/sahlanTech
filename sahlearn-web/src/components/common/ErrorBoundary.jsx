import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl font-bold text-ink-900 font-display mb-3">Something went wrong</h1>
          <p className="text-ink-500 mb-6 max-w-md">
            An unexpected error occurred. Refresh the page or go back to continue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primaryDark transition-colors"
            >
              Refresh page
            </button>
            <a
              href="/"
              className="px-5 py-2.5 border border-ink-300 text-ink-700 font-medium rounded-lg hover:bg-surface-100 transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
