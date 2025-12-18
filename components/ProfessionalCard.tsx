
import React from 'react';
import { Professional } from '../types';

interface ProfessionalCardProps {
  professional: Professional;
  onSelect: (p: Professional) => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional, onSelect }) => {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col items-center text-center group">
      {/* Foto de Perfil com Moldura Clássica */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full p-1 border-2 border-indigo-100 group-hover:border-indigo-500 transition-colors duration-300">
          <img 
            src={professional.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'} 
            alt={professional.name} 
            className="w-full h-full object-cover rounded-full shadow-inner"
          />
        </div>
        {/* Badge de Rating */}
        <div className="absolute -bottom-1 -right-1 bg-white shadow-md border border-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="text-amber-400 text-xs">★</span>
          <span className="text-[10px] font-bold text-slate-700">{professional.rating || '5.0'}</span>
        </div>
      </div>

      {/* Tags de Localização e Categoria */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
          {professional.category}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 px-3 py-1 rounded-full">
          {professional.city}
        </span>
      </div>

      {/* Informações Textuais */}
      <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
        {professional.name}
      </h3>
      {professional.salonName && (
        <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-tight">
          {professional.salonName}
        </p>
      )}
      
      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 h-10 px-2">
        {professional.bio || "Especialista pronto para te atender com excelência e cuidado."}
      </p>

      {/* Botão de Ação Clássico */}
      <button 
        onClick={() => onSelect(professional)}
        className="w-full py-3.5 bg-white text-indigo-600 border-2 border-indigo-50 rounded-2xl text-sm font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-[0.97] shadow-sm"
      >
        Ver Agenda
      </button>
    </div>
  );
};

export default ProfessionalCard;
