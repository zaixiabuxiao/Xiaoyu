export type ChapterCategory =
  | "宅家日常"
  | "外出约会"
  | "旅行探索"
  | "家庭建设"
  | "未来宝宝预备"
  | "沟通与修复"
  | "信仰与价值观"
  | "未来梦想";

export type ChapterStatus = "想做" | "计划中" | "已记录" | "想再来一次";

export type LifeStage = "二人世界" | "迎接宝宝前" | "三个人的小家庭";

export type TodayMode =
  | "今天想宅家"
  | "今天想出去走走"
  | "今天想认真聊聊"
  | "今天有点累";

export type ChapterVolume = {
  id: string;
  number: number;
  title: string;
  lifeStage: LifeStage;
  totalCount: number;
  completedCount: number;
  active: boolean;
};

export type LifeChapter = {
  id: string;
  volumeId: string;
  number: number;
  title: string;
  category: ChapterCategory;
  lifeStage: LifeStage;
  status: ChapterStatus;
  suggestedContext: string;
  meaning: string;
  completedDate?: string;
  location?: string;
  note?: string;
  husbandReflection?: string;
  wifeReflection?: string;
  wantsToRepeat?: boolean;
};

export type TodayRecord = {
  date: string;
  hasOfficialChapter: boolean;
  todayMode?: TodayMode;
  recommendedChapterId?: string;
};

export const chapterVolumes: ChapterVolume[] = [
  {
    id: "v1",
    number: 1,
    title: "二人世界",
    lifeStage: "二人世界",
    totalCount: 100,
    completedCount: 7,
    active: true,
  },
  {
    id: "v2",
    number: 2,
    title: "迎接宝宝前",
    lifeStage: "迎接宝宝前",
    totalCount: 100,
    completedCount: 0,
    active: false,
  },
  {
    id: "v3",
    number: 3,
    title: "三个人的小家庭",
    lifeStage: "三个人的小家庭",
    totalCount: 100,
    completedCount: 0,
    active: false,
  },
];

