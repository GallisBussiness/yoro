import { format } from "date-fns";
import { formatN } from "../../lib/helpers";
import pdfMake from "pdfmake/build/pdfmake";
import { font } from "../../vfs_fonts";
pdfMake.vfs = font;

// Palette GesCom (cohérente avec le design system)
const COLOR = {
  primary: '#334155',      // slate-700
  primaryDark: '#1E293B',  // slate-800
  accent: '#059669',       // emerald-600
  accentLight: '#ECFDF5',  // emerald-50
  muted: '#64748B',        // slate-500
  border: '#E2E8F0',       // slate-200
  bgLight: '#F8FAFC',      // slate-50
  white: '#FFFFFF',
  text: '#0F172A',         // slate-900
};

export const printInvoice = (selectedVente: any, selectedFormat: any, param: any) => {
  if (!selectedVente) return;

  const pageSize = selectedFormat;
  const isA4 = selectedFormat === 'A4';
  const fs = isA4
    ? { title: 16, h2: 12, normal: 9, small: 7, table: 9, xsmall: 6 }
    : { title: 13, h2: 10, normal: 7, small: 5, table: 7, xsmall: 4 };

  const margins = isA4 ? [40, 50, 40, 50] : [20, 25, 20, 25];
  const tableWidths = isA4
    ? ['8%', '8%', '14%', '30%', '20%', '20%']
    : ['8%', '8%', '14%', '30%', '20%', '20%'];

  const docDefinition: any = {
    pageSize,
    pageMargins: margins,
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR.border }] },
        {
          columns: [
            { text: `Merci d'avoir choisi ${param?.nom ?? ''}`, fontSize: fs.small, color: COLOR.muted, alignment: 'left', margin: [0, 4, 0, 0] },
            { text: `Page ${currentPage} / ${pageCount}`, fontSize: fs.small, color: COLOR.muted, alignment: 'right', margin: [0, 4, 0, 0] },
          ],
          margin: [0, 2, 0, 0],
        },
      ],
      margin: [margins[0], 0, margins[2], 10],
    }),
    styles: {
      company: { fontSize: fs.h2, bold: true, color: COLOR.primaryDark },
      companyInfo: { fontSize: fs.small, color: COLOR.muted },
      invoiceTitle: { fontSize: fs.title, bold: true, color: COLOR.accent },
      invoiceLabel: { fontSize: fs.small, color: COLOR.muted, bold: true },
      invoiceValue: { fontSize: fs.normal, color: COLOR.text, bold: true },
      sectionLabel: { fontSize: fs.normal, bold: true, color: COLOR.primary },
      clientInfo: { fontSize: fs.normal, color: COLOR.text },
      th: { fontSize: fs.table, bold: true, color: COLOR.white, alignment: 'center' },
      thRight: { fontSize: fs.table, bold: true, color: COLOR.white, alignment: 'right' },
      td: { fontSize: fs.table, color: COLOR.text },
      tdCenter: { fontSize: fs.table, color: COLOR.text, alignment: 'center' },
      tdRight: { fontSize: fs.table, color: COLOR.text, alignment: 'right' },
      tdNum: { fontSize: fs.table, color: COLOR.text, alignment: 'right' },
      totalLabel: { fontSize: fs.normal, color: COLOR.text, alignment: 'right', margin: [0, 3] },
      totalValue: { fontSize: fs.normal, color: COLOR.text, alignment: 'right', bold: true, margin: [0, 3] },
      netLabel: { fontSize: fs.h2, color: COLOR.white, alignment: 'right', bold: true, margin: [0, 4] },
      netValue: { fontSize: fs.h2, color: COLOR.white, alignment: 'right', bold: true, margin: [0, 4] },
      footerText: { fontSize: fs.small, color: COLOR.muted },
    },
    content: [
      // ====== EN-TÊTE : entreprise à gauche, FACTURE à droite ======
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: param?.nom ?? '', style: 'company' },
              { text: param?.desc ?? '', style: 'companyInfo', margin: [0, 2, 0, 0] },
              { text: param?.tel ?? '', style: 'companyInfo', margin: [0, 1, 0, 0] },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'FACTURE', style: 'invoiceTitle' },
              { text: `N° ${selectedVente?.ref ?? ''}`, style: 'invoiceValue', margin: [0, 2, 0, 0] },
              { text: `Date : ${format(new Date(selectedVente.date), 'dd/MM/yyyy')}`, style: 'companyInfo', margin: [0, 1, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 15],
      },
      // Séparateur
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: COLOR.accent }] },
      { canvas: [{ type: 'line', x1: 0, y1: 3, x2: 515, y2: 3, lineWidth: 0.5, lineColor: COLOR.border }] },

      // ====== INFOS CLIENT ======
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'CLIENT', style: 'sectionLabel', margin: [0, 15, 0, 5] },
              { text: selectedVente?.client?.nom ?? '—', style: 'clientInfo', margin: [0, 1] },
              ...(selectedVente?.client?.tel ? [{ text: `Tél : ${selectedVente.client.tel}`, style: 'clientInfo', margin: [0, 1] }] : []),
              ...(selectedVente?.client?.addr ? [{ text: `Adresse : ${selectedVente.client.addr}`, style: 'clientInfo', margin: [0, 1] }] : []),
            ],
          },
        ],
      },

      // ====== TABLE PRODUITS ======
      {
        margin: [0, 15, 0, 0],
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? COLOR.primary : null),
          hLineColor: () => COLOR.border,
          vLineColor: () => COLOR.border,
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        table: {
          widths: tableWidths,
          headerRow: 1,
          body: [
            [
              { text: '#REF', style: 'th' },
              { text: 'Qté', style: 'th' },
              { text: 'Unité', style: 'th' },
              { text: 'Désignation', style: 'th' },
              { text: 'P.U.', style: 'thRight' },
              { text: 'Total', style: 'thRight' },
            ],
            ...(selectedVente?.produits?.map((k: any) => [
              { text: k.ref ?? '', style: 'tdCenter' },
              { text: formatN(k.qte), style: 'tdCenter' },
              { text: k.unite ?? '', style: 'tdCenter' },
              { text: k.nom ?? '', style: 'td' },
              { text: formatN(k.pu), style: 'tdNum' },
              { text: formatN(k.pu * k.qte), style: 'tdNum' },
            ]) ?? []),
          ],
        },
      },

      // ====== TOTAUX ======
      {
        margin: [0, 12, 0, 0],
        columns: [
          {},
          {
            width: isA4 ? 250 : 200,
            layout: {
              hLineColor: () => COLOR.border,
              vLineWidth: () => 0,
              hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
            table: {
              widths: ['50%', '50%'],
              body: [
                [
                  { text: 'Montant', style: 'totalLabel' },
                  { text: `${formatN(selectedVente?.montant ?? 0)} FCFA`, style: 'totalValue' },
                ],
                [
                  { text: 'Remise', style: 'totalLabel' },
                  { text: `- ${formatN(selectedVente?.remise ?? 0)} FCFA`, style: 'totalValue' },
                ],
                [
                  {
                    text: 'NET À PAYER',
                    style: 'netLabel',
                    fillColor: COLOR.accent,
                  },
                  {
                    text: `${formatN(selectedVente?.net_a_payer ?? 0)} FCFA`,
                    style: 'netValue',
                    fillColor: COLOR.accent,
                  },
                ],
              ],
            },
          },
        ],
      },

      // ====== PIED DE PAGE DOCUMENT ======
      {
        margin: [0, 30, 0, 0],
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLOR.border }] },
          {
            text: param?.desc ?? '',
            style: 'footerText',
            alignment: 'center',
            margin: [0, 6, 0, 0],
          },
          {
            text: `${param?.nom ?? ''} — ${param?.tel ?? ''}`,
            style: 'footerText',
            alignment: 'center',
            margin: [0, 1, 0, 0],
          },
        ],
      },
    ],
  };

  pdfMake.createPdf(docDefinition).open();
};
