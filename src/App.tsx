import { useState, useEffect } from "react";
import { 
  Utensils, 
  Calendar as CalendarIcon, 
  Calculator, 
  User, 
  Bell, 
  ChevronRight, 
  CheckCircle, 
  Heart, 
  Sparkles, 
  Share2, 
  Plus, 
  X, 
  Check, 
  LogOut, 
  UserCheck, 
  HelpCircle,
  FileText,
  AlertTriangle,
  Clock,
  Edit2
} from "lucide-react";

import { Meal, DailyMealData, MenuItem, Nutrition } from "./types";
import { 
  getTodayKST, 
  formatKoreanDate, 
  formatDateKey, 
  getWeekDates, 
  getWeekOfMonth, 
  getDefaultSelectedDate, 
  getKoreanDayOfWeek 
} from "./utils/dateUtils";
import { generateWeeklyMeals, MOCK_MENU_ITEMS } from "./data/mockMeals";

// 알레르기 원인 성분 유틸
const ALLERGY_KEYWORDS = ["우유", "땅콩", "대두", "밀", "돼지고기", "쇠고기", "난류", "생선", "조개류", "새우", "게"];

export default function App() {
  // 오늘 날짜 KST 계산
  const [today] = useState<Date>(() => getTodayKST());
  
  // 5일치 동적 급식 생성
  const [weeklyMeals] = useState<DailyMealData[]>(() => generateWeeklyMeals(today));
  
  // 현재 탭 관리: 'home' | 'calendar' | 'calculate' | 'profile'
  const [activeTab, setActiveTab] = useState<"home" | "calendar" | "calculate" | "profile">("home");
  
  // 식단표 탭에서 선택된 날짜 (초기값은 평일 기준 오늘, 주말이면 다음주 월요일)
  const [selectedDate, setSelectedDate] = useState<Date>(() => getDefaultSelectedDate(today));
  
  // 하트(좋아요) 누른 급식 아이디 보관
  const [likedMeals, setLikedMeals] = useState<Record<string, boolean>>({});

  // 프로필 관리 영역
  const [studentInfo, setStudentInfo] = useState({
    name: "김학생",
    grade: "2",
    classNum: "3",
    seatNum: "15"
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...studentInfo });

  // 알레르기 알림 설정 관리 영역
  const [allergyAlertEnabled, setAllergyAlertEnabled] = useState(true);
  const [myAllergies, setMyAllergies] = useState<string[]>(["우유", "땅콩"]);
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [showAllergyAddInput, setShowAllergyAddInput] = useState(false);

  // 일일 급식 알림 토글
  const [dailyNotificationEnabled, setDailyNotificationEnabled] = useState(true);
  const [notiTime, setNotiTime] = useState("08:00");

  // 영양계산 탭 전용 상태
  const [calculatorMenuItems, setCalculatorMenuItems] = useState<MenuItem[]>(() => MOCK_MENU_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "rice" | "soup" | "side" | "dessert">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 사용자 이용 정보 모달용 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");

  // 주말 여부 파악
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  // 토스트 메시지 도우미
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // 급식 이름 정제용 헬퍼 (숫자 및 특수 기호 제거)
  const cleanDishName = (dish: string): string => {
    return dish.replace(/[0-9.*]/g, '').trim();
  };

  // 영양 성분 실시간 계산용 (영양계산 탭)
  const calculatedStats = calculatorMenuItems.reduce((acc, item) => {
    if (item.selected) {
      acc.calories += item.calories;
      acc.protein += item.nutrition.protein;
      acc.carbs += item.nutrition.carbs;
      acc.fat += item.nutrition.fat;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // 식단 리스트에서 특정 날짜 급식 가져오기
  const getMealByDate = (date: Date) => {
    const key = formatDateKey(date);
    return weeklyMeals.find(m => m.dateKey === key);
  };

  // 홈 화면에 보여줄 급식 (오늘 주말이면 다음 급식일 식단을 타겟)
  const displayDate = isWeekend ? getDefaultSelectedDate(today) : today;
  const currentWeekInfo = getWeekOfMonth(displayDate);
  const activeMealPlan = getMealByDate(displayDate);

  // 좋아요 클릭 핸들러
  const handleLikeToggle = (mealId: string) => {
    const isLiked = !likedMeals[mealId];
    setLikedMeals(prev => ({ ...prev, [mealId]: isLiked }));
    if (isLiked) {
      triggerToast("💖 오늘의 식단을 즐겨찾기에 보관했습니다!");
    } else {
      triggerToast("🤍 즐겨찾기 보관을 해제했습니다.");
    }
  };

  // 알레르기 키워드 추가
  const handleAddAllergy = () => {
    const trimmed = newAllergyInput.trim();
    if (!trimmed) return;
    if (myAllergies.includes(trimmed)) {
      triggerToast("이미 등록된 알레르기 성분입니다.");
      return;
    }
    setMyAllergies(prev => [...prev, trimmed]);
    setNewAllergyInput("");
    setShowAllergyAddInput(false);
    triggerToast(`🌾 [${trimmed}] 경고가 리스트에 추가되었습니다.`);
  };

  // 알레르기 삭제
  const handleRemoveAllergy = (item: string) => {
    setMyAllergies(prev => prev.filter(a => a !== item));
    triggerToast(`🗑️ ${item} 알레르기가 제외되었습니다.`);
  };

  // 급식 내 알레르기 유무 체크 도우미
  const checkAllergyWarning = (allergens: string[] = []) => {
    if (!allergyAlertEnabled) return false;
    return allergens.some(val => myAllergies.includes(val));
  };

  // 프로필 정보 저장
  const handleSaveProfile = () => {
    if (!tempProfile.name.trim()) {
      triggerToast("이름을 입력해 주세요.");
      return;
    }
    setStudentInfo({ ...tempProfile });
    setIsEditingProfile(false);
    triggerToast("👤 학생 정보가 실시간 반영되었습니다!");
  };

  // 계산기 메뉴 선택 toggle
  const handleToggleCalculatorItem = (id: string) => {
    setCalculatorMenuItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#201b11] font-sans pb-28 pt-16 selection:bg-[#c9f17c] selection:text-[#3c5500]">
      
      {/* 1. 글로벌 헤더 (TopAppBar) */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-5 py-3.5 bg-[#fff8f3]/90 backdrop-blur-md border-b border-[#ede1d1] transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#3c5500] text-[#c9f17c] rounded-xl flex items-center justify-center shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#3c5500] font-bold block uppercase tracking-wider mb-[-2px]">CEAMAS HIGH SCHOOL</span>
            <h1 className="text-sm font-extrabold tracking-tight text-[#3c5500]">씨마스고등학교 급식</h1>
          </div>
        </div>

        {/* 상단 알림/캘린더 퀵 이동 */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              setActiveTab("calendar");
              setSelectedDate(getDefaultSelectedDate(today));
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#747967] hover:bg-[#fef2e2] transition-colors relative"
            title="주간 식단 이동"
          >
            <CalendarIcon className="w-5 h-5 text-[#3c5500]" />
          </button>
          
          <button 
            onClick={() => {
              setActiveTab("profile");
              triggerToast("🔔 우측 상단 알림: 정상 작동 중");
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#747967] hover:bg-[#fef2e2] transition-colors relative"
            title="프로필 및 알림"
          >
            <Bell className="w-5 h-5 text-[#3c5500]" />
            {allergyAlertEnabled && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 바디 */}
      <main className="max-w-md mx-auto px-5 mt-4 space-y-6">

        {/* 2-1. 홈 탭 (Home Layout) */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 상단 주차 안내 타이틀 */}
            <div className="flex justify-between items-end border-b border-[#ede1d1] pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#3c5500] uppercase tracking-wider">TODAY'S SELECTION</span>
                <h2 className="text-2xl font-black text-[#201b11]">{currentWeekInfo} 급식</h2>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 bg-[#d2ea7a] text-[#3e4c00] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Asia/Seoul KST
                </span>
              </div>
            </div>

            {/* 오늘의 추천 급식 히어로 카드 */}
            {activeMealPlan && (
              <section className="relative w-full rounded-[28px] overflow-hidden shadow-[0_12px_30px_rgba(60,85,0,0.1)] border border-[#f3e6d7] group">
                <div className="aspect-[1.8/1] w-full relative overflow-hidden">
                  <img 
                    className="w-full h-full object-cover transform duration-700 group-hover:scale-105" 
                    src={activeMealPlan.lunch.image} 
                    alt="오늘의 대표 추천 급식 사진"
                    style={{ filter: "brightness(0.85)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
                </div>

                {/* 배지들 */}
                <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap">
                  <span className="bg-[#d2ea7a] text-[#3e4c00] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    오늘의 추천 급식
                  </span>
                  
                  {isWeekend && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                      🌱 다음 급식일 (월) 예정
                    </span>
                  )}
                </div>

                {/* 좋아요 */}
                <button 
                  onClick={() => handleLikeToggle(activeMealPlan.lunch.id)}
                  className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    likedMeals[activeMealPlan.lunch.id] 
                    ? "bg-red-500 text-white shadow-md border-transparent scale-110" 
                    : "bg-white/25 text-white border border-white/40 hover:bg-white/40"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedMeals[activeMealPlan.lunch.id] ? "fill-current" : ""}`} />
                </button>

                <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                  <p className="text-xs text-white/90 font-medium mb-1 flex items-center gap-1.5">
                    {formatKoreanDate(displayDate)}
                    {isWeekend && <span className="text-amber-300">(주말 보정 반영)</span>}
                  </p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight mb-1 text-white">
                        {activeMealPlan.lunch.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#c9f07c] font-black">{activeMealPlan.lunch.totalCalories} kcal</span>
                        {checkAllergyWarning(activeMealPlan.lunch.allergens) && (
                          <span className="inline-flex items-center gap-0.5 bg-red-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-bounce">
                            <AlertTriangle className="w-3 h-3" /> 알레르기 주의!
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 justify-end ml-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9f07c]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 주말 특별 안내 배너 */}
            {isWeekend && (
              <div className="bg-[#fef2e2] border-2 border-dashed border-[#outline-variant] rounded-2xl p-4 flex gap-3 items-start shadow-sm text-sm text-[#201b11]">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-extrabold text-[#3c5500]">오늘은 주말이라 급식 정보가 없습니다.</strong>
                  <p className="text-xs text-[#444939] leading-relaxed">
                    화면에는 가장 가까운 실제 약속 급식일인 <span className="font-bold underline text-[#3c5500]">{formatKoreanDate(displayDate)}</span> 일자가 대신 연동되어 안전하게 표시됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* 오늘의 급식 요약 섹션 */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-black text-[#201b11]">오늘의 급식 요약</h3>
                <button 
                  onClick={() => setActiveTab("calendar")}
                  className="text-xs text-[#3c5500] font-bold flex items-center gap-0.5 hover:underline"
                >
                  주간 식단표 보기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {activeMealPlan ? (
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* 중식 카드 */}
                  <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,36,26,0.04)] border border-[#f3e6d7] flex flex-col justify-between hover:border-[#3c5500] transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="bg-[#d2ea7a] text-[#3e4c00] font-black text-xs px-2.5 py-1 rounded-full">중식</span>
                          <span className="block text-xs text-[#747967] mt-1.5">⏰ 급식 시간 12:30 ~ 13:30</span>
                        </div>
                        <div className="bg-[#fef2e2] px-3 py-1 rounded-lg border border-[#f3e6d7]">
                          <span className="text-[#3c5500] font-black text-xs">{activeMealPlan.lunch.totalCalories} kcal</span>
                        </div>
                      </div>

                      {/* 메뉴 리스트 */}
                      <ul className="space-y-1.5 py-2">
                        {activeMealPlan.lunch.dishes.map((dish, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-sm text-[#444939]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3c5500]/60"></span>
                            <span>{cleanDishName(dish)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#ede1d1] flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-[#747967] font-bold block w-full mb-0.5">🌾 알레르기 유발 물질</span>
                      {activeMealPlan.lunch.allergens.map((alg, idx) => {
                        const isWarn = myAllergies.includes(alg) && allergyAlertEnabled;
                        return (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                              isWarn 
                              ? "bg-red-100 text-red-700 border border-red-200 animate-pulse" 
                              : "bg-[#fef2e2] text-[#444939] border border-[#f3e6d7]"
                            }`}
                          >
                            {alg} {isWarn && "⚠️"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* 석식 카드 */}
                  <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,36,26,0.04)] border border-[#f3e6d7] flex flex-col justify-between hover:border-[#485229] transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="bg-[#dde8b2] text-[#414b23] font-black text-xs px-2.5 py-1 rounded-full">석식</span>
                          <span className="block text-xs text-[#747967] mt-1.5">⏰ 급식 시간 18:00 ~ 19:00</span>
                        </div>
                        <div className="bg-[#fef2e2] px-3 py-1 rounded-lg border border-[#f3e6d7]">
                          <span className="text-[#485229] font-black text-xs">{activeMealPlan.dinner.totalCalories} kcal</span>
                        </div>
                      </div>

                      {/* 메뉴 리스트 */}
                      <ul className="space-y-1.5 py-2">
                        {activeMealPlan.dinner.dishes.map((dish, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-sm text-[#444939]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#485229]/60"></span>
                            <span>{cleanDishName(dish)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#ede1d1] flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-[#747967] font-bold block w-full mb-0.5">🌾 알레르기 유발 물질</span>
                      {activeMealPlan.dinner.allergens.map((alg, idx) => {
                        const isWarn = myAllergies.includes(alg) && allergyAlertEnabled;
                        return (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                              isWarn 
                              ? "bg-red-100 text-red-700 border border-red-200" 
                              : "bg-[#fef2e2] text-[#444939] border border-[#f3e6d7]"
                            }`}
                          >
                            {alg} {isWarn && "⚠️"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-10 text-center text-sm text-[#747967]">
                  오늘 등록된 데이터가 없습니다.
                </div>
              )}
            </section>

            {/* 영양 분석 퀵 링크 트래커 */}
            <section 
              onClick={() => setActiveTab("calculate")}
              className="bg-[#c9f07c]/40 border border-[#b9d164] rounded-3xl p-5 flex items-center justify-between text-[#141f00] cursor-pointer hover:bg-[#c9f07c]/60 shadow-sm transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#3c5500] text-[#c9f17c] rounded-2xl flex items-center justify-center shadow-md">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#141f00]">오늘 식단 자가 영양소 분석기</h4>
                  <p className="text-xs text-[#364e00] mt-0.5">골라 담은 나만의 메뉴 칼로리/단백질 계산하기</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#3c5500]" />
            </section>

          </div>
        )}

        {/* 2-2. 식단표 탭 (Meal Planner Layout) */}
        {activeTab === "calendar" && (
          <div className="space-y-5 animate-fade-in">
            
            {/* 식단표 헤더 정보 */}
            <section className="space-y-1 pb-1 border-b border-[#ede1d1]">
              <span className="text-xs text-[#3c5500] font-black uppercase tracking-wider">WEEKLY MEAL SCHEDULE</span>
              <h2 className="text-2xl font-black text-[#201b11]">
                {getWeekOfMonth(selectedDate)}
              </h2>
            </section>

            {/* 이번주 월요일~금요일 가로 스톱워치 버튼들 */}
            <section className="flex justify-between items-center gap-1.5 overflow-x-auto pb-1">
              {getWeekDates(selectedDate).map((date, idx) => {
                const dayNum = date.getDate();
                const dayStr = getKoreanDayOfWeek(date);
                const isSelected = formatDateKey(date) === formatDateKey(selectedDate);
                const isCurrentToday = formatDateKey(date) === formatDateKey(today);

                return (
                  <button 
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all relative ${
                      isSelected 
                      ? "bg-[#3c5500] text-white shadow-md transform scale-[1.03]" 
                      : "bg-[#fff8f3] border border-[#f3e6d7] text-[#201b11] hover:bg-[#f8ecdc]"
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-white/80" : "text-[#747967]"}`}>
                      {dayStr}
                    </span>
                    <span className="text-base font-extrabold mt-0.5">
                      {dayNum}
                    </span>
                    
                    {/* 당일 표시 스몰 배지 */}
                    {isCurrentToday && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#c9f07c]" : "bg-[#3c5500]"}`}></span>
                    )}
                  </button>
                );
              })}
            </section>

            {/* 선택 수요일/목요일 일자 상세 렌더링 */}
            <div className="bg-[#fef2e2]/60 border border-[#f3e6d7] rounded-[24px] p-4 text-xs font-bold text-[#3c5500] flex justify-between items-center">
              <span>선택된 일자: {formatKoreanDate(selectedDate)}</span>
              {formatDateKey(selectedDate) === formatDateKey(today) && (
                <span className="bg-[#3c5500] text-white text-[10px] px-2 py-0.5 rounded-full uppercase">TODAY</span>
              )}
            </div>

            {/* 해당 일자의 식단 출력 */}
            {getMealByDate(selectedDate) ? (
              <div className="space-y-5">
                
                {/* 중식 정보 카드 */}
                <article className="bg-white rounded-3xl p-5 shadow-sm border border-[#f3e6d7] relative overflow-hidden flex flex-col gap-4">
                  
                  {/* 식사 종류 및 제목 */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-[#d2ea7a] text-[#3e4c00] rounded-full font-bold text-xs">중식</span>
                      <h3 className="text-lg font-black text-[#201b11] mt-2">
                        {getMealByDate(selectedDate)?.lunch.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#3c5500]">
                        {getMealByDate(selectedDate)?.lunch.totalCalories}
                      </span>
                      <span className="text-xs text-[#747967] block">kcal</span>
                    </div>
                  </div>

                  {/* 음식 썸네일(오른쪽 배치 또는 하단) 및 식단 정보 */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#fef2e2] flex-shrink-0 border border-[#f3e6d7]">
                      <img 
                        src={getMealByDate(selectedDate)?.lunch.image} 
                        alt="중식 미리보기" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <ul className="space-y-1 text-xs text-[#444939] leading-tight">
                        {getMealByDate(selectedDate)?.lunch.dishes.map((dish, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-[#3c5500] rounded-full"></span>
                            <span>{cleanDishName(dish)}</span>
                          </li>
                        ))}
                      </ul>

                      {/* 알레르기 안내 */}
                      <div className="flex flex-wrap gap-1">
                        {getMealByDate(selectedDate)?.lunch.allergens.map((alg, k) => (
                          <span key={k} className="px-1.5 py-0.5 bg-[#fef2e2] text-[#444939] text-[10px] rounded-sm font-semibold">
                            {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 단백질 달성도 (목표 60g 기준) */}
                  <div className="pt-3 border-t border-[#ede1d1]">
                    <div className="flex justify-between mb-1.5 text-xs">
                      <span className="text-[#747967] font-medium">단백질 권장량 달성률</span>
                      <span className="text-[#3c5500] font-black">
                        {Math.round(((getMealByDate(selectedDate)?.lunch.nutrition.protein || 22) / 60) * 100)}%
                        ({getMealByDate(selectedDate)?.lunch.nutrition.protein}g / 60g)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#fef2e2] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#3c5500] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(((getMealByDate(selectedDate)?.lunch.nutrition.protein || 22) / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                </article>

                {/* 석식 정보 카드 */}
                <article className="bg-white rounded-3xl p-5 shadow-sm border border-[#f3e6d7] relative overflow-hidden flex flex-col gap-4">
                  
                  {/* 식사 종류 및 제목 */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-[#dde8b2] text-[#414b23] rounded-full font-bold text-xs">석식</span>
                      <h3 className="text-lg font-black text-[#201b11] mt-2">
                        {getMealByDate(selectedDate)?.dinner.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#485229]">
                        {getMealByDate(selectedDate)?.dinner.totalCalories}
                      </span>
                      <span className="text-xs text-[#747967] block">kcal</span>
                    </div>
                  </div>

                  {/* 음식 썸네일 및 식단 정보 */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#fef2e2] flex-shrink-0 border border-[#f3e6d7]">
                      <img 
                        src={getMealByDate(selectedDate)?.dinner.image} 
                        alt="석식 미리보기" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <ul className="space-y-1 text-xs text-[#444939] leading-tight">
                        {getMealByDate(selectedDate)?.dinner.dishes.map((dish, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-[#485229] rounded-full"></span>
                            <span>{cleanDishName(dish)}</span>
                          </li>
                        ))}
                      </ul>

                      {/* 알레르기 안내 */}
                      <div className="flex flex-wrap gap-1">
                        {getMealByDate(selectedDate)?.dinner.allergens.map((alg, k) => (
                          <span key={k} className="px-1.5 py-0.5 bg-[#fef2e2] text-[#444939] text-[10px] rounded-sm font-semibold">
                            {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 단백질 달성도 (목표 60g 기준) */}
                  <div className="pt-3 border-t border-[#ede1d1]">
                    <div className="flex justify-between mb-1.5 text-xs">
                      <span className="text-[#747967] font-medium">단백질 권장량 달성률</span>
                      <span className="text-[#485229] font-black">
                        {Math.round(((getMealByDate(selectedDate)?.dinner.nutrition.protein || 22) / 60) * 100)}%
                        ({getMealByDate(selectedDate)?.dinner.nutrition.protein}g / 60g)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#fef2e2] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#485229] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(((getMealByDate(selectedDate)?.dinner.nutrition.protein || 22) / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                </article>

              </div>
            ) : (
              <div className="text-center py-10 text-[#747967] text-sm bg-white rounded-3xl border border-[#ede1d1]">
                선택하신 날짜의 급식 일정이 등록되어 있지 않습니다.
              </div>
            )}

          </div>
        )}

        {/* 2-3. 영양계산 탭 (Calculator Layout) */}
        {activeTab === "calculate" && (
          <div className="space-y-5 animate-fade-in">
            
            {/* 영양계산 헤더 */}
            <section className="space-y-1 pb-1 border-b border-[#ede1d1]">
              <span className="text-xs text-[#3c5500] font-black uppercase tracking-wider">NUTRITION CALCULATOR</span>
              <h2 className="text-2xl font-black text-[#201b11]">영양 자가 계산기</h2>
            </section>

            {/* 영양 상황판 대시보드 카드 */}
            <section className="bg-[#fef2e2] rounded-2xl p-5 shadow-sm border border-[#f3e6d7] relative overflow-hidden">
              <div className="absolute top-2 right-2 p-2 opacity-5">
                <Calculator className="w-20 h-20" />
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#747967]">선택 조합 총 영양 섭취</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-[#3c5500]">{calculatedStats.calories}</span>
                    <span className="text-sm font-bold text-[#3c5500]">kcal</span>
                  </div>
                </div>

                {/* 게이지 바 3가지 (단, 탄, 지) */}
                <div className="space-y-3 pt-1">
                  
                  {/* 단백질 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#201b11]">
                      <span>단백질 (목표 60g)</span>
                      <span>{calculatedStats.protein}g / 60g</span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#3c5500] transition-all duration-300"
                        style={{ width: `${Math.min((calculatedStats.protein / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 탄수화물 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#201b11]">
                      <span>탄수화물 (목표 300g)</span>
                      <span>{calculatedStats.carbs}g / 300g</span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#485229] transition-all duration-300"
                        style={{ width: `${Math.min((calculatedStats.carbs / 300) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 지방 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#201b11]">
                      <span>지방 (목표 70g)</span>
                      <span>{calculatedStats.fat}g / 70g</span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#747967] transition-all duration-300"
                        style={{ width: `${Math.min((calculatedStats.fat / 70) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* 필터 카테고리 칩 목록 */}
            <section className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {(["all", "rice", "soup", "side", "dessert"] as const).map((cat) => {
                const label = {
                  all: "전체",
                  rice: "밥류",
                  soup: "국/찌개",
                  side: "반찬",
                  dessert: "디저트"
                }[cat];

                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected 
                      ? "bg-[#3c5500] text-white shadow-sm"
                      : "bg-[#ede1d1]/80 text-[#444939] hover:bg-[#ede1d1]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </section>

            {/* 필터링된 메뉴 리스팅 */}
            <section className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-extrabold text-[#747967]">
                  메뉴를 터치해 선택/해제하세요 (중복 체크 가능)
                </span>
                <button 
                  onClick={() => {
                    setCalculatorMenuItems(prev => prev.map(m => ({ ...m, selected: false })));
                    triggerToast("🔄 모든 선택이 초기화되었습니다.");
                  }}
                  className="text-[10px] text-[#3c5500] underline font-bold"
                >
                  모두 지우기
                </button>
              </div>

              <div className="grid gap-2.5">
                {calculatorMenuItems
                  .filter(item => selectedCategory === "all" || item.category === selectedCategory)
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleCalculatorItem(item.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        item.selected 
                        ? "bg-[#fef2e2] border-[#3c5500] ring-1 ring-[#3c5500]" 
                        : "bg-white border-[#f3e6d7] hover:border-[#747967]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          item.selected 
                          ? "bg-[#3c5500] border-transparent text-white" 
                          : "border-[#747967] bg-white"
                        }`}>
                          {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-[#201b11]">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-[#747967] font-medium">
                            🔥 {item.calories} kcal ・ 🥩 단백질 {item.nutrition.protein}g ・ 🌾 탄수화물 {item.nutrition.carbs}g
                          </p>
                        </div>
                      </div>

                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#fef2e2] flex-shrink-0 border border-[#ede1d1]">
                        <img 
                          className="w-full h-full object-cover" 
                          src={item.image} 
                          alt={item.name} 
                        />
                      </div>
                    </div>
                  ))
                }
              </div>
            </section>

            {/* 임시 계산 저장하기 버튼 */}
            <div className="pt-2">
              <button 
                onClick={() => {
                  triggerToast("💾 오늘의 칼로리 분석이 개인 영양 일지에 안전하게 기록되었습니다!");
                }}
                className="w-full py-3.5 bg-[#3c5500] text-white font-extrabold rounded-2xl text-center text-sm shadow-md hover:bg-[#3c5500]/95 active:scale-[0.99] transition-all"
              >
                계산 결과 인체 일지에 저장하기
              </button>
            </div>

          </div>
        )}

        {/* 2-4. 프로필 및 설정 탭 (Profile Layout) */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 프로필 헤더 */}
            <section className="space-y-1 pb-1 border-b border-[#ede1d1]">
              <span className="text-xs text-[#3c5500] font-black uppercase tracking-wider">MY SERVICE PROFILE</span>
              <h2 className="text-2xl font-black text-[#201b11]">내 프로필 설정</h2>
            </section>

            {/* 사용자 카드 (김학생 정보) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-white to-[#fef2e2] rounded-[24px] p-5 shadow-sm flex items-center justify-between border border-[#ede1d1]">
              {isEditingProfile ? (
                <div className="space-y-3 w-full">
                  <span className="text-xs font-bold text-[#3c5500]">실시간 정보 수정</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white border border-[#747967]/30 rounded-xl px-2.5 py-1.5 text-xs text-[#201b11] outline-none"
                      placeholder="이름"
                    />
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        value={tempProfile.grade}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-12 bg-white border border-[#747967]/30 rounded-xl px-2.5 py-1.5 text-xs text-center text-[#201b11]"
                        placeholder="학년"
                      />
                      <span className="text-xs text-[#201b11]">학년</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        value={tempProfile.classNum}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, classNum: e.target.value }))}
                        className="w-12 bg-white border border-[#747967]/30 rounded-xl px-2.5 py-1.5 text-xs text-center text-[#201b11]"
                        placeholder="반"
                      />
                      <span className="text-xs text-[#201b11]">반</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        value={tempProfile.seatNum}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, seatNum: e.target.value }))}
                        className="w-12 bg-white border border-[#747967]/30 rounded-xl px-2.5 py-1.5 text-xs text-center text-[#201b11]"
                        placeholder="번"
                      />
                      <span className="text-xs text-[#201b11]">번</span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1 bg-[#747967]/10 text-[#444939] text-xs font-bold rounded-lg"
                    >
                      취소
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="px-3 py-1 bg-[#3c5500] text-white text-xs font-bold rounded-lg"
                    >
                      완료
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuASMRRl-XCNKmnBa_8SdyFM0KL9z4t5MRshwlRzQvj58VTXd7tIgU-R7ngtxoBeUuzyi0A4i7m8sTlo-5zV7NEJVdkGwDCx8Wb0KgXabWVdErst9hrsSpvbEEooNV560DmsKVe9QcUCHQO4UK9AE5cmwRHNRkdbYUe7p4GDNfXdqf05agHIJrlfd4lvbPNrcqDbad3e0x30HPem2tPMKCxayWioGhV1zl44Nz20cEAljLcM_n-6kdDVYkFmeSU753VoqHs7QpjpUw" 
                        alt="학생 인물 사진" 
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="absolute bottom-0 right-0 bg-[#3c5500] text-white p-1 rounded-full border border-white shadow-sm cursor-pointer">
                        <Edit2 className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="text-lg font-black text-[#201b11] flex items-center gap-1.5">
                        {studentInfo.name}
                        <span className="bg-[#c9f17c] text-[#3c5500] text-[10px] px-1.5 py-0.5 rounded font-black uppercase">STUDENT</span>
                      </h3>
                      <p className="text-xs text-[#747967] font-semibold">
                        씨마스고등학교 {studentInfo.grade}학년 {studentInfo.classNum}반 {studentInfo.seatNum}번
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setTempProfile({ ...studentInfo });
                      setIsEditingProfile(true);
                    }}
                    className="p-2 text-[#747967] hover:bg-[#fff8f3] hover:text-[#3c5500] rounded-xl transition-all"
                    title="정보 편집"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </section>

            {/* 급식 설정 (알레르기 경고 및 스위치) */}
            <section className="space-y-3.5">
              <h3 className="text-sm font-black text-[#3c5500] px-1">🍲 개인 식단 맞춤 서비스</h3>
              
              {/* 알레르기 관리 카드 */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#f3e6d7] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <strong className="text-sm font-bold block text-[#201b11]">알레르기 실시간 경고</strong>
                      <span className="text-[11px] text-[#747967] block">급식 표에서 위험 식품 강조표시</span>
                    </div>
                  </div>
                  
                  {/* 스위치 */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allergyAlertEnabled}
                      onChange={(e) => {
                        setAllergyAlertEnabled(e.target.checked);
                        triggerToast(e.target.checked ? "🔔 알레르기 수시 경고가 활성화되었습니다." : "🔕 알레르기 경고를 음소거했습니다.");
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-[#c4c9b4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c5500]"></div>
                  </label>
                </div>

                {/* 알레르기 칩 목록 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {myAllergies.map((item, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 bg-[#fef2e2] text-[#444939] px-2.5 py-1 rounded-full text-xs font-bold border border-[#f3e6d7]"
                    >
                      {item}
                      <button 
                        onClick={() => handleRemoveAllergy(item)}
                        className="text-[#747967] hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  {showAllergyAddInput ? (
                    <div className="flex items-center gap-1.5 w-full mt-2">
                      <select
                        value={newAllergyInput}
                        onChange={(e) => setNewAllergyInput(e.target.value)}
                        className="flex-1 bg-white border border-[#747967]/30 rounded-xl px-2.5 py-1.5 text-xs text-[#201b11] outline-none"
                      >
                        <option value="">-- 성분 선택 --</option>
                        {ALLERGY_KEYWORDS.filter(k => !myAllergies.includes(k)).map(keyword => (
                          <option key={keyword} value={keyword}>{keyword}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAddAllergy}
                        className="px-3 py-1.5 bg-[#3c5500] text-white text-xs font-bold rounded-xl"
                      >
                        추가
                      </button>
                      <button 
                        onClick={() => setShowAllergyAddInput(false)}
                        className="p-1.5 bg-gray-100 text-gray-500 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowAllergyAddInput(true)}
                      className="inline-flex items-center gap-1 border border-dashed border-[#747967] text-[#747967] px-3 py-1 rounded-full text-xs font-semibold hover:bg-[#fef2e2] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> 직접 추가
                    </button>
                  )}
                </div>
              </div>

              {/* 매일 아침 푸시 발송 설정 카드 */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#f3e6d7]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div>
                      <strong className="text-sm font-bold block text-[#201b11]">일일 식단 알리미</strong>
                      <span className="text-[11px] text-[#747967] block">설정한 시간에 그날 급식 스케줄 통지</span>
                    </div>
                  </div>
                  
                  {/* 스위치 */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={dailyNotificationEnabled}
                      onChange={(e) => {
                        setDailyNotificationEnabled(e.target.checked);
                        triggerToast(e.target.checked ? "🔔 아침 알람이 설정되었습니다." : "🔕 아침 식단 알람이 정지되었습니다.");
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-[#c4c9b4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3c5500]"></div>
                  </label>
                </div>

                {dailyNotificationEnabled && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#ede1d1] flex justify-between items-center text-xs">
                    <span className="text-[#747967] font-semibold font-sans">⏰ 발송 권장 시각</span>
                    <input 
                      type="time" 
                      value={notiTime} 
                      onChange={(e) => {
                        setNotiTime(e.target.value);
                        triggerToast(`⏰ 발송 시간이 아침 ${e.target.value}로 정정되었습니다.`);
                      }}
                      className="bg-[#fef2e2] border border-[#f3e6d7] rounded-lg px-2 py-1 text-xs text-[#201b11] outline-none font-bold"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 정보 및 고객센터 항목 리스트 */}
            <section className="space-y-1.5ClassName">
              <h3 className="text-sm font-black text-[#3c5500] px-1 mb-2.5">정보 및 도움말</h3>
              <div className="bg-white rounded-[24px] overflow-hidden border border-[#f3e6d7] shadow-sm divide-y divide-[#ede1d1]">
                
                <button 
                  onClick={() => {
                    setModalTitle("📞 씨마스고등학교 급식 고객센터");
                    setModalContent("씨마스고등학교 학생 및 교직원 전용 관리 안내소입니다.\n급식 알레르기 표기 오류나 건의 사항은 본교 행정실이나 영양사 면담실로 방문해 주시거나 아래 전용 메일로 즉시 문의 주시면 감사하겠습니다.\n\n📧 지원 부서: support@ceamas-high.sed.kr\n☎️ 내선 연락처: 02-345-6789 (영양상담실)");
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#fef2e2]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-sm text-[#201b11] font-semibold">
                    <HelpCircle className="w-5 h-5 text-[#747967]" />
                    <span>고객센터 / 영양소 의견 제안</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747967]" />
                </button>

                <button 
                  onClick={() => {
                    setModalTitle("📜 서비스 이용 안내 및 영양 면책 조항");
                    setModalContent("1. 본 정보는 씨마스고등학교 교육과정 및 NEIS 학교 급식 공개 API 가상화 인터페이스를 기반으로 모의 생성되어 가공 표기됩니다.\n\n2. 주말의 경우 사용자의 혼선을 예방하고자 주중의 실 식단 데이터를 연동하여 표시하는 로직이 임베디드되어 있습니다.\n\n3. 알레르기 식품 경보는 참고적인 건강 판단 도움 지표이므로, 중증 특이 체질 학생의 경우 반드시 식사 전 조리실 식단 재확인을 요청하십시오.");
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#fef2e2]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-sm text-[#201b11] font-semibold">
                    <FileText className="w-5 h-5 text-[#747967]" />
                    <span>이용 약관 및 원산지 면책 안내</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747967]" />
                </button>

                <button 
                  onClick={() => {
                    triggerToast("🚪 안전하게 로그아웃 되었습니다. (모의 인터랙션)");
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#fef2e2]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 text-sm text-red-600 font-extrabold">
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span>모의 회원 로그아웃</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>

              </div>
            </section>

            {/* 회사 / 연도 푸크 */}
            <footer className="py-2 text-center space-y-1">
              <p className="text-[11px] text-[#747967] font-semibold">
                © {today.getFullYear()} 씨마스고등학교 급식 시스템
              </p>
              <p className="text-[10px] text-[#747967]">
                본 서비스는 학생들을 위해 엄격하고 건강한 식단 지표를 안전하게 연동 보장합니다.
              </p>
            </footer>

          </div>
        )}

      </main>

      {/* 3. 하단 네비게이션 플로팅 바 (BottomNavBar) */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-[#fff8f3]/95 backdrop-blur-md border-t border-[#ede1d1] rounded-t-3xl shadow-[0_-5px_22px_rgba(42,36,26,0.06)] flex justify-around items-center px-2 py-2 pb-5">
        
        {/* 홈 */}
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all ${
            activeTab === "home" 
            ? "text-[#3c5500] scale-105" 
            : "text-[#747967] hover:text-[#3c5500]"
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === "home" ? "bg-[#c9f17c]/50 text-[#3c5500]" : ""}`}>
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold mt-1">홈</span>
        </button>

        {/* 식단표 */}
        <button 
          onClick={() => {
            setActiveTab("calendar");
            setSelectedDate(getDefaultSelectedDate(today));
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all ${
            activeTab === "calendar" 
            ? "text-[#3c5500] scale-105" 
            : "text-[#747967] hover:text-[#3c5500]"
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === "calendar" ? "bg-[#c9f17c]/50 text-[#3c5500]" : ""}`}>
            <CalendarIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold mt-1">식단표</span>
        </button>

        {/* 영양계산 */}
        <button 
          onClick={() => setActiveTab("calculate")}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all ${
            activeTab === "calculate" 
            ? "text-[#3c5500] scale-105" 
            : "text-[#747967] hover:text-[#3c5500]"
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === "calculate" ? "bg-[#c9f17c]/50 text-[#3c5500]" : ""}`}>
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold mt-1">영양계산</span>
        </button>

        {/* 프로필 */}
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all ${
            activeTab === "profile" 
            ? "text-[#3c5500] scale-105" 
            : "text-[#747967] hover:text-[#3c5500]"
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === "profile" ? "bg-[#c9f17c]/50 text-[#3c5500]" : ""}`}>
            <User className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold mt-1">프로필</span>
        </button>

      </nav>

      {/* 4. 플로팅 인앱 가상 토스트 팝업 */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#201b11] text-[#fff8f3] text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-[#747967]/30 transition-all duration-300">
          <Sparkles className="w-4 h-4 text-[#c9f17c]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5. 우아한 모달 팝업 레이어 (Information Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fff8f3] border-2 border-[#3c5500] w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-base font-black text-[#3c5500]">{modalTitle}</h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-[#fef2e2] rounded-full text-[#747967] hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-[#444939] leading-relaxed whitespace-pre-wrap">{modalContent}</p>
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2.5 bg-[#3c5500] text-white text-xs font-bold rounded-xl"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
