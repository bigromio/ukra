import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const InstallModal = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show modal after 20 seconds
      setTimeout(() => setIsVisible(true), 20000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setIsVisible(false);
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-6 sm:items-center sm:p-0">
      <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={() => setIsVisible(false)}></div>
      
      <div className="relative overflow-hidden bg-white rounded-lg shadow-xl sm:w-full sm:max-w-lg transform transition-all">
        <div className="bg-ukra-navy px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-ukra-gold">Install UKRA App</h3>
          <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">
            For the best experience, install our application on your device. Access offline features and get faster updates.
          </p>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-ukra-gold text-base leading-6 font-medium text-ukra-navy shadow-sm hover:bg-yellow-600 focus:outline-none sm:text-sm sm:w-auto flex items-center gap-2"
            onClick={handleInstallClick}
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};