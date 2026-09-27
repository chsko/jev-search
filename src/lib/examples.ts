export const EXAMPLES = {
  yes_no: {
    label: "Yes or no",
    description: "Any question with a yes or no answer.",
    questions: ["Is a tomato a fruit?", "Can penguins fly?"],
  },
  pick_one: {
    label: "Pick one",
    description: "List the options after a colon, separated by commas or “or”.",
    questions: [
      "Which is the largest planet: Mars, Jupiter or Venus?",
      "Which is a tomato: fruit or vegetable?",
    ],
  },
  rate: {
    label: "Rating",
    description: "Ask how much of something there is. Name a scale to also get a rough number.",
    questions: [
      "How spicy is a jalapeño?",
      "On a scale of 1 to 10, how risky is skydiving?",
    ],
  },
} as const;
