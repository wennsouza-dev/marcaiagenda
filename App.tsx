
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout.tsx';
import ProfessionalCard from './components/ProfessionalCard.tsx';
import { Professional, AppView, Service, Appointment } from './types.ts';
import { supabase } from './lib/supabase.ts';

const App: React.FC = () => {
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
  
  // Agendamentos em memória (Para o MVP)
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', professionalId: 'mock-1', clientName: 'Ricardo Silva', clientPhone: '32988729033', serviceName: 'Corte Degradê', date: '2023-12-25', time: '14:30', status: 'confirmed' }
  ]);
  const [preBookings, setPreBookings] = useState<Appointment[]>([
    { id: '3', professionalId: 'mock-1', clientName: 'Marcos Oliveira', clientPhone: '32988729033', serviceName: 'Barba e Toalha Quente', date: '2023-12-26', time: '10:00', status: 'pending' }
  ]);

  // Configuração de orientação de pré-agendamento
  const [preBookingOrientation, setPreBookingOrientation] = useState('Para garantir seu horário, solicitamos o pagamento antecipado de 50% do valor via PIX. Por favor, envie o comprovante para confirmar.');

  // Estados de Horários
  const [weeklyHours, setWeeklyHours] = useState([
    { day: 'Segunda', active: true, from: '09:00', to: '18:00' },
    { day: 'Terça', active: true, from: '09:00', to: '18:00' },
    { day: 'Quarta', active: true, from: '09:00', to: '18:00' },
    { day: 'Quinta', active: true, from: '09:00', to: '18:00' },
    { day: 'Sexta', active: true, from: '09:00', to: '18:00' },
    { day: 'Sábado', active: false, from: '09:00', to: '12:00' },
    { day: 'Domingo', active: false, from: '09:00', to: '12:00' },
  ]);

  const [lunchBreak, setLunchBreak] = useState({ enabled: true, from: '12:00', to: '13:00' });
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

  // Estado de Avaliação
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

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
          resetWord: p.reset_word,
          password: p.password,
          businessHours: p.business_hours // Carrega as configurações de horários do banco
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
      const slug = newPro.login.toLowerCase().trim();
      const proData: any = {
        slug: slug,
        name: newPro.name,
        salon_name: newPro.salonName,
        city: newPro.city,
        expire_days: newPro.expireDays,
        reset_word: newPro.resetWord,
        category: 'Barbearia',
      };

      if (editingProId) {
        const { error } = await supabase.from('professionals').update(proData).eq('id', editingProId);
        if (error) throw error;
        alert("Profissional atualizado com sucesso!");
      } else {
        proData.image_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop';
        proData.services = [];
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

    const proFound = professionals.find(p => 
      `${p.slug}@marcai.dev` === email.toLowerCase().trim() && 
      (p.password === password || p.resetWord === password)
    );

    setTimeout(() => {
      if (proFound) {
        setLoggedProfessional(proFound);
        // Carrega configurações de horários salvas no banco ou usa os defaults
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
        alert("E-mail ou senha inválidos. Utilize o login e senha (palavra secreta) cadastrados no Painel Dev.");
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

  // --- LÓGICA DE SALVAR HORÁRIOS NO BANCO ---
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

      if (error) {
        // Tratamento específico para coluna inexistente
        if (error.message.includes("column") && error.message.includes("not found")) {
          console.error("ERRO DE SCHEMA:", error.message);
          alert("ERRO TÉCNICO: A coluna 'business_hours' não existe na tabela 'professionals'.\n\nCOMO RESOLVER:\nNo painel do Supabase, vá em 'SQL Editor' e execute:\nALTER TABLE professionals ADD COLUMN business_hours JSONB;");
        } else {
          throw error;
        }
      } else {
        // Atualiza o estado local do profissional
        setLoggedProfessional({ ...loggedProfessional, businessHours: businessHoursConfig });
        alert("Configurações de horários salvas com sucesso!");
      }
    } catch (err: any) {
      alert("Erro inesperado ao salvar horários: " + err.message);
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

  // --- LÓGICA DE AGENDAMENTOS ---

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
    
    const msg = `Olá ${app.clientName}, aqui é ${loggedProfessional.name}! Passando para CONFIRMAR seu agendamento de *${app.serviceName}* no dia *${formatDateBR(app.date)}* às *${app.time}*. Te aguardamos!`;
    sendWhatsApp(app.clientPhone || '', msg);
  };

  const handleCancelAppointment = (id: string) => {
    const app = appointments.find(a => a.id === id) || preBookings.find(a => a.id === id);
    if (!app || !loggedProfessional) return;

    if (confirm("Deseja realmente CANCELAR este agendamento? O horário será liberado para outros clientes.")) {
      const updatedApp: Appointment = { ...app, status: 'cancelled' };
      
      setAppointments(prev => prev.map(a => a.id === id ? updatedApp : a));
      setPreBookings(prev => prev.map(a => a.id === id ? updatedApp : a));
      
      const msg = `Olá ${app.clientName}, aqui é ${loggedProfessional.name}. Infelizmente precisei CANCELAR seu horário de *${app.serviceName}* no dia *${formatDateBR(app.date)}* às *${app.time}*. O horário já está disponível para novos agendamentos no link. Desculpe o transtorno!`;
      sendWhatsApp(app.clientPhone || '', msg);
    }
  };

  const handleCompleteAppointment = (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app || !loggedProfessional) return;

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'concluded' } : a));
    
    const reviewLink = `${window.location.origin}/?view=review&id=${app.id}&pro=${loggedProfessional.slug}`;
    const msg = `Olá ${app.clientName}, aqui é ${loggedProfessional.name}. Obrigado pela preferência! Sua opinião é muito importante. Poderia avaliar meu serviço no link abaixo?\n\n${reviewLink}`;
    sendWhatsApp(app.clientPhone || '', msg);
  };

  const handleDeleteAppointment = (id: string, isFromPre: boolean) => {
    if (confirm("Deseja realmente EXCLUIR este agendamento do histórico?")) {
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
    alert("Agendamento movido para a aba de Pré-agendamentos.");
  };

  const handleSendPreBookingOrientation = (app: Appointment) => {
    if (!loggedProfessional) return;
    const msg = `Olá ${app.clientName}, aqui é ${loggedProfessional.name}! Recebi sua solicitação de agendamento de *${app.serviceName}* no dia *${formatDateBR(app.date)}* às *${app.time}*. Seguem as orientações para confirmação: \n\n${preBookingOrientation}`;
    sendWhatsApp(app.clientPhone || '', msg);
  };

  // --- LÓGICA DE HORÁRIOS ---

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
      alert("Por favor, preencha todos os campos para confirmar.");
      return;
    }

    const dateFormatted = formatDateBR(selectedDate);
    const cleanWhatsapp = selectedProfessional.whatsapp?.replace(/\D/g, '') || '5511999999999';
    const message = `Olá ${selectedProfessional.name}, gostaria de agendar: *${selectedService.name}* para o dia *${dateFormatted}* às *${selectedTime}*. Meu nome é ${clientName}. Está disponível?`;
    
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

  // Gera os próximos 15 dias a partir de HOJE em Brasília
  const nextDays = useMemo(() => {
    const days = [];
    const baseDate = getBrasiliaNow();
    // Zera horas para evitar pulos indesejados no loop
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 15; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [brDateStr]); // Recalcula se a data de Brasília mudar

  const timeSlots = ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30", "16:15", "17:00"];

  const checkIsTimeAvailable = (time: string) => {
    if (!selectedProfessional) return false;

    // 1. Bloqueio por Horário de Brasília (Hoje)
    if (selectedDate === brDateStr) {
      const [h, m] = time.split(':').map(Number);
      const nowH = brTime.getHours();
      const nowM = brTime.getMinutes();
      if (h < nowH) return false;
      if (h === nowH && m <= nowM) return false;
    }

    // 2. Bloqueio por Agendamento Existente (Confirmado ou Pendente)
    const isTaken = [...appointments, ...preBookings].some(a => 
      a.professionalId === selectedProfessional.id && 
      a.date === selectedDate && 
      a.time === time &&
      a.status !== 'cancelled'
    );
    
    if (isTaken) return false;

    return true;
  };

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
             <div className="bg-white rounded-[48px] overflow-hidden border border-slate-100 shadow-xl relative">
               
               {/* Relógio de Brasília Transparente */}
               <div className="absolute top-6 right-8 text-right opacity-30 pointer-events-none select-none">
                 <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Brasília Time</p>
                 <p className="text-xl font-mono font-black text-slate-900">{brTimeFormatted}</p>
               </div>

               <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                 <img 
                    src={selectedProfessional.imageUrl} 
                    className="w-40 h-40 md:w-56 md:h-56 rounded-[48px] object-cover shadow-2xl border-4 border-white" 
                    alt={selectedProfessional.name} 
                  />
                 <div className="text-center md:text-left flex-1">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{selectedProfessional.category}</span>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedProfessional.name}</h1>
                    {selectedProfessional.salonName && <p className="text-slate-400 font-bold uppercase tracking-tight text-sm mb-4">{selectedProfessional.salonName}</p>}
                    <p className="text-slate-600 max-w-lg mb-6">{selectedProfessional.bio || "Agende seu horário com os melhores profissionais."}</p>
                    
                    <div className="flex flex-col gap-3">
                      {selectedProfessional.address && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProfessional.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
                        >
                          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Localização: {selectedProfessional.address}
                        </a>
                      )}
                      {selectedProfessional.whatsapp && (
                        <a 
                          href={`https://wa.me/${selectedProfessional.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium"
                        >
                          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp: {selectedProfessional.whatsapp}
                        </a>
                      )}
                    </div>
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
                                 const dYear = d.getFullYear();
                                 const dMonth = String(d.getMonth() + 1).padStart(2, '0');
                                 const dDay = String(d.getDate()).padStart(2, '0');
                                 const dStr = `${dYear}-${dMonth}-${dDay}`;
                                 
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
                             {timeSlots.map(t => {
                               const available = checkIsTimeAvailable(t);
                               return (
                                 <button 
                                   key={t} 
                                   disabled={!available}
                                   onClick={() => setSelectedTime(t)} 
                                   className={`py-3 rounded-xl text-xs font-black border transition-all 
                                     ${!available ? 'bg-slate-100 text-slate-300 cursor-not-allowed border-slate-200 line-through' : 
                                       selectedTime === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 
                                       'bg-white border-transparent text-slate-500 hover:border-indigo-200'}`}
                                 >
                                   {t}
                                 </button>
                               );
                             })}
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
                      {appointments
                        .filter(a => a.professionalId === loggedProfessional.id || a.professionalId === 'mock-1')
                        .map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between group gap-6">
                          <div className="flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${a.status === 'concluded' ? 'bg-emerald-50 text-emerald-600' : a.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>{a.clientName[0]}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-slate-900">{a.clientName}</h5>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${a.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600' : a.status === 'pending' ? 'bg-amber-50 text-amber-600' : a.status === 'concluded' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{a.status}</span>
                              </div>
                              <p className="text-xs text-slate-400 font-bold uppercase">{a.serviceName} • {a.clientPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                            <p className="text-sm font-black text-indigo-600 whitespace-nowrap">{formatDateBR(a.date)}, {a.time}</p>
                            <div className="flex items-center gap-2">
                              {a.status === 'pending' && (
                                <button onClick={() => handleConfirmAppointment(a.id)} className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all">Confirmar</button>
                              )}
                              {a.status !== 'cancelled' && a.status !== 'concluded' && (
                                <>
                                  <button onClick={() => handleCancelAppointment(a.id)} className="px-3 py-2 bg-orange-50 text-orange-600 text-[10px] font-black uppercase rounded-xl hover:bg-orange-600 hover:text-white transition-all">Cancelar</button>
                                  {/* FIXED: Removed incorrect 'id:' label in function call */}
                                  <button onClick={() => handleCompleteAppointment(a.id)} className="px-3 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Concluir</button>
                                </>
                              )}
                              {a.status === 'confirmed' && (
                                <button onClick={() => handleMoveToPreBooking(a.id)} className="px-3 py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-xl hover:bg-amber-600 hover:text-white transition-all">Mover para Pré</button>
                              )}
                              <button onClick={() => handleDeleteAppointment(a.id, false)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Excluir"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {appointments.filter(a => a.professionalId === loggedProfessional.id || a.professionalId === 'mock-1').length === 0 && (
                        <p className="text-center text-slate-400 py-12">Nenhum agendamento para este profissional.</p>
                      )}
                    </div>
                  </div>
                )}

                {dashTab === 'pre_bookings' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h3 className="text-2xl font-black text-slate-900">Pré-agendamentos</h3>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] space-y-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        <h4 className="font-bold text-amber-900 text-sm">Configuração de Orientação</h4>
                      </div>
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed">Este texto será enviado ao cliente quando você clicar no botão "Enviar Orientação". Ideal para cobranças de sinal ou regras específicas.</p>
                      <textarea 
                        className="w-full bg-white border border-amber-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-24 transition-all"
                        value={preBookingOrientation}
                        onChange={(e) => setPreBookingOrientation(e.target.value)}
                        placeholder="Ex: Para confirmar, solicitamos o pagamento de 50% via PIX..."
                      />
                    </div>

                    <div className="grid gap-4">
                      {preBookings
                        .filter(a => a.professionalId === loggedProfessional.id || a.professionalId === 'mock-1')
                        .map(a => (
                        <div key={a.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4 w-full">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center font-bold text-amber-600">{a.clientName[0]}</div>
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-900">{a.clientName}</h5>
                              <p className="text-xs text-slate-400 font-bold uppercase">{a.serviceName} • {a.clientPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                            <p className="text-sm font-black text-amber-600 whitespace-nowrap">{formatDateBR(a.date)}, {a.time}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <button onClick={() => handleSendPreBookingOrientation(a)} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100">Enviar Orientação</button>
                              <button onClick={() => handleConfirmAppointment(a.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100">Confirmar</button>
                              <button onClick={() => handleCancelAppointment(a.id)} className="px-4 py-2 bg-orange-50 text-orange-600 text-[10px] font-black uppercase rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-orange-100">Cancelar</button>
                              <button onClick={() => handleDeleteAppointment(a.id, true)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {preBookings.filter(a => a.professionalId === loggedProfessional.id || a.professionalId === 'mock-1').length === 0 && (
                        <div className="py-12 text-center text-slate-400 font-medium">Nenhum pré-agendamento pendente.</div>
                      )}
                    </div>
                  </div>
                )}
                
                {dashTab === 'hours' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900">Configuração de Horários</h3>
                      <button 
                        onClick={handleSaveHours}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>

                    {/* Horário Semanal */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <h4 className="font-black text-slate-900">Expediente Semanal</h4>
                      </div>
                      
                      <div className="divide-y divide-slate-50">
                        {weeklyHours.map((day, idx) => (
                          <div key={day.day} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-[140px]">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={day.active} onChange={e => handleUpdateWeeklyDay(idx, 'active', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                              <span className={`font-bold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>{day.day}</span>
                            </div>
                            
                            {day.active ? (
                              <div className="flex items-center gap-3">
                                <input type="time" value={day.from} onChange={e => handleUpdateWeeklyDay(idx, 'from', e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                <span className="text-slate-400 font-bold text-xs">até</span>
                                <input type="time" value={day.to} onChange={e => handleUpdateWeeklyDay(idx, 'to', e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            ) : (
                              <span className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Fechado / Não atende</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Horário de Almoço */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
                          <h4 className="font-black text-slate-900">Pausa para Almoço</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={lunchBreak.enabled} onChange={e => setLunchBreak({...lunchBreak, enabled: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                      
                      {lunchBreak.enabled ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-in slide-in-from-top-2">
                          <p className="text-sm text-slate-500 font-medium">Bloquear agenda entre:</p>
                          <div className="flex items-center gap-3">
                            <input type="time" value={lunchBreak.from} onChange={e => setLunchBreak({...lunchBreak, from: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" />
                            <span className="text-slate-400 font-bold text-xs">e</span>
                            <input type="time" value={lunchBreak.to} onChange={e => setLunchBreak({...lunchBreak, to: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Sem pausa configurada no sistema.</p>
                      )}
                    </div>

                    {/* Horários Especiais */}
                    <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-800 text-indigo-400 rounded-lg flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                          <h4 className="font-black text-white text-lg">Horários Especiais</h4>
                        </div>
                        <button onClick={() => setShowSpecialDateForm(!showSpecialDateForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors">
                          {showSpecialDateForm ? 'Cancelar' : '+ Adicionar Data'}
                        </button>
                      </div>

                      {showSpecialDateForm && (
                        <div className="bg-slate-800 p-6 rounded-3xl space-y-4 animate-in zoom-in-95">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data</label>
                              <input type="date" value={newSpecialDate.date} onChange={e => setNewSpecialDate({...newSpecialDate, date: e.target.value})} className="w-full bg-slate-950 border-none rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Status</label>
                              <select value={newSpecialDate.closed ? 'closed' : 'open'} onChange={e => setNewSpecialDate({...newSpecialDate, closed: e.target.value === 'closed'})} className="w-full bg-slate-950 border-none rounded-xl px-4 py-2 text-white text-sm outline-none">
                                <option value="open">Aberto (Horário Diferente)</option>
                                <option value="closed">Fechado (Folga/Feriado)</option>
                              </select>
                            </div>
                            {!newSpecialDate.closed && (
                              <>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Das</label>
                                  <input type="time" value={newSpecialDate.from} onChange={e => setNewSpecialDate({...newSpecialDate, from: e.target.value})} className="w-full bg-slate-950 border-none rounded-xl px-4 py-2 text-white text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Até</label>
                                  <input type="time" value={newSpecialDate.to} onChange={e => setNewSpecialDate({...newSpecialDate, to: e.target.value})} className="w-full bg-slate-950 border-none rounded-xl px-4 py-2 text-white text-sm" />
                                </div>
                              </>
                            )}
                          </div>
                          <button onClick={handleAddSpecialDate} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Adicionar Exceção</button>
                        </div>
                      )}

                      <div className="space-y-3">
                        {specialDates.length > 0 ? specialDates.map(sd => (
                          <div key={sd.id} className="bg-slate-950/50 p-5 rounded-2xl flex items-center justify-between border border-slate-800">
                            <div>
                              <p className="text-white font-bold">{formatDateBR(sd.date)}</p>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${sd.closed ? 'text-red-400' : 'text-emerald-400'}`}>
                                {sd.closed ? 'Fechado' : `Aberto: ${sd.from} - ${sd.to}`}
                              </p>
                            </div>
                            <button onClick={() => handleRemoveSpecialDate(sd.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )) : (
                          <p className="text-center text-slate-600 text-sm py-4">Nenhuma data especial configurada.</p>
                        )}
                      </div>
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

        {view === AppView.REVIEW && (
          <div className="flex items-center justify-center min-h-[70vh] animate-in zoom-in-95 duration-500">
            <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 w-full max-w-lg text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Avalie o Serviço</h2>
              <p className="text-slate-500 mb-8 font-medium">Sua opinião nos ajuda a crescer.</p>
              
              <div className="flex justify-center gap-4 mb-8">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setReviewRating(star)} className="transition-transform active:scale-90">
                    <svg className={`w-12 h-12 ${star <= reviewRating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </button>
                ))}
              </div>

              <textarea 
                placeholder="Conte-nos como foi sua experiência (opcional)" 
                className="w-full bg-slate-50 border-none rounded-[24px] p-6 text-sm mb-6 h-32 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />

              <button 
                onClick={() => {alert("Obrigado pela sua avaliação!"); setView(AppView.LANDING);}} 
                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Enviar Avaliação
              </button>
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
                 <form onSubmit={handleDevUnlock} className="w-full max-sm space-y-4">
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
                        <input required type="text" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.login} onChange={e => setNewPro({...newPro, login: e.target.value.toLowerCase().trim()})} placeholder="Ex: jorge" />
                        <p className="text-[10px] text-indigo-400 italic">E-mail: {newPro.login || '...' }@marcai.dev</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Senha Temporária</label>
                        <input required type="text" className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-indigo-500" value={newPro.password} onChange={e => setNewPro({...newPro, password: e.target.value})} placeholder="Ex: 123456" />
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