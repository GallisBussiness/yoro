import pdfMake from 'pdfmake/build/pdfmake';
import { font } from '../vfs_fonts';
import { VenteSimple } from '../types/vente-simple.types';
import { formatN } from '../lib/helpers';
import { format, parseISO, isValid } from 'date-fns';

pdfMake.vfs = font;

// Guard : s'assurer qu'une valeur est un nombre fini, sinon 0
const safeNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// formatN safe — gère null/undefined/NaN
const safeFmt = (v: any): string => formatN(safeNum(v));

// Date safe — gère les dates invalides
const safeDate = (iso: string): Date => {
  try {
    const d = parseISO(iso);
    return isValid(d) ? d : new Date();
  } catch {
    return new Date();
  }
};

const COLOR = {
  primary: '#1E293B',
  accent: '#059669',
  muted: '#334155',
  border: '#94A3B8',
  text: '#0F172A',
  white: '#FFFFFF',
};

export const printVentesSimplesRecap = (
  ventes: VenteSimple[],
  from: Date,
  to: Date,
  param?: { nom?: string; tel?: string; desc?: string },
) => {
  if (!ventes || ventes.length === 0) {
    return;
  }

  // Filtrer les ventes avec des données valides
  const validVentes = ventes.filter((v) => v && v._id && v.date);

  if (validVentes.length === 0) {
    return;
  }

  const total = validVentes.reduce((sum, v) => sum + safeNum(v.montant), 0);
  const nbVentes = validVentes.length;

  // Regrouper par jour
  const parJour = new Map<string, { total: number; count: number }>();
  validVentes.forEach((v) => {
    const d = safeDate(v.date);
    const jourKey = format(d, 'dd/MM/yyyy');
    const existing = parJour.get(jourKey) ?? { total: 0, count: 0 };
    existing.total += safeNum(v.montant);
    existing.count += 1;
    parJour.set(jourKey, existing);
  });

  // Trier par date (safe)
  const sorted = [...validVentes].sort((a, b) => {
    const ta = safeDate(a.date).getTime();
    const tb = safeDate(b.date).getTime();
    return ta - tb;
  });

  const tableBody: any[][] = [
    [
      { text: 'Date', style: 'th' },
      { text: 'Reference', style: 'th' },
      { text: 'Note', style: 'th' },
      { text: 'Montant', style: 'thRight' },
    ],
    ...sorted.map((v) => [
      { text: format(safeDate(v.date), 'dd/MM/yyyy HH:mm'), style: 'td' },
      { text: v.ref ?? '', style: 'tdCenter' },
      { text: v.note ?? '—', style: 'td' },
      { text: `${safeFmt(v.montant)} FCFA`, style: 'tdNum' },
    ]),
  ];

  // Dates safe pour le header/footer
  const fromDate = isValid(from) ? from : new Date();
  const toDate = isValid(to) ? to : new Date();
  const fromStr = format(fromDate, 'dd/MM/yyyy');
  const toStr = format(toDate, 'dd/MM/yyyy');

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR.border }] },
        {
          columns: [
            { text: param?.nom ?? '', fontSize: 7, color: COLOR.muted, alignment: 'left', margin: [0, 4, 0, 0] },
            { text: `Page ${currentPage} / ${pageCount}`, fontSize: 7, color: COLOR.muted, alignment: 'right', margin: [0, 4, 0, 0] },
          ],
        },
      ],
      margin: [40, 0, 40, 10],
    }),
    styles: {
      title: { fontSize: 18, bold: true, color: COLOR.accent },
      subtitle: { fontSize: 11, color: COLOR.muted },
      sectionLabel: { fontSize: 10, bold: true, color: COLOR.primary },
      th: { fontSize: 9, bold: true, color: COLOR.white, alignment: 'center' },
      thRight: { fontSize: 9, bold: true, color: COLOR.white, alignment: 'right' },
      td: { fontSize: 9, color: COLOR.text },
      tdCenter: { fontSize: 9, color: COLOR.text, alignment: 'center' },
      tdNum: { fontSize: 9, color: COLOR.text, alignment: 'right' },
      totalLabel: { fontSize: 11, color: COLOR.white, alignment: 'right', bold: true },
      totalValue: { fontSize: 11, color: COLOR.white, alignment: 'right', bold: true },
      recapLabel: { fontSize: 9, color: COLOR.muted, alignment: 'left' },
      recapValue: { fontSize: 9, color: COLOR.text, alignment: 'right', bold: true },
    },
    content: [
      // En-tête
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: param?.nom ?? 'Ventes Rapides', style: 'title' },
              { text: param?.desc ?? '', style: 'subtitle', margin: [0, 2, 0, 0] },
              { text: param?.tel ?? '', style: 'subtitle', margin: [0, 1, 0, 0] },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'RECAPITULATIF', fontSize: 16, bold: true, color: COLOR.primary },
              { text: `Du ${fromStr} au ${toStr}`, style: 'subtitle', margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: COLOR.accent }] },
      { canvas: [{ type: 'line', x1: 0, y1: 3, x2: 515, y2: 3, lineWidth: 0.5, lineColor: COLOR.border }] },

      // Résumé
      {
        margin: [0, 15, 0, 5],
        columns: [
          {
            width: '*',
            stack: [
              { text: 'SYNTHESE', style: 'sectionLabel', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: [120, 120],
                  layout: 'noBorders',
                  body: [
                    [{ text: 'Nombre de ventes', style: 'recapLabel' }, { text: String(nbVentes), style: 'recapValue' }],
                    [{ text: 'Periode', style: 'recapLabel' }, { text: `${fromStr} - ${toStr}`, style: 'recapValue' }],
                  ],
                },
              },
            ],
          },
          {
            width: 'auto',
            stack: [
              {
                margin: [0, 0, 0, 0],
                table: {
                  widths: [120, 120],
                  body: [
                    [
                      { text: 'TOTAL GENERAL', style: 'totalLabel', fillColor: COLOR.accent },
                      { text: `${safeFmt(total)} FCFA`, style: 'totalValue', fillColor: COLOR.accent },
                    ],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
        ],
      },

      // Table des ventes
      {
        margin: [0, 10, 0, 0],
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? COLOR.primary : null),
          hLineColor: () => COLOR.border,
          vLineColor: () => COLOR.border,
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        table: {
          widths: [90, 75, 210, 125],
          headerRow: 1,
          body: tableBody,
        },
      },

      // Récap par jour
      {
        margin: [0, 15, 0, 0],
        stack: [
          { text: 'RECAPITULATIF PAR JOUR', style: 'sectionLabel', margin: [0, 0, 0, 5] },
          {
            layout: {
              hLineColor: () => COLOR.border,
              vLineWidth: () => 0,
              hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
            table: {
              widths: [200, 150, 150],
              body: [
                [
                  { text: 'Jour', fontSize: 9, bold: true, color: COLOR.primary },
                  { text: 'Nb ventes', fontSize: 9, bold: true, color: COLOR.primary, alignment: 'center' },
                  { text: 'Total', fontSize: 9, bold: true, color: COLOR.primary, alignment: 'right' },
                ],
                ...Array.from(parJour.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([jour, data]) => [
                    { text: jour, fontSize: 9, color: COLOR.text },
                    { text: String(data.count), fontSize: 9, color: COLOR.text, alignment: 'center' },
                    { text: `${safeFmt(data.total)} FCFA`, fontSize: 9, color: COLOR.text, alignment: 'right', bold: true },
                  ]),
                [
                  { text: 'TOTAL', fontSize: 10, bold: true, color: COLOR.white, fillColor: COLOR.accent },
                  { text: String(nbVentes), fontSize: 10, bold: true, color: COLOR.white, fillColor: COLOR.accent, alignment: 'center' },
                  { text: `${safeFmt(total)} FCFA`, fontSize: 10, bold: true, color: COLOR.white, fillColor: COLOR.accent, alignment: 'right' },
                ],
              ],
            },
          },
        ],
      },
    ],
  };

  pdfMake.createPdf(docDefinition).open();
};
