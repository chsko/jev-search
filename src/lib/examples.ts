export const EXAMPLES = {
  yes_no: {
    label: "Yes / no",
    description: "A question that can be answered with yes or no.",
    questions: ["Is a tomato a fruit?", "Can penguins fly?"],
  },
  pick_one: {
    label: "Pick one",
    description:
      "Ask which one is the answer and list the alternatives after a colon, separated by commas or “or”.",
    questions: [
      "Which is the largest planet: Mars, Jupiter or Venus?",
      "Which is a tomato: fruit or vegetable?",
    ],
  },
  rate: {
    label: "Rating",
    description:
      "Ask how much of something there is. Name a scale such as “on a scale of 1 to 5” (up to 11 steps), or Jev will rate from 1 to 10.",
    questions: [
      "On a scale of 1 to 10, how spicy is a jalapeño?",
      "How risky is skydiving?",
    ],
  },
} as const;
