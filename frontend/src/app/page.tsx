import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold tracking-tight">Mini AI Interviewer</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-muted-foreground">Interview flow coming next.</p>
      </main>
    </div>
  );
}
