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

export const relationshipDates = {
  metDate: "2022-09-10",
  togetherDate: "2023-03-19",
  engagementDate: "2024-05-15",
  timezone: "America/Los_Angeles",
} as const;

export const chapterVolumes: ChapterVolume[] = [
  {
    id: "v1",
    number: 1,
    title: "二人世界",
    lifeStage: "二人世界",
    totalCount: 100,
    completedCount: 0,
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

type ChapterSeed = {
  category: ChapterCategory;
  title: string;
  context: string;
  meaning: string;
};

const SEEDS: ChapterSeed[] = [
  // A. 宅家日常 (1-20)
  { category: "宅家日常", title: "一起吃一顿不看手机的晚餐", context: "周末傍晚，厨房灯亮的时候。", meaning: "慢慢吃一顿饭，是给彼此的小礼物。" },
  { category: "宅家日常", title: "一起做一次早餐", context: "周末睡到自然醒之后。", meaning: "一起准备的早餐，会甜一点。" },
  { category: "宅家日常", title: "一起在家看一部老电影", context: "下雨的晚上，泡两杯热饮。", meaning: "慢下来，是我们最稀缺的奢侈。" },
  { category: "宅家日常", title: "一起做一顿火锅", context: "心情想热闹一点的某个晚上。", meaning: "一锅咕嘟着，话也多一些。" },
  { category: "宅家日常", title: "一起整理一面柜子", context: "心情乱了想重新开始的时候。", meaning: "整理柜子，也是整理自己。" },
  { category: "宅家日常", title: "一起洗衣服、叠衣服", context: "周日下午阳光好的时候。", meaning: "把生活折叠整齐，也很重要。" },
  { category: "宅家日常", title: "一起给家里换一个小装饰", context: "想让家有点新鲜的那一天。", meaning: "小小的改变，也是新的生活。" },
  { category: "宅家日常", title: "一起在家喝咖啡或奶茶", context: "没有外出计划的下午。", meaning: "一杯热的，就够慢的下午。" },
  { category: "宅家日常", title: "一起做一次深夜宵夜", context: "都还睡不着的某个晚上。", meaning: "凌晨的厨房，最像家。" },
  { category: "宅家日常", title: "一起完成一次大扫除", context: "季节快换的某个周末。", meaning: "把家擦亮，再开始一段日子。" },
  { category: "宅家日常", title: "一起整理婚礼照片", context: "想念那一天的某个晚上。", meaning: "把那一天，再留下来一次。" },
  { category: "宅家日常", title: "一起做一顿对方喜欢吃的菜", context: "知道对方今天特别累的时候。", meaning: "用味道，把人留下来。" },
  { category: "宅家日常", title: "一起宅家一整天，不安排任何事", context: "周末完全留给我们的那一天。", meaning: "什么都不做，也是一种用心。" },
  { category: "宅家日常", title: "一起布置一个舒服的角落", context: "想给家里加一处呼吸的地方。", meaning: "一个小角落，是我们的小岛。" },
  { category: "宅家日常", title: "一起听一张专辑或敬拜歌单", context: "心想被熨平的那个夜晚。", meaning: "安静的歌里，藏着我们。" },
  { category: "宅家日常", title: "一起整理未来旅行照片墙", context: "阳光好的下午，挑几张照片。", meaning: "把走过的路，挂在家里。" },
  { category: "宅家日常", title: "一起做一次家庭预算", context: "月初心情比较清爽的时候。", meaning: "数字背后，是我们想要的生活。" },
  { category: "宅家日常", title: "一起计划下个月的生活安排", context: "月底回头看完上一个月。", meaning: "一起决定接下来怎么过日子。" },
  { category: "宅家日常", title: "一起写下本周最感谢对方的事", context: "周日睡前的安静五分钟。", meaning: "一句感谢，能撑过整周。" },
  { category: "宅家日常", title: "一起拍一张普通但真实的宅家照片", context: "谁刚好穿着旧 T 恤的时候。", meaning: "不修图的样子，也是我们。" },

  // B. 外出约会 (21-35)
  { category: "外出约会", title: "一起去一家没去过的咖啡店", context: "工作日下午挤出半天。", meaning: "一杯陌生的咖啡，是冒险。" },
  { category: "外出约会", title: "一起开车去看日落", context: "天气预报很美的傍晚。", meaning: "太阳落下时，世界更轻。" },
  { category: "外出约会", title: "一起去海边走走", context: "城里待久了想换空气的那天。", meaning: "海会替我们记住今天的风。" },
  { category: "外出约会", title: "一起去一次夜市或小吃街", context: "下班后还想热闹一会儿。", meaning: "烟火气里有真实的我们。" },
  { category: "外出约会", title: "一起去一家正式一点的餐厅", context: "想给某个普通日子加点仪式感。", meaning: "一顿好饭，也是一个纪念日。" },
  { category: "外出约会", title: "一起去逛书店", context: "周末下午想安静一会儿。", meaning: "在别人写的故事里，藏一段我们的。" },
  { category: "外出约会", title: "一起去看一场电影", context: "有想看的新片上映的那个周末。", meaning: "黑暗里，并肩坐着也算礼物。" },
  { category: "外出约会", title: "一起去农夫市场", context: "周六清晨愿意早起的那一天。", meaning: "选一样新鲜，是日常的爱意。" },
  { category: "外出约会", title: "一起去一个公园野餐", context: "春天或秋天，天气刚好。", meaning: "草地上，时间也变软。" },
  { category: "外出约会", title: "一起去拍一组日常情侣照", context: "不必特别装扮的那一天。", meaning: "照片里是我们最自然的样子。" },
  { category: "外出约会", title: "一起复刻一次刚认识时的约会", context: "想起当年是怎么开始的那一天。", meaning: "走一次老路，记一次新的爱。" },
  { category: "外出约会", title: "一起去买一件家里需要的小东西", context: "周末顺路去家居店。", meaning: "一起选东西，也是建造的一部分。" },
  { category: "外出约会", title: "一起去一个陌生社区散步", context: "想给周末多一点新鲜感的时候。", meaning: "走进陌生地方，也是冒险。" },
  { category: "外出约会", title: "一起安排一次没有手机的约会", context: "想要好好看见对方的那一天。", meaning: "关掉屏幕，世界变安静。" },
  { category: "外出约会", title: "一起为对方准备一次小惊喜", context: "普通的某天，没有理由也行。", meaning: "不用大，一束花就够暖。" },

  // C. 旅行探索 (36-50)
  { category: "旅行探索", title: "一起完成一次短途自驾", context: "选一个不太远的小城。", meaning: "出发本身，就是一种相信。" },
  { category: "旅行探索", title: "一起去一个新的城市", context: "假期排开，给彼此一个旅行。", meaning: "在新城市里，我们仍是我们。" },
  { category: "旅行探索", title: "一起去山里住一晚", context: "想离开城市灯光的那个周末。", meaning: "山里很静，话变得简单。" },
  { category: "旅行探索", title: "一起去海边住一晚", context: "想听海的那个周末。", meaning: "海水旁边，时间慢下来。" },
  { category: "旅行探索", title: "一起规划一次周年旅行", context: "提前一两个月开始想。", meaning: "旅行本身，是给我们的礼物。" },
  { category: "旅行探索", title: "一起去一次国家公园", context: "假期长一点的时候。", meaning: "大自然让我们重新变小。" },
  { category: "旅行探索", title: "一起在旅行中拍一段视频", context: "风景特别好或心情特别好时。", meaning: "让以后的我们也能回到这里。" },
  { category: "旅行探索", title: "一起做一本旅行小相册", context: "旅行回来一周内整理。", meaning: "把走过的路，装订起来。" },
  { category: "旅行探索", title: "一起在陌生城市吃一顿早餐", context: "出门第一天的清晨。", meaning: "陌生餐桌，最像家。" },
  { category: "旅行探索", title: "一起看一次日出", context: "旅行里愿意早起的那一天。", meaning: "太阳升起时，从头开始。" },
  { category: "旅行探索", title: "一起看一次星星", context: "远离城市的某个夜晚。", meaning: "星空提醒我们，世界很大。" },
  { category: "旅行探索", title: "一起走一条没计划过的路", context: "旅行到一半愿意冒险的时候。", meaning: "弯路里，藏着没想到的风景。" },
  { category: "旅行探索", title: "一起买一个旅行纪念品", context: "在某家小店一眼喜欢上。", meaning: "一件小物，把那一天带回家。" },
  { category: "旅行探索", title: "一起记录一次旅行中最开心的小瞬间", context: "旅行回来还热乎着的晚上。", meaning: "把那一刻轻轻按下保存。" },
  { category: "旅行探索", title: "一起讨论下一次想去哪里", context: "旅行回来不久的某个晚上。", meaning: "期待，是把我们再粘在一起。" },

  // D. 家庭建设 (51-65)
  { category: "家庭建设", title: "一起整理家庭财务", context: "月底安静的某个晚上。", meaning: "数字之外，是我们想过的日子。" },
  { category: "家庭建设", title: "一起制定一年的家庭目标", context: "新年的某个安静下午。", meaning: "一年的方向，由我们一起决定。" },
  { category: "家庭建设", title: "一起建立一个固定家庭传统", context: "想给我们留点仪式感的那天。", meaning: "每年都做的一件事，会变成根。" },
  { category: "家庭建设", title: "一起规划家里的收纳系统", context: "心情想井井有条的那个周末。", meaning: "一个家，从收纳开始变温柔。" },
  { category: "家庭建设", title: "一起讨论未来住在哪里", context: "想象未来生活的某个夜晚。", meaning: "落脚的地方，是我们的根。" },
  { category: "家庭建设", title: "一起讨论未来家庭生活方式", context: "一周难得都不忙的晚上。", meaning: "怎么过日子，也是我们的选择。" },
  { category: "家庭建设", title: "一起选择一件重要家具或家用品", context: "准备好为家添东西的那一天。", meaning: "每件挑过的东西，都是同意。" },
  { category: "家庭建设", title: "一起招待朋友来家里吃饭", context: "心情好、时间松的那个周末。", meaning: "让朋友看见，我们的小家是真的。" },
  { category: "家庭建设", title: "一起完成一次家庭采购", context: "周末超市最不挤的时间。", meaning: "推着同一辆车，是一种合拍。" },
  { category: "家庭建设", title: "一起制定紧急情况备用计划", context: "想多照顾彼此的某个下午。", meaning: "预先想好，是另一种爱。" },
  { category: "家庭建设", title: "一起记录我们的家庭价值观", context: "聊得很深的某个夜晚。", meaning: "我们是哪种人，要写清楚。" },
  { category: "家庭建设", title: "一起建立家庭照片档案", context: "想念旧照片的某个下午。", meaning: "把回忆放进抽屉，能找得到。" },
  { category: "家庭建设", title: "一起整理证件和重要文件", context: "心情很整理的那一天。", meaning: "把生活的纸条，都放好。" },
  { category: "家庭建设", title: "一起讨论未来五年的方向", context: "一年开始或者结束的时候。", meaning: "五年，是值得一起想的距离。" },
  { category: "家庭建设", title: "一起写下我们想成为怎样的家庭", context: "都想家庭的某个安静晚上。", meaning: "写下来，就开始往那里走。" },

  // E. 未来宝宝预备 (66-75)
  { category: "未来宝宝预备", title: "一起聊聊我们为什么想要孩子", context: "心很柔软的某个夜晚。", meaning: "在他来之前，先把心准备好。" },
  { category: "未来宝宝预备", title: "一起讨论什么时候适合迎接孩子", context: "真心想认真聊的那一天。", meaning: "不催促，但要诚实。" },
  { category: "未来宝宝预备", title: "一起聊聊如果有宝宝，我们最想给他的是什么", context: "看到别人家小孩很可爱时。", meaning: "想给的是爱，不是完美。" },
  { category: "未来宝宝预备", title: "一起讨论未来的育儿分工", context: "不疲惫的某个晚上。", meaning: "提前说清，将来不慌。" },
  { category: "未来宝宝预备", title: "一起了解一次孕前健康准备", context: "准备开始认真考虑的时候。", meaning: "健康，是给宝宝最早的爱。" },
  { category: "未来宝宝预备", title: "一起为未来宝宝写一封信", context: "一个心很温柔的夜晚。", meaning: "在他还没来之前，先准备好语言。" },
  { category: "未来宝宝预备", title: "一起想几个喜欢的名字", context: "不用决定，只是想象。", meaning: "名字，是父母给的第一句话。" },
  { category: "未来宝宝预备", title: "一起讨论孩子出生后，如何保留二人世界", context: "想到这件事的那个晚上。", meaning: "我们也要被彼此记得。" },
  { category: "未来宝宝预备", title: "一起整理一个未来宝宝愿望清单", context: "心很期待的那一天。", meaning: "一份清单，是慢慢做的家。" },
  { category: "未来宝宝预备", title: "一起为未来家庭做一次祷告或祝福", context: "周日晚饭后的安静时间。", meaning: "把家放在一份更大的爱里。" },

  // F. 沟通与修复 (76-85)
  { category: "沟通与修复", title: "一起聊聊最近最大的压力", context: "都还撑得住的那个晚上。", meaning: "说出来，压力就软一半。" },
  { category: "沟通与修复", title: "一起说出最近对方做得好的三件事", context: "心情比较好的那个晚饭后。", meaning: "看见对方，也是一种深爱。" },
  { category: "沟通与修复", title: "一起聊一次我希望你更懂我的地方", context: "都愿意听完的某个晚上。", meaning: "慢慢说，对方就慢慢懂。" },
  { category: "沟通与修复", title: "一起复盘一次争吵，但不互相指责", context: "都已经冷静一两天后。", meaning: "复盘是为了下一次更轻。" },
  { category: "沟通与修复", title: "一起写下我们的沟通约定", context: "都同意要更好那一天。", meaning: "写下来的话，比较算数。" },
  { category: "沟通与修复", title: "一起认真听对方说 20 分钟", context: "谁今天心里满满的时候。", meaning: "被听见，比被解决更重要。" },
  { category: "沟通与修复", title: "一起为一次误会道歉并和好", context: "都愿意先说那一句的那天。", meaning: "道歉，是把关系再缝一针。" },
  { category: "沟通与修复", title: "一起讨论我们各自的情绪按钮", context: "心很坦诚的那个晚上。", meaning: "知道按钮在哪，就少踩一些。" },
  { category: "沟通与修复", title: "一起聊聊原生家庭对我们的影响", context: "心愿意打开的那个晚上。", meaning: "看见来路，才走得更远。" },
  { category: "沟通与修复", title: "一起约定吵架时不说伤人的话", context: "都心疼对方的那个晚上。", meaning: "一句轻一点，就少一道疤。" },

  // G. 信仰与价值观 (86-93)
  { category: "信仰与价值观", title: "一起做一次感恩祷告", context: "一日忙完的那个晚上。", meaning: "感恩，让平凡变成礼物。" },
  { category: "信仰与价值观", title: "一起为家庭方向祷告", context: "心里想求带领的某个晚上。", meaning: "把家交托，路就轻了。" },
  { category: "信仰与价值观", title: "一起参加一次主日聚会", context: "周日清晨愿意早起的那一天。", meaning: "一起被牧养，是同走一段路。" },
  { category: "信仰与价值观", title: "一起帮助一个有需要的人", context: "看见有需要的那一刻。", meaning: "一点点善意，也是家的延伸。" },
  { category: "信仰与价值观", title: "一起做一次公益或服侍", context: "周末有空又有心的那一天。", meaning: "把爱往家外面走一走。" },
  { category: "信仰与价值观", title: "一起读一段经文并分享感受", context: "早晨吃早饭之前。", meaning: "先安静，再开始这一天。" },
  { category: "信仰与价值观", title: "一起记录一次被神带领的时刻", context: "回头看见痕迹的那一天。", meaning: "把神的脚印留下来。" },
  { category: "信仰与价值观", title: "一起写下家庭最重要的三个价值观", context: "都想认真的那个晚上。", meaning: "写下来，就少摇摆。" },

  // H. 未来梦想 (94-100)
  { category: "未来梦想", title: "一起写下 10 个未来愿望", context: "心很大胆的那个晚上。", meaning: "写下来，梦想就开始有重量。" },
  { category: "未来梦想", title: "一起规划一次五周年或十周年旅行", context: "提前一年开始想。", meaning: "期待，是给现在的礼物。" },
  { category: "未来梦想", title: "一起设计未来家的样子", context: "搬家或换季的某个晚上。", meaning: "想象的家，会一点点长成真实。" },
  { category: "未来梦想", title: "一起拍一段给未来自己的视频", context: "一个心情特别好的晚上。", meaning: "让未来的我们听见今天。" },
  { category: "未来梦想", title: "一起写一封给十年后的我们的信", context: "一个心很安静的夜晚。", meaning: "信封封好，留给十年后拆。" },
  { category: "未来梦想", title: "一起完成一个属于我们的项目", context: "都同意值得做那一件事。", meaning: "一起做完一件事，是另一种结合。" },
  { category: "未来梦想", title: "一起决定下一阶段最重要的一件事", context: "一个阶段结束的那个晚上。", meaning: "选一件事，是给下一段的方向。" },
];

export const lifeChapters: LifeChapter[] = SEEDS.map((s, i) => ({
  id: `c${String(i + 1).padStart(3, "0")}`,
  volumeId: "v1",
  number: i + 1,
  title: s.title,
  category: s.category,
  lifeStage: "二人世界",
  status: "想做",
  suggestedContext: s.context,
  meaning: s.meaning,
}));

export const todayRecord: TodayRecord = {
  date: "2026-05-08",
  hasOfficialChapter: false,
  todayMode: "今天想宅家",
  recommendedChapterId: "c001",
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
