var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
// todo: remove jest-mongodb and implement myself
export default function testingStart() {
    return __awaiter(this, void 0, void 0, function* () {
        const mongodb = yield MongoMemoryServer.create();
        const client = yield MongoClient.connect(mongodb.getUri());
        return {
            dataAccess: client,
            teardown: () => __awaiter(this, void 0, void 0, function* () {
                yield client.close(true);
                yield mongodb.stop();
            }),
        };
    });
}
