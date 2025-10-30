import React, { useEffect, useState, useRef } from 'react';

export default function TimerSync({ initialOffsetSeconds = 0 }) {
  const [display, setDisplay] = useState('00:00:00');
  const startRef = useRef(Date.now() - initialOffsetSeconds * 1000);

  useEffect(() => {
    startRef.current = Date.now() - initialOffsetSeconds * 1000;
    const i = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(i);
  }, [initialOffsetSeconds]);

  return (
    <div className="text-center p-3 bg-gradient-to-r from-sky-500 to-sky-700 text-white rounded-lg">
      <div className="text-xs opacity-90">TIEMPO TRANSCURRIDO</div>
      <div className="text-2xl font-bold">{display}</div>
    </div>
  );
}
