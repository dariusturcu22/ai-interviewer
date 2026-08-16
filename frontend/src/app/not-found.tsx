import { Compass } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Compass className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        There&apos;s nothing here - the page or interview you&apos;re looking for doesn&apos;t
        exist.
      </p>
      <Link href="/" className={buttonVariants({ variant: "default" })}>
        Back to Mini AI Interviewer
      </Link>
    </div>
  );
}
