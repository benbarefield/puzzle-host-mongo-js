import {MongoClient, ObjectId} from "mongodb";
import {getPuzzleCollection, PuzzleData} from "./puzzleData";

interface PuzzleAnswerData {
  value: string
  puzzle: ObjectId
}

export interface PuzzleAnswer {
  id: string
  value: string
  puzzle: string
  answerIndex: number
}

export function getPuzzleAnswerCollection(mongo: MongoClient) {
  return mongo.db().collection<PuzzleAnswerData>("puzzle-answer");
}

function getAnswerIndexFromPuzzle(puzzle: PuzzleData, id: ObjectId) {
  for(let i = 0; i < puzzle.answers.length; ++i) {
    if(puzzle.answers[i].equals(id)) {
      return i;
    }
  }
  return -1;
}

export async function createPuzzleAnswer(mongo: MongoClient, puzzle: string, value: string, answerIndex: number): Promise<string | null> {
  let newId: string | null = null;
  const session = mongo.startSession();

  if(!ObjectId.isValid(puzzle)) { return null; }

  try {
    session.startTransaction();

    const puzzleCollection = getPuzzleCollection(mongo);
    const answerCollection = getPuzzleAnswerCollection(mongo);

    const answerResult = await answerCollection.insertOne({ value, puzzle: new ObjectId(puzzle) });
    newId = answerResult.insertedId.toHexString();
    const result = await puzzleCollection.updateOne({_id: new ObjectId(puzzle), deleted: false}, {
      "$push": {
        "answers": {
          $each: [answerResult.insertedId],
          $position: answerIndex,
        },
      },
    });

    if(result.modifiedCount !== 1) {
      throw new Error("Error adding answer to puzzle");
    }
  }
  catch(e) {
    // console.log(e);
    await session.abortTransaction();
    newId = null;
  }
  finally {
    await session.endSession();
  }

  return newId;
}

export async function getPuzzleAnswerById(mongo: MongoClient, id: string) : Promise<PuzzleAnswer | null> {
  const puzzleCollection = getPuzzleCollection(mongo);
  const answerCollection = getPuzzleAnswerCollection(mongo);

  if(!ObjectId.isValid(id)) { return null; }

  const answer = await answerCollection.findOne({_id: new ObjectId(id)});
  if(!answer) { return null; }

  const puzzle = await puzzleCollection.findOne({_id: answer.puzzle});
  if(!puzzle) { return null; }

  return {
    id: answer._id.toHexString(),
    value: answer.value,
    puzzle: answer.puzzle.toHexString(),
    answerIndex: getAnswerIndexFromPuzzle(puzzle, answer._id),
  };
}

export async function removePuzzleAnswer(mongo: MongoClient, id: string): Promise<boolean> {
  if(!ObjectId.isValid(id)) { return false; }

  const session = mongo.startSession();
  let success = false;
  try {
    session.startTransaction();

    const answerCollection = getPuzzleAnswerCollection(mongo);
    const puzzleCollection = getPuzzleCollection(mongo);

    const answer = await answerCollection.findOne({_id: new ObjectId(id)});
    if(!answer) {
      throw new Error("No answer for the id");
    }

    const answerResult = await answerCollection.deleteOne({_id: new ObjectId(id)});
    if(answerResult.deletedCount !== 1) {
      throw new Error("Error deleting answer");
    }

    let puzzleResult = await puzzleCollection.updateOne({_id: answer.puzzle }, {
      $pull: {
        answers: answer._id,
      },
    });
    if(puzzleResult.modifiedCount !== 1) {
      throw new Error("Error deleting answer from puzzle");
    }
    success = true;
  }
  catch(e) {
    // console.log(e);
    await session.abortTransaction();
  }
  finally {
    await session.endSession();
  }

  return success;
}

export async function updatePuzzleAnswer(mongo: MongoClient, id: string, value: string | undefined = undefined, answerIndex: number | undefined = undefined) : Promise<boolean> {
  const answerCollection = getPuzzleAnswerCollection(mongo);

  if(!ObjectId.isValid(id)) { return false; }

  if(value === undefined && answerIndex === undefined) { return true; }

  if(answerIndex === undefined) {
    const result = await answerCollection.updateOne({_id: new ObjectId(id)}, { $set: { value }});
    return result.modifiedCount === 1;
  }

  let success = false;
  const session = mongo.startSession();
  try {
    const answerId = new ObjectId(id);
    if(value !== undefined) {
      const result = await answerCollection.updateOne({_id: answerId}, { $set: { value }});
      if(result.modifiedCount !== 1) {
        throw new Error("Error updating answer value");
      }
    }

    const answer = await answerCollection.findOne({_id: answerId});
    if(answer === null) {
      throw new Error("Error finding answer");
    }

    const puzzleCollection = getPuzzleCollection(mongo);
    let puzzleResult = await puzzleCollection.updateOne({_id: answer.puzzle }, {
      $pull: {
        answers: answerId,
      },
    });
    if(puzzleResult.modifiedCount !== 1) {
      throw new Error("Error moving answer in puzzle");
    }
    puzzleResult = await puzzleCollection.updateOne({_id: answer.puzzle }, {
      $push: {
        answers: {
          $each: [answerId],
          $position: answerIndex,
        },
      },
    });
    if(puzzleResult.modifiedCount !== 1) {
      throw new Error("Error moving answer in puzzle");
    }
    success = true;
  } catch(e) {
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }

  return success;
}

export async function getAnswersForPuzzle(mongo: MongoClient, puzzleId: string) : Promise<PuzzleAnswer[]> {
  const puzzleCollection = getPuzzleCollection(mongo);
  const answerCollection = getPuzzleAnswerCollection(mongo);

  if(!ObjectId.isValid(puzzleId)) {
    return [];
  }

  const puzzle = await puzzleCollection.findOne({_id: new ObjectId(puzzleId)});
  if(!puzzle) {
    return [];
  }

  const answers = await (answerCollection.find({
    _id: { $in: puzzle.answers }
  })).toArray();

  return answers.map(a => ({
    id: a._id.toHexString(),
    value: a.value,
    answerIndex: getAnswerIndexFromPuzzle(puzzle, a._id),
    puzzle: puzzleId,
  }));
}
