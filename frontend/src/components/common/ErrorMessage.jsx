import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#C0392B]">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold underline hover:no-underline ml-2 text-[#C0392B] cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
