// ============================================================================
// Firebase Database (Firestore) 래퍼 로직
// 추후 실제 Firestore API (getDoc, setDoc 등)로 교체될 함수들을 모아둡니다.
// ============================================================================
const FirebaseDB = {
  // 데이터 불러오기
  loadData: (collectionKey, defaultVal) => {
    // 임시 Mock DB 로직 (추후 db.collection().get() 로 교체)
    const data = localStorage.getItem(collectionKey);
    return data ? JSON.parse(data) : defaultVal;
  },

  // 데이터 저장하기
  saveData: (collectionKey, val) => {
    // 임시 Mock DB 로직 (추후 db.collection().add() 로 교체)
    localStorage.setItem(collectionKey, JSON.stringify(val));
  }
};

window.FirebaseDB = FirebaseDB;