
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
  
  // Estado do Profissional Logado
  const [loggedProfessional, setLoggedProfessional] = useState<Professional | null>(null);

  // Dev Mode Security
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [editingProId, setEditingProId] = useState<string | null>(null);

  // Cadastro Profissional Dev
  const [newPro, setNewPro] = useState({
    name: '',
    salonName: '',
    city: '',
    login: '',
    expireDays: 30,
    password: '',
    resetWord: ''
  });

  // Referência para upload de foto no Dashboard
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  // Formulário de Serviço
  const [serviceForm, setServiceForm] = useState<Partial<Service> | null>(null);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('professionals').select('*').order('created_at', { ascending: false });
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
          address: p.address,
          expireDays: p.expire_days,
          resetWord: p.reset_word
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
                          p.city.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === '' || p.city === cityFilter;
      const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [professionals, search, cityFilter, categoryFilter]);

  const handleNavigate = (newView: AppView) => {
    if (newView === AppView.LANDING && isLoggedIn) {
      setIsLoggedIn(false);
      setLoggedProfessional(null);
    }
    setView(newView);
  };

  const handleDevUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPasswordInput === "220624") {
      setIsDevUnlocked(true);
    } else {
      alert("Senha de desenvolvedor incorreta!");
      setDevPasswordInput('');
    }
  };

  const handleCreatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slug = newPro.login.toLowerCase();
      const proData = {
        slug: slug,
        name: newPro.name,
        salon_name: newPro.salonName,
        city: newPro.city,
        expire_days: newPro.expireDays,
        reset_word: newPro.resetWord,
        category: 'Barbearia', // Padrão para novos
        image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        services: []
      };

      if (editingProId) {
        const { error } = await supabase.from('professionals').update(proData).eq('id', editingProId);
        if (error) throw error;
        alert("Profissional atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('professionals').insert([proData]);
        if (error) throw error;
        alert(`Profissional cadastrado com sucesso!\nLogin: ${slug}@marcai.dev`);
      }

      setNewPro({ name: '', salonName: '', city: '', login: '', expireDays: 30, password: '', resetWord: '' });
      setEditingProId(null);
      await fetchProfessionals();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPro = (p: Professional) => {
    setEditingProId(p.id);
    setNewPro({
      name: p.name,
      salonName: p.salonName || '',
      city: p.city,
      login: p.slug,
      expireDays: p.expireDays || 30,
      password: '*****',
      resetWord: p.resetWord || ''
    });
  };

  const handleDeletePro = async (id: string) => {
    if (confirm("Deseja realmente excluir permanentemente este profissional do banco de dados?")) {
      try {
        const { error } = await supabase.from('professionals').delete().eq('id', id);
        if (error) throw error;
        await fetchProfessionals();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const proFound = professionals.find(p => `${p.slug}@marcai.dev` === email.toLowerCase().trim());

    setTimeout(() => {
      if (proFound) {
        setLoggedProfessional(proFound);
        setIsLoggedIn(true);
        setView(AppView.PROFESSIONAL_DASHBOARD);
        setEmail('');
        setPassword('');
      } else {
        alert("E-mail ou senha inválidos. Utilize o login cadastrado no Painel Dev.");
      }
      setLoading(false);
    }, 800);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && loggedProfessional) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoggedProfessional({ ...loggedProfessional, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileChanges = async () => {
    if (!loggedProfessional) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('professionals').update({
        name: loggedProfessional.name,
        whatsapp: loggedProfessional.whatsapp,
        address: loggedProfessional.address,
        image_url: loggedProfessional.imageUrl,
        services: loggedProfessional.services
      }).eq('id', loggedProfessional.id);

      if (error) throw error;
      
      setProfessionals(prev => prev.map(p => p.id === loggedProfessional.id ? loggedProfessional : p));
      alert("Alterações salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar no banco: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenServiceForm = (service?: Service) => {
    if (service) setServiceForm({ ...service });
    else setServiceForm({ name: '', price: 0, duration: 30 });
  };

  const handleSaveService = () => {
    if (!serviceForm?.name || !loggedProfessional) return;

    let updatedServices = [...loggedProfessional.services];
    if (serviceForm.id) {
      updatedServices = updatedServices.map(s => s.id === serviceForm.id ? (serviceForm as Service) : s);
    } else {
      const newService = { ...serviceForm, id: Math.random().toString(36).substr(2, 9) } as Service;
      updatedServices.push(newService);
    }

    setLoggedProfessional({ ...loggedProfessional, services: updatedServices });
    setServiceForm(null);
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Deseja remover este serviço?") && loggedProfessional) {
      const updatedServices = loggedProfessional.services.filter(s => s.id !== id);
      setLoggedProfessional({ ...loggedProfessional, services: updatedServices });
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
    const whatsappUrl = `https://wa.me/${selectedProfessional.whatsapp?.replace(/\D/g, '') || '5511999999999'}?text=${encodeURIComponent(message)}`;
    
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
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Como deseja continuar?</h2>
              <p className="text-slate-500 font-medium">Escolha o seu perfil para acessar o MarcAI Agenda.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 w-full">
              <button onClick={() => setView(AppView.CLIENTS)} className="group relative bg-white border border-slate-200 p-10 rounded-[48px] shadow-sm hover:shadow-2xl hover:border-indigo-500 transition-all duration-500 text-center flex flex-col items-center gap-8">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                  <svg className="w-16 h-16 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Sou cliente</h3>
                  <p className="text-slate-500 font-medium">Encontre profissionais e agende seu horário.</p>
                </div>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="group relative bg-white border border-slate-200 p-10 rounded-[48px] shadow-sm hover:shadow-2xl hover:border-indigo-500 transition-all duration-500 text-center flex flex-col items-center gap-8">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                  <svg className="w-16 h-16 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Sou profissional</h3>
                  <p className="text-slate-500 font-medium">Gerencie sua agenda e serviços em um só lugar.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {view === AppView.CLIENTS && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Encontre o Profissional Ideal</h2>
              <p className="text-slate-500 font-medium">Busque por especialidade ou cidade.</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                <input type="text" placeholder="Busque por nome ou cidade..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                {filteredProfessionals.map(p => (
                  <ProfessionalCard 
                    key={p.id} 
                    professional={p} 
                    onSelect={handleSelectProfessional} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === AppView.PROFESSIONAL_PROFILE && selectedProfessional && (
           <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <button onClick={() => setView(AppView.CLIENTS)} className="mb-6 font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               Voltar
             </button>
             <div className="bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-xl">
               <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                 <img 
                    src={selectedProfessional.imageUrl} 
                    className="w-40 h-40 md:w-56 md:h-56 rounded-[48px] object-cover shadow-2xl border-4 border-white" 
                    alt={selectedProfessional.name} 
                  />
                 <div className="text-center md:text-left">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{selectedProfessional.category}</span>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedProfessional.name}</h1>
                    {selectedProfessional.salonName && <p className="text-slate-400 font-bold uppercase tracking-tight text-sm mb-4">{selectedProfessional.salonName}</p>}
                    <p className="text-slate-600 max-w-lg">{selectedProfessional.bio || "Agende seu horário com os melhores profissionais."}</p>
                 </div>
               </div>

               <div className="p-8 border-t border-slate-50 space-y-6">
                 <h3 className="text-xl font-black text-slate-900">Selecione um Serviço</h3>
                 {!selectedService ? (
                   <div className="space-y-4">
                     {selectedProfessional.services.map(s => (
                       <div key={s.id} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-indigo-100">
                         <div>
                            <p className="font-black text-slate-900 text-lg">{s.name}</p>
                            <p className="text-sm text-slate-400 font-bold">{s.duration} min • R$ {s.price},00</p>
                         </div>
                         <button onClick={() => setSelectedService(s)} className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">Agendar</button>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="bg-indigo-50 p-8 rounded-[40px] animate-in slide-in-from-right-4">
                     <div className="flex justify-between items-center mb-6">
                       <p className="font-black text-indigo-900">Agendando: {selectedService.name}</p>
                       <button onClick={() => {setSelectedService(null); setSelectedTime(null);}} className="text-xs font-bold text-indigo-600 uppercase">Alterar</button>
                     </div>
                     <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Escolha a Data</p>
                           <div className="flex gap-2 overflow-x-auto pb-4">
                              {nextDays.map(d => {
                                 const dStr = d.toISOString().split('T')[0];
                                 return (
                                   <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`min-w-[70px] p-4 rounded-2xl flex flex-col items-center border transition-all ${selectedDate === dStr ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-transparent text-slate-400 hover:border-indigo-200'}`}>
                                      <span className="text-[9px] font-black uppercase">{d.toLocaleDateString('pt-BR', {weekday: 'short'})}</span>
                                      <span className="text-lg font-black">{d.getDate()}</span>
                                   </button>
                                 )
                              })}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Horário</p>
                           <div className="grid grid-cols-3 gap-2">
                             {timeSlots.map(t => (
                               <button key={t} onClick={() => setSelectedTime(t)} className={`py-3 rounded-xl text-xs font-black border transition-all ${selectedTime === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-transparent text-slate-500 hover:border-indigo-200'}`}>{t}</button>
                             ))}
                           </div>
                        </div>
                     </div>
                     
                     {selectedTime && (
                       <div className="mt-8 space-y-4 bg-white p-6 rounded-[32px] border border-indigo-100 shadow-lg animate-in fade-in zoom-in-95">
                          <div className="grid md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Seu Nome" className="w-full bg-slate-50 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clientName} onChange={e => setClientName(e.target.value)} />
                            <input type="tel" placeholder="Seu WhatsApp" className="w-full bg-slate-50 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                          </div>
                          <button onClick={handleConfirmBooking} className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-100">Finalizar Agendamento</button>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
        )}

        {view === AppView.PROFESSIONAL_LOGIN && (
          <div className="flex items-center justify-center min-h-[70vh] w-full px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white p-10 md:p-14 rounded-[48px] shadow-2xl shadow-indigo-100 border border-slate-100 w-full max-w-lg">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-100">M</div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Login Profissional</h2>
                <p className="text-slate-500 font-medium">Acesse sua agenda administrativa</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">E-mail</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu-slug@marcai.dev" className="w-full bg-slate-50 border-none rounded-[24px] px-6 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Senha</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-[24px] px-6 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all">Entrar no Painel</button>
                <button type="button" onClick={() => setView(AppView.LANDING)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm">Voltar ao início</button>
              </form>
            </div>
          </div>
        )}

        {view === AppView.PROFESSIONAL_DASHBOARD && loggedProfessional && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row gap-8">
              <aside className="md:w-72 space-y-2">
                <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm mb-6 flex flex-col items-center text-center group">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-2xl mb-4 border-2 border-indigo-100 shadow-inner cursor-pointer hover:opacity-80 transition-all relative overflow-hidden"
                  >
                    {loggedProfessional.imageUrl ? <img src={loggedProfessional.imageUrl} className="w-full h-full object-cover rounded-full" alt="Perfil" /> : loggedProfessional.name[0]}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900">{loggedProfessional.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Licença: {loggedProfessional.expireDays || 30} dias restantes</p>
                </div>
                <button onClick={() => setDashTab('appointments')} className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'appointments' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Agendamentos</button>
                <button onClick={() => setDashTab('pre_bookings')} className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'pre_bookings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Pré-agendamento</button>
                <button onClick={() => setDashTab('profile')} className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'profile' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Perfil e serviços</button>
                <button onClick={() => setDashTab('hours')} className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'hours' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>Horários</button>
                <div className="pt-8">
                  <button onClick={() => setView(AppView.LANDING)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all">Sair</button>
                </div>
              </aside>

              <main className="flex-1 space-y-8">
                {dashTab === 'appointments' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900">Próximos Agendamentos</h3>
                    <div className="grid gap-4">
                      {appointments.map(a => (
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
                            </div>
                            <button onClick={() => handleDeleteAppointment(a.id, false)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dashTab === 'pre_bookings' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900">Pré-agendamentos</h3>
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
                      )) : <div className="py-12 text-center text-slate-400">Nenhum pré-agendamento pendente.</div>}
                    </div>
                  </div>
                )}
                
                {dashTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Configurações Básicas</h3>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nome Profissional</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={loggedProfessional.name} 
                            onChange={e => setLoggedProfessional({...loggedProfessional, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">WhatsApp Comercial</label>
                          <input 
                            type="tel" 
                            className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                            value={loggedProfessional.whatsapp || ''} 
                            onChange={e => setLoggedProfessional({...loggedProfessional, whatsapp: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Endereço (Exibido no perfil)</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                          value={loggedProfessional.address || ''} 
                          onChange={e => setLoggedProfessional({...loggedProfessional, address: e.target.value})}
                        />
                      </div>
                      
                      <div className="pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-xl font-black text-slate-900">Seus Serviços</h4>
                          <button onClick={() => handleOpenServiceForm()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">+ Adicionar</button>
                        </div>
                        {serviceForm && (
                          <div className="mb-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 animate-in zoom-in-95">
                             <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <input type="text" placeholder="Nome" className="bg-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
                                <input type="number" placeholder="R$" className="bg-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={serviceForm.price || ''} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} />
                                <input type="number" placeholder="Min" className="bg-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={serviceForm.duration || ''} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} />
                             </div>
                             <div className="flex gap-2"><button onClick={handleSaveService} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Salvar Serviço</button><button onClick={() => setServiceForm(null)} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button></div>
                          </div>
                        )}
                        <div className="space-y-3">
                           {loggedProfessional.services.map((s) => (
                             <div key={s.id} className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all group">
                                <div><p className="font-bold text-slate-900">{s.name}</p><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">R$ {s.price},00 • {s.duration} min</p></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleOpenServiceForm(s)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                  <button onClick={() => handleDeleteService(s.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                      <button onClick={handleSaveProfileChanges} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">{loading ? "Salvando..." : "Salvar Alterações"}</button>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}

        {view === AppView.DEVELOPER_PANEL && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {!isDevUnlocked ? (
              <div className="bg-slate-900 p-12 rounded-[48px] border border-slate-800 shadow-2xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-slate-700">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 </div>
                 <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Área do Desenvolvedor</h2>
                 <p className="text-slate-500 mb-8 max-w-xs">Acesso restrito para administração do sistema MarcAI.</p>
                 <form onSubmit={handleDevUnlock} className="w-full max-w-sm space-y-4">
                    <input 
                      type="password" 
                      placeholder="Senha de Acesso" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white text-center text-lg font-black tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={devPasswordInput}
                      onChange={e => setDevPasswordInput(e.target.value)}
                    />
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all">Acessar Console</button>
                 </form>
                 <button onClick={() => setView(AppView.LANDING)} className="mt-6 text-slate-600 hover:text-slate-400 text-sm font-bold">Voltar ao início</button>
              </div>
            ) : (
              <div className="bg-slate-900 p-10 md:p-14 rounded-[48px] border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-white">Dev Mode <span className="text-indigo-400">Admin</span></h2>
                    <p className="text-slate-500 text-sm">Gerenciamento de Instâncias e Licenças</p>
                  </div>
                  <button onClick={() => {setIsDevUnlocked(false); setEditingProId(null); setNewPro({ name: '', salonName: '', city: '', login: '', expireDays: 30, password: '', resetWord: '' });}} className="text-slate-500 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                  <form onSubmit={handleCreatePro} className="space-y-6">
                    <h3 className="text-xl font-black text-white mb-6">{editingProId ? "Editar Profissional" : "Novo Profissional"}</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome Completo</label>
                        <input required type="text" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.name} onChange={e => setNewPro({...newPro, name: e.target.value})} placeholder="Ex: João da Silva" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Estabelecimento</label>
                        <input required type="text" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.salonName} onChange={e => setNewPro({...newPro, salonName: e.target.value})} placeholder="Ex: Barbearia MarcAI" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Cidade</label>
                          <input required type="text" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.city} onChange={e => setNewPro({...newPro, city: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dias Licença</label>
                          <input required type="number" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.expireDays} onChange={e => setNewPro({...newPro, expireDays: parseInt(e.target.value)})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Login (E-mail prefixo)</label>
                        <input required type="text" disabled={!!editingProId} className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" value={newPro.login} onChange={e => setNewPro({...newPro, login: e.target.value.toLowerCase().trim()})} placeholder="Ex: joao" />
                        {!editingProId && <p className="text-[10px] text-indigo-400 italic">Gera: {newPro.login || '...' }@marcai.dev</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Palavra Secreta (Reset Senha)</label>
                        <input required type="text" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.resetWord} onChange={e => setNewPro({...newPro, resetWord: e.target.value})} placeholder="Ex: amora" />
                      </div>
                    </div>
                    <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/40 hover:bg-indigo-700 transition-all disabled:opacity-50">
                      {loading ? "Processando..." : (editingProId ? "Salvar Alterações" : "Criar Conta Professional")}
                    </button>
                    {editingProId && (
                      <button type="button" onClick={() => {setEditingProId(null); setNewPro({ name: '', salonName: '', city: '', login: '', expireDays: 30, password: '', resetWord: '' });}} className="w-full py-2 text-slate-500 text-xs uppercase font-bold">Cancelar Edição</button>
                    )}
                  </form>

                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-white">Instâncias Ativas</h3>
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 max-h-[400px] overflow-y-auto space-y-3">
                      {professionals.length > 0 ? professionals.map(p => (
                        <div key={p.id} className="p-4 bg-slate-900 rounded-xl flex items-center justify-between border border-slate-800 group">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.slug}@marcai.dev • {p.expireDays} dias</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditPro(p)} className="text-indigo-400 p-2 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Editar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={() => handleDeletePro(p.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>
                      )) : <p className="text-slate-600 text-center py-8">Nenhuma instância ativa.</p>}
                    </div>
                    <button onClick={() => setView(AppView.LANDING)} className="w-full py-4 text-slate-500 font-bold border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">Sair do Modo Dev</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
