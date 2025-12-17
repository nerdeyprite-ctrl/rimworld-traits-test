export type Passion = 'None' | 'Minor' | 'Major';

export interface Trait {
  id: string;
  name: string;
  description?: string;
  group?: string; // e.g. 'Mood', 'Nerves'
  conflicts?: string[];
  effect?: string; // For display or logic reference
}

export interface Skill {
  name: string;
  level: number; // 0-20
  passion: Passion;
}

export interface Answer {
  text: string;
  scores: Record<string, number | string>; // traitId -> score impact, or backstory_preference -> string
}

export interface Question {
  id: number;
  text: string;
  answers: Answer[];
  groupId?: string; // For grouping confusingly similar questions to prevent overlap
}

export interface Backstory {
  id: string;
  title: string;
  titleShort: string;
  description: string;
  skillBonuses?: Record<string, number>;
  skillPenalties?: Record<string, number>;
  workDisables?: string[];
  traits?: string[];
  spawnCategories?: string[];
}

export interface TestResult {
  traits: Trait[];
  skills: Skill[];
  scoreLog: Record<string, number>;
  backstory: {
    childhood: Backstory;
    adulthood: Backstory;
  };
  mbti: string;
  incapabilities?: string[]; // List of skill names that are incapable
}
