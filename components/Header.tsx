import React from 'react';
import { GlobeIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center">
        <GlobeIcon className="w-8 h-8 mr-3 text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight">PowerTranslate AI</h1>
      </div>
    </header>
  );
};