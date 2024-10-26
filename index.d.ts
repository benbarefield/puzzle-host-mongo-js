import {type Pool} from 'pg';

export declare function sessionStarter(connectionString?: string): Promise<any>

export interface Puzzle {
  id: string
  name: string
  owner: string
}

export declare function getPuzzleById(pg : Pool, id: string) : Promise<Puzzle | null>
export declare function createPuzzle(pg: Pool, name: string, ownerId: string): Promise<string>
export declare function getPuzzlesForUser(pg: Pool, userId: string): Promise<Puzzle[]>
export declare function verifyPuzzleOwnership(pg: Pool, puzzleId: string, userId: string): Promise<boolean | null>
export declare function markPuzzleAsDeleted(pg: Pool, puzzleId: string): Promise<boolean>
export declare function updatePuzzle(pg: Pool, puzzleId: string, name: string): Promise<boolean>

export interface PuzzleAnswer {
  id: string
  value: string
  puzzle: string
  answerIndex: number
}

export declare function createPuzzleAnswer(pg: Pool, puzzle: string, value: string, answerIndex: number): Promise<string | null>
export declare function getPuzzleAnswerById(pg: Pool, id: string) : Promise<PuzzleAnswer | null>
export declare function removePuzzleAnswer(pg: Pool, id: string): Promise<boolean>
export declare function updatePuzzleAnswer(pg: Pool, id: string, value: string | undefined, answerIndex: number | undefined) : Promise<boolean>
export declare function getAnswersForPuzzle(pg: Pool, puzzleId: string) : Promise<PuzzleAnswer[]>

export interface TestingHarness {
  dataAccess: Pool,
  teardown: () => Promise<void>
}

export declare function testingStart(): Promise<TestingHarness>
