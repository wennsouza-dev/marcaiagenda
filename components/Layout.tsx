
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: any) => void;
  isLoggedIn?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isLoggedIn }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MarcAI <span className="text-indigo-600">Agenda</span></h1>
          </button>
          
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <button 
                onClick={() => onNavigate('pro_login')}
                className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Entrar
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold border border-emerald-100">
                  Logado
                </span>
                <button 
                  onClick={() => onNavigate('landing')}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2"
                  title="Sair"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] opacity-60 tracking-tight">
            &copy; 2024 MarcAI Agenda. Transformando agendamentos com IA.
          </p>
          <button 
            onClick={() => onNavigate('dev_panel')}
            className="text-[9px] text-slate-700 hover:text-slate-400 transition-colors uppercase tracking-widest font-medium"
          >
            dev mode
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
