import { Meal, DailyMealData, MenuItem } from "../types";
import { getWeekDates, formatDateKey, getKoreanDayOfWeek } from "../utils/dateUtils";

// 푸드 이미지 에셋 카탈로그 (사용자 제공 고품질 수려한 이미지 우선)
const IMAGES = {
  cheeseCutlet: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDryh9eeZfHS_FNn0BCd136YKOdfDs-VtM7m4T__qeIRdPSPTfq0mDicIx8Xb12jaUx3jZI6bn0WLCGs40Mmy-kbCT_U62ciFqbOtreVUzHsx1VU-F5NJXXg8aIEp9nY7S4Jgr1PL70S3LX2h9HHZB1kd-p5EUbXw9IgyIUR7rgUmRpSHlHRzzwpfF9fPiuB27xa5O8dSwKlmox83CXBxaWUnLuHpRBrtDdrBK8mKQEviTyhYQCIrG5NxRMRFrIZURVVm3KkO3pA",
  hamburgSteak: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ZdDE1rOr150HUUGP-jVsKPJgdejDXlF3K55sOt4HNK_SYVCn4S8HxkoeYa6sYEwkZc7kRQSqC3anfudtLB1c5QUdo3309RDhp6CnXjgYK7wjosOfgC2uDwk0tbOXSIiP4j6R8JM8T7xRTG5KFRWOtp6vPYqBOrIYTj1usbAj0qpFWHgZpjwrA3lJM_QXSPAzPURA6u7H17G5z_vvtDKTXZPsn8A00L8FSJI12j23ts0Bj6pZpJ0_uEe1nTlAzt1U-FV62KDl8A",
  tunaBowl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBL2_VNoKKBkUeDzxkJNrUc23vvlNJlAP39ZV5n9qe28PWUL7e5Que30tTnva9TQJ33I1fOOXDyB3DhckvZsRklSnEX-47fvv6smnhkcgt57KIjOAyUsniIBaVJL543uPlENzNY6hdQ3-ymLhnIgTbxTLS542moY-jMDmCx19cGKSxwS6Tub87_VH6Yk7ZzSwtGilQxy7_Ve2MSjOViV7iOf7TBZoA-5fTbjc9dpzESDbggmpAL2T2JTS_D6X_H0j4tAeQeK0IYag",
  brownRice: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOTIhtCs2H2OvS-Ospz6eFW_X0HFTuvYQuwJvy3RsGM5FixlvZAxZ6r2emWqMmVlzp2xCUYqi4nYcNiai_vYf_uJpcNiWx_W3ZM3WCZikvmVNAoDiN8YqOCGOGla8sI8rHIAoVzWwxubW0tvjP1wwQn1LVXxJBslgfnJoxl_lMXs07FryDIWxluUP3ZhFztfuGDR1udrW-7Dky2dt0m9NDJYwFBCuHcaRt90y9Uc8_oUlunsitrRIwBF9wu2W6gkVZ3GZYuvzd1g",
  porkStew: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Aq4PBuNYVmPtxp-vynXfGABcxehthwCOs6PpI56vRntXkcRRqAr0I6Rxg5fSnAUz8vMYgHSMXkgREi7XTV7M1AzcFVpKVHkAMaHovxEAZ11sUu_kEMfiffiBml_TlK2YscOl4aF8jnEWWX07z9jXYNP_4anXIFFkcsTf98MPPwy9uDzssBImdvGCy7OrJvbcZXj6Rc7lxMUg1ZLD5KVhyh-3QzMSvDztgRK7BjNczi9k1byZc-0CzkWY7PPC-MX1g3R_9GuKeQ",
  spinach: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfUK4ixUU4sdIDUuxVN9TPMXyB1R2zm8G6mQ7wvnAMW9vOQ8F-w0nr1Mm2GTuhJ2eUD54WuMRybtV1mSFIdrzNtbTauyJ3-MDsibEFuLRRdVqvEKe4qQLTRH_xTr2ghRa7r-w-pAjtyuG-1uFj5-Se22JX2esXPmmWeRwDGlggO16oV9HAfH6dJyqzIYWPuUZhBBOa8Hsk8oiHOSP9lNDpWf2ocKMeaMZCirlC0UPidAfmZhiB44k_Irl6fm877ShZB35F9VTqXw",
  mackerel: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOc3r18DSqr49mKHnwSco1BOYXblyUbWlVlqfjeWfWRhtUPZYVhGyDL6IvXujqKPH7HOjn3suLWl0iX4CcDdlVNs4gWltDej6oTFaeM-CCfN62Ij8NweNVXLT4dpLOypRcGtaNd4nkPyxHS4FfWX8BLT2dvevidU6C1i8OMPSIYKZxq6vIrnJHMT6-fb01ONDHvlpMRF4biHPtz82pkuYjU0Ywtqt-lZFpgNX-v0b4ArT7o4_lArYG1v7dfP2gHQ1WkFNUqMcA_Q",
  koreanBuffet: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ZdDE1rOr150HUUGP-jVsKPJgdejDXlF3K55sOt4HNK_SYVCn4S8HxkoeYa6sYEwkZc7kRQSqC3anfudtLB1c5QUdo3309RDhp6CnXjgYK7wjosOfgC2uDwk0tbOXSIiP4j6R8JM8T7xRTG5KFRWOtp6vPYqBOrIYTj1usbAj0qpFWHgZpjwrA3lJM_QXSPAzPURA6u7H17G5z_vvtDKTXZPsn8A00L8FSJI12j23ts0Bj6pZpJ0_uEe1nTlAzt1U-FV62KDl8A"
};

