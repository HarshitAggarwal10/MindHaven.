import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Flower2,
  Heart,
  HeartHandshake,
  Leaf,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";

const ICONS = [
  { match: ["anxiety", "panic", "stress"], Icon: Wind, tone: "from-[#C1E8E3] to-[#E0F7F4]", ink: "text-teal-700" },
  { match: ["depression", "grief", "loneliness"], Icon: HeartHandshake, tone: "from-[#F4D6BE] to-[#FFF1E5]", ink: "text-rose-700" },
  { match: ["sleep", "burnout"], Icon: Moon, tone: "from-[#D8D5EE] to-[#F2EFFA]", ink: "text-indigo-700" },
  { match: ["adhd", "ocd", "bipolar", "eating-disorder"], Icon: Brain, tone: "from-[#D6E4D1] to-[#EEF5E8]", ink: "text-emerald-800" },
  { match: ["ptsd"], Icon: Shield, tone: "from-[#D7E8EC] to-[#F0F7F7]", ink: "text-cyan-800" },
  { match: ["self-esteem"], Icon: Sparkles, tone: "from-[#FFE5B4] to-[#FFF5E1]", ink: "text-amber-700" },
  { match: ["student"], Icon: BookOpen, tone: "from-[#D1C4E9] to-[#EDE7F6]", ink: "text-violet-700" },
  { match: ["professional"], Icon: BriefcaseBusiness, tone: "from-[#F4D6BE] to-[#FFF1E5]", ink: "text-orange-700" },
  { match: ["parent", "teen"], Icon: Heart, tone: "from-[#F4D6BE] to-[#FFF1E5]", ink: "text-rose-700" },
  { match: ["meditation"], Icon: Flower2, tone: "from-[#C1E8E3] to-[#E0F7F4]", ink: "text-teal-700" },
  { match: ["wellness", "general"], Icon: Sun, tone: "from-[#FFE5B4] to-[#FFF5E1]", ink: "text-amber-700" },
  { match: [], Icon: Leaf, tone: "from-[#B0BD9E] to-[#E5EEDC]", ink: "text-emerald-800" },
];

export default function CommunityIcon({ slug = "", name = "", size = 26, className = "" }) {
  const key = `${slug} ${name}`.toLowerCase();
  const choice = ICONS.find(({ match }) => match.some((topic) => key.includes(topic))) || ICONS[ICONS.length - 1];
  const { Icon, tone, ink } = choice;

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} ${className}`}>
      <Icon aria-hidden="true" className={ink} size={size} strokeWidth={1.7} />
    </span>
  );
}
