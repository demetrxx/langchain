export type Correct = number[] | undefined;

export type CorrectFn = (id: string) => Correct;

export type QType = 'SINGLE' | 'MATCH' | 'ORDER' | 'SELECT';

export type TestType = 'MAIN' | 'ADDITIONAL' | 'TEST' | 'FIRST' | 'SECOND' | 'DEMO';

export interface Question {
  order: number;
  type: QType;
  name: string | null;
  options: string[];
  topics: number[] | string;
  correct: Correct;
  solution: string | undefined;
}
