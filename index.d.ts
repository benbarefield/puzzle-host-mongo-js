import {MongoClient} from "mongodb";

export declare function sessionStarter(connectionString?: string): Promise<any>

export interface Puzzle {
  id: string
  name: string
  owner: string
  lastGuessDate?: Date
  lastGuessResult?: boolean
}

export declare function getPuzzleById(mongo: MongoClient, id: string) : Promise<Puzzle | null>
export declare function createPuzzle(mongo: MongoClient, name: string, ownerId: string): Promise<string>
export declare function getPuzzlesForUser(mongo: MongoClient, userId: string): Promise<Puzzle[]>
export declare function verifyPuzzleOwnership(mongo: MongoClient, puzzleId: string, userId: string): Promise<boolean | null>
export declare function markPuzzleAsDeleted(mongo: MongoClient, puzzleId: string): Promise<boolean>
export declare function updatePuzzle(mongo: MongoClient, puzzleId: string, name: string): Promise<boolean>
export declare function checkPuzzleGuess(mongo: MongoClient, puzzleId: string, guess: string[]): Promise<boolean | null>

export interface PuzzleAnswer {
  id: string
  value: string
  puzzle: string
  answerIndex: number
}

export declare function createPuzzleAnswer(mongo: MongoClient, puzzle: string, value: string, answerIndex: number): Promise<string | null>
export declare function getPuzzleAnswerById(mongo: MongoClient, id: string) : Promise<PuzzleAnswer | null>
export declare function removePuzzleAnswer(mongo: MongoClient, id: string): Promise<boolean>
export declare function updatePuzzleAnswer(mongo: MongoClient, id: string, value: string | undefined, answerIndex: number | undefined) : Promise<boolean>
export declare function getAnswersForPuzzle(mongo: MongoClient, puzzleId: string) : Promise<PuzzleAnswer[]>

export interface TestingHarness {
  dataAccess: MongoClient,
  teardown: () => Promise<void>
}

export declare function testingStart(): Promise<TestingHarness>
