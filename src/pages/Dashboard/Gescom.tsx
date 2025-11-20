import React from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import { Outlet } from 'react-router-dom';

/**
 * Composant principal du dashboard
 * La protection de route est gérée par ProtectedRoute dans App.tsx
 */
const GesCom: React.FC = () => {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
};

export default GesCom;
