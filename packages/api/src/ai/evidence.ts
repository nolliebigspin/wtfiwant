/** Evidence IDs belong in reference arrays, never in user-facing prose. */
export function evidenceContract(
  value: unknown,
  answers: Record<string, unknown>,
): boolean {
  const ids = Object.keys(answers);
  const visit = (item: unknown, key = ""): boolean => {
    if (key === "evidenceQuestionIds")
      return (
        Array.isArray(item) &&
        item.every((id) => typeof id === "string" && ids.includes(id))
      );
    if (typeof item === "string") return !ids.some((id) => item.includes(id));
    if (Array.isArray(item)) return item.every((child) => visit(child));
    if (item && typeof item === "object")
      return Object.entries(item).every(([name, child]) => visit(child, name));
    return true;
  };
  return visit(value);
}

export async function boundedGuidance<T>(
  generate: (repair: boolean) => Promise<unknown>,
  parse: (value: unknown) => T,
  answers: Record<string, unknown>,
): Promise<T> {
  for (const repair of [false, true]) {
    try {
      const result = parse(await generate(repair));
      if (evidenceContract(result, answers)) return result;
    } catch {
      // Malformed/refused/incomplete outputs receive one repair. No answer data is logged.
    }
  }
  throw new Error("Invalid guidance after repair");
}
