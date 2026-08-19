import DropdownUser from './DropdownUser';
import DarkModeSwitcher from './DarkModeSwitcher';
import SubscriptionInfo from './SubscriptionInfo';
import { Menu } from 'lucide-react';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="sticky top-0 z-50 flex w-full border-b border-border bg-card/90 backdrop-blur-md">
      <div className="flex flex-grow items-center justify-between px-4 py-3 md:px-6 2xl:px-8">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            aria-label="Ouvrir le menu"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-border lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden sm:block">
          <SubscriptionInfo />
        </div>

        <div className="flex items-center gap-3 2xsm:gap-5">
          <div className="flex items-center gap-2 2xsm:gap-4">
            <DarkModeSwitcher />
          </div>
          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;
