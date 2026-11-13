import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="w-7 h-7 text-[#FF7547] animate-spin mb-2.5" />
      {message && <p className="text-xs font-semibold text-[#777777]">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
