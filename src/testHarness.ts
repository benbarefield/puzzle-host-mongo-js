import {MongoClient} from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

interface TestingHarness {
  dataAccess: MongoClient,
  teardown: () => Promise<void>
}

// todo: remove jest-mongodb and implement myself
export default async function testingStart(): Promise<TestingHarness> {
  const mongodb = await MongoMemoryServer.create();

  const client = await MongoClient.connect(mongodb.getUri());

  return {
    dataAccess: client,
    teardown: async () => {
      await client.close(true);
      await mongodb.stop();
    },
  }
}
