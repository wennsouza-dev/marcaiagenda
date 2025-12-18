
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
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
  
  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Estados do Dashboard
  const [dashTab, setDashTab] = useState<'appointments' | 'pre_bookings' | 'profile' | 'hours' | 'gallery'>('appointments');
  const [appointments, setAppointments] = useState<any[]>([
    { id: '1', clientName: 'Ricardo Silva', serviceName: 'Corte Degradê', time: '14:30', status: 'confirmed' },
    { id: '2', clientName: 'Ana Souza', serviceName: 'Coloração', time: '16:00', status: 'confirmed' }
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
                <input type="text" placeholder="Ex: Barbeiro, Esteticista..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <select className="bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}><option value="">Todas as Cidades</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}</select>
                <select className="bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Todas Categorias</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
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

        {view === AppView.PROFESSIONAL_PROFILE && selectedProfessional && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setView(AppView.CLIENTS)} className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Voltar para busca
            </button>

            <div className="bg-white rounded-[48px] overflow-hidden shadow-sm border border-slate-100">
              <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border-b border-slate-50">
                <img src={selectedProfessional.imageUrl} className="w-32 h-32 md:w-48 md:h-48 rounded-[32px] object-cover shadow-xl border-4 border-white" alt={selectedProfessional.name} />
                <div className="text-center md:text-left flex-1">
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{selectedProfessional.category}</span>
                    <span className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{selectedProfessional.city}</span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedProfessional.name}</h1>
                  {selectedProfessional.salonName && <p className="text-slate-400 font-bold uppercase tracking-tighter text-sm mb-4">{selectedProfessional.salonName}</p>}
                  <p className="text-slate-600 leading-relaxed max-w-xl">{selectedProfessional.bio}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-50 border-b border-slate-50">
                <a href={`https://wa.me/${selectedProfessional.whatsapp?.replace(/\D/g, '')}`} target="_blank" className="bg-white p-6 flex flex-col items-center gap-2 hover:bg-emerald-50 transition-colors">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="text-sm font-black text-slate-900">Conversar</span>
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProfessional.address || '')}`} target="_blank" className="bg-white p-6 flex flex-col items-center gap-2 hover:bg-indigo-50 transition-colors">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="text-sm font-black text-slate-900">Localização</span>
                </a>
              </div>

              {!selectedService ? (
                <div className="p-8 bg-slate-50/30">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Nossos Serviços</h3>
                  <div className="space-y-4">
                    {selectedProfessional.services?.map((service: Service) => (
                      <div key={service.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-colors group">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{service.name}</h4>
                          <p className="text-slate-400 text-sm font-medium">{service.duration} min • Sugestão MarcAI</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900 mb-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                          </p>
                          <button onClick={() => setSelectedService(service)} className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95">Agendar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-indigo-50/30 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Finalizar Agendamento</h3>
                    <button onClick={() => {setSelectedService(null); setSelectedTime(null);}} className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">Alterar serviço</button>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-indigo-100 mb-8">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Selecione o Dia</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {nextDays.map((date, i) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button 
                            key={i}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-105 z-10' : 'bg-slate-50 text-slate-400 border-transparent hover:border-indigo-200 hover:bg-indigo-50'}`}
                          >
                            <span className="text-[10px] font-black uppercase mb-1">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            <span className="text-lg font-black">{date.getDate()}</span>
                            <span className="text-[9px] opacity-60 font-bold">{date.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-indigo-100">
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Escolha o Horário</p>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(time => (
                          <button 
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-3 rounded-xl text-xs font-black transition-all border ${selectedTime === time ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-transparent hover:border-indigo-200'}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-indigo-100 space-y-4">
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Seus Dados</p>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Nome Completo</label>
                        <input type="text" placeholder="Como quer ser chamado?" className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">WhatsApp</label>
                        <input type="tel" placeholder="(00) 00000-0000" className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {selectedTime && (
                    <div className="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-xl shadow-indigo-100/20 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Resumo do Agendamento</p>
                        <h4 className="text-2xl font-black text-slate-900">{selectedService.name} às {selectedTime}</h4>
                        <p className="text-slate-500 text-sm">Para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <button onClick={handleConfirmBooking} disabled={!clientName || !clientPhone} className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">Confirmar Agendamento</button>
                    </div>
                  )}
                </div>
              )}

              {!selectedService && selectedProfessional.gallery && selectedProfessional.gallery.length > 0 && (
                <div className="p-8 border-t border-slate-50">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Trabalhos Realizados</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProfessional.gallery.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-3xl overflow-hidden shadow-md group cursor-zoom-in">
                        <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Galeria" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === AppView.PROFESSIONAL_LOGIN && (
          <div className="flex items-center justify-center min-h-[70vh] w-full px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white p-10 md:p-14 rounded-[48px] shadow-2xl shadow-indigo-100 border border-slate-100 w-full max-w-lg">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-100">M</div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Login Profissional</h2>
                <p className="text-slate-500 font-medium">Gerencie sua agenda e serviços</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">E-mail de acesso</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu melhor e-mail" 
                    className="w-full bg-slate-50 border-none rounded-[24px] px-6 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Senha secreta</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha" 
                    className="w-full bg-slate-50 border-none rounded-[24px] px-6 py-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  />
                </div>
                
                <div className="flex items-center justify-between px-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Lembrar-me</span>
                  </label>
                  <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Esqueci a senha</button>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? 'Entrando...' : 'Entrar no Painel'}
                  {!loading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </button>
                
                <button type="button" onClick={() => setView(AppView.LANDING)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm">
                  Voltar ao início
                </button>
              </form>
            </div>
          </div>
        )}

        {view === AppView.PROFESSIONAL_DASHBOARD && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Menu Lateral Dashboard */}
              <aside className="md:w-72 space-y-2">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-2xl mb-4 border-2 border-indigo-100 shadow-inner">JD</div>
                  <h4 className="font-black text-slate-900">João Donizete</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Plano Pro</p>
                </div>
                
                <button onClick={() => setDashTab('appointments')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'appointments' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   Agendamentos
                </button>
                <button onClick={() => setDashTab('pre_bookings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'pre_bookings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Pré-agendamento
                </button>
                <button onClick={() => setDashTab('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'profile' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   Perfil e serviços
                </button>
                <button onClick={() => setDashTab('hours')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'hours' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Horários
                </button>
                <button onClick={() => setDashTab('gallery')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === 'gallery' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   Galeria de fotos
                </button>
                
                <div className="pt-8">
                  <button onClick={() => setView(AppView.LANDING)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair da conta
                  </button>
                </div>
              </aside>

              {/* Conteúdo Central Dashboard */}
              <main className="flex-1 space-y-8">
                {dashTab === 'appointments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Próximos Agendamentos</h3>
                      <button className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">Ver histórico</button>
                    </div>
                    <div className="grid gap-4">
                      {appointments.length > 0 ? appointments.map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group">
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
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Confirmado</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleDeleteAppointment(a.id, false)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-400 font-medium">Nenhum agendamento confirmado para hoje.</div>
                      )}
                    </div>
                  </div>
                )}

                {dashTab === 'pre_bookings' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pré-agendamentos Pendentes</h3>
                    </div>
                    <div className="grid gap-4">
                      {preBookings.length > 0 ? preBookings.map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center font-bold text-amber-600">{a.clientName[0]}</div>
                            <div>
                              <h5 className="font-bold text-slate-900">{a.clientName}</h5>
                              <p className="text-xs text-slate-400 font-bold uppercase">{a.serviceName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right mr-4">
                              <p className="text-sm font-black text-amber-600">Aguardando Aprovação</p>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Horário solicitado: {a.time}</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                              <button onClick={() => handleDeleteAppointment(a.id, true)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-400 font-medium">Nenhuma solicitação pendente.</div>
                      )}
                    </div>
                  </div>
                )}

                {dashTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Configurações do Perfil</h3>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nome Profissional</label>
                          <input type="text" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="João Donizete" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">WhatsApp Comercial</label>
                          <input type="tel" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="11999999999" placeholder="Ex: 11999999999" />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Cidade de Atendimento</label>
                          <input type="text" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="São Paulo" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Categoria Principal</label>
                          <select className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium outline-none cursor-pointer">
                            <option value="barbearia">Barbearia</option>
                            <option value="estetica">Estética</option>
                            <option value="bem_estar">Bem Estar</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Endereço Completo</label>
                        <input type="text" className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium" defaultValue="Rua Exemplo, 123, Bairro, São Paulo - SP" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Bio Profissional</label>
                        <textarea className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 font-medium h-32 resize-none" defaultValue="Especialista em cortes clássicos e modernos há mais de 10 anos." />
                      </div>
                      
                      <div className="pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-xl font-black text-slate-900">Gerenciar Serviços</h4>
                          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">+ Adicionar</button>
                        </div>
                        <div className="space-y-3">
                          {[
                            { name: 'Corte de Cabelo', price: 60, dur: 45 },
                            { name: 'Barba Tradicional', price: 40, dur: 30 }
                          ].map((s, idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-200 transition-all">
                              <div>
                                <p className="font-bold text-slate-900">{s.name}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase">R$ {s.price},00 • {s.dur} min</p>
                              </div>
                              <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={() => alert('Serviço removido (MVP)')} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all">Salvar Alterações</button>
                    </div>
                  </div>
                )}

                {dashTab === 'hours' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agenda de Atendimento</h3>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
                      
                      <div className="space-y-6">
                         <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Expediente Semanal</p>
                         <div className="space-y-4">
                           {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                             <div key={day} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                               <span className="font-bold text-slate-700 w-24">{day}</span>
                               <div className="flex items-center gap-3">
                                 <input type="text" className="w-20 bg-white border-none rounded-lg p-2 text-center text-sm font-bold shadow-sm" defaultValue="09:00" />
                                 <span className="text-slate-300 font-black">às</span>
                                 <input type="text" className="w-20 bg-white border-none rounded-lg p-2 text-center text-sm font-bold shadow-sm" defaultValue="18:00" />
                               </div>
                               <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" defaultChecked />
                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                               </label>
                             </div>
                           ))}
                         </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-6">
                           <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Pausas e Almoço</p>
                        </div>
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                            <div>
                              <p className="font-bold text-slate-900">Horário de Almoço</p>
                              <p className="text-xs text-slate-500 font-bold uppercase">Diário • 12:00 às 13:00</p>
                            </div>
                          </div>
                          <button className="text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dashTab === 'gallery' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Seu Portfólio</h3>
                       <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">+ Carregar Fotos</button>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                       <button className="aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all gap-2 group">
                         <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                         <span className="text-xs font-black uppercase tracking-widest">Nova Foto</span>
                       </button>
                       <div className="text-slate-400 text-sm font-medium flex items-center col-span-2">Adicione fotos reais de seus trabalhos para atrair mais clientes.</div>
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
