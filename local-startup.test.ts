import { it, expect } from 'vitest';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { startLocalMongo } from '../src/local-mongo';

async function freePort(): Promise<number> {
  const socket=net.createServer();
  await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve);});
  const port=(socket.address() as net.AddressInfo).port;
  await new Promise<void>((resolve,reject)=>socket.close(error=>error?reject(error):resolve()));
  return port;
}
it('preserves records after a port migration and repeated local restarts', async()=>{
  fs.mkdirSync('work',{recursive:true});
  const dbPath=fs.mkdtempSync(path.resolve('work/startup-regression-'));
  const oldPort=await freePort();let newPort=await freePort();while(newPort===oldPort)newPort=await freePort();
  for(const [index,port] of [oldPort,newPort,newPort].entries()){
    const runtime=await startLocalMongo(dbPath,port);
    let client: InstanceType<typeof mongoose.mongo.MongoClient>|undefined;
    try {
      client=await mongoose.mongo.MongoClient.connect(runtime.uri);
      const records=client.db('studiospace').collection('startup_regression');
      if(index===0)await records.insertOne({message:'Keep this record across restarts'});
      expect(await records.countDocuments()).toBe(1);
      const session=client.startSession();
      try{await session.withTransaction(async()=>{await records.updateOne({},{$set:{lastStart:index}},{session});});}finally{await session.endSession();}
    } finally {await client?.close();await runtime.server.stop({doCleanup:false});}
  }
},120000);
