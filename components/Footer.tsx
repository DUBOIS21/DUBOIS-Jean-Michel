import React from 'react';

interface CircularProgressProps {
  percentage: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ percentage }) => {
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let colorClass = 'stroke-sky-500';
  if (percentage >= 90) {
    colorClass = 'stroke-red-500';
  } else if (percentage >= 60) {
    colorClass = 'stroke-yellow-500';
  }

  return (
    <svg height={radius * 2} width={radius * 2} className="-rotate-90">
      <circle
        className="text-bunker-200 dark:text-bunker-700"
        strokeWidth={stroke}
        stroke="currentColor"
        fill="transparent"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className={`${colorClass} transition-all duration-300`}
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};


interface FooterProps {
    usage: number;
    limit: number;
}

const Footer: React.FC<FooterProps> = ({ usage, limit }) => {
    const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
    const today = new Date().toLocaleDateString('fr-FR');
  
    return (
        <footer className="sticky bottom-0 z-10 bg-bunker-100/80 dark:bg-bunker-900/80 backdrop-blur-sm transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 border-t border-bunker-200 dark:border-bunker-800">
                    <div 
                        className="flex items-center gap-3"
                        title="Nombre de générations gratuites utilisées aujourd'hui. Se réinitialise à minuit."
                        aria-label={`Utilisation quotidienne: ${usage} sur ${limit}`}
                    >
                        <div className="relative flex items-center justify-center">
                            <CircularProgress percentage={percentage} />
                            <span className="absolute text-xs font-bold text-bunker-800 dark:text-bunker-200">
                                {usage}
                                <span className="opacity-50">/{limit}</span>
                            </span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="font-semibold text-bunker-800 dark:text-bunker-200">Utilisation Quotidienne</p>
                            <p className="text-xs text-bunker-500 dark:text-bunker-400">Se réinitialise à minuit</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-bunker-500 dark:text-bunker-400">
                           Propulsé par <a href="https://www.dubois21.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 dark:text-sky-500 hover:underline">www.dubois21.com</a>
                           <span className="ml-2 text-xs">v{today}</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
  
export default Footer;