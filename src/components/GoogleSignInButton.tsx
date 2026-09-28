import React from 'react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  shape?: 'rectangular' | 'pill';
  text?: 'signin_with' | 'continue_with';
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  isLoading = false,
  theme = 'light',
  shape = 'pill',
  text = 'signin_with',
  disabled = false,
  className = '',
  id = 'google-signin-btn',
}) => {
  const isLight = theme === 'light';

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Sign in with Google"
      className={`
        group relative inline-flex items-center justify-center gap-3.5 
        px-7 py-3.5 text-[15px] font-medium tracking-normal
        transition-all duration-200 cursor-pointer select-none
        ${shape === 'pill' ? 'rounded-full' : 'rounded-lg'}
        ${
          isLight
            ? 'bg-white text-[#3c4043] border border-[#dadce0] hover:bg-[#f8fafd] hover:border-[#c6cbd4] hover:shadow-md active:bg-[#eef2f6] shadow-sm'
            : 'bg-[#131314] text-[#e3e3e3] border border-[#444746] hover:bg-[#1f1f21] hover:border-[#5e5e62] hover:shadow-lg active:bg-[#28282b] shadow-sm'
        }
        disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4] focus-visible:ring-offset-2
        ${className}
      `}
      style={{ fontFamily: "'Roboto', 'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-t-transparent border-[#4285f4] rounded-full animate-spin" />
      ) : (
        /* Official Google 4-color "G" Logo */
        <svg
          className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}

      <span className="font-medium whitespace-nowrap">
        {isLoading
          ? 'Signing in...'
          : text === 'signin_with'
          ? 'Sign in with Google'
          : 'Continue with Google'}
      </span>
    </button>
  );
};
