
const ErrorPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-64 h-64 mb-8">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Monitor */}
          <rect x="20" y="20" width="160" height="120" rx="8" fill="#374151" />
          <rect x="30" y="30" width="140" height="90" rx="4" fill="#111827" />
          
          {/* Sick face */}
          <circle cx="80" cy="70" r="8" fill="#EF4444" /> {/* Left eye */}
          <circle cx="120" cy="70" r="8" fill="#EF4444" /> {/* Right eye */}
          <path
            d="M70 90 C90 80, 110 80, 130 90"
            stroke="#EF4444"
            strokeWidth="4"
            fill="none"
          /> {/* Sad mouth */}
          
          {/* Stand */}
          <path
            d="M80 140 L120 140 L110 160 H90 L80 140"
            fill="#374151"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
    </div>
  );
};

export default ErrorPage;
