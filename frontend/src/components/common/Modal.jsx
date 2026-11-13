import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#171717]/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#DEDCD8] z-10 overflow-hidden animate-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#DEDCD8] bg-[#F2F0ED] shrink-0">
          <h3 id="modal-title" className="text-sm sm:text-base font-bold text-[#202020] truncate pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#202020] hover:bg-[#E9E7E4] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 select-text">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
