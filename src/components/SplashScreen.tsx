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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#splash-grad1)" />
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="url(#splash-grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="splash-grad1" x1="2" y1="2" x2="22" y2="12">
                <stop offset="0%" stopColor="#1677ff" />
                <stop offset="100%" stopColor="#722ed1" />
              </linearGradient>
              <linearGradient id="splash-grad2" x1="2" y1="12" x2="22" y2="22">
                <stop offset="0%" stopColor="#722ed1" />
                <stop offset="100%" stopColor="#00b96b" />
              </linearGradient>
            </defs>
          </svg>
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
