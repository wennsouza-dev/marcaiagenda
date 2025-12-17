
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MarcAI <span className="text-indigo-600">Agenda</span></h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => setActiveTab('marketplace')}
              className={`text-sm font-medium transition-colors ${activeTab === 'marketplace' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Marketplace
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('architect')}
              className={`text-sm font-medium transition-colors ${activeTab === 'architect' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Arquitetura
            </button>
          </nav>
          <div className="flex items-center gap-4">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all">
              Login
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; 2024 MarcAI Agenda - MVP Arquitetural para Vercel.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
