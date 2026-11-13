import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="p-3.5 rounded-xl bg-[#E45B54]/15 border border-[#E45B54]/30 flex items-start gap-2.5 text-xs text-[#E45B54]">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 font-semibold leading-relaxed">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold underline hover:no-underline ml-2 text-[#E45B54] cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
