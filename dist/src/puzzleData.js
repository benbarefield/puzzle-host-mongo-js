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
exports.getPuzzleCollection = getPuzzleCollection;
exports.getPuzzleById = getPuzzleById;
exports.createPuzzle = createPuzzle;
exports.getPuzzlesForUser = getPuzzlesForUser;
exports.verifyPuzzleOwnership = verifyPuzzleOwnership;
exports.markPuzzleAsDeleted = markPuzzleAsDeleted;
exports.updatePuzzle = updatePuzzle;
const mongodb_1 = require("mongodb");
function getPuzzleCollection(mongo) {
    return mongo.db().collection("puzzle");
}
function getPuzzleById(mongo, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = getPuzzleCollection(mongo);
        try {
            const result = yield collection.findOne({ _id: new mongodb_1.ObjectId(id), deleted: false });
            if (result) {
                return {
                    id: result._id.toHexString(),
                    name: result.name,
                    owner: result.owner,
                };
            }
        }
        catch (e) {
            // console.log(e);
        }
        return null;
    });
}
function createPuzzle(mongo, name, ownerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = getPuzzleCollection(mongo);
        const result = yield collection.insertOne({
            owner: ownerId,
            name,
            deleted: false,
            answers: [],
        });
        return result.insertedId.toHexString();
    });
}
function getPuzzlesForUser(mongo, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = getPuzzleCollection(mongo);
        const result = yield (collection.find({ owner: userId, deleted: false })).toArray();
        return result.map(p => ({
            id: p._id.toHexString(),
            owner: p.owner,
            name: p.name,
        }));
    });
}
function verifyPuzzleOwnership(mongo, puzzleId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const puzzle = yield getPuzzleById(mongo, puzzleId);
        return puzzle === null
            ? null
            : puzzle.owner === userId;
    });
}
function markPuzzleAsDeleted(mongo, puzzleId) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = getPuzzleCollection(mongo);
        try {
            const result = yield collection.updateOne({ _id: new mongodb_1.ObjectId(puzzleId) }, { $set: { deleted: true } });
            return result.modifiedCount === 1;
        }
        catch (e) {
        }
        return false;
    });
}
function updatePuzzle(mongo, puzzleId, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = getPuzzleCollection(mongo);
        try {
            const result = yield collection.updateOne({ _id: new mongodb_1.ObjectId(puzzleId) }, { $set: { name } });
            return result.modifiedCount === 1;
        }
        catch (e) {
        }
        return false;
    });
}
