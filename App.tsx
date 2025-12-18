
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import DirectoryTree from './components/DirectoryTree.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
import { supabase } from './lib/supabase.ts';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const DEFAULT_PROFESSIONALS: Professional[] = [
  {
    id: '00000000-0000-0000-0000-000000000001', slug: 'marcos-barbeiro', name: 'Marcos Silva', salonName: 'Barbearia do Marcos', category: 'Beleza', city: 'São Paulo',
    bio: 'Especialista em visagismo e barboterapia.', imageUrl: 'https://picsum.photos/seed/barber/400/300',
    rating: 4.9, services: [{ id: 's1', name: 'Corte de Cabelo', duration: 30, price: 50, preBooking: false }],
    gallery: ['https://picsum.photos/seed/1/400/300', 'https://picsum.photos/seed/2/400/300'],
    whatsapp: '5511999999999'
  }
];

const DeveloperPanel: React.FC<{ 
  professionals: Professional[];
  onRefresh: () => void; 
}> = ({ professionals, onRefresh }) => {
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProf, setNewProf] = useState({ 
    name: '', salonName: '', category: '', city: '', username: '', password: '', resetWord: '', expireDays: -1
  });

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-3xl text-white w-full max-w-sm space-y-6 text-center shadow-2xl">
          <h2 className="text-2xl font-bold">Modo Desenvolvedor</h2>
          <input 
            type="password" 
            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-center text-xl font-mono text-indigo-400 outline-none"
            placeholder="Senha Mestra"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pwd === '220624' && setAuthed(true)}
          />
          <button onClick={() => pwd === '220624' ? setAuthed(true) : alert('Incorreta')} className="w-full py-4 bg-indigo-600 rounded-xl font-bold">Acessar</button>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    const cleanUsername = newProf.username.trim().toLowerCase().replace(/\s+/g, '');
    if (!newProf.name || !cleanUsername || (!editingId && !newProf.password)) {
      alert('Dados incompletos');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('professionals').update({
          name: newProf.name, salon_name: newProf.salonName, category: newProf.category, city: newProf.city,
          expire_days: newProf.expireDays, reset_word: newProf.resetWord
        }).eq('id', editingId);
      } else {
        const authEmail = `${cleanUsername}@marcai.dev`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail, password: newProf.password,
          options: { data: { full_name: newProf.name } }
        });
        if (authError) throw authError;

        await supabase.from('professionals').insert([{
          user_id: authData.user?.id,
          name: newProf.name, salon_name: newProf.salonName, category: newProf.category || 'Geral',
          city: newProf.city || 'Remoto', slug: cleanUsername,
          bio: 'Profissional cadastrado via painel administrativo.',
          image_url: `https://picsum.photos/seed/${cleanUsername}/400/300`,
          rating: 5.0, expire_days: newProf.expireDays, reset_word: newProf.resetWord,
          services: [{ id: 'sx', name: 'Atendimento Padrão', duration: 45, price: 100 }]
        }]);
      }
      onRefresh();
      setEditingId(null);
      setNewProf({ name: '', salonName: '', category: '', city: '', username: '', password: '', resetWord: '', expireDays: -1 });
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
       <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold">{editingId ? 'Editar' : 'Novo Profissional'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Nome Completo" className="p-3 border rounded-xl" value={newProf.name} onChange={e => setNewProf({...newProf, name: e.target.value})} />
            <input placeholder="Usuário (login)" className="p-3 border rounded-xl" value={newProf.username} onChange={e => setNewProf({...newProf, username: e.target.value})} />
            {!editingId && <input type="password" placeholder="Senha" className="p-3 border rounded-xl" value={newProf.password} onChange={e => setNewProf({...newProf, password: e.target.value})} />}
          </div>
          <button onClick={handleRegister} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">{loading ? '...' : 'Salvar Profissional'}</button>
       </div>
       <DirectoryTree />
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [dashboardTab, setDashboardTab] = useState<'agendamentos' | 'perfil' | 'horarios' | 'galeria'>('agendamentos');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('18');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'selection' | 'review'>('selection');
  const [clientData, setClientData] = useState({ name: '', whatsapp: '', terms: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // States para Login
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const serviceRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [profileData, setProfileData] = useState({
    name: '', bio: '', whatsapp: '', address: '', customLink: '', services: [] as Service[], photo: ''
  });

  const [daySchedules, setDaySchedules] = useState(DAYS_OF_WEEK.map(day => ({ day, active: true, open: '09:00', close: '18:00' })));
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [earningsMonth, setEarningsMonth] = useState('06/2024');

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('professionals').select('*');
      if (error) throw error;
      setProfessionals(data?.map((p: any) => ({ 
        ...p, salonName: p.salon_name, imageUrl: p.image_url, gallery: p.gallery || [] 
      })) || DEFAULT_PROFESSIONALS);
    } catch {
      setProfessionals(DEFAULT_PROFESSIONALS);
    }
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const handleProfessionalLogin = async () => {
    if (!loginUser || !loginPass) {
      alert("Informe usuário e senha");
      return;
    }
    setLoginLoading(true);
    try {
      const email = `${loginUser.trim().toLowerCase()}@marcai.dev`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: loginPass });
      
      if (authError) throw authError;

      // Busca o perfil estritamente vinculado ao ID do usuário autenticado
      const { data: profData, error: profError } = await supabase.from('professionals')
        .select('*')
        .eq('user_id', authData.user?.id)
        .single();

      if (profError || !profData) throw new Error("Perfil profissional não encontrado para este usuário.");

      setProfileData({
        name: profData.name,
        bio: profData.bio || '',
        whatsapp: profData.whatsapp || '',
        address: profData.address || '',
        customLink: profData.slug,
        services: profData.services || [],
        photo: profData.image_url || ''
      });
      
      setIsLoggedIn(true);
      setView(AppView.PROFESSIONAL_DASHBOARD);
    } catch (err: any) {
      alert("Falha no login: Usuário ou senha incorretos.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleNavigate = (newView: AppView) => {
    if (newView === AppView.LANDING) {
      setIsLoggedIn(false);
      setLoginUser('');
      setLoginPass('');
    }
    setView(newView);
  };

  const handleAddService = () => {
    const newService: Service = { id: Math.random().toString(36).substr(2, 9), name: '', duration: 30, price: 0 };
    setProfileData({ ...profileData, services: [...profileData.services, newService] });
  };

  const handleUpdateService = (id: string, field: keyof Service, value: any) => {
    setProfileData({ ...profileData, services: profileData.services.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const handleDeleteService = (id: string) => {
    setProfileData({ ...profileData, services: profileData.services.filter(s => s.id !== id) });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('professionals')
        .update({
          bio: profileData.bio,
          whatsapp: profileData.whatsapp,
          address: profileData.address,
          services: profileData.services,
          image_url: profileData.photo
        })
        .eq('slug', profileData.customLink);
      if (error) throw error;
      alert("Perfil salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishBooking = () => {
    if (!clientData.name || !clientData.whatsapp || !clientData.terms) {
      alert("Preencha todos os campos.");
      return;
    }
    const message = `Olá ${selectedProfessional?.name}, agendamento via MarcAI:\n📌 ${selectedService?.name}\n📅 ${selectedDate}/06/2024 às ${selectedTime}\n👤 ${clientData.name}`;
    window.open(`https://wa.me/${selectedProfessional?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    setSelectedProfessional(null);
    setBookingStep('selection');
  };

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p => {
      const matchText = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = !cityFilter || p.city === cityFilter;
      return matchText && matchCity;
    });
  }, [searchTerm, cityFilter, professionals]);

  const currentView = () => {
    switch (view) {
      case AppView.LANDING: return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 bg-slate-50">
          <div className="max-w-5xl text-center space-y-12 animate-in fade-in zoom-in duration-700">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1]">
              Agendamentos que <span className="text-indigo-600">aprendem</span> com você.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              <button onClick={() => setView(AppView.CLIENTS)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Sou cliente</h3>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Área do Profissional</h3>
              </button>
            </div>
          </div>
        </div>
      );
      case AppView.CLIENTS: return (
        <div className="max-w-7xl mx-auto py-12 px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-8">Olá, cliente MarcAI!</h2>
          <div className="bg-white p-4 rounded-3xl shadow-sm mb-12 border border-slate-100 grid md:grid-cols-4 gap-4">
            <input placeholder="Buscar profissional ou serviço..." className="col-span-2 px-5 py-4 bg-slate-50 border-none rounded-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="px-5 py-4 bg-slate-50 border-none rounded-2xl" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">Todas Cidades</option>
              {Array.from(new Set(professionals.map(p => p.city))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProfessionals.map((prof) => (
              <ProfessionalCard key={prof.id} professional={prof} onSelect={(p) => setSelectedProfessional(p)} />
            ))}
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_LOGIN: return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md space-y-8 animate-in zoom-in">
            <h2 className="text-3xl font-bold text-center">Acesso Profissional</h2>
            <div className="space-y-4">
              <input 
                placeholder="Usuário" 
                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                value={loginUser} 
                onChange={e => setLoginUser(e.target.value)} 
              />
              <input 
                type="password" 
                placeholder="Senha" 
                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                value={loginPass} 
                onChange={e => setLoginPass(e.target.value)} 
              />
              <button 
                onClick={handleProfessionalLogin} 
                disabled={loginLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loginLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_DASHBOARD: return (
        <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in">
          <div className="flex justify-center mb-8">
            <nav className="flex items-center gap-1 p-1 bg-white border rounded-2xl shadow-sm">
              <button onClick={() => setDashboardTab('agendamentos')} className={`px-6 py-2.5 rounded-xl text-sm font-bold ${dashboardTab === 'agendamentos' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Agendamentos</button>
              <button onClick={() => setDashboardTab('perfil')} className={`px-6 py-2.5 rounded-xl text-sm font-bold ${dashboardTab === 'perfil' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Perfil</button>
              <button onClick={() => setDashboardTab('horarios')} className={`px-6 py-2.5 rounded-xl text-sm font-bold ${dashboardTab === 'horarios' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Horários</button>
            </nav>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
            {dashboardTab === 'agendamentos' && (
              <div className="space-y-10">
                <h2 className="text-4xl font-black text-slate-900">Olá, {profileData.name}!</h2>
                <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                    <h3 className="font-bold text-indigo-900">Ganhos desse mês</h3>
                    <p className="text-3xl font-black text-indigo-600">R$ 1.450,00</p>
                </div>
                <p className="italic text-slate-400">Nenhum agendamento para hoje.</p>
              </div>
            )}
            
            {dashboardTab === 'perfil' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black">Meu Perfil</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <textarea 
                      className="w-full p-4 border rounded-2xl min-h-[140px] bg-slate-50"
                      placeholder="Bio..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    />
                    <div className="space-y-4">
                      <input placeholder="WhatsApp" className="w-full p-4 border rounded-2xl" value={profileData.whatsapp} onChange={e => setProfileData({...profileData, whatsapp: e.target.value})} />
                      <input placeholder="Endereço" className="w-full p-4 border rounded-2xl" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} />
                    </div>
                </div>
                <button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black">
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        </div>
      );
      case AppView.DEVELOPER_PANEL: return <DeveloperPanel professionals={professionals} onRefresh={fetchProfessionals} />;
      default: return null;
    }
  };

  return (
    <Layout activeView={view} onNavigate={handleNavigate} isLoggedIn={isLoggedIn}>
      {currentView()}
      {selectedProfessional && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => { setSelectedProfessional(null); setBookingStep('selection'); }} className="absolute top-6 right-6 z-50 bg-slate-900/50 w-10 h-10 rounded-full text-white">✕</button>
            
            <div className="relative h-64 overflow-hidden">
              <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              <div className="absolute bottom-6 left-10 text-white">
                <h2 className="text-4xl font-black">{selectedProfessional.name}</h2>
              </div>
            </div>

            <div className="p-10">
              {bookingStep === 'selection' ? (
                <div className="grid md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h4 className="text-xl font-bold border-l-4 border-indigo-600 pl-4">Serviços</h4>
                      {selectedProfessional.services?.map(s => (
                        <button key={s.id} onClick={() => { setSelectedService(s); setBookingStep('review'); }} className="w-full p-6 bg-slate-50 border rounded-3xl flex justify-between hover:border-indigo-600 transition-colors">
                          <span className="font-bold">{s.name}</span>
                          <span className="font-black text-indigo-600">R$ {s.price}</span>
                        </button>
                      ))}
                   </div>
                   <AIAssistant context={selectedProfessional} />
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in">
                  <h3 className="text-3xl font-black text-center">Dados do Agendamento</h3>
                  <div className="bg-slate-50 p-10 rounded-[40px] border space-y-6">
                    <input className="w-full p-4 border rounded-2xl" placeholder="Seu Nome" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
                    <input className="w-full p-4 border rounded-2xl" placeholder="Seu WhatsApp" value={clientData.whatsapp} onChange={e => setClientData({...clientData, whatsapp: e.target.value})} />
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={clientData.terms} onChange={e => setClientData({...clientData, terms: e.target.checked})} />
                      <label className="text-sm font-bold text-slate-600">Aceito os termos</label>
                    </div>
                    <button onClick={handleFinishBooking} className="w-full py-5 bg-indigo-600 text-white rounded-[28px] font-black shadow-xl">CONCLUIR AGENDAMENTO</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
