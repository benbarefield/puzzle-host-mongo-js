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
exports.default = testingStart;
const mongodb_1 = require("mongodb");
const mongodb_memory_server_1 = require("mongodb-memory-server");
// todo: remove jest-mongodb and implement myself
function testingStart() {
    return __awaiter(this, void 0, void 0, function* () {
        const mongodb = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const client = yield mongodb_1.MongoClient.connect(mongodb.getUri());
        return {
            dataAccess: client,
            teardown: () => __awaiter(this, void 0, void 0, function* () {
                yield client.close(true);
                yield mongodb.stop();
            }),
        };
    });
}
