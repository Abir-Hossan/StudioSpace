import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

/** Owns only the single-node development database, never an external cluster. */
export async function startLocalMongo(dbPath: string, port = 27018) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LOCAL_MONGO_PORT must be between 1024 and 65535.');
  fs.mkdirSync(dbPath, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve('work/mongodb-binaries');
  const binary = path.resolve('work/mongodb-binaries/mongod.exe');
  if (process.platform === 'win32' && fs.existsSync(binary)) process.env.MONGOMS_SYSTEM_BINARY = binary;
  const server = await MongoMemoryServer.create({ instance: { dbPath, port, portGeneration: false, ip: '127.0.0.1', replSet: 'testset', storageEngine: 'wiredTiger' } });
  let client: InstanceType<typeof mongoose.mongo.MongoClient> | undefined;
  try {
    if (server.instanceInfo?.port !== port) throw new Error(`MongoDB port ${port} is in use. Stop the other instance or set LOCAL_MONGO_PORT to a free port.`);
    const directUri = `mongodb://127.0.0.1:${port}/?directConnection=true`;
    client = await mongoose.mongo.MongoClient.connect(directUri, { serverSelectionTimeoutMS: 10000 });
    const admin = client.db('admin');
    const configurationDeadline = Date.now() + 60000;
    while (true) { try {
      const result = await admin.command({ replSetGetConfig: 1 });
      const config = result.config;
      if (config._id !== 'testset' || config.members.length !== 1 || !/^127\.0\.0\.1:\d+$/.test(config.members[0].host)) throw new Error('Refusing to change an unexpected replica-set configuration. No application data was removed.');
      const host = `127.0.0.1:${port}`;
      if (config.members[0].host !== host) {
        console.log(`Updating the saved local MongoDB address to ${host} (preserving application data).`);
        config.members[0].host = host;
        config.version += 1;
        try { await admin.command({ replSetReconfig: config, force: true }); }
        catch (error) { if ((error as {name?:string}).name !== 'MongoNetworkError') throw error; }
      }
      break;
    } catch (error) {
      const e = error as {code?:number;name?:string};
      if (e.code === 94) {
        try { await admin.command({ replSetInitiate: { _id: 'testset', members: [{ _id: 0, host: `127.0.0.1:${port}` }] } }); break; }
        catch (initializationError) { const ie=initializationError as {code?:number;name?:string}; if(ie.code!==23&&ie.name!=='MongoNetworkError')throw initializationError; }
      } else if (e.name !== 'MongoNetworkError' && ![23,11602,10107,189].includes(e.code ?? 0)) throw error;
      if(Date.now()>=configurationDeadline)throw new Error('Local MongoDB configuration did not settle within 60 seconds; application data was preserved.');
      await new Promise(resolve=>setTimeout(resolve,250));
    } }
    const deadline = Date.now() + 60000;
    while (true) {
      try { if ((await admin.command({ hello: 1 })).isWritablePrimary) break; } catch { /* Reconfiguration can temporarily close the connection. */ }
      if (Date.now() >= deadline) throw new Error('The local MongoDB node did not become primary within 60 seconds. Application data has been preserved.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return { server, uri: `mongodb://127.0.0.1:${port}/studiospace?replicaSet=testset` };
  } catch (error) {
    await server.stop({ doCleanup: false });
    throw error;
  } finally { await client?.close(); }
}
