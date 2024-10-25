import {describe, expect, beforeEach, afterEach, test } from "@jest/globals";
import testingStart from "../src/testHarness";
import {
  createPuzzle,
  getPuzzleById,
  getPuzzlesForUser,
  markPuzzleAsDeleted, updatePuzzle,
  verifyPuzzleOwnership
} from "../src/puzzleData";
import {MongoClient} from "mongodb";

describe("puzzle data", () => {
  let dataAccess: MongoClient, teardown: () => Promise<void>;
  beforeEach(async () => {
    ({dataAccess, teardown} = await testingStart());
  });

  afterEach(async () => {
    await teardown();
  });

  describe('creating puzzles', () => {
    test('a created puzzle should be retrievable', async () => {
      const puzzleName = "a new puzzle", owner = "12315";
      const id = await createPuzzle(dataAccess, puzzleName, owner);

      const puzzle = await getPuzzleById(dataAccess, id);
      expect(puzzle).toMatchObject({
        name: puzzleName,
        owner,
      });
    });
  });

  describe('getting a puzzle that does not exist', () => {
    test('returns null', async () => {
      const puzzle = await getPuzzleById(dataAccess, "unavialable id");

      expect(puzzle).toBe(null);
    });
  });

  describe('getting puzzles for a user', () => {
    const owner1 = "first", owner2 = "last";

    test('it returns all puzzles for the specified owner', async () => {
      const id1 = await createPuzzle(dataAccess, "a puzzle", owner1);
      const id2 = await createPuzzle(dataAccess, "another puzzle", owner1);

      const result = await getPuzzlesForUser(dataAccess, owner1);
      expect(result.length).toBe(2);
      expect(result.find(p => p.id === id1)?.name).toBe("a puzzle");
      expect(result.find(p => p.id === id2)?.name).toBe("another puzzle");
    });

    test('it does not return puzzles for other owners', async () => {
      const id1 = await createPuzzle(dataAccess, "a puzzle", owner1);
      await createPuzzle(dataAccess, "another puzzle", owner2);

      const result = await getPuzzlesForUser(dataAccess, owner1);
      expect(result.length).toBe(1);
      expect(result.find(p => p.id === id1)?.name).toBe("a puzzle");
    });
  });

  describe("verify puzzle ownership", () => {
    test("returns true when the puzzle is owned by the specified user", async () => {
      const owner = "1241asdfas";
      const puzzleId = await createPuzzle(dataAccess, "a puzzle", owner);

      const owned = await verifyPuzzleOwnership(dataAccess, puzzleId, owner);

      expect(owned).toBe(true);
    });

    test('returns false when the puzzle is not owned by the specified user', async () => {
      const puzzleId = await createPuzzle(dataAccess, "a puzzle", "an owner");

      const owned = await verifyPuzzleOwnership(dataAccess, puzzleId, "different owner");

      expect(owned).toBe(false);
    });

    test('returns null when the puzzle does not exist', async () => {
      const owned = await verifyPuzzleOwnership(dataAccess, "does not exist", "maybe");

      expect(owned).toBe(null);
    });
  });

  describe("mark puzzle as deleted", () => {
    test('puzzle does not show up in puzzles for user', async () => {
      const owner = "an owner";
      const puzzleId = await createPuzzle(dataAccess, "a puzzle", owner);

      const result = await markPuzzleAsDeleted(dataAccess, puzzleId);

      expect(result).toBe(true);

      const puzzles = await getPuzzlesForUser(dataAccess, owner);
      expect(puzzles.length).toBe(0);

      const puzzle = await getPuzzleById(dataAccess, puzzleId);
      expect(puzzle).toBe(null);
    });

    test('returns false if the puzzle does not exist', async () => {
      const result = await markPuzzleAsDeleted(dataAccess, "1521432423423");
      expect(result).toBe(false);
    });
  });

  describe("updating a puzzle", () => {
    test('changes are saved', async () => {
      const puzzleId = await createPuzzle(dataAccess, "a puzzle", "an owner");

      const newName = "updated name";
      const response = await updatePuzzle(dataAccess, puzzleId, newName);
      expect(response).toBe(true);

      const puzzle = await getPuzzleById(dataAccess, puzzleId);
      expect(puzzle?.name).toBe(newName);
    });

    test('returns false if the puzzle does not exist', async () => {
      const result = await updatePuzzle(dataAccess, "nonextant", "namename");
      expect(result).toBe(false);
    });
  });
});
