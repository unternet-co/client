const display = {
  standalone: `The process is opened in a persistent, prominent space in the UI. Use for interactive applications and documents, and where ample space or focus is required. (E.g. opening a website, or creating a document)`,
  inline: `The process is displayed to the user inline in the thread. Use where a rich display is available and would be beneficial to the user, but no focus or intesive interaction is required. (E.g. showing a map of cafes)`,
  hidden: `The process is not displayed directly to the user, the user instead only sees that a tool call has taken place. Use for background tasks where you need the information for a task, but the user doesn't need to see it, or where you will summarize it yourself. (E.g. conducting a web search)`,
};

export const flags = { display };
