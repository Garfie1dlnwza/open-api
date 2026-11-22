import type { Category } from "@thai-open-api/schema";
import { Landmark, Leaf, Map, Wallet, Zap, type LucideIcon } from "lucide-react";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  government: Landmark,
  finance: Wallet,
  environment: Leaf,
  geography: Map,
  energy: Zap,
};
