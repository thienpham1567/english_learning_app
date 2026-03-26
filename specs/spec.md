# Vocabulary Learning with Structured Output (JSON)

## Objective

### Exercise Goals

- Get familiar with forcing AI responses into a fixed data format using a **JSON Schema**.
- Use structured data to render a professional UI (Table, Card, Tag) instead of plain text.

---

## New Menu: "Cô Lành Dictionary"

### Sidebar Integration

- Add a new item to the left sidebar:
  - **Label:** `Từ điển Cô Lành`

### Feature Description

- When a user inputs a vocabulary word, the AI must NOT respond freely.
- Instead, it must return a **structured JSON object** following a predefined schema.

---

## AI Configuration (Structured Output Schema)

Use the following library:

```ts
zod;
```

to define the schema that the AI response **must strictly follow**.

### Schema Definition

```ts
import { z } from "zod";

export const VocabularySchema = z.object({
  word: z.string(),
  phonetic: z.string(),
  meaning: z.string(),
  example: z.string(),
  grammar_notes: z.array(z.string()),
  level: z.enum(["Dễ", "Trung bình", "Khó"]),
});
```

### Field Descriptions

- **word**: (string) English word.
- **phonetic**: (string) Phonetic transcription.
- **meaning**: (string) Vietnamese meaning (must be humorous in the "Cô Lành" style).
- **example**: (string) A funny/slang example sentence.
- **grammar_notes**: (string[]) List of related grammar notes.
- **level**: (enum) Difficulty level:
  - `Dễ` (Easy)
  - `Trung bình` (Medium)
  - `Khó` (Hard)

---

## UI & Interface (Ant Design)

### Input

- Use an input field where users can enter a vocabulary word.

### Display

Use Ant Design components:

- **Card (Antd Card)**
  - Display the word and phonetic transcription.

- **Table or Descriptions (Antd Table / Descriptions)**
  - Display:
    - meaning
    - example
    - grammar notes

- **Tag (Antd Tag)**
  - Display the difficulty level (`level`).

### Loading State

- Show loading indicators while waiting for AI response:
  - `Skeleton`
  - or `Spin`

---

## Processing Logic (Vercel AI SDK v6)

### Data Generation

Use one of the following:

```ts
streamObject;
```

- For streaming partial data

OR

```ts
generateObject;
```

- For returning the full object at once

### Prompt

```text
You are a lively dictionary named Cô Minh. Analyze the word [vocabulary] and return data strictly in the required JSON format.
```

---

## Technical Requirements

- Validate AI responses using the defined **Zod schema**.
- Show error messages (using Antd `message`) if:
  - the AI response is invalid
  - or the word cannot be defined

---

## Expected Outcome

The system should:

- Accept a vocabulary input from the user
- Call AI and enforce structured JSON output
- Validate the response using Zod
- Render the data using Ant Design components
- Provide a clean, professional, and interactive vocabulary learning experience
