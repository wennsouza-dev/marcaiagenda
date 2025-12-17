
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import DirectoryTree from './components/DirectoryTree.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
import { supabase } from './lib/supabase.ts';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const DEFAULT_PROFESSIONALS: Professional[] = [
  {
    id: '1', slug: 'marcos-barbeiro', name: 'Marcos Silva', salonName: 'Barbearia do Marcos', category: 'Beleza', city: 'São Paulo',
    bio: 'Especialista em visagismo e barboterapia.', imageUrl: 'https://picsum.photos/seed/barber/400/300',
    rating: 4.9, services: [{ id: 's1', name: 'Corte de Cabelo', duration: 30, price: 50, preBooking: false }]
  }
];

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
    const cleanUsername = newProf.username.trim().toLowerCase().replace(/\s+/g, '');
    if (!newProf.name || !cleanUsername || !newProf.password) {
      alert('Preencha nome completo, usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      const authEmail = `${cleanUsername}@marcai.dev`;
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

      const professionalData = {
        name: newProf.name,
        salon_name: newProf.salonName,
        category: newProf.category || 'Geral',
        city: newProf.city || 'Remoto',
        slug: newProf.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000),
        bio: 'Profissional cadastrado via painel administrativo.',
        imageUrl: `https://picsum.photos/seed/${cleanUsername}/400/300`,
        rating: 5.0,
        expire_days: newProf.expireDays,
        services: [{ id: 'sx', name: 'Atendimento Padrão', duration: 45, price: 100 }]
      };

      const { error: dbError } = await supabase.from('professionals').insert([professionalData]);
      if (dbError) throw dbError;

      alert(`Profissional cadastrado com sucesso!\nAcesso: ${authEmail}`);
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
          <p className="text-slate-500">Gestão de Profissionais (Supabase Ativo)</p>
        </div>
        <button onClick={() => setAuthed(false)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Sair</button>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Novo Profissional (Auth + DB)</h3>
          <div className="space-y-6">
            <div className="space-y-4">
              <input placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProf.name} onChange={(e) => setNewProf({...newProf, name: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Categoria" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.category} onChange={(e) => setNewProf({...newProf, category: e.target.value})} />
                <input placeholder="Nome do Salão" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.salonName} onChange={(e) => setNewProf({...newProf, salonName: e.target.value})} />
                <input placeholder="Cidade" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.city} onChange={(e) => setNewProf({...newProf, city: e.target.value})} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input type="text" placeholder="usuário (ex: joao123)" className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newProf.username} onChange={(e) => setNewProf({...newProf, username: e.target.value})} />
                <div className="absolute right-4 top-3.5 text-slate-400 text-sm font-medium">@marcai.dev</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="password" placeholder="Senha temporária" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.password} onChange={(e) => setNewProf({...newProf, password: e.target.value})} />
                <input type="number" placeholder="Dias expirar (-1 ilim)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.expireDays} onChange={(e) => setNewProf({...newProf, expireDays: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <button disabled={loading} onClick={handleRegister} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg disabled:opacity-50 transition-all">
              {loading ? 'Cadastrando...' : 'Confirmar Registro'}
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
  const [dashboardTab, setDashboardTab] = useState<'agendamentos' | 'perfil' | 'horarios'>('agendamentos');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // States for Profile configuration
  const [profileData, setProfileData] = useState({
    bio: '',
    whatsapp: '',
    address: '',
    customLink: 'meulink',
    services: [] as Service[]
  });

  // States for Schedule configuration
  const [daySchedules, setDaySchedules] = useState(
    DAYS_OF_WEEK.map(day => ({ day, active: true, open: '09:00', close: '18:00' }))
  );
  const [lunchBreak, setLunchBreak] = useState({ active: false, start: '12:00', end: '13:00' });
  const [specialHours, setSpecialHours] = useState([{ date: '', open: '', close: '', closed: false }]);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('professionals').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setProfessionals(data.map((p: any) => ({ ...p, salonName: p.salon_name, expireDays: p.expire_days })));
      } else {
        setProfessionals(DEFAULT_PROFESSIONALS);
      }
    } catch (err) {
      console.warn("Aviso: Usando dados mockados.");
      setProfessionals(DEFAULT_PROFESSIONALS);
    }
  };

  useEffect(() => { fetchProfessionals(); }, []);

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

  const handleNavigate = (newView: AppView) => {
    if (newView === AppView.LANDING) {
      setIsLoggedIn(false);
    }
    setView(newView);
  };

  const handleAddService = () => {
    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      duration: 30,
      price: 0,
      preBooking: false
    };
    setProfileData({ ...profileData, services: [...profileData.services, newService] });
  };

  const handleUpdateService = (id: string, field: keyof Service, value: any) => {
    setProfileData({
      ...profileData,
      services: profileData.services.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const handleDeleteService = (id: string) => {
    setProfileData({
      ...profileData,
      services: profileData.services.filter(s => s.id !== id)
    });
  };

  const currentView = () => {
    switch (view) {
      case AppView.LANDING: return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden bg-slate-50">
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
              <button onClick={() => setView(AppView.CLIENTS)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Sou cliente</h3>
                <p className="text-slate-500 text-sm mt-2">procurar profissionais para agendar</p>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Área do Profissional</h3>
                <p className="text-slate-500 text-sm mt-2">gerencie sua agenda e serviços</p>
              </button>
            </div>
          </div>
        </div>
      );
      case AppView.CLIENTS: return (
        <div className="max-w-7xl mx-auto py-12 px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Marketplace</h2>
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-10 border border-slate-100 grid md:grid-cols-4 gap-4">
            <input placeholder="Nome, Salão ou Serviço..." className="w-full col-span-2 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="px-4 py-3 border border-slate-200 rounded-xl" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">Todas Cidades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-4 py-3 border border-slate-200 rounded-xl" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProfessionals.map((prof) => (
              <ProfessionalCard key={prof.id} professional={prof} onSelect={setSelectedProfessional} />
            ))}
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_LOGIN: return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md space-y-8">
            <h2 className="text-3xl font-bold text-center">Acesso</h2>
            <div className="space-y-4">
              <input placeholder="Usuário" className="w-full px-4 py-3 border rounded-xl" />
              <input type="password" placeholder="Senha" className="w-full px-4 py-3 border rounded-xl" />
              <button onClick={() => { setIsLoggedIn(true); setView(AppView.PROFESSIONAL_DASHBOARD); }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Entrar</button>
            </div>
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_DASHBOARD: return (
        <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-500">
          <div className="flex justify-center mb-8">
            <nav className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setDashboardTab('agendamentos')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'agendamentos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Agendamentos</button>
              <button onClick={() => setDashboardTab('perfil')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'perfil' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Perfil e Serviços</button>
              <button onClick={() => setDashboardTab('horarios')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'horarios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Horários</button>
            </nav>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
            {dashboardTab === 'agendamentos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Seus Agendamentos</h2>
                <div className="space-y-4 italic text-slate-400">Nenhum agendamento para hoje.</div>
              </div>
            )}
            {dashboardTab === 'perfil' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                <h2 className="text-2xl font-black text-slate-900">Perfil e Serviços</h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Descrição do Perfil</label>
                        <textarea 
                          className="w-full p-4 border rounded-2xl min-h-[100px] bg-slate-50"
                          placeholder="Fale um pouco sobre você..."
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        ></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Número WhatsApp</label>
                        <input 
                          type="tel" className="w-full p-4 border rounded-2xl bg-slate-50" 
                          placeholder="(00) 00000-0000"
                          value={profileData.whatsapp}
                          onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Endereço (Google Maps)</label>
                        <input 
                          type="text" className="w-full p-4 border rounded-2xl bg-slate-50" 
                          placeholder="Rua, Número, Cidade..."
                          value={profileData.address}
                          onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Link Personalizado</label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs font-mono">marcai.dev/</span>
                          <input 
                            type="text" className="flex-1 p-4 border rounded-2xl bg-slate-50" 
                            placeholder="meulink"
                            value={profileData.customLink}
                            onChange={(e) => setProfileData({...profileData, customLink: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Foto do Perfil</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                          </div>
                          <input type="file" className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Serviços Oferecidos</h3>
                      <button onClick={handleAddService} className="text-indigo-600 font-bold text-sm hover:underline">+ Adicionar Novo Serviço</button>
                    </div>
                    
                    <div className="space-y-4">
                      {profileData.services.map((s, i) => (
                        <div key={s.id} className="p-6 bg-slate-50 rounded-[24px] border border-slate-200 grid md:grid-cols-4 gap-4 relative animate-in slide-in-from-left-2">
                          <button onClick={() => handleDeleteService(s.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">✕</button>
                          <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Serviço</label>
                            <input type="text" value={s.name} onChange={e => handleUpdateService(s.id, 'name', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200" placeholder="Ex: Corte" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor (R$)</label>
                            <input type="number" value={s.price} onChange={e => handleUpdateService(s.id, 'price', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tempo (min)</label>
                            <input type="number" value={s.duration} onChange={e => handleUpdateService(s.id, 'duration', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200" />
                          </div>
                          <div className="flex flex-col justify-end pb-3">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" className="w-4 h-4" checked={s.preBooking} onChange={e => handleUpdateService(s.id, 'preBooking', e.target.checked)} />
                              <span className="text-xs font-medium text-slate-600">Pré-agendamento</span>
                            </div>
                            {s.preBooking && <p className="text-[9px] text-indigo-400 mt-1">* Libera caixa de confirmação extra</p>}
                          </div>
                        </div>
                      ))}
                      {profileData.services.length === 0 && (
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400 text-sm">Nenhum serviço cadastrado.</div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Salvar Perfil</button>
                  </div>
                </div>
              </div>
            )}
            {dashboardTab === 'horarios' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-10">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Horários de Atendimento</h2>
                    <p className="text-slate-500 text-sm mb-6">Gerencie sua grade de horários disponíveis.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 ml-1">Funcionamento Semanal</h3>
                    <div className="grid gap-3">
                      {daySchedules.map((item, idx) => (
                        <div key={item.day} className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:border-indigo-100 hover:shadow-sm">
                          <div className="flex items-center gap-3 w-40">
                            <input 
                              type="checkbox" className="w-5 h-5 accent-indigo-600" checked={item.active} 
                              onChange={e => {
                                const newSchedules = [...daySchedules];
                                newSchedules[idx].active = e.target.checked;
                                setDaySchedules(newSchedules);
                              }}
                            />
                            <span className={`font-bold text-sm ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>{item.day}</span>
                          </div>
                          
                          <div className={`flex items-center gap-4 flex-1 transition-opacity ${item.active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Abertura:</span>
                              <input type="time" className="p-2 bg-white border border-slate-200 rounded-lg text-sm" value={item.open} onChange={e => {
                                const ns = [...daySchedules]; ns[idx].open = e.target.value; setDaySchedules(ns);
                              }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Fechamento:</span>
                              <input type="time" className="p-2 bg-white border border-slate-200 rounded-lg text-sm" value={item.close} onChange={e => {
                                const ns = [...daySchedules]; ns[idx].close = e.target.value; setDaySchedules(ns);
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="lunch_active" className="w-5 h-5 accent-indigo-600" checked={lunchBreak.active} onChange={e => setLunchBreak({...lunchBreak, active: e.target.checked})} />
                      <label htmlFor="lunch_active" className="text-sm font-bold text-slate-700">Definir horário de almoço</label>
                    </div>
                    {lunchBreak.active && (
                      <div className="flex gap-4 animate-in slide-in-from-top-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Início</label>
                          <input type="time" value={lunchBreak.start} onChange={e => setLunchBreak({...lunchBreak, start: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fim</label>
                          <input type="time" value={lunchBreak.end} onChange={e => setLunchBreak({...lunchBreak, end: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Adicionar horários especiais</h3>
                    <div className="space-y-3">
                      {specialHours.map((h, i) => (
                        <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-wrap items-end gap-4 shadow-sm relative">
                           <button onClick={() => setSpecialHours(specialHours.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">✕</button>
                          <div className="flex-1 min-w-[140px]">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dia</label>
                            <input type="date" className="w-full p-3 rounded-xl border border-slate-200" value={h.date} onChange={e => {
                              const newHours = [...specialHours]; newHours[i].date = e.target.value; setSpecialHours(newHours);
                            }} />
                          </div>
                          {!h.closed && (
                            <>
                              <div className="w-28">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Abertura</label>
                                <input type="time" className="w-full p-3 rounded-xl border border-slate-200" value={h.open} onChange={e => {
                                  const nh = [...specialHours]; nh[i].open = e.target.value; setSpecialHours(nh);
                                }} />
                              </div>
                              <div className="w-28">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fechamento</label>
                                <input type="time" className="w-full p-3 rounded-xl border border-slate-200" value={h.close} onChange={e => {
                                  const nh = [...specialHours]; nh[i].close = e.target.value; setSpecialHours(nh);
                                }} />
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-2 mb-3 px-2">
                            <input type="checkbox" className="w-4 h-4" checked={h.closed} onChange={e => {
                              const nh = [...specialHours]; nh[i].closed = e.target.checked; setSpecialHours(nh);
                            }} />
                            <span className="text-xs font-medium text-slate-600">Não haverá funcionamento</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSpecialHours([...specialHours, { date: '', open: '', close: '', closed: false }])} className="text-indigo-600 font-bold text-xs hover:underline">+ Adicionar dia especial</button>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100/50 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Salvar Horários
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
      case AppView.DEVELOPER_PANEL: return <DeveloperPanel onRefresh={fetchProfessionals} />;
      default: return null;
    }
  };

  return (
    <Layout activeView={view} onNavigate={handleNavigate} isLoggedIn={isLoggedIn}>
      {currentView()}
      {selectedProfessional && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="relative h-64">
              <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover rounded-t-[40px]" />
              <button onClick={() => setSelectedProfessional(null)} className="absolute top-6 right-6 bg-white/20 w-10 h-10 rounded-full text-white">✕</button>
              <div className="absolute bottom-8 left-10 text-white">
                <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">{selectedProfessional.category}</span>
                <h2 className="text-4xl font-black">{selectedProfessional.name}</h2>
                {selectedProfessional.salonName && <p className="opacity-80">🏪 {selectedProfessional.salonName}</p>}
              </div>
            </div>
            <div className="p-10 grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-lg font-bold">Sobre</h4>
                <p className="text-slate-600">{selectedProfessional.bio}</p>
                <h4 className="text-lg font-bold">Serviços</h4>
                {selectedProfessional.services?.map(s => (
                  <div key={s.id} className="p-4 border rounded-2xl flex justify-between">
                    <span>{s.name} ({s.duration} min)</span>
                    <span className="font-bold text-indigo-600">R$ {s.price}</span>
                  </div>
                ))}
              </div>
              <AIAssistant context={selectedProfessional} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
