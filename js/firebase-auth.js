// ============================================================================
// Firebase Auth (인증) 래퍼 로직
// 로그인, 로그아웃, 현재 유저 정보 세팅 등 인증 관련 처리를 모아둡니다.
// ============================================================================
const FirebaseAuthService = {
  // 로그아웃 처리
  logout: () => {
    // 임시 Mock 로직 (추후 auth.signOut() 로 교체)
    localStorage.removeItem('mock_user');
  },
  
  // 현재 접속중인 유저 정보 가져오기
  getCurrentUser: () => {
    return window.FirebaseDB.loadData('mock_user', null);
  },

  // 세션 저장 처리
  saveSession: (userData) => {
    window.FirebaseDB.saveData('mock_user', userData);
  }
};

window.FirebaseAuth = FirebaseAuthService;