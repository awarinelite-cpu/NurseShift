import { Component } from 'react';

// Catches render-time errors anywhere below it (e.g. a page crashing on
// unexpected/missing data) and shows a recoverable message instead of
// letting the whole app unmount into a blank white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error in app:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <div className="empty-state">
            Something went wrong loading this page.
            <div style={{ marginTop: 12 }}>
              <a href="/" style={{ fontWeight: 600 }}>← Back to duty board</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
