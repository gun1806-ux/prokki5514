// ============================================================================
// [1] Firebase API 키 등록 공간
// 차후 실제 Firebase 프로젝트를 생성하신 후 아래 설정값들을 교체하세요.
// ============================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAZ98poir8qwUBBnlH71LdU_mN0-t85EF0",
  authDomain: "ttolgi-analyzer.firebaseapp.com",
  projectId: "ttolgi-analyzer",
  storageBucket: "ttolgi-analyzer.firebasestorage.app",
  messagingSenderId: "1085522134169",
  appId: "1:1085522134169:web:a7099260b3ffd9abb96408"
};

// ============================================================================
// [2] 카카오 / 토스 결제 API 키 설정 공간
// ============================================================================
const USER_CONFIG = {
  FIREBASE: FIREBASE_CONFIG,
  KAKAO_JS_KEY: "1234567890abcdef1234567890abcdef", 
  TOSS_CLIENT_KEY: "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq" 
};

// 전역 객체로 내보내기 (app.js에서 접근)
window.USER_CONFIG = USER_CONFIG;