import React from 'react';
import { BRAND } from '../lib/constants';

/**
 * React Error Boundary — catches unhandled component errors
 * and shows a user-friendly fallback instead of a blank screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Phere] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FDF8EE 0%, #FAF0DB 100%)',
          padding: '24px',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: '420px',
            textAlign: 'center',
            padding: '40px 32px',
            borderRadius: '20px',
            background: 'white',
            border: '1px solid rgba(201, 169, 97, 0.3)',
            boxShadow: '0 8px 32px rgba(139, 26, 58, 0.08)'
          }}>
            {/* Heart icon */}
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💔</div>

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              color: '#8B1A3A',
              fontSize: '22px',
              marginBottom: '8px'
            }}>
              Oops! Kuch galat ho gaya
            </h2>

            <p style={{
              color: '#6B5050',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              {BRAND.name} mein ek unexpected error aaya hai.
              Aapka data safe hai — bas page reload karein.
            </p>

            {/* Error details (collapsed by default) */}
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                marginBottom: '24px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(196, 62, 62, 0.05)',
                border: '1px solid rgba(196, 62, 62, 0.15)',
                fontSize: '12px',
                color: '#C43E3E'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Error Details
                </summary>
                <pre style={{
                  marginTop: '8px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#8B1A3A',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: '1px solid rgba(201, 169, 97, 0.3)',
                  background: 'white',
                  color: '#6B5050',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