export const lifeChapters: LifeChapter[] = [
  {
    id: "c01",
    volumeId: "v1",
    number: 1,
    title: "一起做一顿家常晚餐",
    category: "宅家日常",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "周末傍晚，厨房灯亮着的时候。",
    meaning: "家常的味道里，有最稳的安全感。",
    completedDate: "2025-09-12",
    location: "我们的小厨房",
    note: "番茄牛腩，米饭多煮了一杯。",
    husbandReflection: "她切菜的样子格外认真。",
    wifeReflection: "他洗碗的时候哼了歌。",
  },
  {
    id: "c02",
    volumeId: "v1",
    number: 2,
    title: "把家彻底整理一次",
    category: "宅家日常",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "心情有点乱、想重新开始的那种周末。",
    meaning: "整理家，是温柔地整理我们自己。",
    completedDate: "2025-10-05",
    location: "客厅 & 卧室",
    note: "一起扔掉了三袋旧东西。",
  },
  {
    id: "c03",
    volumeId: "v1",
    number: 3,
    title: "在沙发上看一部老电影",
    category: "宅家日常",
    lifeStage: "二人世界",
    status: "想做",
    suggestedContext: "下雨的晚上，泡两杯热饮。",
    meaning: "慢下来，是我们最稀缺的奢侈。",
  },
  {
    id: "c04",
    volumeId: "v1",
    number: 4,
    title: "去逛一家安静的书店",
    category: "外出约会",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "工作日的下午请假半天。",
    meaning: "在别人写的故事里，藏一段我们自己的。",
    completedDate: "2025-11-20",
    location: "城西的小书店",
    note: "她买了一本散文，他买了一本旧地图集。",
  },
  {
    id: "c05",
    volumeId: "v1",
    number: 5,
    title: "在城市里散步看夜景",
    category: "外出约会",
    lifeStage: "二人世界",
    status: "计划中",
    suggestedContext: "夏夜风刚开始凉的时候。",
    meaning: "我们走过的每一条街，都会变成回家的路。",
  },
  {
    id: "c06",
    volumeId: "v1",
    number: 6,
    title: "第一次短途自驾",
    category: "旅行探索",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "选一个不太远的小城。",
    meaning: "出发本身，就是一种相信。",
    completedDate: "2026-01-02",
    location: "近郊小镇",
    note: "导航绕路了一次，反而看到一片很好的山。",
    wantsToRepeat: true,
  },
  {
    id: "c07",
    volumeId: "v1",
    number: 7,
    title: "去海边待一整天",
    category: "旅行探索",
    lifeStage: "二人世界",
    status: "想做",
    suggestedContext: "不安排任何行程，只看海。",
    meaning: "海会替我们记住那天的风。",
  },
  {
    id: "c08",
    volumeId: "v1",
    number: 8,
    title: "一起照顾一盆植物",
    category: "家庭建设",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "买一盆容易养活的，先从这一盆开始。",
    meaning: "有点点责任的事，最让人心安。",
    completedDate: "2025-08-18",
    location: "阳台",
    note: "薄荷叶子已经多到可以泡茶了。",
  },
  {
    id: "c09",
    volumeId: "v1",
    number: 9,
    title: "整理我们的回忆相册",
    category: "家庭建设",
    lifeStage: "二人世界",
    status: "想再来一次",
    suggestedContext: "下雨天，泡杯茶，开始翻照片。",
    meaning: "回忆要被认真挑选过，才会变成礼物。",
    wantsToRepeat: true,
  },
  {
    id: "c10",
    volumeId: "v1",
    number: 10,
    title: "写一封信给未来的宝宝",
    category: "未来宝宝预备",
    lifeStage: "二人世界",
    status: "想做",
    suggestedContext: "在一个心情很温柔的夜晚。",
    meaning: "在他还没来之前，先准备好爱他的语言。",
  },
  {
    id: "c11",
    volumeId: "v1",
    number: 11,
    title: "学一道适合三个人吃的菜",
    category: "未来宝宝预备",
    lifeStage: "二人世界",
    status: "计划中",
    suggestedContext: "找一个周末的下午一起练。",
    meaning: "为还没出现的人，先腾出一道菜的位置。",
  },
  {
    id: "c12",
    volumeId: "v1",
    number: 12,
    title: "把心里不舒服的事说出来",
    category: "沟通与修复",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "睡前关灯之前的十分钟。",
    meaning: "说出口的那一刻，关系就开始变厚。",
    completedDate: "2025-12-08",
    note: "聊到一半笑出来了。",
  },
  {
    id: "c13",
    volumeId: "v1",
    number: 13,
    title: "一周一次的小复盘",
    category: "沟通与修复",
    lifeStage: "二人世界",
    status: "想再来一次",
    suggestedContext: "周日晚饭后，泡两杯茶。",
    meaning: "把这一周轻轻看完，再翻到下一页。",
    wantsToRepeat: true,
  },
  {
    id: "c14",
    volumeId: "v1",
    number: 14,
    title: "一起读一段经文",
    category: "信仰与价值观",
    lifeStage: "二人世界",
    status: "已记录",
    suggestedContext: "早晨吃早饭之前。",
    meaning: "先安静下来，再开始这一天。",
    completedDate: "2026-02-14",
    note: "读到一句很久没注意的经文。",
  },
  {
    id: "c15",
    volumeId: "v1",
    number: 15,
    title: "写下我们的家庭准则",
    category: "信仰与价值观",
    lifeStage: "二人世界",
    status: "计划中",
    suggestedContext: "在很认真聊完的那个晚上。",
    meaning: "我们是哪种人，要先一起说清楚。",
  },
  {
    id: "c16",
    volumeId: "v1",
    number: 16,
    title: "列出十年后想一起去的地方",
    category: "未来梦想",
    lifeStage: "二人世界",
    status: "想做",
    suggestedContext: "不限制现实，先大胆写。",
    meaning: "梦想被写下来，就开始有重量。",
  },
  {
    id: "c17",
    volumeId: "v1",
    number: 17,
    title: "一起想象未来的家",
    category: "未来梦想",
    lifeStage: "二人世界",
    status: "计划中",
    suggestedContext: "搬家、整理或换季的某一天。",
    meaning: "想象的家，会一点点长成真实的家。",
  },
];

export const todayRecord: TodayRecord = {
  date: "2026-05-07",
  hasOfficialChapter: false,
  todayMode: "今天想宅家",
  recommendedChapterId: "c03",
};

export function getActiveVolume(): ChapterVolume {
  return chapterVolumes.find((v) => v.active) ?? chapterVolumes[0];
}

export function countByStatus(status: ChapterStatus, volumeId?: string) {
  return lifeChapters.filter(
    (c) => c.status === status && (!volumeId || c.volumeId === volumeId),
  ).length;
}

export function getCompletedChapters(volumeId?: string) {
  return lifeChapters
    .filter((c) => c.status === "已记录" && (!volumeId || c.volumeId === volumeId))
    .sort((a, b) => (b.completedDate ?? "").localeCompare(a.completedDate ?? ""));
}
