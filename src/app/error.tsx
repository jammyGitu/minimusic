'use client'; // Error components must be Client Components

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h2 style={{ color: '#1a1a1a', marginBottom: '1rem' }}>
        页面加载出错
      </h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {error.message || '发生了未知错误'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#3a4f61',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        重新加载
      </button>
    </div>
  );
}