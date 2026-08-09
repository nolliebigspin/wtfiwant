export const eyebrowBaseClassName =
  "mb-4 text-[0.68rem] font-black tracking-[0.19em] uppercase";

export const eyebrowClassName = `${eyebrowBaseClassName} text-accent-ink`;

export const darkEyebrowClassName = `${eyebrowBaseClassName} text-accent`;

export const lightEyebrowClassName = `${eyebrowBaseClassName} text-acid`;

const primaryButtonBaseClassName =
  "inline-flex cursor-pointer items-center justify-center gap-8 rounded-full border-0 bg-ink font-extrabold text-white no-underline transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-accent-ink active:translate-y-0 disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0";

export const primaryButtonClassName = `${primaryButtonBaseClassName} min-h-[3.2rem] px-[1.4rem] py-[0.85rem]`;

export const largePrimaryButtonClassName = `${primaryButtonBaseClassName} min-h-16 px-[1.8rem] py-4`;

export const secondaryButtonClassName =
  "cursor-pointer border-0 bg-transparent p-4 font-bold text-ink transition-colors hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-25";

export const textButtonClassName =
  "cursor-pointer border-0 bg-transparent px-0 py-2 font-extrabold text-accent-ink underline-offset-4 hover:underline";

const horizontalHeaderBaseClassName =
  "flex items-center justify-between border-b border-ink/15 px-[clamp(1.2rem,4vw,4.5rem)]";

export const horizontalHeaderClassName = `${horizontalHeaderBaseClassName} min-h-20`;

export const compactHorizontalHeaderClassName = `${horizontalHeaderBaseClassName} min-h-16`;

export const resultSectionClassName =
  "px-[clamp(1.2rem,9vw,9rem)] py-[clamp(5rem,9vw,9rem)]";

export const resultCardGridClassName =
  "grid grid-cols-2 border-t border-ink/17 max-[800px]:grid-cols-1";

export const resultCardClassName =
  "min-h-96 border-b border-ink/17 py-8 pr-10 even:border-l even:border-ink/17 even:pl-10 max-[800px]:even:border-l-0 max-[800px]:even:pl-0";

export const resultCardIndexClassName =
  "text-[0.7rem] font-black tracking-[0.18em] text-accent-ink";

export const resultCardTitleClassName =
  "mt-20 mb-4 text-[clamp(2rem,4vw,3.6rem)] tracking-[-0.06em]";

export const resultCardCopyClassName =
  "max-w-[31rem] leading-[1.65] text-muted";

export const fieldControlClassName =
  "w-full rounded-[0.8rem] border border-ink/18 bg-white/35 p-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

const questionCardBaseClassName =
  "rounded-[1.4rem] border border-ink/16 bg-white/25";

export const questionCardClassName = `${questionCardBaseClassName} p-[clamp(1rem,3vw,2rem)]`;

export const tradeoffCardClassName = `${questionCardBaseClassName} p-6`;
