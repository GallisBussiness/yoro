import { format } from "date-fns";
import { formatN } from "../../lib/helpers";
import pdfMake from "pdfmake/build/pdfmake";
import { font } from "../../vfs_fonts";
pdfMake.vfs = font; 

export const printInvoice = (selectedVente:any,selectedFormat:any,param:any) => {
    if (!selectedVente) return;
    
    // Ajuster les dimensions en fonction du format sélectionné
    const pageSize = selectedFormat;
    const fontSize = selectedFormat === 'A4' ? {
      title: 12,
      subtitle: 10,
      normal: 8,
      small: 6,
      table: 8
    } : {
      title: 10,
      subtitle: 8,
      normal: 6,
      small: 4,
      table: 6
    };
    
    const margins = selectedFormat === 'A4' ? [40, 40, 40, 40] : [20, 20, 20, 20];
    const tableWidths = selectedFormat === 'A4' ? ['8%', '7%','15%', '25%', '20%', '20%'] : ['8%', '7%', '15%', '25%', '20%', '20%'];
    
    const docDefinition: any = {
      pageSize: pageSize,
      pageMargins: margins,
      footer: {text: `Merci d'avoir choisi ${param.nom} à bientôt !!!`, fontSize: fontSize.normal, alignment: 'center'},
      styles: {
        entete: {
          bold: true,
          alignment: 'center',
          fontSize: fontSize.normal,
          color: 'white'
        },
        center: {
          alignment: 'center',
        },
        left: {
          alignment: 'left',
        },
        right: {
          alignment: 'right',
        },
        nombre: {
          alignment: 'right',
          fontSize: fontSize.normal,
          bold: true
        },
        tword: {
          fontSize: fontSize.normal,
          italics: true
        },
        tword1: {
          fontSize: fontSize.normal,
          margin: [0, 10, 0, 10]
        },
        info: {
          fontSize: fontSize.normal,
        },
        header3: {
          color: "white",
          fillColor: '#73BFBA',
          bold: true,
          alignment: 'center',
          fontSize: fontSize.small,
        },
        header4: {
          color: "white",
          fillColor: '#73BFBA',
          bold: true,
          alignment: 'right',
          fontSize: fontSize.small
        },
        total: {
          color: "white",
          bold: true,
          fontSize: fontSize.normal,
          fillColor: '#73BFBA',
          alignment: 'center'
        },
        anotherStyle: {
          italics: true,
          alignment: 'right'
        }
      },
      content: [
        {
          columnGap: selectedFormat === 'A4' ? 200 : 150,
          columns: [
            {
              alignment: 'left',
              stack: [
                {image: 'logo', width: selectedFormat === 'A4' ? 80 : 60, alignment: "right"},
                {text: `FACTURE`, fontSize: fontSize.title, bold: true, alignment: "right", margin: [0, 4]},
              ]
            },
            {
              alignment: 'right',
              width: selectedFormat === 'A4' ? 200 : 150,
              table: {
                widths: ['*'],
                body: [
                  [{
                    stack: [
                      {text: `${param?.nom}`, fontSize: fontSize.normal, bold: true, alignment: "justify", margin: [0, 2]},
                      {text: `${param?.desc}`, fontSize: fontSize.normal, bold: true, alignment: "justify", margin: [0, 2]},
                      {text: `${param?.tel}`, fontSize: fontSize.normal, bold: true, alignment: "justify", margin: [0, 2]},
                    ]
                  }],
                ]
              }
            },
          ],
        },
        {
          columnGap: selectedFormat === 'A4' ? 120 : 80,
          columns: [
            {
              alignment: 'left',
              width: selectedFormat === 'A4' ? 200 : 150,
              stack: [
                {text: `CLIENT : `, fontSize: fontSize.normal, bold: true, alignment: "left", margin: [0, 2]},
                {text: `Nom: ${selectedVente?.client.nom}`, fontSize: fontSize.normal, alignment: "left", margin: [0, 2]},
                {text: `Tel: ${selectedVente?.client?.tel}`, fontSize: fontSize.normal, alignment: "left", margin: [0, 2]},
                {text: `Addr: ${selectedVente?.client.addr}`, fontSize: fontSize.normal, alignment: "left", margin: [0, 2]},
              ]
            },
            {
              alignment: 'right',
              width: selectedFormat === 'A4' ? 200 : 150,
              stack: [
                {
                  margin: [2, 5],
                  fillColor: "#8A2BE2",
                  alignment: 'left',
                  layout: 'noBorders',
                  table: {
                    widths: ['100%'],
                    body: [
                      [{text: `N°: ${selectedVente?.ref}`, fontSize: fontSize.subtitle, bold: true, color: 'white', margin: [2, 1]}],
                      [{text: `DATE : ${format(new Date(), 'dd-MM-yyyy')}`, fontSize: fontSize.normal, bold: true, margin: [2, 1], fillColor: '#F1F5F9'}],
                      [{text: `ECHEANCE : ${format(selectedVente.date, 'dd-MM-yyyy')}`, fontSize: fontSize.normal, margin: [2, 1], bold: true, fillColor: '#F1F5F9'}],
                    ]
                  }
                },
              ]
            },
          ],
        },
        {
          margin: [0, 10],
          width: '100%',
          alignment: 'justify',
          layout: {
            fillColor: function(rowIndex: number) {
              return (rowIndex === 0) ? '#8A2BE2' : null;
            },
            hLineWidth: function() {
              return 1;
            },
            vLineWidth: function() {
              return 1;
            },
            hLineColor: function() {
              return 'black';
            },
            vLineColor: function() {
              return 'black';
            },
          },
          table: {
            widths: tableWidths,
            body: [
              [{text: '#REF', style: 'entete'}, {text: 'Q', style: 'entete'},{text: 'Unit', style: 'entete'}, {text: 'Desc', style: 'entete'},{text: 'Pu', style: 'entete'},  {text: 'Total', style: 'entete'}],
              ...selectedVente?.produits?.map((k: any) => (
                [{text: `${k.ref}`, style: 'info'},
                 {text: `${formatN(k.qte)}`, style: 'nombre'},
                 {text: `${k.unite}`, style: 'info'},
                 {text: `${k.nom}`, style: 'info'},
                 {text: `${formatN(k.pu)}`, style: 'nombre'},
                 {text: `${formatN(k.pu * k.qte)}`, style: 'nombre'}
                ]
              )),
            ],
          }
        },
        {
          columnGap: selectedFormat === 'A4' ? 120 : 80,
          columns: [
            {},
            {
              alignment: 'right',
              width: selectedFormat === 'A4' ? 300 : 250,
              stack: [
                {
                  margin: [2, 5],
                  fillColor: "#8A2BE2",
                  alignment: 'left',
                  layout: 'noBorders',
                  table: {
                    widths: ['100%'],
                    body: [
                      [{text: `MONTANT : ${formatN(selectedVente?.montant)}`, fontSize: fontSize.normal, bold: true, margin: [2, 1], fillColor: '#F1F5F9'}],
                      [{text: `REMISE : ${formatN(selectedVente?.remise)}`, fontSize: fontSize.normal, bold: true, margin: [2, 1], fillColor: '#F1F5F9'}],
                      [{text: `NET A PAYER : ${formatN(selectedVente?.net_a_payer)}`, fontSize: fontSize.subtitle, color: 'white', margin: [2, 1], bold: true}],
                    ]
                  }
                },
              ]
            },
          ],
        },
      ],
      images: {
        logo: `${import.meta.env.VITE_BACKURL}/uploads/${param?.logo}`,
      }
    }
  
    pdfMake.createPdf(docDefinition).open();
}