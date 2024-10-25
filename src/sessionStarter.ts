import {MongoClient} from "mongodb";

export default async function sessionStarter(connectionString?: string): Promise<any> {
  connectionString = connectionString || process.env.DB_CONNECTION;

  if(!connectionString) {
    throw new Error("no connection string available")
  }
  return await MongoClient.connect(connectionString);
}
