import React, { useEffect} from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import { Outlet} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Center, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { checkSubscription } from '../../services/authservice';
import { authclient } from '../../../lib/auth-client';

const GesCom: React.FC = () => {
  const navigate = useNavigate();
 

  // const { data: subscriptionData, isLoading: checkingSubscription  } = useQuery({
  //   queryKey: ['subscription', session?.user.id],
  //   queryFn: () => checkSubscription(),
  //   enabled: !!session,
  // });

  // // console.log(subscriptionData, session);

  // useEffect(() => {
  //   if (session && subscriptionData?.subscription == null && !subscriptionData?.hasActiveSubscription) {
  //     // Rediriger vers la page d'abonnement si aucun abonnement actif
  //     if (window.location.pathname !== '/subscription') {
  //       navigate('/subscription', { replace: true });
  //     }
  //   }
  // },[session, subscriptionData, navigate]);


  // if (checkingSubscription) {
  //   return (
  //     <Center style={{ height: '100vh' }}>
  //       <Loader size="xl" />
  //     </Center>
  //   );
  // }

  return (
    <>
    <DefaultLayout>
     <Outlet />
    </DefaultLayout>
    </>
  );
};

export default GesCom;
