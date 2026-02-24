/**
 * Bottom Navigation Bar
 * Mobile-first navigation with 5 tabs
 * Similar to Instagram/Meta/Snapchat bottom nav
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Calendar, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    id: 'home',
    icon: Home,
    label: 'Home',
    path: '/dashboard',
  },
  {
    id: 'library',
    icon: BookOpen,
    label: 'Library',
    path: '/knowledge-library',
  },
  {
    id: 'events',
    icon: Calendar,
    label: 'Events',
    path: '/events-calendar',
  },
  {
    id: 'search',
    icon: Search,
    label: 'Search',
    path: '/gallery',
  },
  {
    id: 'profile',
    icon: User,
    label: 'Profile',
    path: '/dashboard',
  },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    for (const item of NAV_ITEMS) {
      if (location.pathname === item.path || location.pathname.startsWith(item.path)) {
        return item.id;
      }
    }
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all',
                'w-16 h-14',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-all',
                  isActive && 'scale-110'
                )}
              />
              <span className={cn(
                'text-xs font-medium transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNavigation;
