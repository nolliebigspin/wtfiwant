import { eyebrowClassName, primaryButtonClassName } from "@/lib/styles";

export default function NotFound() {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-content-center justify-items-start p-8">
      <p className={eyebrowClassName}>404</p>
      <h1 className="mb-4 max-w-[13ch] text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-[-0.075em]">
        Nothing to reflect on here.
      </h1>
      <a className={primaryButtonClassName} href="/">
        Go home
      </a>
    </main>
  );
}
