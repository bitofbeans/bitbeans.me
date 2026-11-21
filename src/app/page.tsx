import { AnimatedLogo } from "./animated-logo";
import { CircuitBackdrop } from "./circuit-backdrop";

export default function HomePage() {
  return (
    <main className="fixed inset-x-0 top-0 isolate grid h-dvh touch-pinch-zoom place-items-center overflow-clip">
      <CircuitBackdrop />
      <AnimatedLogo />
    </main>
  );
}
