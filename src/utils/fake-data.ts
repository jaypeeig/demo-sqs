const ANIMALS = [
  "duck",
  "cat",
  "chicken",
  "hippopotamus",
  "koala",
  "whale",
  "bee",
  "deer",
  "eagle",
  "otter",
];

const FIRST_NAMES = [
  "Ada",
  "Grace",
  "Alan",
  "Katherine",
  "Linus",
  "Margaret",
  "Dennis",
  "Radia",
  "Edsger",
  "Barbara",
];

const LAST_NAMES = [
  "Lovelace",
  "Hopper",
  "Turing",
  "Johnson",
  "Torvalds",
  "Hamilton",
  "Ritchie",
  "Perlman",
  "Dijkstra",
  "Liskov",
];

function pick<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  // Non-null: items is always non-empty, so index is always in range.
  return items[index] as T;
}

export function randomAnimal(): string {
  return pick(ANIMALS);
}

export function randomFullName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function emailFor(fullName: string): string {
  const local = fullName.toLowerCase().replace(/\s+/gu, ".");
  return `${local}@example.com`;
}
