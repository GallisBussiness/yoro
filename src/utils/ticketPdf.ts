import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { VenteCaisse } from '../types/vente-caisse';
import dayjs from 'dayjs';

// Initialiser les polices
pdfMake.vfs = pdfFonts.vfs;

// Largeur du ticket 58mm en points (1mm = 2.83465 points)
const TICKET_WIDTH = 58 * 2.83465; // ~164 points

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
  const produitsTable = vente.produits?.map(prod => ([
    { text: prod.nom, fontSize: 8, margin: [0, 2, 0, 2] },
    { text: `${prod.quantite}`, fontSize: 8, alignment: 'center', margin: [0, 2, 0, 2] },
    { text: `${prod.montant?.toLocaleString()}`, fontSize: 8, alignment: 'right', margin: [0, 2, 0, 2] }
  ])) || [];

  const docDefinition: any = {
    pageSize: {
      width: TICKET_WIDTH,
      height: 'auto'
    },
    pageMargins: [5, 10, 5, 10],
    content: [
      // En-tête
      {
        text: nomBoutique,
        fontSize: 12,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 2]
      },
      {
        text: adresse,
        fontSize: 8,
        alignment: 'center',
        margin: [0, 0, 0, 1]
      },
      {
        text: `Tél: ${telephone}`,
        fontSize: 8,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      // Ligne de séparation
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: TICKET_WIDTH - 10, y2: 0, dash: { length: 3 }, lineWidth: 0.5 }],
        margin: [0, 3, 0, 3]
      },
      // Informations de la vente
      {
        columns: [
          { text: 'Date:', fontSize: 8, width: 'auto' },
          { text: dayjs(vente.date).format('DD/MM/YYYY HH:mm'), fontSize: 8, alignment: 'right' }
        ],
        margin: [0, 2, 0, 1]
      },
      ...(vente.numero ? [{
        columns: [
          { text: 'N°:', fontSize: 8, width: 'auto' },
          { text: vente.numero, fontSize: 8, alignment: 'right' }
        ],
        margin: [0, 1, 0, 2]
      }] : []),
      // Ligne de séparation
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: TICKET_WIDTH - 10, y2: 0, dash: { length: 3 }, lineWidth: 0.5 }],
        margin: [0, 3, 0, 3]
      },
      // En-tête du tableau
      {
        columns: [
          { text: 'Article', fontSize: 8, bold: true, width: '*' },
          { text: 'Qté', fontSize: 8, bold: true, width: 25, alignment: 'center' },
          { text: 'Prix', fontSize: 8, bold: true, width: 40, alignment: 'right' }
        ],
        margin: [0, 2, 0, 3]
      },
      // Liste des produits
      ...produitsTable.map(row => ({
        columns: [
          { ...row[0], width: '*' },
          { ...row[1], width: 25 },
          { ...row[2], width: 40 }
        ]
      })),
      // Ligne de séparation
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: TICKET_WIDTH - 10, y2: 0, dash: { length: 3 }, lineWidth: 0.5 }],
        margin: [0, 5, 0, 5]
      },
      // Total
      {
        columns: [
          { text: 'TOTAL:', fontSize: 12, bold: true, width: '*' },
          { text: `${vente.montantTotal?.toLocaleString()} FCFA`, fontSize: 12, bold: true, alignment: 'right' }
        ],
        margin: [0, 3, 0, 5]
      },
      // Ligne de séparation
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: TICKET_WIDTH - 10, y2: 0, dash: { length: 3 }, lineWidth: 0.5 }],
        margin: [0, 3, 0, 5]
      },
      // Pied de page
      {
        text: 'Merci de votre visite!',
        fontSize: 9,
        alignment: 'center',
        margin: [0, 3, 0, 1]
      },
      {
        text: 'À bientôt',
        fontSize: 9,
        alignment: 'center',
        margin: [0, 1, 0, 5]
      }
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
  const filename = `ticket_${vente.numero || dayjs(vente.date).format('YYYYMMDD_HHmmss')}.pdf`;
  pdf.download(filename);
};

export const openTicketInNewTab = (vente: VenteCaisse, config?: TicketConfig) => {
  const pdf = generateTicketPdf(vente, config);
  pdf.open();
};
