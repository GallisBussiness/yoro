import pdfMake from 'pdfmake/build/pdfmake';
import { font } from '../vfs_fonts';
import { VenteCaisse } from '../types/vente-caisse';
import { formatN } from '../lib/helpers';
import { format } from 'date-fns';

// Utiliser les fonts personnalisées du projet (supporte les caractères accentues et espaces standards)
pdfMake.vfs = font;

// Guard : s'assurer qu'une valeur est un nombre fini, sinon 0
const safeNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// formatN safe — gère null/undefined/NaN
const safeFmt = (v: any): string => formatN(safeNum(v));

// Palette GesCom
const COLOR = {
  primary: '#1E293B',   // slate-800 — plus fonce pour les titres
  accent: '#059669',    // emerald-600
  muted: '#334155',     // slate-700 — labels fonces (etait #64748B trop clair)
  border: '#94A3B8',    // slate-400 — bordures plus visibles (etait #E2E8F0)
  bgLight: '#F1F5F9',
  text: '#0F172A',      // slate-900 — presque noir
  white: '#FFFFFF',
};

// Largeur du ticket 58mm en points (1mm = 2.83465 points)
const TICKET_WIDTH = 58 * 2.83465; // ~164 points
const CONTENT_WIDTH = TICKET_WIDTH - 10; // moins les marges

interface TicketConfig {
  nomBoutique?: string;
  adresse?: string;
  telephone?: string;
}

const defaultConfig: TicketConfig = {
  nomBoutique: 'VOTRE BOUTIQUE',
  adresse: 'Adresse de la boutique',
  telephone: '+XXX XX XX XX XX'
};

export const generateTicketPdf = (vente: VenteCaisse, config: TicketConfig = defaultConfig) => {
  const { nomBoutique, adresse, telephone } = { ...defaultConfig, ...config };

  // Construire les lignes de produits
  const produitsRows = vente.produits?.map((prod) => ([
    { text: prod.nom, fontSize: 7.5, color: COLOR.text, margin: [0, 1, 0, 1] },
    { text: safeFmt(prod.quantite), fontSize: 7.5, color: COLOR.muted, alignment: 'center', margin: [0, 1, 0, 1] },
    { text: safeFmt(prod.prixUnitaire), fontSize: 7.5, color: COLOR.muted, alignment: 'right', margin: [0, 1, 0, 1] },
    { text: safeFmt(prod.montant), fontSize: 7.5, color: COLOR.text, bold: true, alignment: 'right', margin: [0, 1, 0, 1] },
  ])) || [];

  const docDefinition: any = {
    pageSize: {
      width: TICKET_WIDTH,
      height: 'auto'
    },
    pageMargins: [5, 8, 5, 8],
    content: [
      // ====== EN-TETE : nom de la boutique ======
      {
        text: nomBoutique?.toUpperCase() ?? '',
        fontSize: 11,
        bold: true,
        color: COLOR.primary,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
      {
        text: adresse ?? '',
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center',
        margin: [0, 0, 0, 1]
      },
      {
        text: `Tel: ${telephone ?? ''}`,
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center',
        margin: [0, 0, 0, 4]
      },

      // Ligne accent (emerald)
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: COLOR.accent }] },
      { canvas: [{ type: 'line', x1: 0, y1: 2, x2: CONTENT_WIDTH, y2: 2, lineWidth: 0.3, lineColor: COLOR.border }] },

      // ====== INFOS VENTE ======
      {
        columns: [
          { text: 'Date', fontSize: 7, color: COLOR.muted, width: 'auto' },
          { text: format(new Date(vente.date), 'dd/MM/yyyy HH:mm'), fontSize: 7, color: COLOR.text, bold: true, alignment: 'right' }
        ],
        margin: [0, 4, 0, 1]
      },
      ...(vente.numero ? [{
        columns: [
          { text: 'Ticket No', fontSize: 7, color: COLOR.muted, width: 'auto' },
          { text: vente.numero, fontSize: 7, color: COLOR.text, bold: true, alignment: 'right' }
        ],
        margin: [0, 1, 0, 1]
      }] : []),
      {
        columns: [
          { text: 'Articles', fontSize: 7, color: COLOR.muted, width: 'auto' },
          { text: formatN(vente.produits?.length ?? 0), fontSize: 7, color: COLOR.text, bold: true, alignment: 'right' }
        ],
        margin: [0, 1, 0, 3]
      },

      // Ligne de separation
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, dash: { length: 2 }, lineWidth: 0.5, lineColor: COLOR.border }] },

      // ====== EN-TETE TABLE PRODUITS ======
      {
        columns: [
          { text: 'ARTICLE', fontSize: 6.5, bold: true, color: COLOR.muted, width: '*' },
          { text: 'QTE', fontSize: 6.5, bold: true, color: COLOR.muted, width: 22, alignment: 'center' },
          { text: 'PU', fontSize: 6.5, bold: true, color: COLOR.muted, width: 30, alignment: 'right' },
          { text: 'TOTAL', fontSize: 6.5, bold: true, color: COLOR.muted, width: 35, alignment: 'right' },
        ],
        margin: [0, 3, 0, 2]
      },

      // ====== LIGNES PRODUITS ======
      ...produitsRows.map((row) => ({
        columns: [
          { ...row[0], width: '*' },
          { ...row[1], width: 22 },
          { ...row[2], width: 30 },
          { ...row[3], width: 35 },
        ]
      })),

      // Ligne de separation
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, dash: { length: 2 }, lineWidth: 0.5, lineColor: COLOR.border }], margin: [0, 4, 0, 4] },

      // ====== TOTAL ======
      {
        columns: [
          { text: 'TOTAL', fontSize: 13, bold: true, color: COLOR.primary, width: '*' },
          { text: `${safeFmt(vente.montantTotal)}`, fontSize: 13, bold: true, color: COLOR.accent, alignment: 'right' }
        ],
        margin: [0, 2, 0, 2]
      },
      {
        text: 'FCFA',
        fontSize: 8,
        color: COLOR.muted,
        alignment: 'right',
        margin: [0, 0, 0, 6]
      },

      // Ligne accent
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: COLOR.accent }] },

      // ====== PIED DE PAGE ======
      {
        text: 'Merci de votre visite',
        fontSize: 8,
        bold: true,
        color: COLOR.primary,
        alignment: 'center',
        margin: [0, 5, 0, 1]
      },
      {
        text: 'A bientot',
        fontSize: 7,
        color: COLOR.muted,
        alignment: 'center',
        margin: [0, 0, 0, 3]
      },
      {
        text: `${nomBoutique ?? ''} - ${telephone ?? ''}`,
        fontSize: 6,
        color: COLOR.muted,
        alignment: 'center',
        margin: [0, 0, 0, 0]
      },
    ],
    defaultStyle: {
      font: 'Roboto'
    }
  };

  return pdfMake.createPdf(docDefinition);
};

export const printTicket = (vente: VenteCaisse, config?: TicketConfig) => {
  const pdf = generateTicketPdf(vente, config);
  pdf.print();
};

export const downloadTicket = (vente: VenteCaisse, config?: TicketConfig) => {
  const pdf = generateTicketPdf(vente, config);
  const filename = `ticket_${vente.numero || format(new Date(vente.date), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.download(filename);
};

export const openTicketInNewTab = (vente: VenteCaisse, config?: TicketConfig) => {
  const pdf = generateTicketPdf(vente, config);
  pdf.open();
};
