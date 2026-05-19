import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-6xl font-bold text-deep-brown">404</h1>
      <p className="mt-4 text-lg text-muted-text">
        This page seems to be lost in the stacks.
      </p>
      <Button href="/" variant="primary" className="mt-6">
        Return home
      </Button>
    </div>
  );
}
