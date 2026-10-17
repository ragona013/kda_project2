import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// 개발 중에는 예전 앱(포디움)이 남긴 서비스워커·캐시를 지워 옛 화면이 뜨지 않게 함
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
