import { Link } from 'react-router-dom';
import { Settings, LogOut, CreditCard, ChevronDown } from 'lucide-react';
import { authclient } from '../../../lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../shadcn/dropdown-menu';

const DropdownUser = () => {
  const { data: session } = authclient.useSession();
  const { signOut } = authclient;
  const initials = (session?.user.name ?? '').slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-muted"
        >
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-primary-foreground shadow-sm ring-2 ring-background">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
          </span>
          <div className="hidden flex-col items-start md:flex">
            <span className="text-sm font-semibold text-foreground">{session?.user.name}</span>
            <span className="text-xs text-muted-foreground">Administrateur</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-primary-foreground shadow-sm">
            {initials}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{session?.user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{session?.user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings" className="gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary">
              <Settings className="h-4 w-4" />
            </span>
            Paramètres
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/dashboard/abonnements" className="gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary">
              <CreditCard className="h-4 w-4" />
            </span>
            Mes abonnements
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-3 text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <LogOut className="h-4 w-4" />
          </span>
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownUser;
