
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
import { supabase } from './lib/supabase.ts';

const App: React.FC = () => {
  // Constantes para estado inicial limpo (novo usuário)
  const INITIAL_WEEKLY_HOURS = [
    { day: 'Segunda', active: false, from: '09:00', to: '18:00' },
    { day: 'Terça', active: false, from: '09:00', to: '18:00' },
    { day: 'Quarta', active: false, from: '09:00', to: '18:00' },
    { day: 'Quinta', active: false, from: '09:00', to: '18:00' },
    { day: 'Sexta', active: false, from: '09:00', to: '18:00' },
    { day: 'Sábado', active: false, from: '09:00', to: '12:00' },
    { day: 'Domingo', active: false, from: '09:00', to: '12:00' },
  ];
  const INITIAL_LUNCH_BREAK = { enabled: false, from: '12:00', to: '13:00' };

  // Função auxiliar para obter a data/hora atual de Brasília
  const getBrasiliaNow = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  };

  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // Inicializa a data selecionada com a data CORRETA de Brasília (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const brNow = getBrasiliaNow();
    const year = brNow.getFullYear();
    const month = String(brNow.getMonth() + 1).padStart(2, '0');
    const day = String(brNow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estado do Horário de Brasília atualizado a cada segundo
  const [brTime, setBrTime] = useState(getBrasiliaNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setBrTime(getBrasiliaNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const brTimeFormatted = useMemo(() => {
    return brTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [brTime]);

  const brDateStr = useMemo(() => {
    const year = brTime.getFullYear();
    const month = String(brTime.getMonth() + 1).padStart(2, '0');
    const day = String(brTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [brTime]);

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
  
  // Agendamentos em memória
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [preBookings, setPreBookings] = useState<Appointment[]>([]);

  // Configuração de orientação de pré-agendamento
  const [preBookingOrientation, setPreBookingOrientation] = useState('Para garantir seu horário, solicitamos o pagamento antecipado de 50% do valor via PIX. Por favor, envie o comprovante para confirmar.');

  // Estados de Horários
  const [weeklyHours, setWeeklyHours] = useState(INITIAL_WEEKLY_HOURS);
  const [lunchBreak, setLunchBreak] = useState(INITIAL_LUNCH_BREAK);
  const [specialDates, setSpecialDates] = useState<{ id: string; date: string; closed: boolean; from?: string; to?: string }[]>([]);
  const [showSpecialDateForm, setShowSpecialDateForm] = useState(false);
  const [newSpecialDate, setNewSpecialDate] = useState({ date: '', closed: false, from: '09:00', to: '18:00' });

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
        const mappedData = data.map((p: any) => ({ 
          id: p.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          city: p.city,
          bio: p.bio || '',
          imageUrl: p.image_url || '',
          rating: p.rating || 5.0,
          services: Array.isArray(p.services) ? p.services : [],
          salonName: p.salon_name || '',
          gallery: p.gallery || [],
          whatsapp: p.whatsapp || '',
          address: p.address || '',
          expireDays: p.expire_days || 30,
          resetWord: p.reset_word || '',
          password: p.password || '',
          businessHours: p.business_hours || {}
        }));
        setProfessionals(mappedData);
        return mappedData;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const pros = await fetchProfessionals();
      
      // Lógica de Deep Linking: Verifica se há um profissional no link
      const params = new URLSearchParams(window.location.search);
      const proSlug = params.get('pro');
      
      if (proSlug && pros) {
        const found = pros.find(p => p.slug === proSlug);
        if (found) {
          setSelectedProfessional(found);
          setView(AppView.PROFESSIONAL_PROFILE);
        }
      }
    };
    init();
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
    if (newView === AppView.LANDING) {
      // Limpa a URL ao voltar para o início
      window.history.replaceState({}, '', window.location.origin + window.location.pathname);
      
      if (isLoggedIn) {
        setIsLoggedIn(false);
        setLoggedProfessional(null);
        setWeeklyHours(INITIAL_WEEKLY_HOURS);
        setLunchBreak(INITIAL_LUNCH_BREAK);
        setSpecialDates([]);
        setAppointments([]);
        setPreBookings([]);
      }
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
      const slug = newPro.login.toLowerCase().trim();
      const proData: any = {
        slug: slug,
        name: newPro.name,
        salon_name: newPro.salonName,
        city: newPro.city,
        expire_days: newPro.expireDays,
        reset_word: newPro.resetWord,
        category: 'Barbearia',
        image_url: '', 
        services: [],
        business_hours: {}
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

  const handleEditPro = (p: any) => {
    setEditingProId(p.id);
    setNewPro({
      name: p.name,
      salonName: p.salonName || '',
      city: p.city,
      login: p.slug,
      expireDays: p.expireDays || 30,
      password: p.password || '',
      resetWord: p.resetWord || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePro = async (id: string) => {
    if (confirm("Deseja realmente excluir permanentemente este profissional?")) {
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

    const proFound = professionals.find(p => 
      `${p.slug}@marcai.dev` === email.toLowerCase().trim() && 
      (p.password === password || p.resetWord === password)
    );

    setTimeout(() => {
      if (proFound) {
        setWeeklyHours(INITIAL_WEEKLY_HOURS);
        setLunchBreak(INITIAL_LUNCH_BREAK);
        setSpecialDates([]);
        setAppointments([]);
        setPreBookings([]);

        setLoggedProfessional(proFound);
        if (proFound.businessHours) {
          const { weekly, lunch, special } = proFound.businessHours as any;
          if (weekly) setWeeklyHours(weekly);
          if (lunch) setLunchBreak(lunch);
          if (special) setSpecialDates(special);
        }
        setIsLoggedIn(true);
        setView(AppView.PROFESSIONAL_DASHBOARD);
        setEmail('');
        setPassword('');
      } else {
        alert("E-mail ou senha inválidos.");
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
        services: loggedProfessional.services,
        bio: loggedProfessional.bio,
        salon_name: loggedProfessional.salonName
      }).eq('id', loggedProfessional.id);

      if (error) throw error;
      
      const allPros = await fetchProfessionals();
      
      // Sincroniza o perfil selecionado (CLIENTE) imediatamente se ele for o mesmo logado
      if (allPros && selectedProfessional && selectedProfessional.id === loggedProfessional.id) {
        const up = allPros.find(p => p.id === loggedProfessional.id);
        if (up) setSelectedProfessional(up);
      }

      alert("Alterações salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar perfil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHours = async () => {
    if (!loggedProfessional) return;
    setLoading(true);

    const businessHoursConfig = {
      weekly: weeklyHours,
      lunch: lunchBreak,
      special: specialDates
    };

    try {
      const { error } = await supabase.from('professionals').update({
        business_hours: businessHoursConfig
      }).eq('id', loggedProfessional.id);

      if (error) throw error;
      
      const allPros = await fetchProfessionals();
      
      // Sincroniza o perfil selecionado (CLIENTE) se ele for o mesmo logado
      if (allPros && selectedProfessional && selectedProfessional.id === loggedProfessional.id) {
        const up = allPros.find(p => p.id === loggedProfessional.id);
        if (up) setSelectedProfessional(up);
      }

      alert("Horários salvos com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar horários: " + err.message);
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

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const sendWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleConfirmAppointment = (id: string) => {
    const app = appointments.find(a => a.id === id) || preBookings.find(a => a.id === id);
    if (!app || !loggedProfessional) return;

    const updatedApp: Appointment = { ...app, status: 'confirmed' };
    
    setPreBookings(prev => prev.filter(a => a.id !== id));
    setAppointments(prev => {
      const exists = prev.find(a => a.id === id);
      if (exists) return prev.map(a => a.id === id ? updatedApp : a);
      return [updatedApp, ...prev];
    });
    
    const msg = `Olá ${app.clientName}, aqui é ${loggedProfessional.name}! Confirmando seu agendamento de *${app.serviceName}* no dia *${formatDateBR(app.date)}* às *${app.time}*.`;
    sendWhatsApp(app.clientPhone || '', msg);
  };

  const handleCancelAppointment = (id: string) => {
    const app = appointments.find(a => a.id === id) || preBookings.find(a => a.id === id);
    if (!app || !loggedProfessional) return;

    if (confirm("Deseja CANCELAR este agendamento?")) {
      const updatedApp: Appointment = { ...app, status: 'cancelled' };
      setAppointments(prev => prev.map(a => a.id === id ? updatedApp : a));
      setPreBookings(prev => prev.map(a => a.id === id ? updatedApp : a));
      
      const msg = `Olá ${app.clientName}, precisei CANCELAR seu horário de *${app.serviceName}* no dia *${formatDateBR(app.date)}* às *${app.time}*.`;
      sendWhatsApp(app.clientPhone || '', msg);
    }
  };

  const handleCompleteAppointment = (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app || !loggedProfessional) return;
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'concluded' } : a));
    alert("Agendamento concluído!");
  };

  const handleDeleteAppointment = (id: string, isFromPre: boolean) => {
    if (confirm("Deseja EXCLUIR do histórico?")) {
      if (isFromPre) setPreBookings(prev => prev.filter(a => a.id !== id));
      else setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleMoveToPreBooking = (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    const updatedApp: Appointment = { ...app, status: 'pending' };
    setAppointments(prev => prev.filter(a => a.id !== id));
    setPreBookings(prev => [updatedApp, ...prev]);
  };

  const handleSendPreBookingOrientation = (app: Appointment) => {
    if (!loggedProfessional) return;
    const msg = `Olá ${app.clientName}, agendamento de *${app.serviceName}* dia *${formatDateBR(app.date)}* às *${app.time}*. Orientação: \n\n${preBookingOrientation}`;
    sendWhatsApp(app.clientPhone || '', msg);
  };

  const handleUpdateWeeklyDay = (index: number, field: string, value: any) => {
    const newWeekly = [...weeklyHours];
    newWeekly[index] = { ...newWeekly[index], [field]: value };
    setWeeklyHours(newWeekly);
  };

  const handleAddSpecialDate = () => {
    if (!newSpecialDate.date) return;
    setSpecialDates([...specialDates, { id: Math.random().toString(36).substr(2, 9), ...newSpecialDate }]);
    setNewSpecialDate({ date: '', closed: false, from: '09:00', to: '18:00' });
    setShowSpecialDateForm(false);
  };

  const handleRemoveSpecialDate = (id: string) => {
    setSpecialDates(specialDates.filter(d => d.id !== id));
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
      alert("Preencha todos os campos.");
      return;
    }

    const dateFormatted = formatDateBR(selectedDate);
    const cleanWhatsapp = selectedProfessional.whatsapp?.replace(/\D/g, '') || '55';
    const message = `Olá ${selectedProfessional.name}, agendamento: *${selectedService.name}* dia *${dateFormatted}* às *${selectedTime}*. Meu nome é ${clientName}.`;
    
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      professionalId: selectedProfessional.id,
      clientName: clientName,
      clientPhone: clientPhone,
      serviceName: selectedService.name,
      time: selectedTime,
      date: selectedDate,
      status: 'pending' 
    };
    
    setPreBookings(prev => [newAppointment, ...prev]);
    sendWhatsApp(cleanWhatsapp, message);
    
    setClientName('');
    setClientPhone('');
    setSelectedService(null);
    setSelectedTime(null);
    setView(AppView.CLIENTS);
  };

  const nextDays = useMemo(() => {
    const days = [];
    const baseDate = getBrasiliaNow();
    baseDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 15; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [brDateStr]);

  const timeSlots = ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30", "16:15", "17:00"];

  const checkIsTimeAvailable = (time: string) => {
    if (!selectedProfessional) return false;
    const config = selectedProfessional.businessHours || { 
      weekly: INITIAL_WEEKLY_HOURS, 
      lunch: INITIAL_LUNCH_BREAK, 
      special: [] 
    };
    const { weekly, lunch, special } = config;
    const specialDay = special?.find((s: any) => s.date === selectedDate);
    if (specialDay) {
      if (specialDay.closed) return false;
      if (specialDay.from && specialDay.to && (time < specialDay.from || time > specialDay.to)) return false;
    }
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDayName = dayNames[dateObj.getDay()];
    const weeklyDayConfig = weekly?.find((w: any) => w.day === currentDayName);
    if (!specialDay && (!weeklyDayConfig || !weeklyDayConfig.active)) return false;
    const activeFrom = specialDay?.from || weeklyDayConfig?.from || '09:00';
    const activeTo = specialDay?.to || weeklyDayConfig?.to || '18:00';
    if (time < activeFrom || time > activeTo) return false;
    if (lunch?.enabled && time >= lunch.from && time < lunch.to) return false;
    if (selectedDate === brDateStr) {
      const [h, m] = time.split(':').map(Number);
      if (h < brTime.getHours() || (h === brTime.getHours() && m <= brTime.getMinutes())) return false;
    }
    return true;
  };

  const proPublicLink = useMemo(() => {
    if (!loggedProfessional) return '';
    return `${window.location.origin}${window.location.pathname}?pro=${loggedProfessional.slug}`;
  }, [loggedProfessional]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proPublicLink);
    alert("Link copiado!");
  };

  return (
    <Layout activeView={view} onNavigate={handleNavigate} isLoggedIn={isLoggedIn}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        
        {view === AppView.LANDING && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">MarcAI Agenda</h2>
              <p className="text-slate-500 font-medium">Plataforma inteligente de agendamentos.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 w-full">
              <button onClick={() => setView(AppView.CLIENTS)} className="group bg-white border border-slate-200 p-10 rounded-[48px] shadow-sm hover:shadow-2xl transition-all flex flex-col items-center gap-8">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                  <svg className="w-16 h-16 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div><h3 className="text-3xl font-black">Sou cliente</h3><p className="text-slate-500">Encontre profissionais.</p></div>
              </button>
              <button onClick={() => setView(AppView.PROFESSIONAL_LOGIN)} className="group bg-white border border-slate-200 p-10 rounded-[48px] shadow-sm hover:shadow-2xl transition-all flex flex-col items-center gap-8">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                  <svg className="w-16 h-16 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div><h3 className="text-3xl font-black">Sou profissional</h3><p className="text-slate-500">Gerencie sua agenda.</p></div>
              </button>
            </div>
          </div>
        )}

        {view === AppView.CLIENTS && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in">
            <div className="text-center"><h2 className="text-3xl font-black">Encontre seu Profissional</h2></div>
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[32px] border border-slate-200">
              <input type="text" placeholder="Busque por nome ou cidade..." className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="bg-slate-50 p-4 rounded-2xl font-bold" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}><option value="">Cidades</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            {loading ? <div className="text-center py-20 font-bold">Carregando...</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">{filteredProfessionals.map(p => <ProfessionalCard key={p.id} professional={p} onSelect={handleSelectProfessional} />)}</div>}
          </div>
        )}

        {view === AppView.PROFESSIONAL_PROFILE && selectedProfessional && (
           <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
             <button onClick={() => handleNavigate(AppView.CLIENTS)} className="mb-6 font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-2">← Voltar</button>
             <div className="bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-xl relative">
               <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                 <div className="w-40 h-40 md:w-56 md:h-56 rounded-[48px] overflow-hidden shadow-2xl border-4 border-white bg-slate-50 flex items-center justify-center">
                    {selectedProfessional.imageUrl ? <img src={selectedProfessional.imageUrl} className="w-full h-full object-cover" /> : <div className="text-6xl font-black text-indigo-200">{selectedProfessional.name[0]}</div>}
                 </div>
                 <div className="text-center md:text-left flex-1">
                    <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedProfessional.name}</h1>
                    <p className="text-slate-400 font-bold uppercase text-sm mb-4">{selectedProfessional.salonName}</p>
                    <p className="text-slate-600 mb-6">{selectedProfessional.bio || "Especialista pronto para te atender."}</p>
                 </div>
               </div>

               <div className="p-8 border-t border-slate-50 space-y-6">
                 <h3 className="text-xl font-black">Selecione um Serviço</h3>
                 {!selectedService ? (
                   <div className="space-y-4">
                     {selectedProfessional.services.map(s => (
                       <div key={s.id} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all cursor-pointer" onClick={() => setSelectedService(s)}>
                         <div><p className="font-black text-lg">{s.name}</p><p className="text-sm text-slate-400 font-bold">{s.duration} min • R$ {s.price},00</p></div>
                         <button className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase">Selecionar</button>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="bg-indigo-50 p-8 rounded-[40px] animate-in slide-in-from-right-4">
                     <div className="flex justify-between items-center mb-6"><p className="font-black text-indigo-900">Agendando: {selectedService.name}</p><button onClick={() => setSelectedService(null)} className="text-xs font-bold text-indigo-600 uppercase">Alterar</button></div>
                     <div className="grid md:grid-cols-2 gap-8">
                        <div><p className="text-[10px] font-black uppercase mb-4 text-indigo-400">Data</p>
                           <div className="flex gap-2 overflow-x-auto pb-4">{nextDays.map(d => {
                              const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                              return <button key={dStr} onClick={() => {setSelectedDate(dStr); setSelectedTime(null);}} className={`min-w-[70px] p-4 rounded-2xl flex flex-col items-center border transition-all ${selectedDate === dStr ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-slate-400'}`}><span className="text-[9px] font-black uppercase">{d.toLocaleDateString('pt-BR', {weekday: 'short'})}</span><span className="text-lg font-black">{d.getDate()}</span></button>
                           })}</div>
                        </div>
                        <div><p className="text-[10px] font-black uppercase mb-4 text-indigo-400">Horário</p>
                           <div className="grid grid-cols-3 gap-2">{timeSlots.map(t => {
                               const available = checkIsTimeAvailable(t);
                               return <button key={t} disabled={!available} onClick={() => setSelectedTime(t)} className={`py-3 rounded-xl text-xs font-black border transition-all ${!available ? 'bg-slate-100 text-slate-300 opacity-50' : selectedTime === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white hover:border-indigo-200'}`}>{t}</button>
                           })}</div>
                        </div>
                     </div>
                     {selectedTime && (
                       <div className="mt-8 space-y-4 bg-white p-6 rounded-[32px] border border-indigo-100">
                          <input placeholder="Seu Nome" className="w-full bg-slate-50 p-4 rounded-2xl outline-none" value={clientName} onChange={e => setClientName(e.target.value)} />
                          <input placeholder="WhatsApp" className="w-full bg-slate-50 p-4 rounded-2xl outline-none" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                          <button onClick={handleConfirmBooking} className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-black text-lg">Confirmar WhatsApp</button>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
        )}

        {view === AppView.PROFESSIONAL_LOGIN && (
          <div className="flex items-center justify-center min-h-[70vh] w-full px-4 animate-in fade-in">
            <div className="bg-white p-10 md:p-14 rounded-[48px] shadow-2xl border border-slate-100 w-full max-w-lg text-center">
              <h2 className="text-3xl font-black mb-10">Painel Profissional</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu-slug@marcai.dev" className="w-full bg-slate-50 p-4 rounded-[24px] outline-none" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full bg-slate-50 p-4 rounded-[24px] outline-none" />
                <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg">Entrar</button>
                <button type="button" onClick={() => handleNavigate(AppView.LANDING)} className="w-full py-4 text-slate-400 font-bold text-sm">Voltar</button>
              </form>
            </div>
          </div>
        )}

        {view === AppView.PROFESSIONAL_DASHBOARD && loggedProfessional && (
          <div className="max-w-6xl mx-auto animate-in fade-in">
            <div className="flex flex-col md:flex-row gap-8">
              <aside className="md:w-72 space-y-2">
                <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm mb-6 flex flex-col items-center text-center group">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-2xl mb-4 border-2 border-indigo-100 shadow-inner cursor-pointer hover:opacity-80 transition-all relative overflow-hidden"
                  >
                    {loggedProfessional.imageUrl ? <img src={loggedProfessional.imageUrl} className="w-full h-full object-cover rounded-full" /> : loggedProfessional.name[0]}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                  </div>
                  <h4 className="font-black text-slate-900">{loggedProfessional.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Profissional MarcAI</p>
                </div>
                {['appointments', 'pre_bookings', 'profile', 'hours'].map(tab => (
                  <button key={tab} onClick={() => setDashTab(tab as any)} className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all ${dashTab === tab ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>{tab === 'appointments' ? 'Agenda' : tab === 'pre_bookings' ? 'Pré-agendamentos' : tab === 'profile' ? 'Perfil e serviços' : 'Horários'}</button>
                ))}
                <button onClick={() => handleNavigate(AppView.LANDING)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 mt-8">Sair</button>
              </aside>

              <main className="flex-1 space-y-8">
                {dashTab === 'appointments' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black">Próximos Agendamentos</h3>
                    <div className="grid gap-4">{appointments.filter(a => a.professionalId === loggedProfessional.id).map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4 w-full">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">{a.clientName[0]}</div>
                            <div className="flex-1"><h5 className="font-bold">{a.clientName}</h5><p className="text-xs text-slate-400">{a.serviceName}</p></div>
                          </div>
                          <div className="flex flex-col md:items-end gap-2"><p className="text-sm font-black text-indigo-600">{formatDateBR(a.date)}, {a.time}</p><div className="flex gap-2"><button onClick={() => handleCancelAppointment(a.id)} className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg">Cancelar</button></div></div>
                        </div>
                      ))}</div>
                  </div>
                )}

                {dashTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black">Configurações Básicas</h3>
                    <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-4">
                      <p className="font-black text-lg">Seu Link de Agendamento</p>
                      <div className="flex gap-2"><input readOnly value={proPublicLink} className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-sm" /><button onClick={handleCopyLink} className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black uppercase text-xs">Copiar</button></div>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-8">
                      {/* Upload de Foto dentro do formulário de perfil */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-2xl border-2 border-indigo-100 shadow-inner cursor-pointer hover:opacity-80 transition-all relative overflow-hidden"
                        >
                          {loggedProfessional.imageUrl ? <img src={loggedProfessional.imageUrl} className="w-full h-full object-cover" /> : loggedProfessional.name[0]}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                        </div>
                        <div className="text-center sm:text-left">
                          <h4 className="font-black text-slate-900">Foto de Perfil</h4>
                          <p className="text-xs text-slate-500 mb-4">Clique na imagem ou no botão para carregar.</p>
                          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Alterar Foto</button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Profissional</label><input className="w-full bg-slate-50 p-4 rounded-2xl outline-none" value={loggedProfessional.name} onChange={e => setLoggedProfessional({...loggedProfessional, name: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Estabelecimento</label><input className="w-full bg-slate-50 p-4 rounded-2xl outline-none" value={loggedProfessional.salonName || ''} onChange={e => setLoggedProfessional({...loggedProfessional, salonName: e.target.value})} /></div>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Endereço Completo</label><input className="w-full bg-slate-50 p-4 rounded-2xl outline-none" value={loggedProfessional.address || ''} onChange={e => setLoggedProfessional({...loggedProfessional, address: e.target.value})} /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bio</label><textarea className="w-full bg-slate-50 p-4 rounded-2xl h-24 outline-none" value={loggedProfessional.bio || ''} onChange={e => setLoggedProfessional({...loggedProfessional, bio: e.target.value})} /></div>
                      <div className="pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-6"><h4 className="text-xl font-black">Seus Serviços</h4><button onClick={() => handleOpenServiceForm()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">+ Adicionar</button></div>
                        {serviceForm && (
                          <div className="mb-8 p-6 bg-indigo-50 rounded-3xl animate-in zoom-in-95">
                             <div className="grid md:grid-cols-3 gap-4 mb-4"><input placeholder="Nome" className="bg-white p-3 rounded-xl outline-none" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} /><input type="number" placeholder="R$" className="bg-white p-3 rounded-xl outline-none" value={serviceForm.price || ''} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} /><input type="number" placeholder="Min" className="bg-white p-3 rounded-xl outline-none" value={serviceForm.duration || ''} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} /></div>
                             <div className="flex gap-2"><button onClick={handleSaveService} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Salvar</button><button onClick={() => setServiceForm(null)} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button></div>
                          </div>
                        )}
                        <div className="space-y-3">{loggedProfessional.services.map(s => <div key={s.id} className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all group"><div><p className="font-bold">{s.name}</p><p className="text-xs text-slate-400 uppercase">R$ {s.price},00 • {s.duration} min</p></div><button onClick={() => handleDeleteService(s.id)} className="text-red-500 font-black text-xs opacity-0 group-hover:opacity-100">Excluir</button></div>)}</div>
                      </div>
                      <button onClick={handleSaveProfileChanges} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg">Salvar Alterações</button>
                    </div>
                  </div>
                )}
                
                {dashTab === 'hours' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between"><h3 className="text-2xl font-black">Horários</h3><button onClick={handleSaveHours} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase">Salvar Horários</button></div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-6">
                      {weeklyHours.map((day, idx) => (
                          <div key={day.day} className="py-4 flex items-center justify-between border-b last:border-0">
                            <label className="flex items-center gap-4 cursor-pointer"><input type="checkbox" checked={day.active} onChange={e => handleUpdateWeeklyDay(idx, 'active', e.target.checked)} className="w-5 h-5 rounded text-indigo-600" /><span className={`font-bold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>{day.day}</span></label>
                            {day.active && <div className="flex items-center gap-2"><input type="time" value={day.from} onChange={e => handleUpdateWeeklyDay(idx, 'from', e.target.value)} className="bg-slate-50 p-2 rounded-lg text-sm" /><span>até</span><input type="time" value={day.to} onChange={e => handleUpdateWeeklyDay(idx, 'to', e.target.value)} className="bg-slate-50 p-2 rounded-lg text-sm" /></div>}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {dashTab === 'pre_bookings' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black">Solicitações de Agendamento</h3>
                    <div className="grid gap-4">{preBookings.filter(a => a.professionalId === loggedProfessional.id).map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                          <div><h5 className="font-bold">{a.clientName}</h5><p className="text-xs text-slate-400">{a.serviceName} • {formatDateBR(a.date)} às {a.time}</p></div>
                          <div className="flex gap-2"><button onClick={() => handleConfirmAppointment(a.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg">Confirmar</button><button onClick={() => handleCancelAppointment(a.id)} className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-lg">Recusar</button></div>
                        </div>
                      ))}</div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}

        {view === AppView.DEVELOPER_PANEL && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in">
            {!isDevUnlocked ? (
              <form onSubmit={handleDevUnlock} className="bg-slate-900 p-12 rounded-[48px] flex flex-col items-center gap-6">
                <h2 className="text-white text-2xl font-black">Área Dev</h2>
                <input type="password" placeholder="Senha" className="bg-slate-800 text-white p-6 rounded-2xl text-center text-lg" value={devPasswordInput} onChange={e => setDevPasswordInput(e.target.value)} />
                <button className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase">Acessar</button>
              </form>
            ) : (
              <div className="bg-slate-900 p-10 rounded-[48px] border border-slate-800">
                <h2 className="text-3xl font-black text-white mb-10">Instâncias MarcAI</h2>
                <form onSubmit={handleCreatePro} className="grid lg:grid-cols-2 gap-6 mb-12">
                  <input required placeholder="Nome" className="bg-slate-800 p-4 rounded-2xl text-white" value={newPro.name} onChange={e => setNewPro({...newPro, name: e.target.value})} />
                  <input required placeholder="Login/Slug" className="bg-slate-800 p-4 rounded-2xl text-white" value={newPro.login} onChange={e => setNewPro({...newPro, login: e.target.value.toLowerCase().trim()})} />
                  <input required placeholder="Cidade" className="bg-slate-800 p-4 rounded-2xl text-white" value={newPro.city} onChange={e => setNewPro({...newPro, city: e.target.value})} />
                  <input required placeholder="Senha Temporária" className="bg-slate-800 p-4 rounded-2xl text-white" value={newPro.password} onChange={e => setNewPro({...newPro, password: e.target.value})} />
                  <button className="lg:col-span-2 bg-indigo-600 py-4 rounded-2xl text-white font-black uppercase">Salvar Profissional</button>
                </form>
                <div className="space-y-4">{professionals.map(p => (
                    <div key={p.id} className="p-4 bg-slate-800 rounded-xl flex items-center justify-between text-white"><div className="flex items-center gap-3">{p.imageUrl ? <img src={p.imageUrl} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">{p.name[0]}</div>}<div><p className="font-bold">{p.name}</p><p className="text-[10px] text-indigo-400">{p.slug}@marcai.dev</p></div></div><div className="flex gap-2"><button onClick={() => handleEditPro(p)} className="text-indigo-400 text-xs font-bold uppercase">Editar</button><button onClick={() => handleDeletePro(p.id)} className="text-red-500 text-xs font-bold uppercase">Excluir</button></div></div>
                  ))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
