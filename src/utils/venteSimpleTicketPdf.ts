import pdfMake from 'pdfmake/build/pdfmake';
import { font } from '../vfs_fonts';
import { VenteSimple, TotauxResultat } from '../types/vente-simple.types';
import { formatN } from '../lib/helpers';
import { format, parseISO, isValid } from 'date-fns';

// Utiliser les fonts personnalisées du projet (supporte les caractères accentues et espaces standards)
pdfMake.vfs = font;

// Guard : s'assurer qu'une valeur est un nombre fini, sinon 0
const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// formatN safe — gère null/undefined/NaN
const safeFmt = (v: unknown): string => formatN(safeNum(v));

// Date safe — retourne une date valide ou la date courante
const safeDate = (v: unknown): Date => {
  const d = parseISO(String(v ?? ''));
  return isValid(d) ? d : new Date();
};

// Palette GesCom (meme que ticketPdf)
const COLOR = {
  primary: '#1E293B',   // slate-800 — titres fonces
  accent: '#059669',    // emerald-600
  muted: '#334155',     // slate-700 — labels fonces
  border: '#94A3B8',    // slate-400 — bordures visibles
  text: '#0F172A',      // slate-900 — presque noir
};

// Largeur du ticket en points (1mm = 2.83465 points)
// Xprinter 58mm (XP-58IIH...) : 58mm ~164pt. Pour un modele 80mm, passer a 80.
const TICKET_WIDTH_MM = 58;
const TICKET_WIDTH = TICKET_WIDTH_MM * 2.83465; // ~164 points
const CONTENT_WIDTH = TICKET_WIDTH - 10; // moins les marges [5,5]

interface TicketBoutique {
  nom?: string;
  desc?: string;
  tel?: string;
  adresse?: string;
}

export const generateVenteSimpleTicketPdf = (vente: VenteSimple, boutique: TicketBoutique = {}) => {
  const nomBoutique = boutique?.nom ?? 'VOTRE BOUTIQUE';
  const descBoutique = boutique?.desc ?? boutique?.adresse ?? '';
  const telBoutique = boutique?.tel ?? '';
  const venteDate = safeDate(vente.date);

  const docDefinition: any = {
    pageSize: {
      width: TICKET_WIDTH,
      height: 'auto'
    },
    pageMargins: [5, 8, 5, 8],
    content: [
      // ====== EN-TETE : infos boutique ======
      {
        text: nomBoutique.toUpperCase(),
        fontSize: 11,
        bold: true,
        color: COLOR.primary,
        alignment: 'center',
        margin: [0, 0, 0, 3]
      },
      ...(descBoutique ? [{
        text: descBoutique,
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center' as const,
        margin: [0, 0, 0, 1]
      }] : []),
      ...(telBoutique ? [{
        text: `Tel: ${telBoutique}`,
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center' as const,
        margin: [0, 0, 0, 1]
      }] : []),

      // Ligne accent (emerald) + ligne fine
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: COLOR.accent }], margin: [0, 3, 0, 0] },
      { canvas: [{ type: 'line', x1: 0, y1: 2, x2: CONTENT_WIDTH, y2: 2, lineWidth: 0.3, lineColor: COLOR.border }] },

      // ====== INFOS VENTE ======
      {
        columns: [
          { text: 'Date', fontSize: 7, color: COLOR.muted, width: 'auto' },
          { text: format(venteDate, 'dd/MM/yyyy HH:mm'), fontSize: 7, color: COLOR.text, bold: true, alignment: 'right' }
        ],
        margin: [0, 4, 0, 1]
      },
      {
        columns: [
          { text: 'Ticket No', fontSize: 7, color: COLOR.muted, width: 'auto' },
          { text: vente.ref ?? '', fontSize: 7, color: COLOR.text, bold: true, alignment: 'right' }
        ],
        margin: [0, 1, 0, 1]
      },
      ...(vente.note ? [{
        columns: [
          { text: 'Note', fontSize: 7, color: COLOR.muted, width: 'auto' },
          { text: vente.note, fontSize: 7, color: COLOR.text, alignment: 'right' }
        ],
        margin: [0, 1, 0, 1]
      }] : []),

      // Ligne de separation
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, dash: { length: 2 }, lineWidth: 0.5, lineColor: COLOR.border }], margin: [0, 3, 0, 0] },

      // ====== MONTANT ======
      {
        text: 'MONTANT',
        fontSize: 7,
        bold: true,
        color: COLOR.muted,
        alignment: 'center',
        margin: [0, 6, 0, 2]
      },
      {
        text: `${safeFmt(vente.montant)} FCFA`,
        fontSize: 15,
        bold: true,
        color: COLOR.accent,
        alignment: 'center',
        margin: [0, 0, 0, 6]
      },

    ],
    defaultStyle: {
      font: 'Roboto'
    }
  };

  return pdfMake.createPdf(docDefinition);
};

export const printVenteSimpleTicket = (vente: VenteSimple, boutique?: TicketBoutique) => {
  const pdf = generateVenteSimpleTicketPdf(vente, boutique);
  pdf.print();
};

