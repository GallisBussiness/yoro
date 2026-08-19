import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import {
  Badge, Button, Group, LoadingOverlay, Modal,
  NumberInput, Text, Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { toast } from 'sonner';
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FaArrowLeft, FaEdit, FaTrash, FaRegCheckCircle, FaLock } from "react-icons/fa";
import { VenteSimpleService } from "../../services/vente-simple.service";
import { VenteSimple } from "../../types/vente-simple.types";
import { useIsVenteDuJour } from "../../hooks/useIsVenteDuJour";
import { PageHeader, Money } from "../../components/ui";
import { Card, CardContent } from "../../components/shadcn/card";

const service = new VenteSimpleService();

const schema = yup.object({
  montant: yup.number().min(0.01, 'Montant invalide').required('Requis'),
  note: yup.string().max(500, 'Maximum 500 caractères').optional(),
});

type FormValues = yup.InferType<typeof schema>;

function VenteSimplePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const { data: vente, isLoading } = useQuery<VenteSimple>({
    queryKey: ['vente-simple', id],
    queryFn: () => service.getOne(id!),
    enabled: !!id,
  });

  const duJour = useIsVenteDuJour(vente?.date ?? '');

  const form = useForm<FormValues>({
    initialValues: { montant: 0, note: '' },
    validate: yupResolver(schema),
  });

  const { mutate: updateVente, isPending: loadingUpdate } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { montant?: number; note?: string } }) =>
      service.updateVente(id, data),
    onSuccess: () => {
      toast.success('Vente rapide modifiée');
      qc.invalidateQueries({ queryKey: ['vente-simple'] });
      qc.invalidateQueries({ queryKey: ['vente-simple', id] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-jour'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-semaine'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-mois'] });
      close();
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("Seules les ventes du jour courant peuvent être modifiées.");
      } else {
        toast.error("Erreur lors de la modification");
      }
    },
  });

  const { mutate: deleteVente, isPending: loadingDelete } = useMutation({
    mutationFn: () => service.delete(id!),
    onSuccess: () => {
      toast.success('Vente rapide supprimée');
      qc.invalidateQueries({ queryKey: ['vente-simple'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-jour'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-semaine'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-mois'] });
      navigate('/dashboard/ventes-simples');
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("Seules les ventes du jour courant peuvent être supprimées.");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    },
  });

  const openEdit = () => {
    if (!vente) return;
    form.setValues({ montant: vente.montant, note: vente.note ?? '' });
    open();
  };

  const onSubmit = (values: FormValues) => {
    if (!id) return;
    updateVente({ id, data: { montant: values.montant, note: values.note || undefined } });
  };

  if (isLoading || !vente) {
    return (
      <div className="relative min-h-[400px]">
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'brand', type: 'dots' }} />
      </div>
    );
  }

  return (
    <div className="relative">
      <LoadingOverlay visible={loadingUpdate || loadingDelete} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'brand', type: 'dots' }} />

      <PageHeader
        title="Détail de la vente rapide"
        subtitle={`Référence ${vente.ref}`}
        actions={
          <Button variant="subtle" leftSection={<FaArrowLeft />} onClick={() => navigate('/dashboard/ventes-simples')}>
            Retour
          </Button>
        }
      />

      <div className="mx-auto max-w-2xl space-y-4">
        {/* Statut verrouillage */}
        {!duJour && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <FaLock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <Text fw={600} size="sm" className="text-amber-700 dark:text-amber-400">Vente verrouillée</Text>
                <Text size="xs" className="text-muted-foreground">
                  Seules les ventes du jour courant peuvent être modifiées ou supprimées.
                </Text>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carte détail */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <Badge color="brand" variant="light" size="lg">{vente.ref}</Badge>
              {duJour ? (
                <Badge color="emerald" variant="light" size="sm">Modifiable</Badge>
              ) : (
                <Badge color="gray" variant="light" size="sm">Verrouillée</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Text size="xs" className="uppercase tracking-wide text-muted-foreground">Date</Text>
                <Text size="sm" className="mt-1 font-medium text-foreground capitalize">
                  {format(parseISO(vente.date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                </Text>
              </div>
              <div>
                <Text size="xs" className="uppercase tracking-wide text-muted-foreground">Montant</Text>
                <Text className="num mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  <Money value={vente.montant} />
                </Text>
              </div>
            </div>

            {vente.note && (
              <div>
                <Text size="xs" className="uppercase tracking-wide text-muted-foreground">Note</Text>
                <Text size="sm" className="mt-1 text-foreground leading-relaxed">{vente.note}</Text>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Text size="xs" className="uppercase tracking-wide text-muted-foreground">Créée le</Text>
                <Text size="xs" className="mt-1 text-muted-foreground">
                  {format(parseISO(vente.createdAt), 'dd/MM/yyyy à HH:mm')}
                </Text>
              </div>
              <div>
                <Text size="xs" className="uppercase tracking-wide text-muted-foreground">Modifiée le</Text>
                <Text size="xs" className="mt-1 text-muted-foreground">
                  {format(parseISO(vente.updatedAt), 'dd/MM/yyyy à HH:mm')}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {duJour && (
          <div className="flex gap-3">
            <Button variant="outline" leftSection={<FaEdit />} onClick={openEdit} className="flex-1">
              Modifier
            </Button>
            <Button variant="filled" color="red" leftSection={<FaTrash />} onClick={() => deleteVente()} className="flex-1">
              Supprimer
            </Button>
          </div>
        )}
      </div>

      {/* Modal édition */}
      <Modal opened={opened} onClose={close} title="Modifier la vente rapide" centered size="md">
        <form onSubmit={form.onSubmit(onSubmit)} className="space-y-4">
          <NumberInput
            label="Montant (FCFA)"
            placeholder="Entrez le montant"
            min={0.01}
            rightSection={<Text size="xs" className="text-muted-foreground pr-2">FCFA</Text>}
            rightSectionWidth={60}
            {...form.getInputProps('montant')}
          />
          <Textarea
            label="Note (optionnelle)"
            placeholder="Note associée à la vente..."
            maxLength={500}
            autosize
            minRows={2}
            {...form.getInputProps('note')}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={close}>Annuler</Button>
            <Button type="submit" color="brand" loading={loadingUpdate} leftSection={<FaRegCheckCircle />}>
              Enregistrer
            </Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}

export default VenteSimplePage;
