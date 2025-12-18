
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
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  
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

  const handleExecuteSQL = async () => {
    setLoading(true);
    setSqlResult(null);
    try {
      // Nota: exec_sql RPC deve estar habilitado no seu Supabase
      const { data, error } = await supabase.rpc('exec_sql', { query: sqlQuery });
      if (error) throw error;
      setSqlResult(JSON.stringify(data, null, 2) || 'Sucesso: Query executada.');
      onRefresh();
    } catch (err: any) {
      setSqlResult('Erro SQL: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
          bio: '', // Deixa em branco para preenchimento manual
          image_url: 'https://picsum.photos/seed/default/400/300',
          rating: 5.0,
          expire_days: newProf.expireDays,
          reset_word: newProf.resetWord,
          services: [] // Deixa em branco para preenchimento manual
        };

        const { error: dbError } = await supabase.from('professionals').insert([professionalData]);
        if (dbError) throw dbError;
      }
      
      setNewProf({ name: '', salonName: '', category: '', city: '', username: '', password: '', resetWord: '', expireDays: -1 });
      setEditingId(null);
      onRefresh();
      alert('Operação realizada com sucesso!');
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
          <p className="text-slate-500">Gestão de Arquitetura e SQL</p>
        </div>
        <button onClick={() => setAuthed(false)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">Sair</button>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Profissional' : 'Novo Profissional'}</h3>
            <div className="space-y-4">
              <input placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProf.name} onChange={(e) => setNewProf({...newProf, name: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Categoria" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.category} onChange={(e) => setNewProf({...newProf, category: e.target.value})} />
                <input placeholder="Salão" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.salonName} onChange={(e) => setNewProf({...newProf, salonName: e.target.value})} />
                <input placeholder="Cidade" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={newProf.city} onChange={(e) => setNewProf({...newProf, city: e.target.value})} />
              </div>
              <button disabled={loading} onClick={handleRegister} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg transition-all">
                {loading ? 'Processando...' : 'Confirmar Registro'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6 shadow-2xl">
            <h3 className="text-xl font-bold text-indigo-400">🚀 Gerador de SQL (Supabase)</h3>
            <div className="space-y-4">
              <textarea 
                placeholder="Ex: UPDATE professionals SET services = '[]' WHERE id = '...';" 
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
              ></textarea>
              <button 
                onClick={handleExecuteSQL}
                disabled={loading || !sqlQuery}
                className="w-full py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
              >
                Executar Query SQL
              </button>
              {sqlResult && (
                <pre className="p-4 bg-black/40 rounded-xl text-[10px] overflow-auto max-h-40 border border-slate-700 text-emerald-400">
                  {sqlResult}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Lista de Profissionais</h3>
            <div className="space-y-3">
              {professionals.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-sm text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{p.category} • {p.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DirectoryTree />
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
  const [bookingStep, setBookingStep] = useState<'selection' | 'review'>('selection');
  const [clientData, setClientData] = useState({ name: '', whatsapp: '', terms: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    bio: '',
    whatsapp: '',
    address: '',
    customLink: '',
    services: [] as Service[],
    photo: 'https://picsum.photos/seed/marcos/100'
  });

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
      }
    } catch (err) {
      console.error(err);
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

  const handleNavigate = (newView: AppView) => {
    if (newView === AppView.LANDING) setIsLoggedIn(false);
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
    setProfileData(prev => ({ ...prev, services: [...prev.services, newService] }));
  };

  const handleUpdateService = (id: string, field: keyof Service, value: any) => {
    setProfileData(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleDeleteService = (id: string) => {
    setProfileData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  const handleSaveProfile = async () => {
    if (!profileData.id) return;
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
      await fetchProfessionals();
      alert("Perfil e Serviços atualizados com sucesso!");
    } catch (err: any) {
      alert("Falha ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishBooking = () => {
    if (!clientData.name || !clientData.whatsapp || !clientData.terms) {
      alert("Preencha todos os campos.");
      return;
    }
    const targetProf = activeProfessionalInModal;
    const msg = `Olá ${targetProf?.name}, novo agendamento MarcAI:\n📍 ${selectedService?.name}\n👤 ${clientData.name}\n📱 ${clientData.whatsapp}`;
    const link = `https://wa.me/${targetProf?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(link, '_blank');
    setSelectedProfessional(null);
  };

  const handleProfessionalLogin = async (userData: any) => {
    try {
      const { data } = await supabase.from('professionals').select('*').eq('slug', userData.slug).single();
      if (!data) throw new Error("Acesso não encontrado.");
      setProfileData({
        id: data.id,
        name: data.name,
        bio: data.bio || '',
        whatsapp: data.whatsapp || '',
        address: data.address || '',
        customLink: data.slug,
        services: data.services || [],
        photo: data.image_url || 'https://picsum.photos/seed/marcos/100'
      });
      setGalleryImages(data.gallery || []);
      setIsLoggedIn(true);
      setView(AppView.PROFESSIONAL_DASHBOARD);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const modalProfessional = activeProfessionalInModal;

  return (
    <Layout activeView={view} onNavigate={handleNavigate} isLoggedIn={isLoggedIn}>
      {view === AppView.LANDING && (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 bg-slate-50">
          <div className="max-w-5xl text-center space-y-12 animate-in fade-in duration-700">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">
              Agendamentos que <span className="text-indigo-600">aprendem</span> com você.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              <button onClick={() => setView(AppView.CLIENTS)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Sou cliente</h3>
                <p className="text-slate-500 text-sm mt-2">agendar um serviço</p>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="p-10 bg-white border-2 border-slate-100 rounded-[32px] hover:border-indigo-600 hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Área Profissional</h3>
                <p className="text-slate-500 text-sm mt-2">gerenciar minha agenda</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {view === AppView.CLIENTS && (
        <div className="max-w-7xl mx-auto py-12 px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-8">Marketplace MarcAI</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProfessionals.map((prof) => (
              <ProfessionalCard key={prof.id} professional={prof} onSelect={(p) => setSelectedProfessional(p)} />
            ))}
          </div>
        </div>
      )}

      {view === AppView.PROFESSIONAL_LOGIN && (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 w-full max-w-md space-y-8">
            <h2 className="text-3xl font-bold text-center">Login Profissional</h2>
            <div className="space-y-4">
              <input placeholder="Usuário (slug)" className="w-full px-4 py-4 border rounded-2xl bg-slate-50 outline-none" onChange={(e) => setProfileData(p => ({...p, customLink: e.target.value}))} />
              <button onClick={() => handleProfessionalLogin({slug: profileData.customLink})} className="w-full py-5 bg-[#4338ca] text-white rounded-2xl font-black hover:bg-indigo-700 transition-all">ENTRAR NO PAINEL</button>
            </div>
          </div>
        </div>
      )}

      {view === AppView.PROFESSIONAL_DASHBOARD && (
        <div className="max-w-7xl mx-auto py-12 px-4">
          <div className="flex justify-center mb-8">
            <nav className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl">
              <button onClick={() => setDashboardTab('agendamentos')} className={`px-6 py-2.5 rounded-xl text-xs font-black ${dashboardTab === 'agendamentos' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>AGENDAMENTOS</button>
              <button onClick={() => setDashboardTab('perfil')} className={`px-6 py-2.5 rounded-xl text-xs font-black ${dashboardTab === 'perfil' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>PERFIL & SERVIÇOS</button>
              <button onClick={() => setDashboardTab('horarios')} className={`px-6 py-2.5 rounded-xl text-xs font-black ${dashboardTab === 'horarios' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>HORÁRIOS</button>
            </nav>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm min-h-[500px] relative">
            {dashboardTab === 'perfil' && (
              <div className="space-y-8 pb-24">
                <h2 className="text-2xl font-black text-slate-900">Perfil e Serviços</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Descrição do Perfil</label>
                      <textarea className="w-full p-4 border border-slate-200 rounded-2xl min-h-[140px] bg-slate-50" value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Foto do Perfil</label>
                      <div className="flex items-center gap-4">
                        <img src={profileData.photo} className="w-20 h-20 rounded-2xl object-cover bg-slate-100" />
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">Escolher arquivo</button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">WhatsApp de Atendimento</label>
                      <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50" value={profileData.whatsapp} onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Endereço do Local</label>
                      <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50" value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black">Meus Serviços</h3>
                    <button onClick={handleAddService} className="text-indigo-600 font-bold text-sm">+ Adicionar Serviço</button>
                  </div>
                  <div className="space-y-4">
                    {profileData.services.map((s) => (
                      <div key={s.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[28px] grid md:grid-cols-[1fr,100px,100px,180px,50px] gap-4 items-end animate-in fade-in">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SERVIÇO</span>
                          <input value={s.name} onChange={e => handleUpdateService(s.id, 'name', e.target.value)} className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">VALOR (R$)</span>
                          <input type="number" value={s.price} onChange={e => handleUpdateService(s.id, 'price', parseFloat(e.target.value))} className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MINUTOS</span>
                          <input type="number" value={s.duration} onChange={e => handleUpdateService(s.id, 'duration', parseInt(e.target.value))} className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none" />
                        </div>
                        <div className="flex items-center gap-2 h-full pb-3.5">
                          <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" checked={s.preBooking} onChange={e => handleUpdateService(s.id, 'preBooking', e.target.checked)} />
                          <span className="text-[11px] font-black text-slate-600 tracking-tight uppercase">Pré-agendamento</span>
                        </div>
                        <button onClick={() => handleDeleteService(s.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-6 right-8">
                  <button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#4338ca] text-white px-14 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-800 transition-all disabled:opacity-50">
                    {isSaving ? 'SALVANDO...' : 'Salvar Perfil'}
                  </button>
                </div>
              </div>
            )}
            {dashboardTab === 'agendamentos' && <div className="p-20 text-center text-slate-400 italic font-medium">Lista de agendamentos agendados hoje.</div>}
            {dashboardTab === 'horarios' && <div className="p-20 text-center text-slate-400 italic font-medium">Configurações de horários de atendimento.</div>}
          </div>
        </div>
      )}

      {view === AppView.DEVELOPER_PANEL && <DeveloperPanel professionals={professionals} onRefresh={fetchProfessionals} />}

      {modalProfessional && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl relative">
            <button onClick={() => setSelectedProfessional(null)} className="absolute top-6 right-6 z-50 bg-slate-900/40 hover:bg-slate-900/60 w-10 h-10 rounded-full text-white flex items-center justify-center">✕</button>
            <div className="relative h-80">
              <img src={modalProfessional.imageUrl} className="w-full h-full object-cover rounded-t-[40px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>
              
              <div className="absolute -bottom-12 left-12 p-1.5 bg-white rounded-[32px] shadow-2xl border border-slate-100 z-10">
                <img src={modalProfessional.imageUrl} className="w-32 h-32 rounded-[28px] object-cover" />
              </div>

              <div className="absolute top-10 left-10 p-6 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10">
                <span className="bg-[#4338ca] text-[9px] font-black uppercase px-3 py-1 rounded-full text-white mb-2 inline-block shadow-lg">{modalProfessional.category.toUpperCase()}</span>
                <h2 className="text-5xl font-black text-white leading-none">{modalProfessional.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-white/80 text-xs font-bold uppercase tracking-tight">🏪 {modalProfessional.salonName || 'MarcAI Studio'}</div>
              </div>

              <div className="absolute top-10 right-20 flex flex-col gap-3">
                {modalProfessional.whatsapp && (
                  <a href={`https://wa.me/${modalProfessional.whatsapp.replace(/\D/g, '')}`} target="_blank" className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-xl hover:bg-white transition-all group min-w-[200px]">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp direto</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <span className="text-[#4338ca] font-black text-sm group-hover:underline">{modalProfessional.whatsapp}</span>
                    </div>
                  </a>
                )}
                {modalProfessional.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(modalProfessional.address)}`} target="_blank" className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-xl hover:bg-white transition-all group min-w-[200px]">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço / Local</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📍</span>
                      <span className="text-slate-700 font-bold text-[10px] line-clamp-1 group-hover:underline">{modalProfessional.address}</span>
                    </div>
                  </a>
                )}
              </div>
            </div>

            <div className="p-10 pt-20 space-y-12">
              <div className="grid lg:grid-cols-[1fr,400px] gap-12">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 tracking-tight">Sobre</h4>
                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{modalProfessional.bio || 'Profissional parceiro MarcAI.'}</p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-2xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 tracking-tight">Agendar Serviço</h4>
                    <div className="space-y-4">
                      {modalProfessional.services.length === 0 ? (
                        <p className="text-slate-400 italic p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nenhum serviço disponível no momento.</p>
                      ) : (
                        modalProfessional.services.map(s => (
                          <button key={s.id} onClick={() => { setSelectedService(s); setBookingStep('selection'); }} className="w-full p-7 bg-slate-50 border border-slate-200 rounded-[32px] flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all group shadow-sm hover:shadow-xl">
                            <div className="flex flex-col text-left">
                              <span className="font-black text-slate-900 text-xl group-hover:text-[#4338ca] transition-colors">{s.name}</span>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-slate-400 text-xs font-bold">🕒 {s.duration} min</span>
                                 {s.preBooking && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Pré-agendamento</span>}
                              </div>
                            </div>
                            <span className="font-black text-2xl text-[#4338ca] tracking-tight">R$ {s.price}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="lg:sticky lg:top-10 h-fit">
                  <AIAssistant context={modalProfessional} />
                </div>
              </div>

              {selectedService && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white p-10 rounded-[40px] w-full max-w-md shadow-2xl space-y-8 animate-in zoom-in-95">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl font-black tracking-tight leading-tight">Agendar {selectedService.name}</h3>
                      <button onClick={() => setSelectedService(null)} className="text-slate-400 font-bold text-xl hover:text-red-500 transition-colors">✕</button>
                    </div>
                    <div className="space-y-6">
                      <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none" placeholder="Seu Nome Completo" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
                      <input className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none" placeholder="WhatsApp (DDD+Número)" value={clientData.whatsapp} onChange={e => setClientData({...clientData, whatsapp: e.target.value})} />
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" className="w-6 h-6 accent-[#4338ca] rounded cursor-pointer" checked={clientData.terms} onChange={e => setClientData({...clientData, terms: e.target.checked})} />
                        <span className="text-[11px] font-bold text-slate-600 leading-tight">Estou ciente das políticas de agendamento do MarcAI.</span>
                      </div>
                    </div>
                    <button onClick={handleFinishBooking} className="w-full py-5 bg-[#4338ca] text-white rounded-2xl font-black shadow-xl hover:bg-indigo-800 transition-all active:scale-95">CONCLUIR AGENDAMENTO</button>
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
