import { useState } from "react";
import { searchWord } from "../appwrite/api";

export const useSearch = () => {
  const [loading, setLoading] = useState(false);

  const search = async (
    word: string,
    deepSearch = false
  ) => {
    if (!word.trim()) return null;

    setLoading(true);

    try {
      // -----------------------------------------
      // NORMAL SEARCH
      // -----------------------------------------

      const response = await searchWord(word);

      if (response.documents.length > 0) {
        return response.documents[0];
      }

      // -----------------------------------------
      // DEEP SEARCH
      // -----------------------------------------

      if (deepSearch) {
        console.log(
          `Deep searching for: ${word}`
        );

        /*
         * AI DEEP SEARCH GOES HERE
         *
         * For now we return null.
         *
         * We'll connect this to your AI endpoint/API
         * so it can rethink the word instead of doing
         * another exact Appwrite lookup.
         */

        return null;
      }

      return null;

    } catch (err) {
      console.error(err);
      return null;

    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    search,
  };
};