"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPuzzleAnswerCollection = getPuzzleAnswerCollection;
exports.createPuzzleAnswer = createPuzzleAnswer;
exports.getPuzzleAnswerById = getPuzzleAnswerById;
exports.removePuzzleAnswer = removePuzzleAnswer;
exports.updatePuzzleAnswer = updatePuzzleAnswer;
exports.getAnswersForPuzzle = getAnswersForPuzzle;
const mongodb_1 = require("mongodb");
const puzzleData_1 = require("./puzzleData");
function getPuzzleAnswerCollection(mongo) {
    return mongo.db().collection("puzzle-answer");
}
function getAnswerIndexFromPuzzle(puzzle, id) {
    for (let i = 0; i < puzzle.answers.length; ++i) {
        if (puzzle.answers[i].equals(id)) {
            return i;
        }
    }
    return -1;
}
function createPuzzleAnswer(mongo, puzzle, value, answerIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        let newId = null;
        const session = mongo.startSession();
        if (!mongodb_1.ObjectId.isValid(puzzle)) {
            return null;
        }
        try {
            session.startTransaction();
            const puzzleCollection = (0, puzzleData_1.getPuzzleCollection)(mongo);
            const answerCollection = getPuzzleAnswerCollection(mongo);
            const answerResult = yield answerCollection.insertOne({ value, puzzle: new mongodb_1.ObjectId(puzzle) });
            newId = answerResult.insertedId.toHexString();
            const result = yield puzzleCollection.updateOne({ _id: new mongodb_1.ObjectId(puzzle), deleted: false }, {
                "$push": {
                    "answers": {
                        $each: [answerResult.insertedId],
                        $position: answerIndex,
                    },
                },
            });
            if (result.modifiedCount !== 1) {
                throw new Error("Error adding answer to puzzle");
            }
        }
        catch (e) {
            // console.log(e);
            yield session.abortTransaction();
            newId = null;
        }
        finally {
            yield session.endSession();
        }
        return newId;
    });
}
function getPuzzleAnswerById(mongo, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const puzzleCollection = (0, puzzleData_1.getPuzzleCollection)(mongo);
        const answerCollection = getPuzzleAnswerCollection(mongo);
        if (!mongodb_1.ObjectId.isValid(id)) {
            return null;
        }
        const answer = yield answerCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!answer) {
            return null;
        }
        const puzzle = yield puzzleCollection.findOne({ _id: answer.puzzle });
        if (!puzzle) {
            return null;
        }
        return {
            id: answer._id.toHexString(),
            value: answer.value,
            puzzle: answer.puzzle.toHexString(),
            answerIndex: getAnswerIndexFromPuzzle(puzzle, answer._id),
        };
    });
}
function removePuzzleAnswer(mongo, id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!mongodb_1.ObjectId.isValid(id)) {
            return false;
        }
        const session = mongo.startSession();
        let success = false;
        try {
            session.startTransaction();
            const answerCollection = getPuzzleAnswerCollection(mongo);
            const puzzleCollection = (0, puzzleData_1.getPuzzleCollection)(mongo);
            const answer = yield answerCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
            if (!answer) {
                throw new Error("No answer for the id");
            }
            const answerResult = yield answerCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
            if (answerResult.deletedCount !== 1) {
                throw new Error("Error deleting answer");
            }
            let puzzleResult = yield puzzleCollection.updateOne({ _id: answer.puzzle }, {
                $pull: {
                    answers: answer._id,
                },
            });
            if (puzzleResult.modifiedCount !== 1) {
                throw new Error("Error deleting answer from puzzle");
            }
            success = true;
        }
        catch (e) {
            // console.log(e);
            yield session.abortTransaction();
        }
        finally {
            yield session.endSession();
        }
        return success;
    });
}
function updatePuzzleAnswer(mongo_1, id_1) {
    return __awaiter(this, arguments, void 0, function* (mongo, id, value = undefined, answerIndex = undefined) {
        const answerCollection = getPuzzleAnswerCollection(mongo);
        if (!mongodb_1.ObjectId.isValid(id)) {
            return false;
        }
        if (value === undefined && answerIndex === undefined) {
            return true;
        }
        if (answerIndex === undefined) {
            const result = yield answerCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { value } });
            return result.modifiedCount === 1;
        }
        let success = false;
        const session = mongo.startSession();
        try {
            const answerId = new mongodb_1.ObjectId(id);
            if (value !== undefined) {
                const result = yield answerCollection.updateOne({ _id: answerId }, { $set: { value } });
                if (result.modifiedCount !== 1) {
                    throw new Error("Error updating answer value");
                }
            }
            const answer = yield answerCollection.findOne({ _id: answerId });
            if (answer === null) {
                throw new Error("Error finding answer");
            }
            const puzzleCollection = (0, puzzleData_1.getPuzzleCollection)(mongo);
            let puzzleResult = yield puzzleCollection.updateOne({ _id: answer.puzzle }, {
                $pull: {
                    answers: answerId,
                },
            });
            if (puzzleResult.modifiedCount !== 1) {
                throw new Error("Error moving answer in puzzle");
            }
            puzzleResult = yield puzzleCollection.updateOne({ _id: answer.puzzle }, {
                $push: {
                    answers: {
                        $each: [answerId],
                        $position: answerIndex,
                    },
                },
            });
            if (puzzleResult.modifiedCount !== 1) {
                throw new Error("Error moving answer in puzzle");
            }
            success = true;
        }
        catch (e) {
            yield session.abortTransaction();
        }
        finally {
            yield session.endSession();
        }
        return success;
    });
}
function getAnswersForPuzzle(mongo, puzzleId) {
    return __awaiter(this, void 0, void 0, function* () {
        const puzzleCollection = (0, puzzleData_1.getPuzzleCollection)(mongo);
        const answerCollection = getPuzzleAnswerCollection(mongo);
        if (!mongodb_1.ObjectId.isValid(puzzleId)) {
            return [];
        }
        const puzzle = yield puzzleCollection.findOne({ _id: new mongodb_1.ObjectId(puzzleId) });
        if (!puzzle) {
            return [];
        }
        const answers = yield (answerCollection.find({
            _id: { $in: puzzle.answers }
        })).toArray();
        return answers.map(a => ({
            id: a._id.toHexString(),
            value: a.value,
            answerIndex: getAnswerIndexFromPuzzle(puzzle, a._id),
            puzzle: puzzleId,
        }));
    });
}
