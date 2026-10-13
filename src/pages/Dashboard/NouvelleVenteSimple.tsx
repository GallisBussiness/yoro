import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import {
  ActionIcon, Button, Group, NumberInput, Text, Textarea, Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { FaArrowLeft, FaHistory, FaReceipt, FaRegCheckCircle } from "react-icons/fa";
import { VenteSimpleService } from "../../services/vente-simple.service";
import { ParamService } from "../../services/paramservice";
import { CreateVenteSimpleDto, VenteSimple } from "../../types/vente-simple.types";
import { authclient } from "../../../lib/auth-client";
import { Money, PageHeader } from "../../components/ui";
import { Card, CardContent } from "../../components/shadcn/card";
import { printVenteSimpleTicket } from "../../utils/venteSimpleTicketPdf";

const service = new VenteSimpleService();

const schema = yup.object({
  montant: yup.number().typeError('Requis').min(0.01, 'Montant invalide').required('Requis'),
  note: yup.string().max(500, 'Maximum 500 caractères').optional(),
});

interface FormValues {
  montant: number | string;
  note: string;
}

function NouvelleVenteSimple() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const montantRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    initialValues: { montant: '', note: '' },
    validate: yupResolver(schema),
  });

  const { mutate: createVente, isPending: loadingCreate } = useMutation({
    mutationFn: (data: CreateVenteSimpleDto) => service.createVente(data),
    onSuccess: () => {
      toast.success('Vente rapide enregistrée');
      qc.invalidateQueries({ queryKey: ['vente-simple'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-jour'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-semaine'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-mois'] });
      // Réinitialiser le formulaire et garder l'utilisateur sur la page
      form.reset();
      form.setValues({ montant: '', note: '' });
      // Mettre le focus sur le champ montant pour enchaîner les saisies
      setTimeout(() => {
        montantRef.current?.focus();
        montantRef.current?.select();
      }, 50);
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("Action non autorisée.");
      } else {
        toast.error("Erreur lors de'enregistrement");
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    createVente({ montant: Number(values.montant), note: values.note || undefined });
  };

  const { data: ventes, isLoading: loadingVentes } = useQuery<VenteSimple[]>({
    queryKey: ['vente-simple'],
    queryFn: () => service.getAll(),
  });

  const { data: session } = authclient.useSession();
  const paramService = new ParamService();
  const { data: param } = useQuery({
    queryKey: ['param', session?.user.id],
    queryFn: () => paramService.getByUser(session!.user.id),
    enabled: !!session,
  });

  const dernieresVentes = (ventes ?? [])
    .slice()
    .sort((a, b) => {
      const da = parseISO(a.createdAt || a.date);
      const db = parseISO(b.createdAt || b.date);
      return (isValid(db) ? db.getTime() : 0) - (isValid(da) ? da.getTime() : 0);
    })
    .slice(0, 8);

  return (
    <div className="relative">
      <PageHeader
        title="Nouvelle Vente Rapide"
        subtitle="Enregistrez une vente avec juste un montant"
        actions={
          <Button variant="subtle" leftSection={<FaArrowLeft />} onClick={() => navigate('/dashboard/ventes-simples')}>
            Retour à la liste
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 h-fit gc-fade-up">
          <CardContent className="p-6">
            <form onSubmit={form.onSubmit(onSubmit)} className="space-y-5">
              {/* Info date */}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
                <FaRegCheckCircle className="text-emerald-500 shrink-0" />
                <Text size="sm" className="text-muted-foreground">
                  Date effective : <span className="font-semibold text-foreground capitalize">
                    {format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}
                  </span> (aujourd'hui, forcée par le système)
                </Text>
              </div>

              <NumberInput
                ref={montantRef}
                label="Montant (FCFA)"
                description="Le montant de la vente rapide"
                placeholder="Entrez le montant"
                min={0.01}
                size="md"
                rightSection={<Text size="xs" className="text-muted-foreground pr-2">FCFA</Text>}
                rightSectionWidth={60}
                {...form.getInputProps('montant')}
              />

              <Textarea
                label="Note (optionnelle)"
                description="Une note descriptive associée à cette vente"
                placeholder="Ex: Vente comptoir, client de passage..."
                maxLength={500}
                autosize
                minRows={3}
                size="md"
                {...form.getInputProps('note')}
              />

              <Group justify="flex-end" gap="sm" className="pt-2">
                <Button type="submit" color="brand" loading={loadingCreate} leftSection={<FaRegCheckCircle />}>
                  Enregistrer et saisir une autre vente
                </Button>
              </Group>
            </form>
          </CardContent>
        </Card>

        {/* Dernières ventes rapides */}
        <Card className="lg:col-span-2 h-fit gc-fade-up">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <FaHistory className="text-muted-foreground" size={14} />
                <Text fw={600} size="sm">Dernières ventes</Text>
              </div>
              <Button variant="subtle" size="compact-sm" onClick={() => navigate('/dashboard/ventes-simples')}>
                Voir tout
              </Button>
            </div>

            {loadingVentes ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : dernieresVentes.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Text size="sm" className="text-muted-foreground">Aucune vente enregistrée</Text>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {dernieresVentes.map((v) => {
                  const d = parseISO(v.date);
                  return (
                    <li key={v._id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="num text-xs font-medium text-foreground">{v.ref}</span>
                          <span className="text-xs text-muted-foreground">
                            {isValid(d) ? format(d, 'dd/MM HH:mm') : '—'}
                          </span>
                        </div>
                        {v.note && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-[220px]">{v.note}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Money value={v.montant} className="text-sm font-semibold" tone="pos" />
                        <Tooltip label="Imprimer le ticket" position="top" withArrow>
                          <ActionIcon variant="subtle" color="teal" size="sm" onClick={() => printVenteSimpleTicket(v, param)} className="transition-colors">
                            <FaReceipt size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NouvelleVenteSimple;
