export type ChatMessage =
  | {
      id: string;
      type: "user";
      text: string;
    }
  | {
      id: string;
      type: "assistant";
      result: any;
    };