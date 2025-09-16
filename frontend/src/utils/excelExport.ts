/* eslint-disable */
import { Commande } from '@/services/type';
import type { Absence } from '@/services/type';
import * as XLSX from 'xlsx';

// Déclarations pour éviter l'erreur TS2584 sans activer "DOM" dans tsconfig
declare const document: any;
declare const URL: any;

interface ExcelRow {
  Nom: string;
  Prenom: string;
  Article: string;
  Fournisseur: string;
  Categorie: string;
  Quantite: number;
  'Prix Unitaire': number;
  'Prix Total': number;
  Epaisseur?: string;
  Type?: string;
  Description?: string;
}

export const exportCommandeToExcel = (commande: Commande, users: any[]) => {
  const data: ExcelRow[] = [];

  commande.members.forEach((member) => {
    const user = users.find((u) => u.id === member.memberId);
    const nom = user ? user.nom : 'Inconnu';
    const prenom = user ? user.prenom : 'Inconnu';

    member.items.forEach((item) => {
      data.push({
        Nom: nom,
        Prenom: prenom,
        Article: item.name,
        Fournisseur: item.fournisseur || '',
        Categorie: item.category,
        Quantite: parseInt(item.quantity),
        'Prix Unitaire': parseFloat(item.price),
        'Prix Total': parseFloat(item.price) * parseInt(item.quantity),
        ...(item.epaisseur && { Epaisseur: item.epaisseur }),
        ...(item.type && { Type: item.type }),
        ...(item.description && { Description: item.description }),
      });
    });
  });

  // Création du contenu CSV
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(';'),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof ExcelRow];
          return typeof value === 'string' && value.includes(';')
            ? `"${value}"`
            : value || '';
        })
        .join(';')
    ),
  ].join('\n');

  // Ajout du BOM pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Téléchargement côté navigateur uniquement
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `commande_${commande.name}_${commande.date}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// --- Export des absences en Excel ---
export const exportAbsencesToExcel = (absences: Absence[]) => {
  const headers = ['Membre', 'Date', 'Détails', 'Statut', 'Date de création'];

  // Construire les lignes au format lisible
  const rows = absences.map((a) => [
    a.memberName || '',
    a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '',
    a.details || '',
    a.statut || '',
    a.dateCreation ? new Date(a.dateCreation).toLocaleString('fr-FR') : '',
  ]);

  // Créer la feuille avec les en-têtes puis les données
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Largeurs de colonnes approximatives
  ws['!cols'] = [
    { wch: 22 }, // Membre
    { wch: 14 }, // Date
    { wch: 60 }, // Détails
    { wch: 12 }, // Statut
    { wch: 22 }, // Date de création
  ];

  // Auto-filter sur toute la zone de données
  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] } as any;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Absences');

  const filename = `absences_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename, { compression: true });
};
