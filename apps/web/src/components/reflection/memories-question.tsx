import {
  type MemoryAnswer,
  maxMemories,
  memoryMetadataFields,
  memoryStoryPrompt,
} from "@wtfiwant/shared";
import {
  eyebrowClassName,
  questionCardClassName,
  textButtonClassName,
} from "@/lib/styles";
import {
  type AnswerInputProps,
  questionInputClassName,
} from "./question-input.types";

type Memory = MemoryAnswer["memories"][number];

function createBlankMemory(): Memory {
  return { story: "", with: "", where: "", doing: "", special: "" };
}

export function MemoriesQuestion({ value, onChange }: AnswerInputProps) {
  const record =
    value && typeof value === "object"
      ? (value as { memories?: Memory[] })
      : {};
  const memories = record.memories?.length
    ? record.memories
    : [createBlankMemory()];
  const update = (index: number, key: keyof Memory, next: string) => {
    const updated = memories.map((memory, memoryIndex) =>
      memoryIndex === index ? { ...memory, [key]: next } : memory,
    );
    onChange({ memories: updated });
  };

  return (
    <div className="space-y-5">
      {memories.map((memory, index) => (
        <section className={questionCardClassName} key={`memory-${index + 1}`}>
          <p className={eyebrowClassName}>Moment {index + 1}</p>
          <textarea
            className={`${questionInputClassName} min-h-32`}
            value={memory.story}
            aria-label={`${memoryStoryPrompt} Moment ${index + 1}`}
            onChange={(event) => update(index, "story", event.target.value)}
            placeholder={memoryStoryPrompt}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {memoryMetadataFields.map((field) => (
              <label key={field.id}>
                <span className="mb-2 block text-xs font-extrabold">
                  {field.label}{" "}
                  <span className="font-normal text-muted">optional</span>
                </span>
                <input
                  className={questionInputClassName}
                  value={memory[field.id] ?? ""}
                  onChange={(event) =>
                    update(index, field.id, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </section>
      ))}
      {memories.length < maxMemories ? (
        <button
          className={textButtonClassName}
          type="button"
          onClick={() =>
            onChange({ memories: [...memories, createBlankMemory()] })
          }
        >
          + Add another moment
        </button>
      ) : null}
    </div>
  );
}
