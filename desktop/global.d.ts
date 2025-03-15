declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const path: string;
  export default path;
}
