import mongoose from 'mongoose'
//library of mongoDb ODM (Object data modelling)

const MONGODB_URI = process.env.MONGODB_URI! // ! is used to tell the compiler that the variable is not null

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

// caching to prevent multiple connections
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// global variable to store the mongoose connection of instance MongooseCache 
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

// if mongoose is already connected, return it
const cached: MongooseCache = global.mongoose || { conn: null, promise: null }

// if mongoose is not connected, create a new connection
if (!global.mongoose) {
  global.mongoose = cached
}

export async function connectDB() {

  // if mongoose is already connected, return it
  if (cached.conn) {
    return cached.conn
  }
  // if mongoose is not connected, create a new connection checking if promise is already created
  if (!cached.promise) {

    // then create a new promise and store it in cached.promise
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      console.log('[MongoDB] Connected successfully')
      return mongoose
    })
  }

  // if promise is created, wait for it to resolve and store the connection
  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    console.error('[MongoDB] Connection failed:', error)
    throw error
  }

  return cached.conn
}
