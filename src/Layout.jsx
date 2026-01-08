import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Target, 
  CheckSquare, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Home,
  CalendarDays,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: Home, page: 'Dashboard' },
  { name: 'Calendar', icon: Calendar, page: 'Calendar' },
  { name: 'Weekly Planner', icon: CalendarDays, page: 'WeeklyPlanner' },
  { name: 'Goals', icon: Target, page: 'Goals' },
  { name: 'Tasks', icon: CheckSquare, page: 'Tasks' },
  { name: 'Notes', icon: FileText, page: 'Notes' },
  { name: 'Contacts', icon: Users, page: 'Contacts' },
  { name: 'Progress', icon: BarChart3, page: 'Progress' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { data: settings } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: async () => {
      const list = await base44.entities.PlannerSettings.list();
      return list[0] || {};
    },
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';
  const accentColor = settings?.accent_color || '#c9a962';

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        :root {
          --primary-color: ${primaryColor};
          --accent-color: ${accentColor};
        }
      `}</style>
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-8 w-auto" />
            ) : (
              <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
            )}
            <span className="font-semibold text-stone-800">
              {settings?.company_name || 'Business Planner'}
            </span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-white border-r border-stone-200 z-50 transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-10 w-auto" />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                )}
                <div>
                  <h1 className="font-semibold text-stone-800 text-sm">
                    {settings?.company_name || 'Business Planner'}
                  </h1>
                  {settings?.slogan && (
                    <p className="text-xs text-stone-500">{settings.slogan}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                        isActive 
                          ? "text-white shadow-lg" 
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                      )}
                      style={isActive ? { backgroundColor: primaryColor } : {}}
                    >
                      <item.icon className={cn("w-5 h-5", isActive && "text-white")} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100">
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <p className="text-xs font-medium" style={{ color: primaryColor }}>
                Stay organized, achieve more
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Your productivity companion
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}