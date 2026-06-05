// ============================================================================
// 결제 (Payment) 서비스 모듈
// 토스페이먼츠 호출 및 테스트용 가상 결제 승인 로직을 관리합니다.
// ============================================================================

const PaymentServiceModule = {
  // 과정 결제 요청 공통 함수
  requestCoursePayment: (course, user, onEnrollSuccess, showModal, navigate) => {
    if(!user) { 
      showModal('alert', '로그인 필요', '로그인 후 수강신청 및 결제가 가능합니다.', () => navigate('/login'));
      return; 
    }
    
    // 금액 포맷 내부 유틸리티
    const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price) + '원';

    // 결제 로직 분기점 (현재는 테스트 모드 자동 승인)
    const runTossOrFallback = () => {
      
      /* --- [실제 상용 연동 시 활성화 영역 시작] ---
      try {
        const tossPayments = window.TossPayments(window.USER_CONFIG.TOSS_CLIENT_KEY);
        tossPayments.requestPayment('카드', {
          amount: course.price,
          orderId: `order_${Date.now()}_${course.id}`,
          orderName: course.title,
          customerName: user.name || user.email || '수강생',
          successUrl: window.location.origin + window.location.pathname + `?payment=success&courseId=${course.id}`,
          failUrl: window.location.origin + window.location.pathname + `?payment=fail`
        });
        return; // 실제 연동이 활성화되면 아래 모달 로직으로 넘어가지 않게 return을 추가합니다.
      } catch (e) {
        console.error("결제 모듈 실행 오류", e);
      }
      --- [실제 상용 연동 시 활성화 영역 끝] --- */

      // 가상 결제(테스트 모드) 승인 완료 처리
      showModal('alert', '테스트 모드 결제 완료', '실제 결제창 호출 없이 테스트 모드로 즉시 결제가 승인되었습니다.\n클래스 소장이 완료되었습니다.', () => {
        onEnrollSuccess(course.id, true);
      });
    };

    showModal('confirm', '수강 신청 확인', `[${course.title}]\n\n위 강의를 결제하시겠습니까?\n결제 금액: ${formatPrice(course.price)}`, runTossOrFallback);
  }
};

window.PaymentService = PaymentServiceModule;