/**
 * 주어진 기준 날짜 주차(월~금)의 5일치 급식 일정을 동적 생성
 */
export function generateWeeklyMeals(referenceDate: Date): DailyMealData[] {
  const weekDates = getWeekDates(referenceDate);
  const school = "씨마스고등학교";

  // 요일 인덱스에 따라 각기 다른 5개 구성의 디폴트 식단 배치
  const dailyPlans = [
    // 월요일 (Index 0)
    {
      lunch: {
        title: "영양가득 곤드레밥 정식",
        dishes: ["곤드레밥 / 달래양념장", "감자옹심이국", "맥적구이", "도라지오이무침", "배추김치"],
        calories: 820,
        nutrition: { protein: 28, carbs: 125, fat: 18 },
        allergens: ["대두", "밀", "돼지고기"],
        image: IMAGES.koreanBuffet
      },
      dinner: {
        title: "소고기 마파두부 덮밥",
        dishes: ["마파두부덮밥", "팽이버섯맑은국", "닭강정", "단무지무침", "배추김치"],
        calories: 750,
        nutrition: { protein: 31, carbs: 110, fat: 22 },
        allergens: ["대두", "밀", "닭고기", "쇠고기"],
        image: IMAGES.tunaBowl
      }
    },
    // 화요일 (Index 1)
    {
      lunch: {
        title: "수제함박스테이크와 단호박스프",
        dishes: ["수제함박스테이크", "단호박크림스프", "혼합잡곡밥", "숙주미나리무침", "깍두기 / 콘드레싱"],
        calories: 850,
        nutrition: { protein: 32, carbs: 120, fat: 25 },
        allergens: ["돼지고기", "대두", "밀", "우유"],
        image: IMAGES.hamburgSteak
      },
      dinner: {
        title: "부대찌개와 계란말이 저녁",
        dishes: ["흑미밥", "돈육부대찌개", "치즈달걀말이", "감자채볶음", "배추김치"],
        calories: 780,
        nutrition: { protein: 29, carbs: 115, fat: 23 },
        allergens: ["돼지고기", "대두", "밀", "우유", "난류"],
        image: IMAGES.porkStew
      }
    },
    // 수요일 (Index 2)
    {
      lunch: {
        title: "치즈돈까스 정식",
        dishes: ["치즈돈까스 정식", "쇠고기미역국", "친환경현미밥", "매콤돈육강정", "숙주나물무침 / 배추김치"],
        calories: 845,
        nutrition: { protein: 35, carbs: 130, fat: 24 },
        allergens: ["밀", "우유", "대두", "쇠고기", "돼지고기"],
        image: IMAGES.cheeseCutlet
      },
      dinner: {
        title: "참치마요덮밥과 우동 정식",
        dishes: ["참치마요덮밥", "미니우동", "단무지무침", "배추김치", "요구르트"],
        calories: 720,
        nutrition: { protein: 26, carbs: 105, fat: 21 },
        allergens: ["대두", "밀", "난류", "우유"],
        image: IMAGES.tunaBowl
      }
    },
    // 목요일 (Index 3)
    {
      lunch: {
        title: "고열량 든든 소불고기 덮밥",
        dishes: ["소불고기덮밥", "어묵맑은국", "오징어초무침", "시금치나물", "배추김치"],
        calories: 810,
        nutrition: { protein: 34, carbs: 118, fat: 20 },
        allergens: ["쇠고기", "대두", "밀"],
        image: IMAGES.koreanBuffet
      },
      dinner: {
        title: "얼큰 순두부찌개 정식",
        dishes: ["현미쌀밥", "순두부찌개", "적어구이", "진미채볶음", "깍두기"],
        calories: 690,
        nutrition: { protein: 28, carbs: 98, fat: 16 },
        allergens: ["대두", "밀", "조개류"],
        image: IMAGES.porkStew
      }
    },
    // 금요일 (Index 4)
    {
      lunch: {
        title: "얼큰 삼겹살구이 해장 도시락",
        dishes: ["보리밥", "얼큰김치찌개", "삼겹살오븐구이", "상추파채무침", "갓김치"],
        calories: 890,
        nutrition: { protein: 38, carbs: 110, fat: 32 },
        allergens: ["돼지고기", "대두", "밀"],
        image: IMAGES.hamburgSteak
      },
      dinner: {
        title: "직화 짜장면과 군만두",
        dishes: ["유니짜장면", "군만두 / 소스", "단무지", "요구르트", "배추김치"],
        calories: 830,
        nutrition: { protein: 25, carbs: 135, fat: 22 },
        allergens: ["밀", "돼지고기", "대두", "우유"],
        image: IMAGES.tunaBowl
      }
    }
  ];

  return weekDates.map((date, index) => {
    const key = formatDateKey(date);
    const dow = getKoreanDayOfWeek(date);
    const plan = dailyPlans[index] || dailyPlans[2]; // 방어 코드

    const lunchMeal: Meal = {
      id: `${key}-LUNCH`,
      schoolName: school,
      date,
      dateKey: key,
      dayOfWeek: dow,
      mealType: "LUNCH",
      title: plan.lunch.title,
      dishes: plan.lunch.dishes,
      totalCalories: plan.lunch.calories,
      nutrition: plan.lunch.nutrition,
      allergens: plan.lunch.allergens,
      image: plan.lunch.image
    };

    const dinnerMeal: Meal = {
      id: `${key}-DINNER`,
      schoolName: school,
      date,
      dateKey: key,
      dayOfWeek: dow,
      mealType: "DINNER",
      title: plan.dinner.title,
      dishes: plan.dinner.dishes,
      totalCalories: plan.dinner.calories,
      nutrition: plan.dinner.nutrition,
      allergens: plan.dinner.allergens,
      image: plan.dinner.image
    };

    return {
      dateKey: key,
      lunch: lunchMeal,
      dinner: dinnerMeal
    };
  });
}

