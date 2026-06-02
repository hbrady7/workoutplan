import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
