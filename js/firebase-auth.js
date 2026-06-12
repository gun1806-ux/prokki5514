// ============================================================================
// Firebase Auth (인증) 래퍼 로직
// 로그인, 로그아웃, 현재 유저 정보 세팅 등 인증 관련 처리를 모아둡니다.
// ============================================================================
const FirebaseAuthService = {
  // 로그아웃 처리
  logout: () => {
    localStorage.removeItem('mock_user');
    try {
      sessionStorage.removeItem('mock_user');
    } catch (e) {
      console.warn("sessionStorage logout failed", e);
    }
  },
  
  // 현재 접속중인 유저 정보 가져오기
  getCurrentUser: () => {
    let user = window.FirebaseDB.loadData('mock_user', null);
    if (!user) {
      try {
        const sessionData = sessionStorage.getItem('mock_user');
        if (sessionData && sessionData !== "undefined" && sessionData !== "null") {
          user = JSON.parse(sessionData);
        }
      } catch (e) {
        console.warn("Error reading mock_user from sessionStorage:", e);
      }
    }
    return user;
  },

  // 세션 저장 처리
  saveSession: (userData) => {
    window.FirebaseDB.saveData('mock_user', userData);
    try {
      sessionStorage.setItem('mock_user', JSON.stringify(userData));
    } catch (e) {
      console.warn("Error writing mock_user to sessionStorage:", e);
    }
  }
};

window.FirebaseAuth = FirebaseAuthService;