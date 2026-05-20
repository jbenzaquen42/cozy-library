import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HousePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader label="Browse" title="Your house" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="blue" title="2D Floor Plan">
          <p className="mb-4 text-muted-text">
            Browse shelves on a flat map view.
          </p>
          <Button href="/house/2d" variant="secondary" size="sm">
            Open 2D view
          </Button>
        </Card>
        <Card variant="pink" title="Living Room Shelf View">
          <p className="mb-4 text-muted-text">
            Switch between the real bookshelves from a straight-on room view.
          </p>
          <Button href="/house/3d" variant="secondary" size="sm">
            Open shelf view
          </Button>
        </Card>
      </div>
    </div>
  );
}
