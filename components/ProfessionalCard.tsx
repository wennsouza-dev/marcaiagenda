
import React from 'react';
import { Professional } from '../types';

interface ProfessionalCardProps {
  professional: Professional;
  onSelect: (p: Professional) => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional, onSelect }) => {
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={professional.imageUrl} 
          alt={professional.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/50">
          <span className="text-amber-500">★</span>
          <span className="text-xs font-bold text-slate-700">{professional.rating || '4.9'}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
            {professional.category} • {professional.city}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">
          {professional.salonName ? `${professional.salonName} - ` : ''}{professional.name}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 mb-5 leading-relaxed h-10">
          {professional.bio}
        </p>
        <button 
          onClick={() => onSelect(professional)}
          className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl text-sm font-bold border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-[0.98]"
        >
          Ver Agenda
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;