export const downloadVenteSimpleTicket = (vente: VenteSimple, boutique?: TicketBoutique) => {
  const pdf = generateVenteSimpleTicketPdf(vente, boutique);
  const filename = `ticket_${vente.ref || format(safeDate(vente.date), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.download(filename);
};

// ====== TICKET DE CAISSE : totaux jour / semaine / mois ======

export interface TotauxCaisse {
  jour?: TotauxResultat;
  semaine?: TotauxResultat;
  mois?: TotauxResultat;
}

// Libelle de la plage couverte (ex: "13/10/2026" ou "13/10 - 19/10/2026")
const rangeLabel = (t?: TotauxResultat): string => {
  if (!t?.from || !t?.to) return '';
  const fStr = format(safeDate(t.from), 'dd/MM/yyyy');
  const toStr = format(safeDate(t.to), 'dd/MM/yyyy');
  return fStr === toStr ? fStr : `${format(safeDate(t.from), 'dd/MM')} - ${toStr}`;
};

export const generateVentesSimplesTotauxTicketPdf = (totaux: TotauxCaisse, boutique: TicketBoutique = {}) => {
  const nomBoutique = boutique?.nom ?? 'VOTRE BOUTIQUE';
  const descBoutique = boutique?.desc ?? boutique?.adresse ?? '';
  const telBoutique = boutique?.tel ?? '';

  const blocPeriode = (titre: string, t?: TotauxResultat): any[] => [
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, dash: { length: 2 }, lineWidth: 0.5, lineColor: COLOR.border }],
      margin: [0, 5, 0, 0]
    },
    { text: titre, fontSize: 8, bold: true, color: COLOR.primary, margin: [0, 3, 0, 0] },
    ...(rangeLabel(t) ? [{ text: rangeLabel(t), fontSize: 6, color: COLOR.muted, margin: [0, 0, 0, 2] }] : []),
    {
      columns: [
        { text: 'Nb ventes', fontSize: 7, color: COLOR.muted, width: 'auto' },
        { text: String(t?.count ?? 0), fontSize: 7, bold: true, color: COLOR.text, alignment: 'right' }
      ],
      margin: [0, 1, 0, 1]
    },
    {
      columns: [
        { text: 'Total', fontSize: 8, bold: true, color: COLOR.muted, width: 'auto' },
        { text: `${safeFmt(t?.total)} FCFA`, fontSize: 9, bold: true, color: COLOR.accent, alignment: 'right' }
      ],
      margin: [0, 0, 0, 2]
    },
  ];

  const docDefinition: any = {
    pageSize: {
      width: TICKET_WIDTH,
      height: 'auto'
    },
    pageMargins: [5, 8, 5, 8],
    content: [
      // ====== EN-TETE : infos boutique ======
      {
        text: nomBoutique.toUpperCase(),
        fontSize: 11,
        bold: true,
        color: COLOR.primary,
        alignment: 'center',
        margin: [0, 0, 0, 3]
      },
      ...(descBoutique ? [{
        text: descBoutique,
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center' as const,
        margin: [0, 0, 0, 1]
      }] : []),
      ...(telBoutique ? [{
        text: `Tel: ${telBoutique}`,
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center' as const,
        margin: [0, 0, 0, 1]
      }] : []),

      // Ligne accent (emerald) + ligne fine
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: COLOR.accent }], margin: [0, 3, 0, 0] },
      { canvas: [{ type: 'line', x1: 0, y1: 2, x2: CONTENT_WIDTH, y2: 2, lineWidth: 0.3, lineColor: COLOR.border }] },

      // ====== TITRE ======
      {
        text: 'TICKET DE CAISSE',
        fontSize: 9,
        bold: true,
        color: COLOR.text,
        alignment: 'center',
        margin: [0, 5, 0, 1]
      },
      {
        text: 'Ventes rapides — synthese des totaux',
        fontSize: 6,
        color: COLOR.muted,
        alignment: 'center',
        margin: [0, 0, 0, 1]
      },
      {
        text: `Edite le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        fontSize: 6,
        color: COLOR.muted,
        alignment: 'center'
      },

      // ====== TOTAUX ======
      ...blocPeriode("AUJOURD'HUI", totaux.jour),
      ...blocPeriode('CETTE SEMAINE', totaux.semaine),
      ...blocPeriode('CE MOIS', totaux.mois),

      // ====== PIED ======
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1, lineColor: COLOR.primary }], margin: [0, 4, 0, 0] },
      { text: '*** Fin du ticket ***', fontSize: 7, color: COLOR.muted, alignment: 'center', margin: [0, 4, 0, 0] },
    ],
    defaultStyle: {
      font: 'Roboto'
    }
  };

  return pdfMake.createPdf(docDefinition);
};

export const printVentesSimplesTotauxTicket = (totaux: TotauxCaisse, boutique?: TicketBoutique) => {
  const pdf = generateVentesSimplesTotauxTicketPdf(totaux, boutique);
  pdf.print();
};

export const downloadVentesSimplesTotauxTicket = (totaux: TotauxCaisse, boutique?: TicketBoutique) => {
  const pdf = generateVentesSimplesTotauxTicketPdf(totaux, boutique);
  pdf.download(`ticket_caisse_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
};
