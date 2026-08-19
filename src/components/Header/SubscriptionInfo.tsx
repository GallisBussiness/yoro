import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentService } from '../../services/payment.service';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../shadcn/tooltip';
import { Clock, CheckCircle2 } from 'lucide-react';
import { authclient } from '../../../lib/auth-client';
import { useNavigate } from 'react-router-dom';

interface SubscriptionData {
  pack: { _id: string; nom: string; description: string };
  daysRemaining: number;
  expirationDate: string | null;
}

const SubscriptionInfo = () => {
  const navigate = useNavigate();
  const { data: session } = authclient.useSession();

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  const { data: activeSubscription, isLoading } = useQuery({
    queryKey: ['activeSubscription', session?.user.id],
    queryFn: () => new PaymentService().getByUser(),
    enabled: !!session,
  });

  useEffect(() => {
    if (activeSubscription) {
      if (activeSubscription.subscription) {
        const endDate = new Date(activeSubscription?.subscription?.date_fin);
        const today = new Date();
        const timeDiff = endDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        setSubscriptionData({
          pack: activeSubscription?.subscription?.pack,
          daysRemaining,
          expirationDate: new Date(activeSubscription?.subscription?.date_fin).toLocaleDateString(),
        });
      }
    } else {
      navigate('/subscription');
    }
  }, [activeSubscription]);

  if (isLoading || !subscriptionData) {
    return null;
  }

  const days = subscriptionData?.daysRemaining;
  const daysColor = days <= 5 ? 'text-destructive' : days <= 15 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex cursor-default items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{subscriptionData?.pack.nom}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className={`text-xs font-medium ${daysColor}`}>
                  {days} jour{days > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">Expire le {subscriptionData?.expirationDate}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SubscriptionInfo;
