
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
    id: '1', slug: 'marcos-barbeiro', name: 'Marcos Silva', salonName: 'Barbearia do Marcos', category: 'Beleza', city: 'São Paulo',
    bio: 'Especialista em visagismo e barboterapia.', imageUrl: 'https://picsum.photos/seed/barber/400/300',
    rating: 4.9, services: [{ id: 's1', name: 'Corte de Cabelo', duration: 30, price: 50, preBooking: false }],
    gallery: ['https://picsum.photos/seed/1/400/300', 'https://picsum.photos/seed/2/400/300']
  }
];

const DeveloperPanel: React.FC<{ 
  professionals: Professional[];
  onRefresh: () => void; 
}> = ({ professionals, onRefresh }) => {
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProf, setNewProf] = useState({ 
    name: '', 
    salonName: '',
    category: '', 
    city: '', 
    username: '', 
    password: '',
    resetWord: '',
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
    if (!newProf.name || !cleanUsername || (!editingId && !newProf.password)) {
      alert('Preencha nome completo, usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Lógica de update
        const { error } = await supabase.from('professionals').update({
          name: newProf.name,
          salon_name: newProf.salonName,
          category: newProf.category,
          city: newProf.city,
          expire_days: newProf.expireDays,
          reset_word: newProf.resetWord,
        }).eq('id', editingId);
        if (error) throw error;
        alert('Profissional atualizado!');
      } else {
        // Lógica de insert
        const authEmail = `${cleanUsername}@marcai.dev`;
        const { error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: newProf.password,
          options: { data: { full_name: newProf.name, role: 'professional' } }
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
          reset_word: newProf.resetWord,
          services: [{ id: 'sx', name: 'Atendimento Padrão', duration: 45, price: 100 }]
        };

        const { error: dbError } = await supabase.from('professionals').insert([professionalData]);
        if (dbError) throw dbError;
        alert(`Profissional cadastrado!\nAcesso: ${authEmail}`);
      }
      
      setNewProf({ name: '', salonName: '', category: '', city: '', username: '', password: '', resetWord: '', expireDays: -1 });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Professional) => {
    setEditingId(p.id);
    setNewProf({
      name: p.name,
      salonName: p.salonName || '',
      category: p.category,
      city: p.city,
      username: p.slug, // apenas ilustrativo
      password: '',
      resetWord: p.resetWord || '',
      expireDays: p.expireDays || -1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este profissional?')) return;
    try {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
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
          <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Profissional' : 'Novo Profissional'}</h3>
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
              {!editingId && (
                <div className="relative">
                  <input type="text" placeholder="usuario (ex: joao123)" className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newProf.username} onChange={(e) => setNewProf({...newProf, username: e.target.value})} />
                  <div className="absolute right-4 top-3.5 text-slate-400 text-sm font-medium">@marcai.dev</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {!editingId && <input type="password" placeholder="Senha temporária" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.password} onChange={(e) => setNewProf({...newProf, password: e.target.value})} />}
                <input placeholder="Palavra reset" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.resetWord} onChange={(e) => setNewProf({...newProf, resetWord: e.target.value})} />
              </div>
              <input type="number" placeholder="- 1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.expireDays} onChange={(e) => setNewProf({...newProf, expireDays: parseInt(e.target.value) || 0})} />
            </div>
            <button disabled={loading} onClick={handleRegister} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg disabled:opacity-50 transition-all">
              {loading ? 'Salvando...' : 'Confirmar Registro'}
            </button>
            {editingId && <button onClick={() => { setEditingId(null); setNewProf({ name: '', salonName: '', category: '', city: '', username: '', password: '', resetWord: '', expireDays: -1 }); }} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancelar Edição</button>}
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Profissionais Cadastrados</h3>
            <div className="space-y-3">
              {professionals.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                    <div>
                      <p className="font-bold text-sm text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category} • {p.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Editar">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Arquitetura de Pastas</h3>
            <button onClick={() => setShowTree(!showTree)} className="text-indigo-400 text-[10px] font-black uppercase hover:underline">
              {showTree ? 'minimizar essa informação' : 'expandir árvore'}
            </button>
          </div>
          {showTree && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <DirectoryTree />
            </div>
          )}
        </div>
      </div>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const serviceRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // States for Profile configuration
  const [profileData, setProfileData] = useState({
    bio: '',
    whatsapp: '',
    address: '',
    customLink: 'meulink',
    services: [] as Service[],
    photo: 'https://picsum.photos/seed/marcos/100'
  });

  // States for Schedule configuration
  const [daySchedules, setDaySchedules] = useState(
    DAYS_OF_WEEK.map(day => ({ day, active: true, open: '09:00', close: '18:00' }))
  );
  const [lunchBreak, setLunchBreak] = useState({ active: false, start: '12:00', end: '13:00' });
  const [specialHours, setSpecialHours] = useState([{ date: '', open: '', close: '', closed: false }]);
  
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [earningsMonth, setEarningsMonth] = useState('06/2024');

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('professionals').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setProfessionals(data.map((p: any) => ({ 
          ...p, 
          salonName: p.salon_name, 
          expireDays: p.expire_days,
          resetWord: p.reset_word,
          gallery: p.gallery || []
        })));
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
      preBooking: false,
      preBookingRules: ''
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

  const handleEditService = (id: string) => {
    serviceRefs.current[id]?.focus();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(res => setTimeout(res, 1000));
    setIsSaving(false);
    alert("salvo com sucesso");
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    await new Promise(res => setTimeout(res, 1000));
    setIsSaving(false);
    alert("salvo com sucesso");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfile: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isProfile) {
          setProfileData(prev => ({ ...prev, photo: base64 }));
        } else {
          setGalleryImages(prev => [base64, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    }
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
          <h2 className="text-4xl font-black text-slate-900 mb-8">Olá, cliente MarcAI!</h2>
          <div className="bg-white p-4 rounded-3xl shadow-sm mb-12 border border-slate-100 grid md:grid-cols-4 gap-4">
            <div className="col-span-2 relative">
              <input placeholder="Nome, Salão ou Serviço..." className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium cursor-pointer" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">Todas Cidades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium cursor-pointer" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
              <button onClick={() => setDashboardTab('galeria')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'galeria' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Galeria</button>
            </nav>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
            {dashboardTab === 'agendamentos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={profileData.photo} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900">Olá, Marcos Silva!</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-indigo-900">Ganhos desse mês</h3>
                      <select className="bg-white border border-indigo-200 rounded-lg text-xs p-1" value={earningsMonth} onChange={e => setEarningsMonth(e.target.value)}>
                        <option value="06/2024">Junho 2024</option>
                        <option value="05/2024">Maio 2024</option>
                      </select>
                    </div>
                    <p className="text-3xl font-black text-indigo-600">R$ 1.450,00</p>
                    <p className="text-[10px] text-indigo-400 mt-1">Soma de todos os serviços realizados no mês.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900">Seus Agendamentos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-slate-100">
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-4 px-2">Nome cliente</th>
                          <th className="py-4 px-2">DATA</th>
                          <th className="py-4 px-2">HORÁRIO</th>
                          <th className="py-4 px-2">NOME DO SERVIÇO AGENDADO</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-600">
                        <tr>
                          <td colSpan={4} className="py-8 text-center italic text-slate-400">Nenhum agendamento para hoje.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="text-indigo-600 font-bold hover:underline">Agendamentos futuros</button>
                </div>
              </div>
            )}
            
            {dashboardTab === 'perfil' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                <h2 className="text-2xl font-black text-slate-900">Perfil e Serviços</h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Descrição do Perfil</label>
                        <textarea 
                          className="w-full p-4 border rounded-2xl min-h-[140px] bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Fale um pouco sobre você..."
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        ></textarea>
                      </div>

                      <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700">Adicionar foto do perfil via upload do dispositivo</h4>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                             <img src={profileData.photo} alt="Profile" className="w-full h-full object-cover" />
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-transparent rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                          >
                            Escolher arquivo
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Número whatsapp</label>
                        <input 
                          type="tel" className="w-full p-4 border rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="32988729033"
                          value={profileData.whatsapp}
                          onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Endereço (Google Maps)</label>
                        <input 
                          type="text" className="w-full p-4 border rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="Rua, Batista de Oliveira, 331, centro"
                          value={profileData.address}
                          onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Link Personalizado</label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs font-mono">marcai.dev/</span>
                          <input 
                            type="text" className="flex-1 p-4 border rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="meulink"
                            value={profileData.customLink}
                            onChange={(e) => setProfileData({...profileData, customLink: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-900">Serviços Oferecidos</h3>
                      <button 
                        onClick={handleAddService}
                        className="text-indigo-600 font-bold text-sm hover:underline"
                      >
                        + Adicionar Novo Serviço
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {profileData.services.map((s) => (
                        <div key={s.id} className="p-6 bg-slate-50/50 border border-slate-200 rounded-[28px] grid gap-4 items-start shadow-sm relative animate-in fade-in slide-in-from-top-4">
                          <div className="grid md:grid-cols-[1fr,120px,120px,180px,80px] gap-4 items-end">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Serviço</label>
                              <input 
                                ref={el => { serviceRefs.current[s.id] = el; }}
                                type="text" value={s.name} onChange={e => handleUpdateService(s.id, 'name', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-bold" placeholder="Ex: Corte" 
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                              <input type="number" value={s.price} onChange={e => handleUpdateService(s.id, 'price', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-bold" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tempo (min)</label>
                              <input type="number" value={s.duration} onChange={e => handleUpdateService(s.id, 'duration', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-bold" />
                            </div>
                            <div className="flex flex-col gap-2 justify-center h-full pb-1">
                              <div className="flex items-center gap-2">
                                <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={s.preBooking} onChange={e => handleUpdateService(s.id, 'preBooking', e.target.checked)} />
                                <span className="text-xs font-bold text-slate-600">Pré-agendamento</span>
                              </div>
                              <p className="text-[9px] text-indigo-400">* Libera caixa de confirmação extra</p>
                            </div>
                            <div className="flex items-center gap-2 h-full pb-1">
                              <button 
                                onClick={() => handleEditService(s.id)}
                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteService(s.id)} 
                                className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                          
                          {s.preBooking && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-slate-200/50 mt-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Regras do Pré-agendamento (enviadas ao cliente)</label>
                              <textarea 
                                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs mt-1 min-h-[80px]"
                                placeholder="Descreva as condições para este agendamento (ex: tolerância de atraso, cancelamento)..."
                                value={s.preBookingRules || ''}
                                onChange={e => handleUpdateService(s.id, 'preBookingRules', e.target.value)}
                              ></textarea>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70">
                      {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
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
                    <div className="space-y-2">
                      {daySchedules.map((item, idx) => (
                        <div key={item.day} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:border-indigo-100">
                          <input 
                            type="checkbox" className="w-5 h-5 accent-indigo-600" checked={item.active} 
                            onChange={e => {
                              const newSchedules = [...daySchedules];
                              newSchedules[idx].active = e.target.checked;
                              setDaySchedules(newSchedules);
                            }}
                          />
                          <span className={`font-bold text-sm w-24 ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>{item.day}</span>
                          
                          <div className={`flex items-center gap-6 flex-1 transition-opacity ${item.active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">ABERTURA:</span>
                              <input type="time" className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-mono" value={item.open} onChange={e => {
                                const ns = [...daySchedules]; ns[idx].open = e.target.value; setDaySchedules(ns);
                              }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">FECHAMENTO:</span>
                              <input type="time" className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-mono" value={item.close} onChange={e => {
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
                          <input type="time" value={lunchBreak.start} onChange={e => setLunchBreak({...lunchBreak, start: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fim</label>
                          <input type="time" value={lunchBreak.end} onChange={e => setLunchBreak({...lunchBreak, end: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono" />
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
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={h.closed} onChange={e => {
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
                    <button onClick={handleSaveSchedule} disabled={isSaving} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100/50 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70">
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      )}
                      Salvar Horários
                    </button>
                  </div>
                </div>
              </div>
            )}

            {dashboardTab === 'galeria' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Galeria de Fotos</h2>
                    <p className="text-slate-500 text-sm">Faça upload de fotos dos seus trabalhos para exibir no seu perfil.</p>
                  </div>
                  <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                  <button onClick={() => galleryInputRef.current?.click()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    Fazer Upload
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {galleryImages.length === 0 ? (
                    <div className="col-span-full p-20 border-2 border-dashed border-slate-200 rounded-[32px] text-center text-slate-400">
                      Nenhuma foto enviada ainda. Suas fotos aparecerão aqui.
                    </div>
                  ) : (
                    galleryImages.map((img, i) => (
                      <div key={i} className="aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-sm group relative animate-in zoom-in duration-300">
                        <img src={img} alt={`Trabalho ${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">✕</button>
                      </div>
                    ))
                  )}
                </div>
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
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl relative">
            <button onClick={() => { setSelectedProfessional(null); setSelectedService(null); }} className="absolute top-6 right-6 z-50 bg-slate-900/50 hover:bg-slate-900/80 w-10 h-10 rounded-full text-white flex items-center justify-center transition-colors">✕</button>
            
            {/* Header com as informações do profissional movidas para o topo */}
            <div className="relative h-80 overflow-hidden">
              <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover rounded-t-[40px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              <div className="absolute top-10 left-10 p-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 animate-in slide-in-from-top-4 duration-500">
                <span className="bg-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-2 inline-block text-white shadow-lg">{selectedProfessional.category}</span>
                <h2 className="text-4xl font-black text-white leading-tight">{selectedProfessional.name}</h2>
                {selectedProfessional.salonName && <p className="text-white/80 font-medium flex items-center gap-1 mt-1 text-sm">🏪 {selectedProfessional.salonName}</p>}
              </div>
            </div>

            <div className="p-10">
              {/* Fluxo de Agendamento: Ao clicar no serviço, mostra calendário (mockado) */}
              {selectedService ? (
                <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agendar {selectedService.name}</h3>
                      <p className="text-slate-500 font-medium">Horário de Brasília (BRT)</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[1fr,350px] gap-8">
                    <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 text-center space-y-6">
                      <div className="flex justify-between items-center px-4">
                        <button className="text-slate-400">❮</button>
                        <span className="font-black text-xl text-slate-800">Junho 2024</span>
                        <button className="text-slate-400">❯</button>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>)}
                        {Array.from({length: 30}).map((_, i) => (
                          <button key={i} className={`h-12 w-full rounded-2xl flex items-center justify-center font-bold transition-all ${i+1 === 18 ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-slate-700'}`}>
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-black text-slate-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Horários Disponíveis
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {['09:00','09:30','10:00','10:30','14:00','14:30','15:00','16:00'].map(t => (
                          <button key={t} className="py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all">
                            {t}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => alert('Agendamento enviado para aprovação!')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all">REVISAR E AGENDAR</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[1fr,400px] gap-12 animate-in fade-in duration-500">
                  <div className="space-y-12">
                    {/* Seção Sobre */}
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Sobre</h4>
                      <p className="text-slate-600 leading-relaxed text-lg">{selectedProfessional.bio}</p>
                    </div>

                    {/* Seção Serviços: Clicar leva para agendamento */}
                    <div className="space-y-6">
                      <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Serviços</h4>
                      <div className="space-y-4">
                        {selectedProfessional.services?.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => setSelectedService(s)}
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between hover:border-indigo-200 transition-colors group text-left"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{s.name}</span>
                              <span className="text-slate-400 text-sm font-medium flex items-center gap-1 mt-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {s.duration} min
                              </span>
                            </div>
                            <span className="font-black text-2xl text-indigo-600">R$ {s.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seção Galeria: Fotos que o profissional fez upload */}
                    <div className="space-y-6">
                      <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Galeria de fotos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedProfessional.gallery?.map((img, i) => (
                          <div key={i} className="aspect-square rounded-[24px] overflow-hidden border border-slate-200 shadow-sm hover:scale-[1.02] transition-transform">
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {(!selectedProfessional.gallery || selectedProfessional.gallery.length === 0) && (
                          <div className="col-span-full p-12 bg-slate-50 rounded-[32px] text-center text-slate-400 italic font-medium">
                            Nenhuma foto disponível na galeria deste profissional.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assistente Lateral */}
                  <div className="lg:sticky lg:top-10 h-fit">
                    <AIAssistant context={selectedProfessional} />
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
