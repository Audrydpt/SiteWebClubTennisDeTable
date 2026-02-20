/* eslint-disable */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Plat, CategorieCaisse } from '@/services/type';

declare const document: any;

/**
 * Exporte l'état du stock en PDF avec repères visuels sur les quantités.
 */
export const exportStockToPdf = (
  plats: Plat[],
  categories: CategorieCaisse[]
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // --- En-tête ---
  doc.setFillColor(44, 44, 44);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(241, 196, 15); // Jaune #F1C40F
  doc.text('État du Stock', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(`Généré le ${dateStr}`, 14, 22);

  const totalArticles = plats.length;
  const ruptures = plats.filter(
    (p) => p.stock !== undefined && p.stock === 0
  ).length;
  const stockBas = plats.filter(
    (p) => p.stock !== undefined && p.stock > 0 && p.stock <= 3
  ).length;

  doc.text(
    `${totalArticles} articles  |  ${ruptures} en rupture  |  ${stockBas} stock bas`,
    pageWidth - 14,
    22,
    { align: 'right' }
  );

  // --- Légende ---
  const legendY = 34;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Légende :', 14, legendY);

  // Rupture
  doc.setFillColor(220, 53, 69);
  doc.roundedRect(40, legendY - 3, 8, 4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setTextColor(100, 100, 100);
  doc.text('Rupture', 50, legendY);

  // Stock bas
  doc.setFillColor(255, 152, 0);
  doc.roundedRect(70, legendY - 3, 8, 4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setTextColor(100, 100, 100);
  doc.text('Bas', 80, legendY);

  // OK
  doc.setFillColor(40, 167, 69);
  doc.roundedRect(93, legendY - 3, 8, 4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setTextColor(100, 100, 100);
  doc.text('OK', 103, legendY);

  // Illimité
  doc.setFillColor(108, 117, 125);
  doc.roundedRect(115, legendY - 3, 8, 4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setTextColor(100, 100, 100);
  doc.text('Illimité', 125, legendY);

  // --- Trier par catégorie puis par nom ---
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const sortedPlats = [...plats].sort((a, b) => {
    const catA = catMap.get(a.categorie)?.ordre ?? 999;
    const catB = catMap.get(b.categorie)?.ordre ?? 999;
    if (catA !== catB) return catA - catB;
    return a.nom.localeCompare(b.nom, 'fr');
  });

  const getCatNom = (catId: string) => catMap.get(catId)?.nom ?? catId;

  // --- Tableau ---
  const tableData = sortedPlats.map((p) => {
    const stockText = p.stock !== undefined ? String(p.stock) : 'Illimité';
    const statut = p.disponible ? 'Actif' : 'Inactif';
    return [
      p.nom,
      getCatNom(p.categorie),
      `${p.prix.toFixed(2)} €`,
      stockText,
      statut,
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [['Article', 'Catégorie', 'Prix', 'Stock', 'Statut']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [80, 80, 80],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [44, 44, 44],
      textColor: [241, 196, 15],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
    },
    didParseCell(data) {
      // Colonne Stock (index 3)
      if (data.section === 'body' && data.column.index === 3) {
        const plat = sortedPlats[data.row.index];
        if (!plat) return;

        if (plat.stock === undefined) {
          // Illimité
          data.cell.styles.fillColor = [108, 117, 125];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (plat.stock === 0) {
          // Rupture
          data.cell.styles.fillColor = [220, 53, 69];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (plat.stock <= 3) {
          // Stock bas
          data.cell.styles.fillColor = [255, 152, 0];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else {
          // OK
          data.cell.styles.fillColor = [40, 167, 69];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Colonne Statut (index 4)
      if (data.section === 'body' && data.column.index === 4) {
        const plat = sortedPlats[data.row.index];
        if (!plat) return;
        if (!plat.disponible) {
          data.cell.styles.textColor = [220, 53, 69];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [40, 167, 69];
        }
      }
    },
    didDrawPage(data) {
      // Pied de page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  // Télécharger
  const filename = `stock_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
