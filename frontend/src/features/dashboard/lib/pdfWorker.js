
import jsPDF from 'jspdf';
import 'jspdf-autotable';

self.onmessage = function (e) {
  const { data, filename } = e.data;
  const Doc = new jsPDF();
  const headers = Object.keys(data[0]);
  const rows = data.map((obj) => Object.values(obj));

  Doc.autoTable({
    head: [headers],
    body: rows,
    margin: { top: 20 },
  });

  Doc.save(`${filename}.pdf`);
  self.postMessage('done');
};
