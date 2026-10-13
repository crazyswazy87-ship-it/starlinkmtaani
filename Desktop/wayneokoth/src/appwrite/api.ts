import { databases, DATABASE_ID, SHENG_COLLECTION_ID, SUBSCRIBERS_COLLECTION_ID, SHENGTEZO_COLLECTION_ID } from "./config";

import { ID, Query } from "appwrite";

export const searchWord = async (search: string) => {

    const query = search.trim().toLowerCase();

    return databases.listDocuments(
        DATABASE_ID,
        SHENG_COLLECTION_ID,
        [
            Query.or([
                Query.equal("word", query),

                Query.equal("english", query),

                Query.equal("swahili", query),

                Query.contains("aliases", [query]),

                Query.search("englishMeaning", query),

                Query.search("swahiliMeaning", query)
            ])
        ]
    );

};



export const getWordsByCategory = async (category: string) => {
  const queries =
    category === "all"
      ? [Query.limit(1000)]
      : [
          Query.equal("category", category),
          Query.limit(1000),
        ];

  const response = await databases.listDocuments(
    DATABASE_ID,
    SHENG_COLLECTION_ID,
    queries
  );

  return response.documents;
};


export const getWordByName = async (word: string) => {
const query = word.trim().toLowerCase();

if (!query) {
return null;
}

const response = await databases.listDocuments(
DATABASE_ID,
SHENG_COLLECTION_ID,
[
Query.or([
Query.equal("word", query),
Query.contains("aliases", [query]),
]),
Query.limit(1),
]
);

return response.documents[0] ?? null;
};



export const subscribeToShengDrops = async (email: string) => {
  return await databases.createDocument(
    DATABASE_ID,
    SUBSCRIBERS_COLLECTION_ID,
    ID.unique(),
    {
      email
    }
  );
};

export const createShengSuggestion = async ({
  word,
  meaning,
  example,
}: {
  word: string;
  meaning: string;
  example?: string;
}) => {
  const cleanWord = word.trim();
  const cleanMeaning = meaning.trim();
  const cleanExample = example?.trim() || "";

  if (!cleanWord || !cleanMeaning) {
    throw new Error("Word and meaning are required.");
  }

  try {
    const suggestion = await databases.createDocument(
      DATABASE_ID,
      SHENGTEZO_COLLECTION_ID,
      ID.unique(),
      {
        word: cleanWord,
        meaning: cleanMeaning,
        example: cleanExample,
        status: "pending",
      }
    );

    return suggestion;

  } catch (error) {
    console.error(
      "Failed to submit Sheng suggestion:",
      error
    );

    throw error;
  }
};