import { AnimatedLogo } from "./animated-logo";
import { CircuitBackdrop } from "./circuit-backdrop";

export default function HomePage() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-clip">
      <CircuitBackdrop />
      <AnimatedLogo />
    </main>
  );
}
