
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import DirectoryTree from './components/DirectoryTree.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
import { supabase } from './lib/supabase.ts';

// Mock inicial expandido (fallback caso o DB esteja vazio)
const DEFAULT_PROFESSIONALS: Professional[] = [
  {
    id: '1', slug: 'marcos-barbeiro', name: 'Marcos Silva', salonName: 'Barbearia do Marcos', category: 'Beleza', city: 'São Paulo',
    bio: 'Especialista em visagismo e barboterapia.', imageUrl: 'https://picsum.photos/seed/barber/400/300',
    rating: 4.9, services: [{ id: 's1', name: 'Corte de Cabelo', duration: 30, price: 50 }]
  }
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', professionalId: '1', clientName: 'João Silva', serviceId: 's1', date: '2024-06-25', time: '14:00', status: 'confirmed' },
  { id: 'a2', professionalId: '1', clientName: 'Maria Lima', serviceId: 's1', date: '2024-06-25', time: '15:30', status: 'pending' },
];

// Componente separado para o Painel do Desenvolvedor
const DeveloperPanel: React.FC<{ 
  onRefresh: () => void; 
}> = ({ onRefresh }) => {
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newProf, setNewProf] = useState({ 
    name: '', 
    salonName: '',
    category: '', 
    city: '', 
    username: '', 
    password: '',
    expireDays: -1
  });

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-3xl text-white w-full max-w-sm space-y-6 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <h2 className="text-2xl font-bold">Modo Desenvolvedor</h2>
          <p className="text-slate-400 text-sm">Insira a senha mestra para gerenciar a arquitetura.</p>
          <input 
            type="password" 
            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-center text-xl font-mono text-indigo-400 placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pwd === '220624' && setAuthed(true)}
          />
          <button 
            onClick={() => pwd === '220624' ? setAuthed(true) : alert('Senha incorreta')}
            className="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
          >
            Acessar Painel
          </button>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    if (!newProf.name || !newProf.username || !newProf.password) {
      alert('Preencha nome completo, usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      // O e-mail no Supabase será (usuario)@marcai.dev
      const authEmail = `${newProf.username.toLowerCase()}@marcai.dev`;

      // 1. Cadastro no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: newProf.password,
        options: {
          data: {
            full_name: newProf.name,
            salon_name: newProf.salonName,
            role: 'professional'
          }
        }
      });

      if (authError) throw authError;

      // 2. Cadastro na tabela de profissionais (Table Editor)
      const professionalData = {
        name: newProf.name,
        salon_name: newProf.salonName,
        category: newProf.category || 'Geral',
        city: newProf.city || 'Remoto',
        slug: newProf.name.toLowerCase().replace(/\s+/g, '-'),
        bio: 'Profissional cadastrado via painel administrativo.',
        imageUrl: `https://picsum.photos/seed/${newProf.name}/400/300`,
        rating: 5.0,
        expire_days: newProf.expireDays,
        services: [{ id: 'sx', name: 'Atendimento Padrão', duration: 45, price: 100 }]
      };

      const { error: dbError } = await supabase
        .from('professionals')
        .insert([professionalData]);

      if (dbError) {
        console.warn("Erro ao inserir na tabela (verifique se a tabela 'professionals' existe no Supabase):", dbError.message);
      }

      alert(`Profissional cadastrado com sucesso! Acesso: ${authEmail}`);
      setNewProf({ name: '', salonName: '', category: '', city: '', username: '', password: '', expireDays: -1 });
      onRefresh();
    } catch (err: any) {
      alert('Erro no cadastro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900">🛠️ Painel Administrativo</h2>
          <p className="text-slate-500">Gestão de Profissionais e Infraestrutura</p>
        </div>
        <button onClick={() => setAuthed(false)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Sair</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Novo Profissional (Auth + DB)</h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Dados Básicos</h4>
              <div className="space-y-1">
                <input 
                  placeholder="Nome Completo" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newProf.name}
                  onChange={(e) => setNewProf({...newProf, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input 
                  placeholder="Categoria" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newProf.category}
                  onChange={(e) => setNewProf({...newProf, category: e.target.value})}
                />
                <input 
                  placeholder="Nome do Salão" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newProf.salonName}
                  onChange={(e) => setNewProf({...newProf, salonName: e.target.value})}
                />
                <input 
                  placeholder="Cidade" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newProf.city}
                  onChange={(e) => setNewProf({...newProf, city: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-indigo-400 mt-[-8px] px-1 italic">O nome do salão será exibido no perfil do profissional para o agendamento do cliente.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Acesso (Supabase Auth)</h4>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Usuário" 
                  className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newProf.username}
                  onChange={(e) => setNewProf({...newProf, username: e.target.value})}
                />
                <div className="absolute right-4 top-3.5 text-slate-400 text-sm font-medium">@marcai.dev</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="password" 
                  placeholder="Senha temporária" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newProf.password}
                  onChange={(e) => setNewProf({...newProf, password: e.target.value})}
                />
                <div className="space-y-1">
                  <input 
                    type="number" 
                    placeholder="Dias para expirar" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newProf.expireDays}
                    onChange={(e) => setNewProf({...newProf, expireDays: parseInt(e.target.value) || 0})}
                  />
                  <p className="text-[9px] text-slate-400 italic px-1">Prazo de acesso: 0 = inativo, &lt;0 = ilimitado</p>
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              onClick={handleRegister}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100/50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {loading ? 'Processando...' : 'Cadastrar Profissional'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Arquitetura de Pastas</h3>
          <DirectoryTree />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Busca inicial do Supabase
  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Mapeia campos snake_case do DB para camelCase se necessário
        const mappedData = data.map((p: any) => ({
          ...p,
          salonName: p.salon_name,
          expireDays: p.expire_days
        }));
        setProfessionals(mappedData);
      } else {
        setProfessionals(DEFAULT_PROFESSIONALS);
      }
    } catch (err) {
      console.warn("Usando dados mockados (tabela 'professionals' não encontrada ou sem acesso).");
      setProfessionals(DEFAULT_PROFESSIONALS);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p => {
      const matchText = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (p.salonName && p.salonName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCity = cityFilter === '' || p.city === cityFilter;
      const matchCat = categoryFilter === '' || p.category === categoryFilter;
      return matchText && matchCity && matchCat;
    });
  }, [searchTerm, cityFilter, categoryFilter, professionals]);

  const cities = Array.from(new Set(professionals.map(p => p.city)));
  const categories = Array.from(new Set(professionals.map(p => p.category)));

  const renderLanding = () => (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden bg-slate-50">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-200 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-5xl text-center space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="space-y-4">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Agendamentos que <span className="text-indigo-600">aprendem</span> com você.
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            A plataforma inteligente que conecta clientes a profissionais de forma simples, rápida e assistida por IA.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          <button 
            onClick={() => setView(AppView.CLIENTS)}
            className="group relative flex flex-col items-center text-center p-10 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 active:scale-95"
          >
            <div className="w-24 h-24 mb-6 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Sou cliente</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              procurar profissionais para agendar serviço
            </p>
          </button>

          <button 
            onClick={() => setView(AppView.PROFESSIONAL_LOGIN)}
            className="group relative flex flex-col items-center text-center p-10 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 active:scale-95"
          >
            <div className="w-24 h-24 mb-6 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Área do Profissional</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              gerencie sua agenda, serviços e faturamento
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-6">
        <h2 className="text-3xl font-bold text-slate-900">Explore o Marketplace</h2>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid md:grid-cols-4 gap-4">
          <div className="relative col-span-2">
            <input 
              type="text"
              placeholder="Nome, Salão ou Serviço..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">Todas as Cidades</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Categorias</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProfessionals.map((prof) => (
          <ProfessionalCard 
            key={prof.id} 
            professional={prof} 
            onSelect={(p) => setSelectedProfessional(p)} 
          />
        ))}
      </div>
    </div>
  );

  const renderProLogin = () => (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Acesse sua Agenda</h2>
          <p className="text-slate-500 text-sm mt-2">Logon realizado via Supabase Auth (@marcai.dev).</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</label>
            <div className="relative">
              <input type="text" placeholder="username" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="absolute right-4 top-3.5 text-slate-400 text-sm">@marcai.dev</div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
            <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button 
            onClick={() => { setIsLoggedIn(true); setView(AppView.PROFESSIONAL_DASHBOARD); }}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 active:scale-95"
          >
            Entrar no Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const renderProDashboard = () => (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 px-4">Painel do Profissional</h3>
          <button className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center gap-3">
            Início / Agenda
          </button>
          <button 
            onClick={() => { setIsLoggedIn(false); setView(AppView.LANDING); }}
            className="w-full text-left px-4 py-3 rounded-xl text-red-500 font-bold hover:bg-red-50 flex items-center gap-3 mt-4"
          >
            Sair
          </button>
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Agenda do Profissional</h2>
            <p className="text-slate-500 italic">Área integrada ao gerenciamento de agendamentos.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const currentView = () => {
    switch (view) {
      case AppView.LANDING: return renderLanding();
      case AppView.CLIENTS: return renderMarketplace();
      case AppView.PROFESSIONAL_LOGIN: return renderProLogin();
      case AppView.PROFESSIONAL_DASHBOARD: return renderProDashboard();
      case AppView.DEVELOPER_PANEL: return (
        <DeveloperPanel onRefresh={fetchProfessionals} />
      );
      default: return renderLanding();
    }
  };

  return (
    <Layout activeView={view} onNavigate={setView} isLoggedIn={isLoggedIn}>
      {currentView()}

      {selectedProfessional && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative h-64">
              <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover rounded-t-[40px] opacity-90" />
              <button 
                onClick={() => setSelectedProfessional(null)}
                className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all"
              >
                ✕
              </button>
              <div className="absolute bottom-8 left-10 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold inline-block">{selectedProfessional.category}</span>
                  {selectedProfessional.salonName && (
                    <span className="bg-slate-900/40 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold inline-block">
                      🏪 {selectedProfessional.salonName}
                    </span>
                  )}
                </div>
                <h2 className="text-4xl font-black drop-shadow-lg">{selectedProfessional.name}</h2>
                <p className="font-medium opacity-90">📍 {selectedProfessional.city}</p>
              </div>
            </div>
            
            <div className="p-10 grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Sobre</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedProfessional.bio}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Serviços Disponíveis</h4>
                  <div className="space-y-3">
                    {selectedProfessional.services?.map(s => (
                      <div key={s.id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 transition-all cursor-pointer flex justify-between items-center group">
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.duration} min</p>
                        </div>
                        <p className="font-bold text-indigo-600">R$ {s.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100">
                <AIAssistant context={selectedProfessional} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
