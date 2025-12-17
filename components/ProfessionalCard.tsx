
import React from 'react';
import { Professional } from '../types';

interface ProfessionalCardProps {
  professional: Professional;
  onSelect: (p: Professional) => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={professional.imageUrl} 
          alt={professional.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
          <span className="text-amber-500">★</span>
          <span className="text-xs font-bold text-slate-700">{professional.rating}</span>
        </div>
      </div>
      <div className="p-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
          {professional.category}
        </span>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{professional.name}</h3>
        <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
          {professional.bio}
        </p>
        <button 
          onClick={() => onSelect(professional)}
          className="w-full py-2.5 bg-slate-50 text-slate-900 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
        >
          Ver Agenda
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;
