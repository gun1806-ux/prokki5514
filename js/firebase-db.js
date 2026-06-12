// ============================================================================
// Firebase Database (Firestore) 래퍼 로직
// 실제 Firebase와 로컬스토리지를 연동하여 실시간 데이터베이스 환경을 제공합니다.
// ============================================================================

let isFirebaseActive = false;
let db = null;

// Firebase API 설정 검증 및 초기화
if (
  window.USER_CONFIG &&
  window.USER_CONFIG.FIREBASE &&
  window.USER_CONFIG.FIREBASE.apiKey &&
  !window.USER_CONFIG.FIREBASE.apiKey.includes('입력') &&
  window.USER_CONFIG.FIREBASE.apiKey !== ''
) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.USER_CONFIG.FIREBASE);
    }
    db = firebase.firestore();
    isFirebaseActive = true;
    console.log("[Firebase] 성공적으로 활성화되었습니다.");
  } catch (error) {
    console.error("[Firebase] 초기화 중 오류가 발생했습니다:", error);
  }
} else {
  console.log("[Firebase] 설정이 비어있어 로컬 Mock 모드(LocalStorage)로 동작합니다.");
}

// 1MB 제한을 피하기 위해 각 항목을 단일 문서로 저장할 키 목록 (이미지 업로드 포함 가능 컬렉션)
const COLLECTION_KEYS = ['reviews', 'revenues', 'community', 'users_db', 'courses', 'materials', 'qna'];

