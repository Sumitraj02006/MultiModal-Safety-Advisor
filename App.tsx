import React, { useState } from 'react';
import { ShieldCheck, Map, MessageSquare, Menu, X } from 'lucide-react';
import AnalysisView from './components/AnalysisView';
import ChatView from './components/ChatView';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ANALYZE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavItem = ({ view, label, icon: Icon }: { view: AppView; label: string; icon: any }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all w-full md:w-auto ${
        currentView === view
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">Safety Scout</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavItem view={AppView.ANALYZE} label="Analyze & Report" icon={Map} />
            <NavItem view={AppView.CHAT} label="Emergency Advisor" icon={MessageSquare} />
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 p-2 space-y-1 bg-white shadow-lg absolute w-full left-0">
            <NavItem view={AppView.ANALYZE} label="Analyze & Report" icon={Map} />
            <NavItem view={AppView.CHAT} label="Emergency Advisor" icon={MessageSquare} />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        {currentView === AppView.ANALYZE && <AnalysisView />}
        {currentView === AppView.CHAT && <ChatView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 Safety Scout</p>
          <p className="mt-1 text-xs text-slate-400">
            Disclaimer: This tool is for informational purposes only. In a life-threatening emergency, always contact local authorities immediately.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;