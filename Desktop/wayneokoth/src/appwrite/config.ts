import { Client, Databases } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("695fa78500123148c6ff");

export const databases = new Databases(client);

export const DATABASE_ID = "696c7dc0000d7998f391";

export const SUBSCRIBERS_COLLECTION_ID = "waitlist";

export const SHENG_COLLECTION_ID = "sheng";

export const SHENGTEZO_COLLECTION_ID = "shengtezo";