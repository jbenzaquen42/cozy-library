import { PageHeader } from "@/components/ui/page-header";
import { ScanFlow } from "@/components/scan/ScanFlow";
import { PhotoOcr } from "@/components/scan/PhotoOcr";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader label="Tools" title="Scan a book" />
      <p className="text-muted-text">
        Start the camera only when you are ready, scan an ISBN barcode, review metadata, then continue to the manual add form. Photo OCR extracts ISBN candidates from cover or spine images.
      </p>
      <ScanFlow />
      <PhotoOcr />
    </div>
  );
}