/**
 * 영양계산 전용 단일 메뉴 재료 및 영양 데이터 (필터링 칩스용)
 * 사용자가 요청한 전체, 밥류, 국/찌개, 반찬, 디저트 리스트를 완벽하게 반영
 */
export const MOCK_MENU_ITEMS: MenuItem[] = [
  // 밥류 (Category: "rice")
  {
    id: "m1",
    name: "현미밥",
    category: "rice",
    calories: 300,
    nutrition: { protein: 6, carbs: 62, fat: 1.5 },
    allergens: [],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOTIhtCs2H2OvS-Ospz6eFW_X0HFTuvYQuwJvy3RsGM5FixlvZAxZ6r2emWqMmVlzp2xCUYqi4nYcNiai_vYf_uJpcNiWx_W3ZM3WCZikvmVNAoDiN8YqOCGOGla8sI8rHIAoVzWwxubW0tvjP1wwQn1LVXxJBslgfnJoxl_lMXs07FryDIWxluUP3ZhFztfuGDR1udrW-7Dky2dt0m9NDJYwFBCuHcaRt90y9Uc8_oUlunsitrRIwBF9wu2W6gkVZ3GZYuvzd1g",
    info: "식이섬유가 풍부하고 영양이 가득한 현미밥",
    selected: true
  },
  {
    id: "m2",
    name: "혼합잡곡밥",
    category: "rice",
    calories: 320,
    nutrition: { protein: 8, carbs: 65, fat: 2 },
    allergens: [],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOTIhtCs2H2OvS-Ospz6eFW_X0HFTuvYQuwJvy3RsGM5FixlvZAxZ6r2emWqMmVlzp2xCUYqi4nYcNiai_vYf_uJpcNiWx_W3ZM3WCZikvmVNAoDiN8YqOCGOGla8sI8rHIAoVzWwxubW0tvjP1wwQn1LVXxJBslgfnJoxl_lMXs07FryDIWxluUP3ZhFztfuGDR1udrW-7Dky2dt0m9NDJYwFBCuHcaRt90y9Uc8_oUlunsitrRIwBF9wu2W6gkVZ3GZYuvzd1g",
    info: "다양한 곡물이 조화롭게 포함된 잡곡밥",
    selected: false
  },
  {
    id: "m3",
    name: "참치마요덮밥베이스",
    category: "rice",
    calories: 450,
    nutrition: { protein: 18, carbs: 55, fat: 15 },
    allergens: ["대두", "밀", "난류", "생선"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBL2_VNoKKBkUeDzxkJNrUc23vvlNJlAP39ZV5n9qe28PWUL7e5Que30tTnva9TQJ33I1fOOXDyB3DhckvZsRklSnEX-47fvv6smnhkcgt57KIjOAyUsniIBaVJL543uPlENzNY6hdQ3-ymLhnIgTbxTLS542moY-jMDmCx19cGKSxwS6Tub87_VH6Yk7ZzSwtGilQxy7_Ve2MSjOViV7iOf7TBZoA-5fTbjc9dpzESDbggmpAL2T2JTS_D6X_H0j4tAeQeK0IYag",
    info: "고소한 참치와 부드러운 마요네즈의 환상 조화",
    selected: false
  },

  // 국/찌개 (Category: "soup")
  {
    id: "m4",
    name: "돼지고기 김치찌개",
    category: "soup",
    calories: 250,
    nutrition: { protein: 18, carbs: 12, fat: 14 },
    allergens: ["돼지고기", "대두", "밀"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Aq4PBuNYVmPtxp-vynXfGABcxehthwCOs6PpI56vRntXkcRRqAr0I6Rxg5fSnAUz8vMYgHSMXkgREi7XTV7M1AzcFVpKVHkAMaHovxEAZ11sUu_kEMfiffiBml_TlK2YscOl4aF8jnEWWX07z9jXYNP_4anXIFFkcsTf98MPPwy9uDzssBImdvGCy7OrJvbcZXj6Rc7lxMUg1ZLD5KVhyh-3QzMSvDztgRK7BjNczi9k1byZc-0CzkWY7PPC-MX1g3R_9GuKeQ",
    info: "순두부와 신김치, 쫄깃한 돼지고기 육수의 얼큰함",
    selected: false
  },
  {
    id: "m5",
    name: "쇠고기미역국",
    category: "soup",
    calories: 180,
    nutrition: { protein: 14, carbs: 8, fat: 10 },
    allergens: ["쇠고기", "대두", "밀"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Aq4PBuNYVmPtxp-vynXfGABcxehthwCOs6PpI56vRntXkcRRqAr0I6Rxg5fSnAUz8vMYgHSMXkgREi7XTV7M1AzcFVpKVHkAMaHovxEAZ11sUu_kEMfiffiBml_TlK2YscOl4aF8jnEWWX07z9jXYNP_4anXIFFkcsTf98MPPwy9uDzssBImdvGCy7OrJvbcZXj6Rc7lxMUg1ZLD5KVhyh-3QzMSvDztgRK7BjNczi9k1byZc-0CzkWY7PPC-MX1g3R_9GuKeQ",
    info: "고소한 참기름과 소고기로 푹 끓여낸 미역국",
    selected: false
  },

  // 반찬 (Category: "side")
  {
    id: "m6",
    name: "시금치 나물",
    category: "side",
    calories: 45,
    nutrition: { protein: 3, carbs: 5, fat: 1 },
    allergens: [],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfUK4ixUU4sdIDUuxVN9TPMXyB1R2zm8G6mQ7wvnAMW9vOQ8F-w0nr1Mm2GTuhJ2eUD54WuMRybtV1mSFIdrzNtbTauyJ3-MDsibEFuLRRdVqvEKe4qQLTRH_xTr2ghRa7r-w-pAjtyuG-1uFj5-Se22JX2esXPmmWeRwDGlggO16oV9HAfH6dJyqzIYWPuUZhBBOa8Hsk8oiHOSP9lNDpWf2ocKMeaMZCirlC0UPidAfmZhiB44k_Irl6fm877ShZB35F9VTqXw",
    info: "식이섬유 3g 함유! 싱그러운 시금치 무침",
    selected: false
  },
  {
    id: "m7",
    name: "고등어 구이",
    category: "side",
    calories: 250,
    nutrition: { protein: 22, carbs: 0, fat: 15 },
    allergens: ["생선"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOc3r18DSqr49mKHnwSco1BOYXblyUbWlVlqfjeWfWRhtUPZYVhGyDL6IvXujqKPH7HOjn3suLWl0iX4CcDdlVNs4gWltDej6oTFaeM-CCfN62Ij8NweNVXLT4dpLOypRcGtaNd4nkPyxHS4FfWX8BLT2dvevidU6C1i8OMPSIYKZxq6vIrnJHMT6-fb01ONDHvlpMRF4biHPtz82pkuYjU0Ywtqt-lZFpgNX-v0b4ArT7o4_lArYG1v7dfP2gHQ1WkFNUqMcA_Q",
    info: "오메가-3와 단백질이 매우 풍부한 겉바속촉 고등어구이",
    selected: false
  },
  {
    id: "m8",
    name: "수제함박스테이크",
    category: "side",
    calories: 320,
    nutrition: { protein: 24, carbs: 12, fat: 18 },
    allergens: ["돼지고기", "대두", "밀"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ZdDE1rOr150HUUGP-jVsKPJgdejDXlF3K55sOt4HNK_SYVCn4S8HxkoeYa6sYEwkZc7kRQSqC3anfudtLB1c5QUdo3309RDhp6CnXjgYK7wjosOfgC2uDwk0tbOXSIiP4j6R8JM8T7xRTG5KFRWOtp6vPYqBOrIYTj1usbAj0qpFWHgZpjwrA3lJM_QXSPAzPURA6u7H17G5z_vvtDKTXZPsn8A00L8FSJI12j23ts0Bj6pZpJ0_uEe1nTlAzt1U-FV62KDl8A",
    info: "육즙 가득 소스와 퐁신하고 묵직한 함박스테이크",
    selected: false
  },

  // 디저트 (Category: "dessert")
  {
    id: "m9",
    name: "야구르트",
    category: "dessert",
    calories: 65,
    nutrition: { protein: 1, carbs: 15, fat: 0.2 },
    allergens: ["우유"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBL2_VNoKKBkUeDzxkJNrUc23vvlNJlAP39ZV5n9qe28PWUL7e5Que30tTnva9TQJ33I1fOOXDyB3DhckvZsRklSnEX-47fvv6smnhkcgt57KIjOAyUsniIBaVJL543uPlENzNY6hdQ3-ymLhnIgTbxTLS542moY-jMDmCx19cGKSxwS6Tub87_VH6Yk7ZzSwtGilQxy7_Ve2MSjOViV7iOf7TBZoA-5fTbjc9dpzESDbggmpAL2T2JTS_D6X_H0j4tAeQeK0IYag",
    info: "상큼하고 산뜻한 입가심 장 건강 액티비아 요구르트",
    selected: false
  },
  {
    id: "m10",
    name: "단호박크림스프",
    category: "dessert",
    calories: 110,
    nutrition: { protein: 2, carbs: 20, fat: 3 },
    allergens: ["우유"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ZdDE1rOr150HUUGP-jVsKPJgdejDXlF3K55sOt4HNK_SYVCn4S8HxkoeYa6sYEwkZc7kRQSqC3anfudtLB1c5QUdo3309RDhp6CnXjgYK7wjosOfgC2uDwk0tbOXSIiP4j6R8JM8T7xRTG5KFRWOtp6vPYqBOrIYTj1usbAj0qpFWHgZpjwrA3lJM_QXSPAzPURA6u7H17G5z_vvtDKTXZPsn8A00L8FSJI12j23ts0Bj6pZpJ0_uEe1nTlAzt1U-FV62KDl8A",
    info: "부드럽고 달콤한 단호박 크림 스프",
    selected: false
  }
];
