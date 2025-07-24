'use client';

import Link from 'next/link';

interface CorporateActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
  disabled?: boolean;
}

export default function CorporateActionCard({
  title,
  description,
  href,
  icon,
  bgColor = 'bg-slate-50',
  iconColor = 'text-slate-600',
  disabled = false
}: CorporateActionCardProps) {
  if (disabled) {
    return (
      <div className="feature-card opacity-60 cursor-not-allowed">
        <div className={`feature-icon ${bgColor} ${iconColor}`}>
          {icon}
        </div>
        <h4 className="heading-5 text-slate-700 mb-2">{title}</h4>
        <p className="body-small text-slate-500 mb-4">{description}</p>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          Acceso restringido
        </span>
      </div>
    );
  }

  return (
    <Link href={href} className="block">
      <div className="feature-card cursor-pointer">
        <div className={`feature-icon ${bgColor} ${iconColor}`}>
          {icon}
        </div>
        <h4 className="heading-5 text-slate-700 mb-2 group-hover:text-blue-700 transition-colors">{title}</h4>
        <p className="body-small text-slate-500 mb-4">{description}</p>
        <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
          <span>Acceder</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
