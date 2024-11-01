import {MongoClient, ObjectId} from "mongodb";
import {getPuzzleAnswerCollection} from "./puzzleAnswerData";

export interface PuzzleData {
  name: string
  owner: string
  deleted: boolean
  answers: ObjectId[]
  lastGuessDate?: number
  lastGuessResult?: boolean
}

export interface Puzzle {
  id: string
  name: string
  owner: string
  lastGuessDate?: Date
  lastGuessResult?: boolean
}

export function getPuzzleCollection(mongo: MongoClient) {
  return mongo.db().collection<PuzzleData>("puzzle");
}

export async function getPuzzleById(mongo : MongoClient, id: string) : Promise<Puzzle | null> {
  if(!ObjectId.isValid(id)) { return null; }

  const collection = getPuzzleCollection(mongo);

  try {
    const result = await collection.findOne({_id: new ObjectId(id), deleted: false});
    if(result) {
      return {
        id: result._id.toHexString(),
        name: result.name,
        owner:result.owner,
        lastGuessResult: result.lastGuessResult,
        lastGuessDate: result.lastGuessDate ? new Date(result.lastGuessDate) : undefined,
      };
    }
  }
  catch(e) {
    // console.log(e);
  }

  return null;
}

export async function createPuzzle(mongo : MongoClient, name: string, ownerId: string): Promise<string> {
  const collection = getPuzzleCollection(mongo);

  const result = await collection.insertOne({
    owner: ownerId,
    name,
    deleted: false,
    answers: [],
  });

  return result.insertedId.toHexString();
}

export async function getPuzzlesForUser(mongo: MongoClient, userId: string): Promise<Puzzle[]> {
  const collection = getPuzzleCollection(mongo);

  const result = await (collection.find({owner: userId, deleted: false})).toArray();

  return result.map(p => ({
    id: p._id.toHexString(),
    owner: p.owner,
    name: p.name,
    lastGuessDate: p.lastGuessDate ? new Date(p.lastGuessDate) : undefined,
    lastGuessResult: p.lastGuessResult,
  }));
}

export async function verifyPuzzleOwnership(mongo: MongoClient, puzzleId: string, userId: string): Promise<boolean | null> {
  const puzzle = await getPuzzleById(mongo, puzzleId);
  return puzzle === null
    ? null
    : puzzle.owner === userId;
}

export async function markPuzzleAsDeleted(mongo: MongoClient, puzzleId: string): Promise<boolean> {
  const collection = getPuzzleCollection(mongo);

  try {
    const result = await collection.updateOne({_id: new ObjectId(puzzleId)}, {$set: {deleted: true}});
    return result.modifiedCount === 1;
  } catch(e) {
  }

  return false;
}

export async function updatePuzzle(mongo: MongoClient, puzzleId: string, name: string): Promise<boolean> {
  const collection = getPuzzleCollection(mongo);

  try {
    const result = await collection.updateOne({_id: new ObjectId(puzzleId)}, {$set: {name}});
    return result.modifiedCount === 1;
  } catch(e) {
  }

  return false;
}

export async function checkPuzzleGuess(mongo: MongoClient, puzzleId: string, guess: string[]): Promise<boolean | null> {
  if(!ObjectId.isValid(puzzleId)) {
    return null;
  }

  const puzzleCollection = getPuzzleCollection(mongo);
  const puzzle = await puzzleCollection.findOne({_id: new ObjectId(puzzleId), deleted: false});
  if(!puzzle) {
    return null;
  }

  const answerCollection = getPuzzleAnswerCollection(mongo);
  const answers = await (answerCollection.find({
    _id: { $in: puzzle.answers }
  })).toArray();

  let correct = guess.length === puzzle.answers.length;
  for(let i = 0; i < puzzle.answers.length && correct; ++i) {
    const answer = answers.find(a => a._id.equals(puzzle.answers[i]));
    correct = answer?.value === guess[i];
  }

  await puzzleCollection.updateOne({_id: new ObjectId(puzzleId)}, {
    $set: {
      lastGuessDate: Date.now(),
      lastGuessResult: correct,
    },
  });

  return correct;
}
