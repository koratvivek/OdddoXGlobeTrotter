import { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [saved, setSaved] = useState(() => {
    const local = localStorage.getItem('gt_saved_destinations');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('gt_saved_destinations', JSON.stringify(saved));
  }, [saved]);

  const toggleSaved = (id) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <StoreContext.Provider value={{ saved, toggleSaved }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
