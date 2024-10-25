import {afterEach, beforeEach, describe, expect} from "@jest/globals";
import {MongoClient} from "mongodb";
import testingStart from "../src/testHarness";
import {createPuzzle, markPuzzleAsDeleted} from "../src/puzzleData";
import {
  createPuzzleAnswer,
  getAnswersForPuzzle,
  getPuzzleAnswerById,
  removePuzzleAnswer,
  updatePuzzleAnswer
} from "../src/puzzleAnswerData";

describe("puzzle data", () => {
  let dataAccess: MongoClient, teardown: () => Promise<void>;
  let puzzleId: string;
  beforeEach(async () => {
    ({dataAccess, teardown} = await testingStart());

    puzzleId = await createPuzzle(dataAccess, "puzz", "nam");
  });

  afterEach(async () => {
    await teardown();
  });

  describe("creating answers", () => {
    test('the answer is able to be retrieved', async () => {
      const id = await createPuzzleAnswer(dataAccess, puzzleId, "10", 0);

      expect(id).toBeTruthy();
      const data = await getPuzzleAnswerById(dataAccess, id!);
      expect(data).toMatchObject({
        value: "10",
        answerIndex: 0,
      });
    });

    test('returns null for a puzzle that does not exist', async () => {
      const result = await createPuzzleAnswer(dataAccess, "does not exist", "10", 0);

      expect(result).toBe(null);
    });

    test('returns null for a puzzle that is deleted', async () => {
      await markPuzzleAsDeleted(dataAccess, puzzleId);

      const result = await createPuzzleAnswer(dataAccess, puzzleId, "10", 0);

      expect(result).toBe(null);
    });
  });

  describe('getting answers', () => {
    test('returns null for a answer that does not exist', async () => {
      const result = await getPuzzleAnswerById(dataAccess, "does not exist");

      expect(result).toBe(null);
    });
  });

  describe('removing a puzzle answer', () => {
    test('should no longer be retrievable', async () => {
      const id = await createPuzzleAnswer(dataAccess, puzzleId, "10", 0);

      const result = await removePuzzleAnswer(dataAccess, id!);
      expect(result).toBe(true);

      const answer = await getPuzzleAnswerById(dataAccess, id!);
      expect(answer).toBe(null);
    });

    test('returns false when the answer does not exist', async () => {
      const result = await removePuzzleAnswer(dataAccess, puzzleId);
      expect(result).toBe(false);
    });

    test('returns false when the id is not valid', async () => {
      const result = await removePuzzleAnswer(dataAccess, "bad id");
      expect(result).toBe(false);
    });

    // answer index is correct
  });

  describe("get answers for puzzle", () => {
    test('all the answers for a puzzle are returned', async () => {
      await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);
      await createPuzzleAnswer(dataAccess, puzzleId, "10", 1);
      await createPuzzleAnswer(dataAccess, puzzleId, "100", 2);

      const result = await getAnswersForPuzzle(dataAccess, puzzleId);

      expect(result.length).toBe(3);
      expect(result.find(a => a.answerIndex === 0)?.value).toBe("1");
      expect(result.find(a => a.answerIndex === 1)?.value).toBe("10");
      expect(result.find(a => a.answerIndex === 2)?.value).toBe("100");
    });

    test('empty list for a bad puzzle id', async () => {
      const result = await getAnswersForPuzzle(dataAccess, "bad id");
      expect(result).toEqual([]);
    });

    test('empty list for a nonexistent puzzle id', async () => {
      await markPuzzleAsDeleted(dataAccess, puzzleId);
      const result = await getAnswersForPuzzle(dataAccess, puzzleId);
      expect(result).toEqual([]);
    });
  });

  describe('update puzzle answer', () => {
    test('updating the value is persisted', async () => {
      const id = await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);

      const result = await updatePuzzleAnswer(dataAccess, id!, "2");
      expect(result).toBe(true);

      const answer = await getPuzzleAnswerById(dataAccess, id!);
      expect(answer).toMatchObject({
        value: "2",
        answerIndex: 0,
      });
    });

    test('updating a bad id returns false', async () => {
      const result = await updatePuzzleAnswer(dataAccess, "bad id", "2");
      expect(result).toBe(false);
    });

    test('updating a non-existant returns false', async () => {
      const id = await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);
      await removePuzzleAnswer(dataAccess, id!);
      const result = await updatePuzzleAnswer(dataAccess, id!, "2");
      expect(result).toBe(false);
    });
  });

  describe('answer indexes', () => {
    test('creating an answer at index 0 results in correctly ordered answers', async () => {
      await createPuzzleAnswer(dataAccess, puzzleId, "10", 0);
      await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);

      const answers = await getAnswersForPuzzle(dataAccess, puzzleId);

      expect(answers.length).toBe(2);
      expect(answers.find(a => a.answerIndex === 0)?.value).toBe("1");
      expect(answers.find(a => a.answerIndex === 1)?.value).toBe("10");
    });

    test('creating an answer in the middle of a list results in correctly ordered answers', async () => {
      await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);
      await createPuzzleAnswer(dataAccess, puzzleId, "100", 1);
      await createPuzzleAnswer(dataAccess, puzzleId, "10", 1);

      const answers = await getAnswersForPuzzle(dataAccess, puzzleId);

      expect(answers.length).toBe(3);
      expect(answers.find(a => a.answerIndex === 0)?.value).toBe("1");
      expect(answers.find(a => a.answerIndex === 1)?.value).toBe("10");
      expect(answers.find(a => a.answerIndex === 2)?.value).toBe("100");
    });

    test('deleting an answer results in correctly ordered answers', async () => {
      await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);
      const toDelete = await createPuzzleAnswer(dataAccess, puzzleId, "10", 1);
      await createPuzzleAnswer(dataAccess, puzzleId, "100", 2);
      await removePuzzleAnswer(dataAccess, toDelete!);

      const answers = await getAnswersForPuzzle(dataAccess, puzzleId);

      expect(answers.length).toBe(2);
      expect(answers.find(a => a.answerIndex === 0)?.value).toBe("1");
      expect(answers.find(a => a.answerIndex === 1)?.value).toBe("100");
    });

    test('moving an answer to a lower index results in correctly answers', async () => {
      await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);
      await createPuzzleAnswer(dataAccess, puzzleId, "100", 1);
      const toUpdate = await createPuzzleAnswer(dataAccess, puzzleId, "10", 2);

      const result = await updatePuzzleAnswer(dataAccess, toUpdate!, undefined, 1);
      expect(result).toBe(true);

      const answers = await getAnswersForPuzzle(dataAccess, puzzleId);
      expect(answers.length).toBe(3);
      expect(answers.find(a => a.answerIndex === 0)?.value).toBe("1");
      expect(answers.find(a => a.answerIndex === 1)?.value).toBe("10");
      expect(answers.find(a => a.answerIndex === 2)?.value).toBe("100");
    });

    test('moving an answer to a higher index results in correctly answers (and persists the new value)', async () => {
      await createPuzzleAnswer(dataAccess, puzzleId, "1", 0);
      const toUpdate = await createPuzzleAnswer(dataAccess, puzzleId, "20", 1);
      await createPuzzleAnswer(dataAccess, puzzleId, "10", 2);

      const result = await updatePuzzleAnswer(dataAccess, toUpdate!, "100", 2);
      expect(result).toBe(true);

      const answers = await getAnswersForPuzzle(dataAccess, puzzleId);
      expect(answers.length).toBe(3);
      expect(answers.find(a => a.answerIndex === 0)?.value).toBe("1");
      expect(answers.find(a => a.answerIndex === 1)?.value).toBe("10");
      expect(answers.find(a => a.answerIndex === 2)?.value).toBe("100");
    });
  });
});
