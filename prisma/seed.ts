import { PrismaClient, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedQuestion = {
  code: string;
  level: number;
  theme: string;
  category: string;
  topic: string;
  difficulty: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  type?: QuestionType;
  sortOrder: number;
};

const questions: SeedQuestion[] = [
  {
    code: "L1-Q1", level: 1, theme: "CRACK THE CODE", category: "Aptitude", topic: "Percentages", difficulty: "Easy", points: 8, sortOrder: 1,
    questionText: "A security key costs ₹800. It is sold with a 10% discount. What is the sale price?",
    options: ["₹680", "₹720", "₹760", "₹780"], correctAnswer: "₹720",
  },
  {
    code: "L1-Q2", level: 1, theme: "CRACK THE CODE", category: "Aptitude", topic: "Averages", difficulty: "Easy", points: 8, sortOrder: 2,
    questionText: "What is the average of 11, 15, 19, 23 and 27?",
    options: ["17", "18", "19", "20"], correctAnswer: "19",
  },
  {
    code: "L1-Q3", level: 1, theme: "CRACK THE CODE", category: "Aptitude", topic: "Ratios", difficulty: "Easy", points: 8, sortOrder: 3,
    questionText: "Two values are in the ratio 3:5 and their sum is 64. What is the smaller value?",
    options: ["20", "24", "32", "40"], correctAnswer: "24",
  },
  {
    code: "L1-Q4", level: 1, theme: "CRACK THE CODE", category: "Aptitude", topic: "Number series", difficulty: "Easy", points: 8, sortOrder: 4,
    questionText: "Find the next number in the sequence: 2, 6, 12, 20, 30, __",
    options: ["38", "40", "42", "44"], correctAnswer: "42",
  },
  {
    code: "L1-Q5", level: 1, theme: "CRACK THE CODE", category: "Aptitude", topic: "Basic probability", difficulty: "Easy", points: 8, sortOrder: 5,
    questionText: "A bag holds 3 blue tokens and 2 green tokens. One token is selected at random. What is the probability it is blue?",
    options: ["2/5", "1/2", "3/5", "3/2"], correctAnswer: "3/5",
  },
  {
    code: "L2-Q1", level: 2, theme: "FIND THE PATTERN", category: "Data & Logical Reasoning", topic: "Tables", difficulty: "Easy–Moderate", points: 10, sortOrder: 1,
    questionText: "A team solved 12 tasks on Monday, 18 on Tuesday, 15 on Wednesday and 20 on Thursday. On which day did it solve the second-highest number of tasks?",
    options: ["Monday", "Tuesday", "Wednesday", "Thursday"], correctAnswer: "Tuesday",
  },
  {
    code: "L2-Q2", level: 2, theme: "FIND THE PATTERN", category: "Data & Logical Reasoning", topic: "Sequences", difficulty: "Easy–Moderate", points: 10, sortOrder: 2,
    questionText: "Find the missing term: 3, 8, 15, 24, 35, __",
    options: ["42", "46", "48", "50"], correctAnswer: "48",
  },
  {
    code: "L2-Q3", level: 2, theme: "FIND THE PATTERN", category: "Data & Logical Reasoning", topic: "Directions", difficulty: "Easy–Moderate", points: 10, sortOrder: 3,
    questionText: "A student walks 4 km north, turns right and walks 3 km, then turns right and walks 4 km. Where is the student relative to the starting point?",
    options: ["3 km east", "3 km west", "4 km north", "4 km south"], correctAnswer: "3 km east",
  },
  {
    code: "L2-Q4", level: 2, theme: "FIND THE PATTERN", category: "Data & Logical Reasoning", topic: "Logical reasoning", difficulty: "Easy–Moderate", points: 10, sortOrder: 4,
    questionText: "All coders are problem solvers. Some problem solvers are gamers. Which conclusion is definitely true?",
    options: ["All gamers are coders", "Some coders are gamers", "All coders are problem solvers", "No problem solver is a gamer"], correctAnswer: "All coders are problem solvers",
  },
  {
    code: "L2-Q5", level: 2, theme: "FIND THE PATTERN", category: "Data & Logical Reasoning", topic: "Charts", difficulty: "Easy–Moderate", points: 10, sortOrder: 5,
    questionText: "In a bar chart, Team A has 24 points, Team B has 36 points and Team C has 30 points. By what percentage is Team B's score greater than Team A's?",
    options: ["25%", "33⅓%", "40%", "50%"], correctAnswer: "50%",
  },
  {
    code: "L3-Q1", level: 3, theme: "BREAK THE CODE", category: "Programming", topic: "C loops", difficulty: "Moderate", points: 12, sortOrder: 1,
    questionText: "What does this C program print?\n\nint sum = 0;\nfor (int i = 1; i <= 3; i++) {\n  sum += i;\n}\nprintf(\"%d\", sum);",
    options: ["3", "5", "6", "7"], correctAnswer: "6",
  },
  {
    code: "L3-Q2", level: 3, theme: "BREAK THE CODE", category: "Programming", topic: "Python conditions", difficulty: "Moderate", points: 12, sortOrder: 2,
    questionText: "What is printed by this Python code?\n\nx = 7\nif x % 2 == 0:\n    print(\"even\")\nelse:\n    print(\"odd\")",
    options: ["even", "odd", "7", "error"], correctAnswer: "odd",
  },
  {
    code: "L3-Q3", level: 3, theme: "BREAK THE CODE", category: "Programming", topic: "Arrays", difficulty: "Moderate", points: 12, sortOrder: 3,
    questionText: "What is the value of result after this pseudocode runs?\n\nnums = [4, 1, 6, 2]\nresult = 0\nfor each n in nums:\n  if n > 3:\n    result = result + n",
    options: ["4", "6", "10", "13"], correctAnswer: "10",
  },
  {
    code: "L3-Q4", level: 3, theme: "BREAK THE CODE", category: "Programming", topic: "Java strings", difficulty: "Moderate", points: 12, sortOrder: 4,
    questionText: "What does this Java expression produce?\n\n\"HEIST\".substring(1, 4)",
    options: ["HEI", "EIS", "IST", "EIST"], correctAnswer: "EIS",
  },
  {
    code: "L3-Q5", level: 3, theme: "BREAK THE CODE", category: "Programming", topic: "Functions", difficulty: "Moderate", points: 12, sortOrder: 5,
    questionText: "A function double(n) returns n * 2. What is the result of double(3) + double(4)?",
    options: ["7", "10", "12", "14"], correctAnswer: "14",
  },
  {
    code: "L4-PUZZLE", level: 4, theme: "CONNECT THE CLUES", category: "Digital Puzzle", topic: "Connected reasoning", difficulty: "Moderate", points: 80, type: QuestionType.SHORT_ANSWER, sortOrder: 1,
    questionText: "CONNECTED PUZZLE — Submit the final decoded word only.\n\nClue 1: What value is stored in total?\nint total = 0;\nfor (int i = 2; i <= 6; i += 2) total += i;\n\nClue 2: Continue this pattern: 3, 6, 12, 24, __\n\nClue 3: Add the answers from Clues 1 and 2. Reduce the result modulo 26 (if needed) to get a Caesar shift.\n\nClue 4: Shift each letter in BZIKM backward by that amount. What mission word do you obtain?",
    correctAnswer: "TRACE",
  },
  {
    code: "L5-Q1", level: 5, theme: "SOLVE THE CHALLENGE", category: "Final Protocol", topic: "Python loops", difficulty: "Moderate–Hard", points: 20, sortOrder: 1,
    questionText: "What does this Python code print?\n\ncount = 0\nfor n in [2, 5, 8, 11, 14]:\n    if n % 2 == 0:\n        count += 1\nprint(count)",
    options: ["2", "3", "4", "5"], correctAnswer: "3",
  },
  {
    code: "L5-Q2", level: 5, theme: "SOLVE THE CHALLENGE", category: "Final Protocol", topic: "String logic", difficulty: "Moderate–Hard", points: 20, sortOrder: 2,
    questionText: "A password is valid only if it has at least 6 characters and contains the character '#'. Which password is valid?",
    options: ["abc#1", "heist#", "passcode", "#code"], correctAnswer: "heist#",
  },
  {
    code: "L5-Q3", level: 5, theme: "SOLVE THE CHALLENGE", category: "Final Protocol", topic: "Debugging", difficulty: "Moderate–Hard", points: 20, sortOrder: 3,
    questionText: "A program should print the numbers 1 through 5. Which loop condition fixes this pseudocode?\n\nfor (i = 1; ___; i++) print(i)",
    options: ["i < 5", "i <= 5", "i == 5", "i >= 5"], correctAnswer: "i <= 5",
  },
  {
    code: "L5-Q4", level: 5, theme: "SOLVE THE CHALLENGE", category: "Final Protocol", topic: "Algorithms", difficulty: "Moderate–Hard", points: 20, sortOrder: 4,
    questionText: "Which simple method finds the largest number in an unsorted array without sorting it?",
    options: ["Compare each value and keep the largest seen so far", "Always choose the first value", "Add all values", "Reverse the array"], correctAnswer: "Compare each value and keep the largest seen so far",
  },
  {
    code: "L5-Q5", level: 5, theme: "SOLVE THE CHALLENGE", category: "Final Protocol", topic: "Combined reasoning", difficulty: "Moderate–Hard", points: 20, sortOrder: 5,
    questionText: "A function encrypt(word) reverses a word, then converts it to uppercase. What is encrypt(\"code\")?",
    options: ["CODE", "EDOC", "edoc", "code"], correctAnswer: "EDOC",
  },
];

async function main() {
  await prisma.event.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      title: "Cyber Heist",
      status: "DRAFT",
      questionCounts: { "1": 10, "2": 10, "3": 10, "4": 10, "5": 10 },
      roundMarks: { "1": 100, "2": 100, "3": 100, "4": 100, "5": 100 },
      totalMarks: 500,
    },
  });

  for (const question of questions) {
    await prisma.question.upsert({
      where: { code: question.code },
      update: { ...question, published: true },
      create: { ...question, published: true },
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("Questions seeded. ADMIN_EMAIL and ADMIN_PASSWORD were not set, so no administrator was created.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });
  console.log(`Ensured the initial event, ${questions.length} questions, and administrator exist.`);
}

main()
  .catch((error) => {
    const failure = error as { code?: string; name?: string };
    console.error("Database seed failed.", { code: failure.code ?? null, name: failure.name ?? "UnknownError" });
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
