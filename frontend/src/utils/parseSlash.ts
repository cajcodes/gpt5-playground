interface ParseResult {
  handled: boolean;
  payload?: { tool: "image_gen"; prompt: string };
  reset?: boolean;
  systemMessage?: string;
}

export const parseSlashCommand = (input: string): ParseResult => {
  if (!input.startsWith("/")) {
    return { handled: false };
  }

  const [command, ...args] = input.slice(1).split(" ");
  const restOfInput = args.join(" ");

  switch (command) {
    case "image":
      return {
        handled: true,
        payload: {
          tool: "image_gen",
          prompt: restOfInput,
        },
      };
    case "reset":
      return {
        handled: true,
        reset: true,
      };
    case "system":
        return {
            handled: true,
            systemMessage: restOfInput,
        };
    default:
      return { handled: false };
  }
};

