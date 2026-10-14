import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import './SplashScreen.css';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [loadingText, setLoadingText] = useState('Initializing workspace...');
  const [fadeClass, setFadeClass] = useState('');

  useEffect(() => {
    const textSequence = [
      { time: 500, text: 'Connecting to local database...' },
      { time: 1100, text: 'Loading team directories...' },
      { time: 1700, text: 'Restoring active timesheets...' },
      { time: 2200, text: 'Ready!' }
    ];

    textSequence.forEach(step => {
      setTimeout(() => {
        setLoadingText(step.text);
      }, step.time);
    });

    // Start fade out animation slightly before finishing
    const fadeTimeout = setTimeout(() => {
      setFadeClass('splash-fade-out');
    }, 2500);

    const finishTimeout = setTimeout(() => {
      onFinish();
    }, 2900);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(finishTimeout);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadeClass}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <img
            src="/logo.png"
            alt="TaskFlow Logo"
            style={{ width: 84, height: 84, objectFit: 'contain', filter: 'drop-shadow(0 0 16px rgba(22, 119, 255, 0.5))' }}
          />
        </div>
        <h1 className="splash-title">TaskFlow</h1>
        <p className="splash-subtitle">Manage &bull; Track &bull; Deliver</p>
        <div className="splash-loading-container">
          <Spin size="large" />
          <div className="splash-loading-text">{loadingText}</div>
        </div>
      </div>
    </div>
  );
};
