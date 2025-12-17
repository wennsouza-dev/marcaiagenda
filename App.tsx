
import React, { useState } from 'react';
import Layout from './components/Layout.tsx';
import DirectoryTree from './components/DirectoryTree.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import { Professional, AppTab } from './types.ts';

const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    slug: 'marcos-barbeiro',
    name: 'Marcos Silva',
    category: 'Barbearia',
    bio: 'Especialista em cortes clássicos e barbas modeladas. 15 anos de experiência.',
    imageUrl: 'https://picsum.photos/seed/barber/400/300',
    rating: 4.9,
    services: [
      { id: 's1', name: 'Corte Social', duration: 30, price: 45 },
      { id: 's2', name: 'Barba Terapia', duration: 40, price: 60 },
    ]
  },
  {
    id: '2',
    slug: 'ana-psicologa',
    name: 'Ana Carolina',
    category: 'Saúde',
    bio: 'Psicoterapia cognitiva comportamental. Foco em ansiedade e performance.',
    imageUrl: 'https://picsum.photos/seed/therapy/400/300',
    rating: 5.0,
    services: [
      { id: 's3', name: 'Sessão Individual', duration: 50, price: 180 },
    ]
  },
  {
    id: '3',
    slug: 'rodrigo-personal',
    name: 'Rodrigo Nunes',
    category: 'Fitness',
    bio: 'Treinamento funcional e hipertrofia. Transformando vidas através do movimento.',
    imageUrl: 'https://picsum.photos/seed/fitness/400/300',
    rating: 4.8,
    services: [
      { id: 's4', name: 'Avaliação Física', duration: 60, price: 120 },
      { id: 's5', name: 'Treino Personalizado', duration: 60, price: 90 },
    ]
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MARKETPLACE);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.ARCHITECT:
        return (
          <div className="max-w-4xl mx-auto py-12 px-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Arquitetura MarcAI Agenda</h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-2">Responsabilidades</h3>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li><strong className="text-indigo-600">/app:</strong> Rotas, layouts e server components. Padrão SRP.</li>
                    <li><strong className="text-indigo-600">/components/ui:</strong> Componentes atômicos reutilizáveis.</li>
                    <li><strong className="text-indigo-600">/lib:</strong> Singleton clients (DB, Auth).</li>
                    <li><strong className="text-indigo-600">/services:</strong> Lógica de negócio agnóstica de framework.</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-2">Escalabilidade SaaS</h3>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li>Multi-tenancy via subdomínios ou slugs.</li>
                    <li>Edge Functions (Vercel) para menor latência.</li>
                    <li>Server Components para SEO e performance.</li>
                  </ul>
                </div>
              </div>
              <DirectoryTree />
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-indigo-400">⚡</span> Deploy & PWA
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                O projeto está estruturado para ser hospedado na Vercel com CI/CD automático.
                A preparação para PWA inclui o manifesto e service workers mapeados no diretório <code>/public</code>, prontos para serem registrados via <code>next-pwa</code> ou implementação customizada no entry-point.
              </p>
              <div className="flex gap-4">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono">App Router</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono">Server Actions</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono">Edge Config</span>
              </div>
            </div>
          </div>
        );

      case AppTab.DASHBOARD:
        return (
          <div className="max-w-7xl mx-auto py-12 px-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Área Restrita</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                No MVP real, esta rota seria protegida pelo NextAuth.js. Aqui o profissional gerencia sua agenda, serviços e lucros.
              </p>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold">Simular Login</button>
            </div>
          </div>
        );

      case AppTab.MARKETPLACE:
      default:
        return (
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Encontre o profissional ideal para seu momento.
              </h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                Agendamentos rápidos, inteligentes e sem complicações.
              </p>
            </div>

            <AIAssistant />

            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <h3 className="text-xl font-bold text-slate-800">Destaques</h3>
              <div className="flex gap-2">
                <button className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50">Todos</button>
                <button className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50">Saúde</button>
                <button className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50">Beleza</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {MOCK_PROFESSIONALS.map((prof) => (
                <ProfessionalCard 
                  key={prof.id} 
                  professional={prof} 
                  onSelect={(p) => setSelectedProfessional(p)} 
                />
              ))}
            </div>

            {selectedProfessional && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="relative h-48 bg-indigo-600">
                    <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover opacity-50" />
                    <button 
                      onClick={() => setSelectedProfessional(null)}
                      className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-6 left-8">
                      <h2 className="text-3xl font-bold text-white">{selectedProfessional.name}</h2>
                      <p className="text-white/80">{selectedProfessional.category}</p>
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="font-bold text-slate-900 mb-4">Escolha um serviço:</h4>
                    <div className="space-y-3">
                      {selectedProfessional.services.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 cursor-pointer transition-all group" onClick={() => setSelectedProfessional(null)}>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.duration} min</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600">R$ {s.price}</p>
                            <span className="text-[10px] text-indigo-400 font-bold group-hover:underline">Agendar Agora</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
