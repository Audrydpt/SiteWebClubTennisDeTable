import * as XLSX from 'xlsx';
import { PdfWorkerRequest, PdfWorkerResponse } from './pdfWorker';
import WebWorker from './pdfWorker?worker&inline';

type ExportFormat = 'Excel' | 'PDF';

const exportData = (
  data: Record<string, string | number | boolean>[],
  format: ExportFormat,
  filename: string,
  setLoading: (loading: boolean) => void
) => {
  if (!data || data.length === 0) return;

  switch (format) {
    case 'Excel': {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      setLoading(false);
      break;
    }

    case 'PDF': {
      const worker = new WebWorker();

      worker.onerror = () => {
        setLoading(false);
        worker.terminate();
      };

      worker.onmessage = (e: MessageEvent<PdfWorkerResponse>) => {
        if (e.data.status === 'success') {
          if (e.data.data) {
            const blob = new Blob([e.data.data], {
              type: 'application/pdf',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = e.data.filename || `${filename}.pdf`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }
        }
        setLoading(false);
        worker.terminate();
      };

      worker.postMessage({
        data,
        filename,
      } as PdfWorkerRequest);

      break;
    }

    default:
      setLoading(false);
      break;
  }
};

export default exportData;
