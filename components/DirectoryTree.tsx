
import React from 'react';

const FolderIcon = () => (
  <svg className="w-4 h-4 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4 text-slate-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const DirectoryTree: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-sm overflow-x-auto border border-slate-800 shadow-2xl">
      <div className="flex items-center mb-4 border-b border-slate-800 pb-2">
        <span className="text-indigo-400 font-bold">ESTRUTURA DE PASTAS (Next.js App Router)</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center"><FolderIcon /> /app</div>
        <div className="ml-6 flex items-center"><FolderIcon /> /(auth) <span className="text-slate-500 ml-2">// Agrupamento de rotas de autenticação</span></div>
        <div className="ml-12 flex items-center"><FolderIcon /> /login</div>
        <div className="ml-12 flex items-center"><FolderIcon /> /register</div>
        
        <div className="ml-6 flex items-center mt-2"><FolderIcon /> /(public) <span className="text-slate-500 ml-2">// Marketplace e Perfis Públicos</span></div>
        <div className="ml-12 flex items-center"><FolderIcon /> /profissionais</div>
        <div className="ml-12 flex items-center"><FolderIcon /> /profissional/[slug]</div>
        
        <div className="ml-6 flex items-center mt-2"><FolderIcon /> /(dashboard) <span className="text-slate-500 ml-2">// Áreas Restritas</span></div>
        <div className="ml-12 flex items-center"><FolderIcon /> /profissional <span className="text-slate-500 ml-2">// Agenda, Serviços, Ganhos</span></div>
        <div className="ml-12 flex items-center"><FolderIcon /> /cliente <span className="text-slate-500 ml-2">// Meus Agendamentos</span></div>
        
        <div className="ml-6 flex items-center mt-2"><FolderIcon /> /api <span className="text-slate-500 ml-2">// Route Handlers (Back-end)</span></div>
        <div className="ml-12 flex items-center"><FileIcon /> route.ts <span className="text-slate-500 ml-2">(auth, agendamentos, etc)</span></div>
        
        <div className="ml-6 flex items-center mt-2"><FileIcon /> layout.tsx</div>
        <div className="ml-6 flex items-center"><FileIcon /> page.tsx</div>

        <div className="flex items-center mt-4"><FolderIcon /> /components</div>
        <div className="ml-6 flex items-center"><FolderIcon /> /ui <span className="text-slate-500 ml-2">// Botões, Inputs, Modais (Atomic)</span></div>
        <div className="ml-6 flex items-center"><FolderIcon /> /forms <span className="text-slate-500 ml-2">// Lógica de Formulários</span></div>
        <div className="ml-6 flex items-center"><FolderIcon /> /agenda <span className="text-slate-500 ml-2">// Grid de Horários</span></div>
        <div className="ml-6 flex items-center"><FolderIcon /> /cards <span className="text-slate-500 ml-2">// ProfessionalCard, ServiceCard</span></div>

        <div className="flex items-center mt-4"><FolderIcon /> /lib</div>
        <div className="ml-6 flex items-center"><FileIcon /> auth.ts <span className="text-slate-500 ml-2">// Configuração Auth.js/NextAuth</span></div>
        <div className="ml-6 flex items-center"><FileIcon /> db.ts <span className="text-slate-500 ml-2">// Client do Prisma ou Supabase</span></div>
        <div className="ml-6 flex items-center"><FileIcon /> utils.ts <span className="text-slate-500 ml-2">// Formatters, cn helpers</span></div>

        <div className="flex items-center mt-4"><FolderIcon /> /services <span className="text-slate-500 ml-2">// Camada de Negócio / Integrações (Ex: Gemini)</span></div>
        <div className="flex items-center mt-4"><FolderIcon /> /hooks <span className="text-slate-500 ml-2">// Custom React Hooks</span></div>
        <div className="flex items-center mt-4"><FolderIcon /> /types <span className="text-slate-500 ml-2">// Interfaces Globais</span></div>
        <div className="flex items-center mt-4"><FolderIcon /> /styles <span className="text-slate-500 ml-2">// Global CSS</span></div>
        
        <div className="flex items-center mt-4"><FolderIcon /> /public <span className="text-slate-500 ml-2">// Estáticos (Ícones, Manifest.json)</span></div>
        <div className="ml-6 flex items-center text-indigo-400 italic font-bold">// ⚡ PREPARAÇÃO PWA (Futuro)</div>
        <div className="ml-6 flex items-center"><FileIcon /> manifest.json</div>
        <div className="ml-6 flex items-center"><FileIcon /> sw.js <span className="text-slate-500 ml-2">(Service Worker)</span></div>
      </div>
    </div>
  );
};

export default DirectoryTree;
