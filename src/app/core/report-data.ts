/**
 * State for the PDF report viewer, as in astra-app: endpoints return the PDF
 * base64-encoded and the page hands it to showPdfReport().
 */
export class ReportData {
  reportTitle = 'Report Viewer';
  showReportViewer = false;
  pdfUrl: string | null = null;

  showPdfReport(reportTitle: string, base64Pdf: string): void {
    this.release();

    const bytes = Uint8Array.from(atob(base64Pdf), (c) => c.charCodeAt(0));
    this.pdfUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    this.reportTitle = reportTitle;
    this.showReportViewer = true;
  }

  release(): void {
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
      this.pdfUrl = null;
    }
  }
}
