import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Boxes,
  ClipboardList,
  Warehouse,
  FileText,
  ScanLine,
  Zap,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg0: boolean) => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
  { to: '/dashboard/ventes-simples', label: 'Ventes Rapides', icon: Zap, match: (p) => p.includes('ventes-simples') },
  { to: '/dashboard/vente-caisses', label: 'Ventes Caisse', icon: ScanLine, match: (p) => p.includes('vente-caisses') },
  { to: '/dashboard/clients', label: 'Clients', icon: Users, match: (p) => p.includes('clients') },
  { to: '/dashboard/fournisseurs', label: 'Fournisseurs', icon: Users, match: (p) => p.includes('fournisseurs') },
  {
    to: '/dashboard/ventes',
    label: 'Ventes',
    icon: ShoppingCart,
    match: (p) => p.includes('ventes') && !p.includes('inventaire-ventes') && !p.includes('vente-caisses') && !p.includes('ventes-simples'),
  },
  { to: '/dashboard/approvisionnements', label: 'Approvisionnement', icon: Package, match: (p) => p.includes('approvisionnements') },
  { to: '/dashboard/articles', label: 'Articles', icon: Package, match: (p) => p.includes('articles') },
  { to: '/dashboard/stock', label: 'Stock', icon: Boxes, match: (p) => p.includes('stock') },
  { to: '/dashboard/inventaire-ventes', label: 'Inventaire Ventes', icon: ClipboardList, match: (p) => p.includes('inventaire-ventes') },
  { to: '/dashboard/depots', label: 'Dépôts', icon: Warehouse, match: (p) => p.includes('dashboard/depots') },
  { to: '/dashboard/annual-report', label: 'Rapport annuel', icon: FileText, match: (p) => p.includes('dashboard/annual-report') },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const location = useLocation();
  const { pathname } = location;
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-50 flex h-screen w-72.5 flex-col overflow-y-hidden border-r border-white/5 bg-gradient-to-b from-[#1E293B] to-[#0F172A] shadow-xl duration-300 ease-in-out lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-6 py-5">
        <NavLink to="/" className="rounded-xl bg-white p-1.5 shadow-md transition-all duration-300 hover:shadow-lg">
          <img src="/img/logo.png" alt="YORO" className="h-14 w-14 object-contain" />
        </NavLink>
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          aria-label="Fermer le menu"
          className="flex cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white/80 transition-colors duration-300 hover:bg-white/20 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4 lg:mt-6 lg:px-6">
          <div>
            <h3 className="mb-6 ml-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              YORO HAIR
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <li
                    key={item.to}
                    onMouseEnter={() => setHoveredItem(item.to)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <NavLink
                      to={item.to}
                      className={`group relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/90 duration-200 ease-in-out ${
                        active
                          ? 'bg-emerald-500/15 text-white shadow-md ring-1 ring-emerald-500/30'
                          : 'hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          active ? 'bg-white text-emerald-600' : 'bg-white/10 text-white/80'
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <span>{item.label}</span>
                      {hoveredItem === item.to && !active && (
                        <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="absolute right-2">
                          <span className="text-xs text-white/40">›</span>
                        </motion.div>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
