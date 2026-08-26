import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: 'calc(84px + 6rem) 0 6rem', textAlign: 'center' }}>
      <p className="eyebrow" style={{ justifyContent: 'center' }}>404</p>
      <h1 className="text-4xl" style={{ margin: '0.5rem 0' }}>This page has wandered off</h1>
      <p style={{ color: 'var(--color-stone)', marginBottom: '2rem' }}>
        Let's get you back to the courtyard.
      </p>
      <Link to="/" className="btn btn-primary">Return Home</Link>
    </div>
  );
}
