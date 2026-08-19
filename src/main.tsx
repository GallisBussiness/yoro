import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import '@mantine/core/styles.css';
import 'mantine-datatable/styles.css';
import '@mantine/dropzone/styles.css';
import './css/style.css';
import '@mantine/dates/styles.css';
import { fr } from 'date-fns/locale';
import 'dayjs/locale/fr';
import { Toaster, toast } from 'sonner';

setDefaultOptions({ locale: fr })

import { createTheme, MantineProvider } from '@mantine/core';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatesProvider } from '@mantine/dates';
import { setDefaultOptions } from 'date-fns';

const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: 8,
  fontFamily: 'Fira Sans, ui-sans-serif, system-ui, sans-serif',
  headings: {
    fontFamily: 'Fira Sans, ui-sans-serif, system-ui, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.75rem', lineHeight: '2.15rem' },
      h2: { fontSize: '1.5rem', lineHeight: '1.9rem' },
      h3: { fontSize: '1.25rem', lineHeight: '1.65rem' },
    },
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  },
  spacing: { xs: '0.375rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
  colors: {
    // Slate "brand" — primary actions, rings, focus
    brand: [
      '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B',
      '#475569', '#334155', '#1E293B', '#0F172A', '#020617',
    ],
    // Green "accent" — CTA, positive/inbound/paid
    accent: [
      '#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399',
      '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
    ],
    // Semantic statuses
    pos: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
    neg: ['#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
    warn: ['#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F'],
    info: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
  },
  components: {
    Button: {
      defaultProps: { radius: 8, size: 'sm' },
    },
    Card: {
      defaultProps: { radius: 12, padding: 'md', withBorder: true },
    },
    TextInput: {
      defaultProps: { radius: 8, size: 'sm' },
    },
    Select: {
      defaultProps: { radius: 8, size: 'sm' },
    },
    Modal: {
      defaultProps: { radius: 12, centered: true },
    },
    Tooltip: {
      defaultProps: { withArrow: true, offset: 6 },
    },
    Badge: {
      defaultProps: { radius: 6, size: 'md' },
    },
  },
});
function getSuccessMessage() {
  return "Opération réussie : la requête a été traitée avec succès.";
}

function getErrorMessage(statusCode: number) {
  switch (statusCode) {
    case 400:
      return "Erreur de requête : la syntaxe de la requête est incorrecte.";
    case 401:
      return "Erreur d'authentification : vous n'avez pas les droits d'accès.";
    case 403:
      return "Accès refusé : vous n'avez pas la permission d'accéder à cette ressource.";
    case 404:
      return "Erreur 404 : la page demandée n'a pas été trouvée.";
    case 500:
      return "Erreur interne du serveur : une erreur inattendue est survenue.";
    case 502:
      return "Erreur de passerelle : le serveur a reçu une réponse invalide.";
    case 503:
      return "Service indisponible : le serveur est actuellement en maintenance.";
    default:
      return "Erreur inconnue : veuillez réessayer plus tard.";
  }
}
const queryClient = new QueryClient(
  {
    mutationCache: new MutationCache({
      onSuccess:()=> {
        toast.success(getSuccessMessage())
      },
      onError: (error: any) => {
        if(error?.response?.data?.statusCode){
          toast.error(getErrorMessage(error.response.data.statusCode))
        } else {
          toast.error(getErrorMessage(error))
        }
      }
    }),
    queryCache: new QueryCache({
      onError: (error: any) => {
        if(error?.response?.data?.statusCode){
          toast.error(getErrorMessage(error.response.data.statusCode))
        } else {
          toast.error(getErrorMessage(error))
        }
      }
    })
  }
)


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
    <Toaster />
    <DatesProvider settings={{ locale: 'fr' }}>
      <QueryClientProvider client={queryClient}>
       <Router future={{
    v7_relativeSplatPath: true,
    v7_startTransition: true
  }}>
           <App />
    </Router>
    </QueryClientProvider>
    </DatesProvider>
   
    </MantineProvider>
   
  </React.StrictMode>,
);
