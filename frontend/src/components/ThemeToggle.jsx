import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'light') {
      root.style.setProperty('--bg-primary', '#ffffff'); 
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--text-primary', '#1f2937');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    } else if (newTheme === 'dark') {
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--text-primary', '#f1f5f9');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
      return;
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const themes = [
    { id: 'light', name: 'Light', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', name: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { id: 'system', name: 'System', icon: <Monitor className="w-4 h-4" /> }
  ];

  return (
    <div className="flex items-center gap-2 glass-effect rounded-2xl p-2">
      {themes.map((themeOption) => (
        <button
          key={themeOption.id}
          onClick={() => changeTheme(themeOption.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
            theme === themeOption.id
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'hover:bg-white/10 text-secondary'
          }`}
        >
          {themeOption.icon}
          <span className="text-sm font-medium">{themeOption.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;