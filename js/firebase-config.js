// ============================================================================
// [1] API 연동 키 설정 (의뢰인 수정 영역)
// 발급받으신 각 서비스의 키 값을 아래 따옴표 안에 넣어주세요.
// ============================================================================

// 1. 카카오 로그인 API JavaScript 키 (카카오 디벨로퍼스 앱 설정에서 발급)
const KAKAO_JS_KEY = "6298d79a9b447a3eca3dfedd80a08e4a"; 

// 2. 파이어베이스 웹 앱 설정 키 (파이어베이스 콘솔 앱 설정에서 발급)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAZ98poir8qwUBBnlH71LdU_mN0-t85EF0",
  authDomain: "ttolgi-analyzer.firebaseapp.com",
  projectId: "ttolgi-analyzer",
  storageBucket: "ttolgi-analyzer.firebasestorage.app",
  messagingSenderId: "1085522134169",
  appId: "1:1085522134169:web:a7099260b3ffd9abb96408"
};

// ============================================================================
// [2] 시스템 자동 바인딩 설정 (절대 수정 금지)
// ============================================================================
const USER_CONFIG = {
  FIREBASE: FIREBASE_CONFIG,
  KAKAO_JS_KEY: KAKAO_JS_KEY
};

window.USER_CONFIG = USER_CONFIG;