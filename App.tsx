
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
    whatsapp: '5511999999999', address: 'Av. Paulista, 1000'
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
        <div className="bg-slate-900 p-8 rounded-3xl text-white w-full max-sm space-y-6 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
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
          slug: cleanUsername,
          bio: 'Profissional cadastrado via painel administrativo.',
          image_url: `https://picsum.photos/seed/${cleanUsername}/400/300`,
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
      username: p.slug,
      password: '',
      resetWord: p.resetWord || '',
      expireDays: p.expireDays || -1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este profissional?')) return;
    if (id.length < 10) {
      alert("Este é um profissional de demonstração e não pode ser excluído.");
      return;
    }

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
          </div>
          <div className="animate-in slide-in-from-top-4 duration-300">
            <DirectoryTree />
          </div>
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
  const [selectedDate, setSelectedDate] = useState<string>('18');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'selection' | 'review'>('selection');
  const [clientData, setClientData] = useState({ name: '', whatsapp: '', terms: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const serviceRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    whatsapp: '',
    address: '',
    customLink: 'meulink',
    services: [] as Service[],
    photo: 'https://picsum.photos/seed/marcos/100'
  });

  const [daySchedules, setDaySchedules] = useState(
    DAYS_OF_WEEK.map(day => ({ day, active: true, open: '09:00', close: '18:00' }))
  );
  const [lunchBreak, setLunchBreak] = useState({ active: false, start: '12:00', end: '13:00' });
  
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [earningsMonth, setEarningsMonth] = useState('06/2024');

  // Fix: Added handleNavigate to resolve the missing name error.
  const handleNavigate = (newView: AppView) => {
    if (view === AppView.PROFESSIONAL_DASHBOARD && newView === AppView.LANDING) {
      setIsLoggedIn(false);
    }
    setView(newView);
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('professionals').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const proList = data.map((p: any) => ({ 
          ...p, 
          salonName: p.salon_name, 
          expireDays: p.expire_days,
          resetWord: p.reset_word,
          imageUrl: p.image_url,
          whatsapp: p.whatsapp,
          address: p.address,
          gallery: p.gallery || []
        }));
        setProfessionals(proList);
      } else {
        setProfessionals(DEFAULT_PROFESSIONALS);
      }
    } catch (err) {
      console.warn("Aviso: Usando dados mockados.");
      setProfessionals(DEFAULT_PROFESSIONALS);
    }
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const handleProfessionalLogin = async () => {
    const username = loginUser.trim().toLowerCase();
    const found = professionals.find(p => p.slug === username);
    
    if (found) {
      setProfileData({
        name: found.name,
        bio: found.bio || '',
        whatsapp: found.whatsapp || '',
        address: found.address || '',
        customLink: found.slug,
        services: found.services || [],
        photo: found.imageUrl || 'https://picsum.photos/seed/marcos/100'
      });
      setIsLoggedIn(true);
      setView(AppView.PROFESSIONAL_DASHBOARD);
    } else {
      alert("Usuário não encontrado.");
    }
  };

  const handleAddService = () => {
    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      duration: 30,
      price: 0,
      preBooking: false,
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

  const handleFinishBooking = () => {
    if (!clientData.name || !clientData.whatsapp || !clientData.terms) {
      alert("Preencha todos os campos e aceite os termos para continuar.");
      return;
    }

    const message = `Olá ${selectedProfessional?.name}, gostaria de agendar um serviço pelo MarcAI Agenda:\n\n` +
                    `📌 Serviço: ${selectedService?.name}\n` +
                    `📅 Data: ${selectedDate} de Junho de 2024\n` +
                    `⏰ Horário: ${selectedTime}\n` +
                    `👤 Cliente: ${clientData.name}\n` +
                    `📱 Contato: ${clientData.whatsapp}\n\n` +
                    `Pode me confirmar?`;
    
    const whatsappLink = `https://wa.me/${selectedProfessional?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
    
    setSelectedProfessional(null);
    setSelectedService(null);
    setBookingStep('selection');
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

  const currentView = () => {
    switch (view) {
      case AppView.LANDING: return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden bg-slate-50">
          <div className="max-w-5xl text-center space-y-12 animate-in fade-in zoom-in duration-700">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Agendamentos que <span className="text-indigo-600">aprendem</span> com você.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              <button onClick={() => setView(AppView.CLIENTS)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 transition-all">
                <h3 className="text-2xl font-bold text-slate-900">Sou cliente</h3>
                <p className="text-slate-500 text-sm mt-2">procurar profissionais para agendar</p>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 transition-all">
                <h3 className="text-2xl font-bold text-slate-900">Área do Profissional</h3>
                <p className="text-slate-500 text-sm mt-2">gerencie sua agenda e serviços</p>
              </button>
            </div>
          </div>
        </div>
      );
      case AppView.CLIENTS: return (
        <div className="max-w-7xl mx-auto py-12 px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-8">Encontre um Profissional</h2>
          <div className="bg-white p-4 rounded-3xl shadow-sm mb-12 border border-slate-100 grid md:grid-cols-4 gap-4">
            <input placeholder="Busca..." className="col-span-2 px-5 py-4 bg-slate-50 border-none rounded-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="px-5 py-4 bg-slate-50 rounded-2xl" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">Cidades</option>
              {Array.from(new Set(professionals.map(p => p.city))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProfessionals.map((prof) => (
              <ProfessionalCard key={prof.id} professional={prof} onSelect={(p) => { setSelectedProfessional(p); setBookingStep('selection'); }} />
            ))}
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_LOGIN: return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md space-y-8 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-bold text-center text-slate-900">Acesso</h2>
            <div className="space-y-4">
              <input placeholder="Usuário" className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
              <input type="password" placeholder="Senha" className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              <button onClick={handleProfessionalLogin} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Entrar</button>
            </div>
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_DASHBOARD: return (
        <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-500">
          <div className="flex justify-center mb-8">
            <nav className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl">
              <button onClick={() => setDashboardTab('agendamentos')} className={`px-6 py-2.5 rounded-xl font-bold ${dashboardTab === 'agendamentos' ? 'bg-indigo-600 text-white' : ''}`}>Agendamentos</button>
              <button onClick={() => setDashboardTab('perfil')} className={`px-6 py-2.5 rounded-xl font-bold ${dashboardTab === 'perfil' ? 'bg-indigo-600 text-white' : ''}`}>Perfil e Serviços</button>
            </nav>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
            {dashboardTab === 'agendamentos' && (
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full overflow-hidden">
                    <img src={profileData.photo} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900">Olá, {profileData.name}!</h2>
                </div>
                <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                    <h3 className="font-bold text-indigo-900">Ganhos desse mês</h3>
                    <p className="text-3xl font-black text-indigo-600">R$ 1.450,00</p>
                </div>
              </div>
            )}
            
            {dashboardTab === 'perfil' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black text-slate-900">Perfil e Serviços</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-700">WhatsApp de Atendimento</label>
                      <input 
                        className="w-full p-4 border rounded-2xl bg-slate-50" 
                        placeholder="Ex: 5511999999999"
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-700">Endereço Completo</label>
                      <input 
                        className="w-full p-4 border rounded-2xl bg-slate-50" 
                        placeholder="Rua, Número, Bairro, Cidade"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      />
                    </div>
                </div>
                <div className="space-y-6 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-900">Serviços</h3>
                      <button onClick={handleAddService} className="text-indigo-600 font-bold">+ Novo Serviço</button>
                    </div>
                    <div className="space-y-4">
                      {profileData.services.map((s) => (
                        <div key={s.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[28px] grid md:grid-cols-4 gap-4 items-center">
                            <input value={s.name} onChange={e => handleUpdateService(s.id, 'name', e.target.value)} className="p-3 rounded-xl border" placeholder="Nome do Serviço" />
                            <input type="number" value={s.price} onChange={e => handleUpdateService(s.id, 'price', Number(e.target.value))} className="p-3 rounded-xl border" placeholder="Preço" />
                            <input type="number" value={s.duration} onChange={e => handleUpdateService(s.id, 'duration', Number(e.target.value))} className="p-3 rounded-xl border" placeholder="Duração (min)" />
                            <button onClick={() => handleDeleteService(s.id)} className="text-red-500 font-bold">Excluir</button>
                        </div>
                      ))}
                    </div>
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
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => { setSelectedProfessional(null); setSelectedService(null); setBookingStep('selection'); }} className="absolute top-6 right-6 z-50 bg-slate-900/50 hover:bg-slate-900/80 w-10 h-10 rounded-full text-white flex items-center justify-center">✕</button>
            
            <div className="relative h-80 overflow-hidden">
              <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover rounded-t-[40px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              <div className="absolute top-10 left-10 p-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20">
                <h2 className="text-4xl font-black text-white leading-tight">{selectedProfessional.name}</h2>
                <div className="flex gap-4 mt-4">
                   {selectedProfessional.whatsapp && (
                     <a href={`https://wa.me/${selectedProfessional.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">
                       📱 WhatsApp do Estabelecimento
                     </a>
                   )}
                   {selectedProfessional.address && (
                     <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProfessional.address)}`} target="_blank" className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors">
                       📍 Ver Endereço no Maps
                     </a>
                   )}
                </div>
              </div>
            </div>

            <div className="p-10">
              {bookingStep === 'selection' ? (
                <>
                  {selectedService ? (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-slate-100 rounded-full">❮</button>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agendar {selectedService.name}</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-8 rounded-[32px] text-center">
                          <span className="font-black text-xl text-slate-800">Junho 2024</span>
                          <div className="grid grid-cols-7 gap-2 mt-4">
                            {Array.from({length: 30}).map((_, i) => (
                              <button key={i} onClick={() => setSelectedDate((i+1).toString())} className={`h-12 rounded-2xl font-bold ${selectedDate === (i+1).toString() ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-slate-700'}`}>
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h4 className="font-black text-slate-900">Horários Disponíveis</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {['09:00','09:30','10:00','10:30','14:00','14:30','15:00','16:00'].map(t => (
                              <button key={t} onClick={() => setSelectedTime(t)} className={`py-3 px-4 border rounded-xl font-bold ${selectedTime === t ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:border-indigo-600 transition-all'}`}>
                                {t}
                              </button>
                            ))}
                          </div>
                          {selectedTime && (
                            <button onClick={() => setBookingStep('review')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl mt-4 active:scale-95 transition-all">REVISAR E AGENDAR</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-[1fr,400px] gap-12">
                      <div className="space-y-12">
                        <div className="space-y-4">
                          <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Sobre</h4>
                          <p className="text-slate-600 leading-relaxed">{selectedProfessional.bio}</p>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Serviços</h4>
                          <div className="space-y-4">
                            {selectedProfessional.services?.map(s => (
                              <button key={s.id} onClick={() => setSelectedService(s)} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between hover:border-indigo-200 transition-colors group">
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-slate-900 text-lg group-hover:text-indigo-600">{s.name}</span>
                                  <span className="text-slate-400 text-sm flex items-center gap-1 mt-1">🕒 {s.duration} min</span>
                                </div>
                                <span className="font-black text-2xl text-indigo-600">R$ {s.price}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="lg:sticky lg:top-10 h-fit">
                        <AIAssistant context={selectedProfessional} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-slate-900">Quase lá!</h3>
                    <p className="text-slate-500">Complete seus dados para confirmar seu horário com {selectedProfessional.name}.</p>
                  </div>
                  
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                        <input className="w-full p-4 rounded-2xl bg-white border border-slate-200" placeholder="Digite seu nome" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Seu WhatsApp</label>
                        <input className="w-full p-4 rounded-2xl bg-white border border-slate-200" placeholder="Ex: 32988887777" value={clientData.whatsapp} onChange={e => setClientData({...clientData, whatsapp: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl">
                      <input type="checkbox" id="terms" className="w-5 h-5 accent-indigo-600" checked={clientData.terms} onChange={e => setClientData({...clientData, terms: e.target.checked})} />
                      <label htmlFor="terms" className="text-sm font-medium text-indigo-900">Li e concordo com os termos de agendamento</label>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button 
                        onClick={handleFinishBooking}
                        disabled={!clientData.terms}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 disabled:opacity-50 transition-all hover:bg-indigo-700"
                      >
                        CONCLUIR AGENDAMENTO
                      </button>
                      <button onClick={() => setBookingStep('selection')} className="w-full text-slate-400 font-bold text-sm">Voltar</button>
                    </div>
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