const FirebaseDB = {
  // Firebase가 실제 활성화되어있는지 확인
  isFirebaseActive: () => isFirebaseActive,

  // 데이터 불러오기 (동기 - 마운트 시 즉시 로컬 데이터 조회용)
  loadData: (collectionKey, defaultVal) => {
    try {
      let data = localStorage.getItem(collectionKey);
      if (!data && (collectionKey === 'mock_user' || collectionKey.startsWith('enrollments_'))) {
        try {
          data = sessionStorage.getItem(collectionKey);
        } catch (se) {
          console.warn(`Error reading from sessionStorage for "${collectionKey}":`, se);
        }
      }
      if (!data || data === "undefined" || data === "null") {
        return defaultVal;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(defaultVal) && !Array.isArray(parsed)) {
        return defaultVal;
      }
      return parsed;
    } catch (e) {
      console.warn(`Error parsing local storage key "${collectionKey}":`, e);
      return defaultVal;
    }
  },


  // 데이터 저장하기 (동기/비동기 병행)
  saveData: (collectionKey, val) => {
    // 1. 즉각적인 UI 반영을 위해 LocalStorage에 먼저 저장
    try {
      localStorage.setItem(collectionKey, JSON.stringify(val));
    } catch (e) {
      console.warn(`[LocalStorage] 저장 공간 한도 초과 (${collectionKey}). 캐시 정리 중...`, e);
      // Evict non-essential heavy cache keys
      const heavyKeys = ['community', 'reviews', 'revenues', 'materials'];
      heavyKeys.forEach(k => {
        if (k !== collectionKey) {
          try {
            localStorage.removeItem(k);
          } catch (err) {}
        }
      });
      // Try again
      try {
        localStorage.setItem(collectionKey, JSON.stringify(val));
        console.log(`[LocalStorage] 캐시 정리 후 저장 성공: ${collectionKey}`);
      } catch (retryError) {
        console.error(`[LocalStorage] 캐시 정리 후에도 저장 실패:`, retryError);
      }
    }

    // 2. 세션 필수 정보는 SessionStorage에도 미러링 저장
    if (collectionKey === 'mock_user' || collectionKey.startsWith('enrollments_')) {
      try {
        sessionStorage.setItem(collectionKey, JSON.stringify(val));
      } catch (se) {
        console.warn(`[SessionStorage] 세션 데이터 백업 실패:`, se);
      }
    }

    // 2. Firebase가 활성화되어 있고, 로컬 세션 정보인 'mock_user'가 아닐 때 Firestore에 업로드
    if (isFirebaseActive && db && collectionKey !== 'mock_user') {
      if (COLLECTION_KEYS.includes(collectionKey)) {
        // 컬렉션 기반 저장: 각 아이템을 개별 문서로 저장 (1MB 문서 제한 회피)
        const colRef = db.collection('platform_data').doc(collectionKey).collection('items');
        
        // 아이템 개별 등록 및 수정
        val.forEach(item => {
          const docId = item.id || item.uid || item.email;
          if (docId) {
            colRef.doc(docId).set(item)
              .catch(err => {
                console.error(`[Firestore] 개별 아이템 저장 오류 (${collectionKey}/${docId}):`, err);
                window.alert(`[데이터베이스 오류] 저장에 실패했습니다.\n상세 오류: ${err.message}`);
              });
          }
        });

        // 삭제 처리: Firestore에 있으나 전달된 배열에 없는 아이템 삭제
        colRef.get().then(snapshot => {
          snapshot.docs.forEach(doc => {
            const exists = val.some(item => (item.id === doc.id || item.uid === doc.id || item.email === doc.id));
            if (!exists) {
              doc.ref.delete()
                .catch(err => {
                  console.error(`[Firestore] 개별 아이템 삭제 오류 (${collectionKey}/${doc.id}):`, err);
                  window.alert(`[데이터베이스 오류] 삭제에 실패했습니다.\n상세 오류: ${err.message}`);
                });
            }
          });
        }).catch(err => {
          console.error(`[Firestore] 컬렉션 조회 오류 (${collectionKey}):`, err);
          window.alert(`[데이터베이스 오류] 목록 조회에 실패했습니다.\n상세 오류: ${err.message}`);
        });

      } else {
        // 단순 단일 문서 저장 (courses, materials, enrollments 등 크기가 작고 이미지가 없는 데이터)
        db.collection('platform_data').doc(collectionKey).set({ list: val })
          .then(() => {
            console.log(`[Firestore] 성공적으로 저장됨: ${collectionKey}`);
          })
          .catch(err => {
            console.error(`[Firestore] 저장 오류 (${collectionKey}):`, err);
            window.alert(`[데이터베이스 오류] 저장에 실패했습니다.\n상세 오류: ${err.message}`);
          });
      }
    }
  },

  // 실시간 데이터 구독 (App 컴포넌트 마운트 시 호출하여 Firestore 변경사항 동기화)
  subscribe: (collectionKey, callback) => {
    if (isFirebaseActive && db && collectionKey !== 'mock_user') {
      if (COLLECTION_KEYS.includes(collectionKey)) {
        // 컬렉션 기반 실시간 구독
        const colRef = db.collection('platform_data').doc(collectionKey).collection('items');
        return colRef.onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            const item = doc.data();
            if (item) {
              if (collectionKey === 'users_db') {
                if (!item.uid) item.uid = doc.id;
              } else {
                if (!item.id) item.id = doc.id;
              }
              list.push(item);
            }
          });

          if (list.length === 0) {
            // 만약 Firestore에 데이터가 없으면, 로컬스토리지의 데이터를 업로드합니다.
            const localData = localStorage.getItem(collectionKey);
            if (localData) {
              const parsed = JSON.parse(localData);
              if (parsed && parsed.length > 0) {
                FirebaseDB.saveData(collectionKey, parsed);
                callback(parsed);
                return;
              }
            }
          }

          // ID 기준 정렬: courses, materials는 오름차순(asc), 나머지는 내림차순(desc)
          list.sort((a, b) => {
            const idA = String(a.id || a.uid || a.email || '');
            const idB = String(b.id || b.uid || b.email || '');
            if (collectionKey === 'courses' || collectionKey === 'materials') {
              return idA.localeCompare(idB);
            }
            return idB.localeCompare(idA);
          });

          // 로컬 캐시 동기화 후 콜백 호출
          localStorage.setItem(collectionKey, JSON.stringify(list));
          callback(list);
        }, err => {
          console.error(`[Firestore] 컬렉션 구독 오류 (${collectionKey}):`, err);
        });
      } else {
        // 단일 문서 기반 실시간 구독
        return db.collection('platform_data').doc(collectionKey).onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data && Array.isArray(data.list)) {
              localStorage.setItem(collectionKey, JSON.stringify(data.list));
              callback(data.list);
            }
          } else {
            const localData = localStorage.getItem(collectionKey);
            const val = localData ? JSON.parse(localData) : [];
            db.collection('platform_data').doc(collectionKey).set({ list: val });
          }
        }, err => {
          console.error(`[Firestore] 문서 구독 오류 (${collectionKey}):`, err);
        });
      }
    }
    // Firebase 미활성화 상태이면 아무것도 안 하는 더미 함수 반환
    return () => {};
  }
};

window.FirebaseDB = FirebaseDB;