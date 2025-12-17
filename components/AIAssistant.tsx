
import React, { useState } from 'react';
import { getSmartScheduleAdvice } from '../services/geminiService.ts';

const AIAssistant: React.FC<{ context?: any }> = ({ context }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const result = await getSmartScheduleAdvice(input, context);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-indigo-900">MarcAI Smart Scheduling</h3>
          <p className="text-indigo-600 text-xs">Agende via voz ou texto com inteligência artificial</p>
        </div>
      </div>
      
      <div className="relative">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: 'Quero um corte de cabelo amanhã às 15h'"
          className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>

      {response && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm text-sm text-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="font-semibold text-indigo-600 mb-1">MarcAI diz:</p>
          {response}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
