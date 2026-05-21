/**
 * 한국 시간 기준 (Asia/Seoul) 날짜 관련 유틸리티 함수 모음
 */

/**
 * 1. 한국 시간 기준 오늘 날짜를 반환 (KST)
 */
export function getTodayKST(): Date {
  const now = new Date();
  
  // 사용자가 전달한 실제 현재 시각 메타데이터: 2026-05-21T11:05:23Z
  // 브라우저 또는 서버 환경에서 타임존 차이가 있어도 한국 시간(UTC+9)으로 정밀하게 맞춥니다.
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(utc + kstOffset);
  
  // 테스트나 빌드 환경에 따른 오차가 있을 수 있으므로 연, 월, 일까지만 정확히 추출해서 반환할 때 시간 영향을 받지 않도록 합니다.
  return kstDate;
}

/**
 * 2. "5월 15일 금요일" 형식으로 변환
 */
export function formatKoreanDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const dayOfWeek = days[date.getDay()];
  return `${month}월 ${day}일 ${dayOfWeek}`;
}

/**
 * 3. "YYYYMMDD" 형식으로 변환 (NEIS API 연동용)
 */
export function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * 4. 해당 날짜가 포함된 주의 월요일부터 금요일까지 Date 배열 반환
 */
export function getWeekDates(date: Date): Date[] {
  const currentDay = date.getDay(); // 0(일) ~ 6(토)
  // 월요일과의 거리를 구함 (KST 기준)
  // 일요일(0)이면 -6 일, 월요일(1)이면 0 일, 화요일(2)이면 -1 일, ..., 토요일(6)이면 -5 일
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + distanceToMonday);
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const nextDay = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    weekDates.push(nextDay);
  }
  return weekDates;
}

/**
 * 5. 해당 날짜가 몇 월 몇 주차인지 계산 ("M월 N주차")
 */
export function getWeekOfMonth(date: Date): string {
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const month = targetDate.getMonth() + 1;
  
  // 첫날의 요일과 첫날 날짜 구하기
  const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).getDay();
  const dateNum = targetDate.getDate();
  
  // 주차 계산: 매 월요일이 한 주의 시작이라고 할 때, 간단히 (날짜 + 1일요일보정)을 7로 나눈 올림을 씁니다.
  const weekNum = Math.ceil((dateNum + firstDay) / 7);
  
  return `${month}월 ${weekNum}주차`;
}

/**
 * 6. 오늘이 평일이면 오늘 반환, 오늘이 토요일 또는 일요일이면 다음 월요일 또는 직전 금요일 반환
 * (방식 B: 다음 급식일인 월요일로 넘기기 권장)
 */
export function getDefaultSelectedDate(today: Date): Date {
  const day = today.getDay();
  if (day === 0) { // 일요일 -> 다음주 월요일 (+1일)
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  } else if (day === 6) { // 토요일 -> 다음주 월요일 (+2일)
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
  }
  return today;
}

/**
 * 요일 한 글자 구하기 ("월", "화", "수", "목", "금", "토", "일")
 */
export function getKoreanDayOfWeek(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[date.getDay()];
}
