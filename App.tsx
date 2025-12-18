
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import { Professional, AppView, Service } from './types.ts';
import { supabase } from './lib/supabase.ts';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Referência para upload de foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Estados do Dashboard
  const [dashTab, setDashTab] = useState<'appointments' | 'pre_bookings' | 'profile' | 'hours' | 'gallery'>('appointments');
  const [appointments, setAppointments] = useState<any[]>([
    { id: '1', clientName: 'Ricardo Silva', serviceName: 'Corte Degradê', time: '14:30', status: 'confirmed' }
  ]);
  const [preBookings, setPreBookings] = useState<any[]>([
    { id: '3', clientName: 'Marcos Oliveira', serviceName: 'Barba e Toalha Quente', time: '10:00', status: 'pending' }
  ]);

  // Dados do Cliente (Agendamento)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Estados de Filtro
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('professionals').select('*');
      if (error) throw error;
      if (data) {
        setProfessionals(data.map((p: any) => ({ 
          id: p.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          city: p.city,
          bio: p.bio || '',
          imageUrl: p.image_url,
          rating: p.rating || 5.0,
          services: p.services || [],
          salonName: p.salon_name,
          gallery: p.gallery || [],
          whatsapp: p.whatsapp,
          address: p.address
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const cities = useMemo(() => Array.from(new Set(professionals.map(p => p.city))).sort(), [professionals]);
  const categories = useMemo(() => Array.from(new Set(professionals.map(p => p.category))).sort(), [professionals]);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.bio.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === '' || p.city === cityFilter;
      const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [professionals, search, cityFilter, categoryFilter]);

  const handleNavigate = (newView: AppView) => {
    if (newView === AppView.LANDING && isLoggedIn) {
      setIsLoggedIn(false);
    }
    setView(newView);
    if (newView !== AppView.PROFESSIONAL_PROFILE) {
        setSelectedService(null);
        setSelectedTime(null);
        setClientName('');
        setClientPhone('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setView(AppView.PROFESSIONAL_DASHBOARD);
      setLoading(false);
    }, 800);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAppointment = (id: string, isPre: boolean) => {
    if (confirm("Deseja realmente excluir este agendamento?")) {
      if (isPre) setPreBookings(prev => prev.filter(a => a.id !== id));
      else setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSelectProfessional = (p: Professional) => {
    setSelectedProfessional(p);
    setSelectedService(null);
    setSelectedTime(null);
    setView(AppView.PROFESSIONAL_PROFILE);
    window.scrollTo(0, 0);
  };

  const handleConfirmBooking = () => {
    if (!selectedTime || !selectedService || !selectedProfessional || !clientName || !clientPhone) {
      alert("Por favor, preencha todos os campos para confirmar.");
      return;
    }

    const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');
    const message = `Olá ${selectedProfessional.name}, gostaria de agendar: *${selectedService.name}* para o dia *${dateFormatted}* às *${selectedTime}*. Meu nome é ${clientName}. Está confirmado?`;
    const whatsappUrl = `https://wa.me/${selectedProfessional.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    setView(AppView.CLIENTS);
  };

  const nextDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const timeSlots = ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30", "16:15", "17:00"];

  return (
    <Layout activeView={view} onNavigate={handleNavigate} isLoggedIn={isLoggedIn}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        
        {view === AppView.LANDING && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Como deseja continuar?</h2>
              <p className="text-slate-500 font-medium">Escolha o seu perfil para acessar o MarcAI Agenda.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 w-full">
              <button onClick={() => setView(AppView.CLIENTS)} className="group relative bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-center flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                  <svg className="w-16 h-16 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Sou cliente</h3>
                  <p className="text-slate-500 text-sm">Quero encontrar profissionais e agendar um horário.</p>
                </div>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="group relative bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-center flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                  <svg className="w-16 h-16 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Sou profissional</h3>
                  <p className="text-slate-500 text-sm">Quero gerenciar meus serviços e minha agenda.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {view === AppView.CLIENTS && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Encontre o Profissional Ideal</h2>
              <p className="text-slate-500 font-medium">Busque por nome, cidade ou categoria de serviço.</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                <input type="text" placeholder="Busque por especialidade..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <select className="bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}><option value="">Cidades</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select>
                <select className="bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Categorias</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {filteredProfessionals.map(p => <ProfessionalCard key={p.id} professional={p} onSelect={handleSelectProfessional} />)}
              </div>
            )}
          </div>
        )}

        {view === AppView.PROFESSIONAL_LOGIN && (
          <div className="flex items-center justify-center min-h-[70vh] w-full px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white p-10 md:p-14 rounded-[48px] shadow-2xl shadow-indigo-100 border border-slate-100 w-full max-w-lg">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-100">M</div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Acesso Restrito</h2>
                <p className="text-slate-500 font-medium">Painel de Controle Profissional</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">E-mail</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-slate-50 border-none rounded-[24px] px-6 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Senha</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-[24px] px-6 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                
                <div className="flex items-center justify-between px-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Lembrar-me</span>
                  </label>
                  <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Esqueci a senha</button>
                </div>

                <button disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4">
                  {loading ? 'Entrando...' : 'Acessar Painel'}
                </button>
                
                <button type="button" onClick={() => setView(AppView.LANDING)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm">Voltar ao início</button>
              </form>
            </div>
          </div>
        )}

        {view === AppView.PROFESSIONAL_DASHBOARD && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row gap-8">
              <aside className="md:w-72 space-y-2">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6 flex flex-col items-center text-center relative overflow-hidden group">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-2xl mb-4 border-2 border-indigo-100 shadow-inner cursor-pointer hover:opacity-80 transition-all relative group"
                  >
                    {profileImage ? (
                      <img src={profileImage} className="w-full h-full object-cover rounded-full" alt="Perfil" />
                    ) : (
                      "JD"
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900">João Donizete</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Plano Pro</p>
                </div>
                
                <button onClick={() => setDashTab('appointments')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'appointments' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Agendamentos</button>
                <button onClick={() => setDashTab('pre_bookings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'pre_bookings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Pré-agendamento</button>
                <button onClick={() => setDashTab('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'profile' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Perfil e serviços</button>
                <button onClick={() => setDashTab('hours')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'hours' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Horários</button>
                <button onClick={() => setDashTab('gallery')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'gallery' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Galeria</button>
                
                <div className="pt-8">
                  <button onClick={() => setView(AppView.LANDING)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all">Sair da conta</button>
                </div>
              </aside>

              <main className="flex-1 space-y-8">
                {dashTab === 'appointments' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Próximos Agendamentos</h3>
                    <div className="grid gap-4">
                      {appointments.length > 0 ? appointments.map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600">{a.clientName[0]}</div>
                            <div>
                              <h5 className="font-bold text-slate-900">{a.clientName}</h5>
                              <p className="text-xs text-slate-400 font-bold uppercase">{a.serviceName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-black text-indigo-600">Hoje, {a.time}</p>
                              <p className="text-xs text-slate-400 font-bold uppercase">Confirmado</p>
                            </div>
                            <button onClick={() => handleDeleteAppointment(a.id, false)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>
                      )) : <div className="py-12 text-center text-slate-400">Nenhum agendamento para hoje.</div>}
                    </div>
                  </div>
                )}

                {dashTab === 'pre_bookings' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Solicitações Pendentes</h3>
                    <div className="grid gap-4">
                      {preBookings.length > 0 ? preBookings.map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center font-bold text-amber-600">{a.clientName[0]}</div>
                            <div>
                              <h5 className="font-bold text-slate-900">{a.clientName}</h5>
                              <p className="text-xs text-slate-400 font-bold uppercase">{a.serviceName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => {setAppointments([...appointments, {...a, status: 'confirmed'}]); setPreBookings(preBookings.filter(p => p.id !== a.id))}} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                            <button onClick={() => handleDeleteAppointment(a.id, true)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>
                      )) : <div className="py-12 text-center text-slate-400">Nenhuma solicitação nova.</div>}
                    </div>
                  </div>
                )}

                {dashTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dados da Conta</h3>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nome Comercial</label>
                          <input type="text" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="João Donizete" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">WhatsApp</label>
                          <input type="tel" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="11999999999" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Endereço de Atendimento</label>
                        <input type="text" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="Rua Exemplo, 123 - Centro" />
                      </div>
                      
                      <div className="pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-xl font-black text-slate-900">Seus Serviços</h4>
                          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">+ Novo Serviço</button>
                        </div>
                        <div className="space-y-3">
                           <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between">
                              <div><p className="font-bold">Corte Tradicional</p><p className="text-xs text-slate-400">R$ 50,00 • 30 min</p></div>
                              <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                           </div>
                        </div>
                      </div>
                      <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg">Salvar Configurações</button>
                    </div>
                  </div>
                )}

                {dashTab === 'hours' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agenda de Atendimento</h3>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                       {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(day => (
                         <div key={day} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                           <span className="font-bold text-slate-700 w-24">{day}</span>
                           <div className="flex items-center gap-3">
                             <input type="text" className="w-20 bg-white border-none rounded-lg p-2 text-center text-sm font-bold" defaultValue="09:00" />
                             <span className="text-slate-300 font-black">às</span>
                             <input type="text" className="w-20 bg-white border-none rounded-lg p-2 text-center text-sm font-bold" defaultValue="18:00" />
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" defaultChecked />
                             <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                           </label>
                         </div>
                       ))}
                       <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                          <p className="font-bold">Intervalo de Almoço</p>
                          <div className="flex gap-3"><input className="w-20 bg-slate-50 p-2 rounded-lg text-center" defaultValue="12:00" /><span>até</span><input className="w-20 bg-slate-50 p-2 rounded-lg text-center" defaultValue="13:00" /></div>
                       </div>
                    </div>
                  </div>
                )}

                {dashTab === 'gallery' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Seu Portfólio</h3>
                       <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">+ Adicionar Fotos</button>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                       <button className="aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all gap-2 group">
                         <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                       </button>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
