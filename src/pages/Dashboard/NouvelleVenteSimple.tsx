import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import {
  Button, Group, NumberInput, Text, Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FaArrowLeft, FaRegCheckCircle } from "react-icons/fa";
import { VenteSimpleService } from "../../services/vente-simple.service";
import { CreateVenteSimpleDto } from "../../types/vente-simple.types";
import { PageHeader } from "../../components/ui";
import { Card, CardContent } from "../../components/shadcn/card";

const service = new VenteSimpleService();

const schema = yup.object({
  montant: yup.number().min(0.01, 'Montant invalide').required('Requis'),
  note: yup.string().max(500, 'Maximum 500 caractères').optional(),
});

type FormValues = yup.InferType<typeof schema>;

function NouvelleVenteSimple() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const montantRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    initialValues: { montant: 0, note: '' },
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
      form.setValues({ montant: 0, note: '' });
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
    createVente({ montant: values.montant, note: values.note || undefined });
  };

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

      <div className="mx-auto max-w-lg">
        <Card>
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
      </div>
    </div>
  );
}

export default NouvelleVenteSimple;
