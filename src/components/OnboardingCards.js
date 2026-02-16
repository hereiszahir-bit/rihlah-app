import React, { useState } from 'react';

function OnboardingCards({ options, onComplete, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleYes = () => {
    if (isCompleting) return; // Prevent double-calls
    
    const newSelected = [...selected, options[currentIndex].value];
    
    if (currentIndex < options.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(newSelected);
    } else {
      // Last card - complete
      setIsCompleting(true);
      onComplete(newSelected);
    }
  };

  const handleSkip = () => {
    if (isCompleting) return; // Prevent double-calls
    
    if (currentIndex < options.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last card - complete
      setIsCompleting(true);
      onComplete(selected);
    }
  };

  // Enhanced safety checks
  if (!options || options.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading options...</div>
      </div>
    );
  }

  if (currentIndex >= options.length) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Completing...</div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Saving your preferences...</div>
      </div>
    );
  }

  const current = options[currentIndex];

  // Safety check for current card
  if (!current || !current.icon || !current.title) {
    console.error('Invalid card data at index:', currentIndex, current);
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading card...</div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / options.length) * 100;

  return (
    <div style={styles.container}>
      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width: `${progress}%`}} />
      </div>

      <h2 style={styles.sectionTitle}>{title}</h2>

      <div style={styles.card}>
        <div style={styles.icon}>{current.icon}</div>
        <h3 style={styles.title}>{current.title}</h3>
        <p style={styles.description}>{current.description}</p>
      </div>

      <div style={styles.actions}>
        <button style={styles.skipBtn} onClick={handleSkip}>
          Skip
        </button>
        <button style={styles.yesBtn} onClick={handleYes}>
          ❤️ Yes!
        </button>
      </div>

      <p style={styles.counter}>
        {currentIndex + 1} of {options.length}
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #fafafa 100%)',
  },
  progressBar: {
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressFill: {
    height: '100%',
    background: '#059669',
    transition: 'width 0.3s',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '24px',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    background: '#fff',
    borderRadius: '24px',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    marginBottom: '20px',
  },
  icon: {
    fontSize: '80px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  description: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: '320px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  skipBtn: {
    flex: 1,
    padding: '16px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  yesBtn: {
    flex: 2,
    padding: '16px',
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
  },
  counter: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#6b7280',
  },
};

export default OnboardingCards;