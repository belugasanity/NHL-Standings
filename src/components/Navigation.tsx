'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center w-full my-6 relative z-10 px-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-full p-1.5 flex gap-1 shadow-lg shadow-black/20">
        <Link 
          href="/"
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            pathname === '/' 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Playoff Bracket
        </Link>
        <Link 
          href="/trivia"
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            pathname === '/trivia' 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          Player Trivia
        </Link>
      </div>
    </nav>
  );
}
