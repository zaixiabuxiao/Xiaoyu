type Scene =
  | "couple"
  | "kitchen"
  | "date"
  | "walk"
  | "park"
  | "night"
  | "note"
  | "cafe";

const tints: Record<Scene, [string, string]> = {
  couple: ["#F5DBA6", "#ECC983"],
  kitchen: ["#E8A86B", "#C98449"],
  date: ["#5B3A6B", "#3A2548"],
  walk: ["#9EC2C5", "#6F9AA0"],
  park: ["#CDE0A3", "#A8C777"],
  night: ["#3A4778", "#252F55"],
  note: ["#FFF5DC", "#F0E0B6"],
  cafe: ["#2A2C4A", "#15182B"],
};

const categoryToScene: Record<string, Scene> = {
  宅家日常: "kitchen",
  外出约会: "date",
  旅行探索: "walk",
  家庭建设: "park",
  未来宝宝预备: "note",
  沟通与修复: "couple",
  信仰与价值观: "night",
  未来梦想: "cafe",
};

type Props = {
  scene?: Scene;
  category?: string;
  tag?: string;
  label?: string;
  height?: number;
  className?: string;
};

export function getSceneForCategory(category?: string): Scene {
  if (!category) return "couple";
  return categoryToScene[category] ?? "couple";
}

export default function MemoryThumbnail({
  scene,
  category,
  tag,
  label,
  height = 96,
  className = "",
}: Props) {
  const resolved = scene ?? getSceneForCategory(category);
  const [a, b] = tints[resolved];
  return (
    <div
      className={`relative overflow-hidden border-2 border-navy rounded-lg ${className}`}
      style={{
        height,
        background: `repeating-linear-gradient(45deg, ${a} 0 8px, ${b} 8px 16px)`,
        boxShadow:
          "inset 0 0 0 2px #FFF7DF, inset 0 0 0 4px #ECC983",
      }}
      aria-hidden="true"
    >
      {tag ? (
        <span className="absolute top-1 left-1 bg-navy/85 text-cream font-pixel text-[8px] px-1.5 py-0.5 rounded-sm">
          {tag}
        </span>
      ) : null}
      {label ? (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-navy/85 text-cream font-display text-[11px] px-2 py-0.5 rounded-sm whitespace-nowrap max-w-[90%] overflow-hidden text-ellipsis">
          {label}
        </span>
      ) : null}
    </div>
  );
}
