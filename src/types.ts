export interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: "all" | "rice" | "soup" | "side" | "dessert";
  calories: number;
  nutrition: Nutrition;
  allergens: string[];
  image: string;
  info?: string;
  selected?: boolean;
}

export interface Meal {
  id: string;
  schoolName: string; // 반드시 "씨마스고등학교"로 유지
  date: Date;
  dateKey: string; // "YYYYMMDD"
  dayOfWeek: string; // "월", "화", "수", "목", "금"
  mealType: "LUNCH" | "DINNER";
  title: string;
  dishes: string[];
  totalCalories: number;
  nutrition: Nutrition;
  allergens: string[];
  image: string;
}

export interface DailyMealData {
  dateKey: string;
  lunch: Meal;
  dinner: Meal;
  isWeekend?: boolean;
}
