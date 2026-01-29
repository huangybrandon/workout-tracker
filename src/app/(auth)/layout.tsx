import { Dumbbell } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="mb-10 flex items-center gap-2">
        <Dumbbell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Workout Tracker</h1>
      </div>
      {children}
    </div>
  );
}
