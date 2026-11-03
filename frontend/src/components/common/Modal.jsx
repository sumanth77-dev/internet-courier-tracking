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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#172033]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#E1E7EF] z-10`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E1E7EF] bg-[#F5F7FA]/70 sticky top-0 z-10 backdrop-blur-xs">
          <h3 className="text-sm font-bold text-[#17243A] truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#65748B] hover:text-[#17243A] hover:bg-[#E1E7EF]/60 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
