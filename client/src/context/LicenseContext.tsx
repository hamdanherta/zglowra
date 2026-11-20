import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface LockInfo {
  title: string;
  message: string;
  contact: string;
  status: string;
}

export interface LicenseContextType {
  isLocked: boolean;
  lockInfo: LockInfo;
  checkStatus: (force?: boolean) => Promise<{ isLocked: boolean; status: string } | null>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<LockInfo>({
    title: 'Akses Aplikasi Dinonaktifkan',
    message: '',
    contact: '',
    status: 'AKTIF',
  });

  const checkStatus = useCallback(async (force = false) => {
    try {
      const url = force ? '/api/system/license-status?force=true' : '/api/system/license-status';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.isLocked) {
          setIsLocked(true);
          setLockInfo({
            title: data.title || 'Akses Aplikasi Dinonaktifkan',
            message: data.message || '',
            contact: data.contact || '',
            status: data.status || 'KUNCI',
          });
          return { isLocked: true, status: data.status };
        } else {
          setIsLocked(false);
          setLockInfo((prev) => ({ ...prev, status: data.status || 'AKTIF' }));
          return { isLocked: false, status: data.status };
        }
      } else if (res.status === 423) {
        // Status 423 Locked dari server backend
        const data = await res.json();
        setIsLocked(true);
        setLockInfo({
          title: data.title || 'Akses Aplikasi Dinonaktifkan',
          message: data.message || '',
          contact: data.contact || '',
          status: 'KUNCI',
        });
        return { isLocked: true, status: 'KUNCI' };
      }
    } catch (err) {
      // Abaikan error jaringan sementara
    }
    return null;
  }, []);

  // Global Interceptor: Jika ada request API apa pun yang menghasilkan HTTP 423 (Locked),
  // layar kunci langsung aktif seketika tanpa harus menunggu polling!
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 423) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data.locked) {
            setIsLocked(true);
            setLockInfo({
              title: data.title || 'Akses Aplikasi Dinonaktifkan',
              message: data.message || '',
              contact: data.contact || '',
              status: 'KUNCI',
            });
          }
        } catch (e) {
          setIsLocked(true);
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Pengecekan saat aplikasi pertama kali dimuat & polling background setiap 30 detik
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <LicenseContext.Provider value={{ isLocked, lockInfo, checkStatus }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};

export default LicenseContext;
