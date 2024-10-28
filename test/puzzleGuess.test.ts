import {afterEach, beforeEach, describe} from "@jest/globals";
import {MongoClient} from "mongodb";
import testingStart from "../src/testHarness";
import {createPuzzle} from "../src/puzzleData";
import {checkPuzzleGuess, createPuzzleAnswer, getPuzzleById, markPuzzleAsDeleted} from "../index";

describe("puzzle guess", () => {
  let dataAccess: MongoClient, teardown: () => Promise<void>;
  let puzzleId: string;
  const answer1 = "1", answer2 = "10", answer3 = "100";

  beforeEach(async () => {

    ({dataAccess, teardown} = await testingStart());

    puzzleId = await createPuzzle(dataAccess, "puzz", "nam");

    await createPuzzleAnswer(dataAccess, puzzleId, answer1, 0);
    await createPuzzleAnswer(dataAccess, puzzleId, answer2, 1);
    await createPuzzleAnswer(dataAccess, puzzleId, answer3, 2);

  });

  afterEach(async () => {
    await teardown();
  });

  test('no guess results in no guess information', async () => {
    const puzzle = await getPuzzleById(dataAccess, puzzleId);

    expect(puzzle!.lastGuessDate).toBeUndefined();
    expect(puzzle!.lastGuessResult).toBeUndefined();
  });

  test("a correct answer responds with true", async () => {
    const result = await checkPuzzleGuess(dataAccess, puzzleId, [answer1, answer2, answer3]);

    expect(result).toBe(true);
  });

  test("the correct guess details are persisted", async () => {
    await checkPuzzleGuess(dataAccess, puzzleId, [answer1, answer2, answer3]);

    const puzzle = await getPuzzleById(dataAccess, puzzleId);

    expect(puzzle!.lastGuessDate?.getTime()).toBeGreaterThanOrEqual(Date.now()-2000);
    expect(puzzle!.lastGuessDate?.getTime()).toBeLessThanOrEqual(Date.now()+2000);
    expect(puzzle!.lastGuessResult).toBe(true);
  });

  test('an incorrect answer responds with false', async () => {
    const result = await checkPuzzleGuess(dataAccess, puzzleId, [answer1, answer3, answer2]);

    expect(result).toBe(false);
  });

  test('too many answers is incorrect', async () => {
    const result = await checkPuzzleGuess(dataAccess, puzzleId, [answer1, answer2, answer3, answer3]);

    expect(result).toBe(false);
  });

  test('the incorrect guess details are persisted', async () => {
    await checkPuzzleGuess(dataAccess, puzzleId, [answer1, answer3, answer2]);

    const puzzle = await getPuzzleById(dataAccess, puzzleId);

    expect(puzzle!.lastGuessDate?.getTime()).toBeGreaterThanOrEqual(Date.now()-2000);
    expect(puzzle!.lastGuessDate?.getTime()).toBeLessThanOrEqual(Date.now()+2000);
    expect(puzzle!.lastGuessResult).toBe(false);
  });

  test('invalid puzzle id returns null', async () => {
    const result = await checkPuzzleGuess(dataAccess, "not a puzz", [answer1, answer2]);

    expect(result).toBeNull();
  });

  test('non-existant puzzle returns null', async () => {
    await markPuzzleAsDeleted(dataAccess, puzzleId);

    const result = await checkPuzzleGuess(dataAccess, puzzleId, [answer1, answer2, answer3]);

    expect(result).toBeNull();
  });
});
