export const siteConfig = {
  name: "羽扬日记",
  shortName: "羽扬",
  description: "我们的私密日记本",
} as const;

export type SiteConfig = typeof siteConfig;
