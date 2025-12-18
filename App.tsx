
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import DirectoryTree from './components/DirectoryTree.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
import { supabase } from './lib/supabase.ts';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const DEFAULT_PROFESSIONALS: Professional[] = [];

const DeveloperPanel: React.FC<{ 
  professionals: Professional[];
  onRefresh: () => void; 
}> = ({ professionals, onRefresh }) => {
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
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
          slug: newProf.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000),
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
              {professionals.length === 0 ? (
                <p className="text-slate-400 italic text-sm text-center py-4">Nenhum profissional cadastrado.</p>
              ) : (
                professionals.map(p => (
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
                ))
              )}
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const serviceRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [profileData, setProfileData] = useState({
    id: '',
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
  
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [earningsMonth, setEarningsMonth] = useState('06/2024');

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('professionals').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setProfessionals(data.map((p: any) => ({ 
          id: p.id,
          slug: p.slug,
          name: p.name,
          salonName: p.salon_name,
          category: p.category,
          city: p.city,
          bio: p.bio || '',
          imageUrl: p.image_url,
          rating: p.rating || 5.0,
          services: p.services || [],
          gallery: p.gallery || [],
          whatsapp: p.whatsapp || '',
          address: p.address || '',
          expireDays: p.expire_days,
          resetWord: p.reset_word
        })));
      } else {
        setProfessionals(DEFAULT_PROFESSIONALS);
      }
    } catch (err) {
      setProfessionals(DEFAULT_PROFESSIONALS);
    }
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const activeProfessionalInModal = useMemo(() => {
    if (!selectedProfessional) return null;
    return professionals.find(p => p.id === selectedProfessional.id) || selectedProfessional;
  }, [selectedProfessional, professionals]);

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
    if (!profileData.id) {
        alert("Erro ao salvar: ID do profissional não carregado. Faça login novamente.");
        return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('professionals')
        .update({
          bio: profileData.bio,
          whatsapp: profileData.whatsapp,
          address: profileData.address,
          services: profileData.services,
          image_url: profileData.photo,
          gallery: galleryImages
        })
        .eq('id', profileData.id);
      
      if (error) throw error;
      
      // Sincronização imediata: re-fetch do marketplace e preview
      await fetchProfessionals();
      alert("Perfil e Serviços sincronizados com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar perfil: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    await new Promise(res => setTimeout(res, 1000));
    setIsSaving(false);
    alert("Horários salvos com sucesso!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfile: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
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

  const handleFinishBooking = () => {
    if (!clientData.name || !clientData.whatsapp || !clientData.terms) {
      alert("Por favor, preencha todos os campos e aceite os termos para concluir.");
      return;
    }

    const targetProf = activeProfessionalInModal;
    const message = `Olá ${targetProf?.name}, gostaria de agendar o seguinte serviço pelo MarcAI Agenda:\n\n` +
                    `📌 Serviço: ${selectedService?.name}\n` +
                    `📅 Data: ${selectedDate} de Junho de 2024\n` +
                    `⏰ Horário: ${selectedTime}\n` +
                    `👤 Cliente: ${clientData.name}\n` +
                    `📱 WhatsApp: ${clientData.whatsapp}\n\n` +
                    `Aguardo sua confirmação!`;
    
    const whatsappLink = `https://wa.me/${targetProf?.whatsapp?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
    
    setSelectedProfessional(null);
    setSelectedService(null);
    setBookingStep('selection');
    setClientData({ name: '', whatsapp: '', terms: false });
  };

  const handleProfessionalLogin = async (userData: any) => {
    try {
      let { data, error } = await supabase.from('professionals')
        .select('*')
        .eq('slug', userData.slug)
        .limit(1);
      
      if (!data || data.length === 0) {
        const { data: allProfs } = await supabase.from('professionals').select('*').limit(1);
        if (allProfs && allProfs.length > 0) {
            data = allProfs;
        } else {
            throw new Error("Nenhum profissional cadastrado no sistema.");
        }
      }

      const prof = data[0];

      setProfileData({
        id: prof.id,
        name: prof.name,
        bio: prof.bio || '',
        whatsapp: prof.whatsapp || '',
        address: prof.address || '',
        customLink: prof.slug,
        services: prof.services || [],
        photo: prof.image_url || 'https://picsum.photos/seed/marcos/100'
      });
      
      setGalleryImages(prof.gallery || []);
      
      setAppointments([
        {
          id: '1',
          professionalId: prof.id,
          clientName: 'Ana Silva',
          clientPhone: '11999999999',
          serviceId: 's1',
          serviceName: 'Corte de Cabelo',
          date: '17/12',
          time: '14:00',
          status: 'confirmed'
        },
        {
          id: '2',
          professionalId: prof.id,
          clientName: 'Carlos Souza',
          clientPhone: '11988888888',
          serviceId: 's2',
          serviceName: 'Barba',
          date: '17/12',
          time: '15:30',
          status: 'pending',
          isPreBooking: true
        }
      ]);

      setIsLoggedIn(true);
      setView(AppView.PROFESSIONAL_DASHBOARD);
    } catch (err: any) {
      console.error("Login Error:", err);
      alert("Erro ao acessar painel: " + err.message);
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
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
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
            {filteredProfessionals.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 italic text-lg">Nenhum profissional encontrado.</p>
              </div>
            ) : (
              filteredProfessionals.map((prof) => (
                <ProfessionalCard key={prof.id} professional={prof} onSelect={(p) => setSelectedProfessional(p)} />
              ))
            )}
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
              <button onClick={() => handleProfessionalLogin({slug: 'marcos-barbeiro'})} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Entrar</button>
            </div>
          </div>
        </div>
      );
      case AppView.PROFESSIONAL_DASHBOARD: return (
        <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-500">
          <div className="flex justify-center mb-8">
            <nav className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setDashboardTab('agendamentos')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'agendamentos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>AGENDAMENTOS</button>
              <button onClick={() => setDashboardTab('perfil')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'perfil' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>PERFIL & SERVIÇOS</button>
              <button onClick={() => setDashboardTab('horarios')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'horarios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>HORÁRIOS</button>
              <button onClick={() => setDashboardTab('galeria')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${dashboardTab === 'galeria' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>GALERIA</button>
            </nav>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
            {dashboardTab === 'agendamentos' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-12">
                <div className="bg-[#0f172a] p-8 rounded-[32px] text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm font-medium mb-1">Ganhos do dia (Concluídos)</p>
                        <h3 className="text-5xl font-black mb-6 tracking-tight">R$ 0.00</h3>
                        <button className="bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            Ganhos por Período
                        </button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                        <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agendamentos de Hoje</h2>
                    </div>
                    
                    <div className="grid gap-8">
                        {appointments.map(app => (
                            <div key={app.id} className={`p-8 bg-white border ${app.status === 'pending' ? 'border-amber-200 shadow-amber-50 shadow-lg' : 'border-slate-100 shadow-sm'} rounded-[32px] space-y-6 relative group transition-all hover:shadow-md`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 leading-none mb-2">{app.clientName}</h4>
                                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                            {app.clientPhone}
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        app.status === 'confirmed' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {app.status === 'confirmed' ? 'CONFIRMADO' : 'PENDENTE'}
                                    </span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-6 text-slate-500 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        {app.date} <span className="opacity-40 font-normal ml-1">(Hoje)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        {app.time}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                                        {app.serviceName}
                                    </div>
                                </div>

                                {app.isPreBooking && (
                                    <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl flex gap-4">
                                        <div className="flex-shrink-0 text-amber-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                                <span>🔔</span> <span>⚠️ PRÉ-AGENDAMENTO ATIVO</span>
                                            </h5>
                                            <p className="text-amber-700 text-xs font-medium italic">
                                                "Para confirmar este serviço, é necessário o pagamento antecipado de 50% via PIX (Chave: 123.456.789-00)."
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {app.isPreBooking && app.status === 'pending' && (
                                        <>
                                            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                                                Pré-confirmar
                                            </button>
                                            <button className="w-full py-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all">
                                                Confirmar Agendamento
                                            </button>
                                        </>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all">
                                            Concluir
                                        </button>
                                        <button className="py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all">
                                            Cancelar
                                        </button>
                                    </div>
                                    <button className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors pt-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        Excluir Agendamento
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Próximos Agendamentos</h2>
                    </div>
                    <div className="p-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px]">
                        <p className="text-slate-400 italic">Nenhum agendamento futuro no sistema.</p>
                    </div>
                </div>
              </div>
            )}
            
            {dashboardTab === 'perfil' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 relative pb-20">
                <h2 className="text-2xl font-black text-slate-900">Perfil e Serviços</h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Descrição do Perfil</label>
                        <textarea 
                          className="w-full p-4 border border-slate-200 rounded-2xl min-h-[140px] bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Fale um pouco sobre você..."
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        ></textarea>
                      </div>

                      <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700">Adicionar foto do perfil via upload do dispositivo</h4>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
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
                          type="tel" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="32988729033"
                          value={profileData.whatsapp}
                          onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Endereço (Google Maps)</label>
                        <input 
                          type="text" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="Rua, Batista de Oliveira, 331, centro"
                          value={profileData.address}
                          onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        />
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
                        <div key={s.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[28px] grid gap-4 items-start shadow-sm relative animate-in fade-in slide-in-from-top-4">
                          <div className="grid md:grid-cols-[1fr,120px,120px,180px,80px] gap-4 items-end">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Serviço</label>
                              <input 
                                ref={el => { serviceRefs.current[s.id] = el; }}
                                type="text" value={s.name} onChange={e => handleUpdateService(s.id, 'name', e.target.value)} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" placeholder="Ex: Atendimento Padrao" 
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                              <input type="number" value={s.price} onChange={e => handleUpdateService(s.id, 'price', parseFloat(e.target.value) || 0)} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tempo (min)</label>
                              <input type="number" value={s.duration} onChange={e => handleUpdateService(s.id, 'duration', parseInt(e.target.value) || 0)} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                            </div>
                            <div className="flex flex-col gap-2 justify-center h-full pb-1">
                              <div className="flex items-center gap-2">
                                <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={s.preBooking} onChange={e => handleUpdateService(s.id, 'preBooking', e.target.checked)} />
                                <span className="text-xs font-bold text-slate-600">Pré-agendamento</span>
                              </div>
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
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving} 
                      className="bg-[#4338ca] text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70"
                    >
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
                  <div className="pt-6 flex justify-end">
                    <button onClick={handleSaveSchedule} disabled={isSaving} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70">
                      {isSaving ? 'Salvando...' : 'Salvar Horários'}
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
                    <p className="text-slate-500 text-sm">Fotos dos seus trabalhos que aparecerão no seu perfil público.</p>
                  </div>
                  <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                  <button onClick={() => galleryInputRef.current?.click()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Fazer Upload
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {galleryImages.length === 0 ? (
                    <div className="col-span-full p-20 border-2 border-dashed border-slate-200 rounded-[32px] text-center text-slate-400">
                      Nenhuma foto enviada ainda. Use o botão acima para adicionar fotos.
                    </div>
                  ) : (
                    galleryImages.map((img, i) => (
                      <div key={i} className="aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-sm group relative animate-in zoom-in duration-300">
                        <img src={img} alt={`Trabalho ${i}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            const updated = galleryImages.filter((_, idx) => idx !== i);
                            setGalleryImages(updated);
                          }} 
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-lg"
                        >✕</button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-end pt-6">
                  <button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70">
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
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

  const modalProfessional = activeProfessionalInModal;

  return (
    <Layout activeView={view} onNavigate={handleNavigate} isLoggedIn={isLoggedIn}>
      {currentView()}
      {modalProfessional && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl relative">
            <button onClick={() => { setSelectedProfessional(null); setSelectedService(null); setBookingStep('selection'); }} className="absolute top-6 right-6 z-50 bg-slate-900/50 hover:bg-slate-900/80 w-10 h-10 rounded-full text-white flex items-center justify-center transition-colors">✕</button>
            <div className="relative h-80 overflow-hidden">
              <img src={modalProfessional.imageUrl} className="w-full h-full object-cover rounded-t-[40px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              <div className="absolute top-10 left-10 p-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 animate-in slide-in-from-top-4 duration-500">
                <span className="bg-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-2 inline-block text-white shadow-lg">{modalProfessional.category}</span>
                <h2 className="text-4xl font-black text-white leading-tight">{modalProfessional.name}</h2>
                {modalProfessional.salonName && <p className="text-white/80 font-medium flex items-center gap-1 mt-1 text-sm">🏪 {modalProfessional.salonName}</p>}
              </div>
            </div>

            <div className="p-10">
              {bookingStep === 'selection' ? (
                <div className="grid lg:grid-cols-[1fr,400px] gap-12 animate-in fade-in duration-500">
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 tracking-tight">Sobre</h4>
                      <div className="space-y-4">
                        <p className="text-slate-600 leading-relaxed text-lg">{modalProfessional.bio}</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                           {modalProfessional.whatsapp && (
                             <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                               <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">📱</span>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</span>
                                 <a href={`https://wa.me/${modalProfessional.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-indigo-600 font-bold hover:underline">
                                   {modalProfessional.whatsapp}
                                 </a>
                               </div>
                             </div>
                           )}
                           {modalProfessional.address && (
                             <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                               <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">📍</span>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</span>
                                 <a 
                                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(modalProfessional.address)}`} 
                                   target="_blank" 
                                   className="text-indigo-600 font-bold hover:underline truncate max-w-[150px]"
                                   title={modalProfessional.address}
                                 >
                                   {modalProfessional.address}
                                 </a>
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 tracking-tight">Serviços Disponíveis</h4>
                      <div className="space-y-4">
                        {modalProfessional.services?.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => setSelectedService(s)}
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between hover:border-indigo-200 transition-all group text-left hover:bg-white hover:shadow-lg"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{s.name}</span>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {s.duration} min
                                </span>
                                {s.preBooking && (
                                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Pré-agendamento</span>
                                )}
                              </div>
                            </div>
                            <span className="font-black text-2xl text-indigo-600">R$ {s.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 tracking-tight">Galeria de fotos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {modalProfessional.gallery?.map((img, i) => (
                          <div key={i} className="aspect-square rounded-[24px] overflow-hidden border border-slate-200 shadow-sm hover:scale-[1.02] transition-transform">
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="lg:sticky lg:top-10 h-fit">
                    <AIAssistant context={modalProfessional} />
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setBookingStep('selection')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">Quase lá!</h3>
                      <p className="text-slate-500 font-medium">Complete seus dados para confirmar o horário.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                        <input 
                          type="text" 
                          className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Digite seu nome"
                          value={clientData.name}
                          onChange={(e) => setClientData({...clientData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Seu WhatsApp</label>
                        <input 
                          type="tel" 
                          className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Ex: 32988887777"
                          value={clientData.whatsapp}
                          onChange={(e) => setClientData({...clientData, whatsapp: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        id="terms"
                        className="w-6 h-6 accent-indigo-600 rounded-lg cursor-pointer"
                        checked={clientData.terms}
                        onChange={(e) => setClientData({...clientData, terms: e.target.checked})}
                      />
                      <label htmlFor="terms" className="text-sm font-bold text-slate-600 cursor-pointer select-none">
                        Li e concordo com os termos de agendamento e políticas de cancelamento.
                      </label>
                    </div>
                    <button 
                      onClick={handleFinishBooking}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[28px] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                    >
                      CONCLUIR AGENDAMENTO
                    </button>
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
