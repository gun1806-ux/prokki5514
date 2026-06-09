const { useState, useEffect, useRef } = React;

// -------------------------------------------------------------------
// 분리된 모듈(Firebase, 결제, 설정) 불러오기
// -------------------------------------------------------------------
const APP_CONFIG = window.USER_CONFIG || {};
const loadLocalData = window.FirebaseDB.loadData;
const saveLocalData = window.FirebaseDB.saveData;
const FirebaseAuth = window.FirebaseAuth;
const PaymentService = window.PaymentService;

// SDK 초기화 연동 유지
if (window.Kakao && !window.Kakao.isInitialized()) {
  try { window.Kakao.init(APP_CONFIG.KAKAO_JS_KEY); } catch(e) {}
}

const Icon = ({ path, className = "w-5 h-5", fill = "none" }) => (
  <svg className={className} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />
);

const ICONS = {
  Search: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
  BookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />',
  Star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />',
  ChevronDown: '<polyline points="6 9 12 15 18 9" />', ChevronUp: '<polyline points="18 15 12 9 6 15" />',
  ChevronLeft: '<polyline points="15 18 9 12 15 6" />', ChevronRight: '<polyline points="9 18 15 12 9 6" />',
  PlayCircle: '<circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />',
  CheckCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />',
  ArrowRight: '<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />',
  User: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
  LogOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />',
  LayoutDashboard: '<rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />',
  Users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />',
  Plus: '<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />',
  Trash2: '<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />',
  X: '<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />',
  Lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
  TrendingUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />',
  Award: '<circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />',
  Zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />',
  FileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  Edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
};

const generateMockReviews = () => [];
const generateMockRevenues = () => [];

const INITIAL_COURSES = [
  { id: "course-1", title: "[초급] 치열한 경쟁에서 살아남는 '진짜' 생존 소싱법", summary: "[무료 클래스] 이커머스 어떻게 판매하는지, 진짜를 보여드립니다.", description: "이커머스 어떻게 판매하는지, 진짜를 보여드립니다.\n[중간]\n공유하지 마세요.\n이런게 진짜입니다.", price: 0, thumbnail: "[https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)", studentCount: 1250, category: "생존 소 소싱", curriculum: ["1장: 무작정 열심히 하지 마라 (마인드셋)", "2장: 상품 2개로 3억을 만든 틈새 발굴 로직", "3장: 실패 없는 도매처 협상과 리스크 제로 소싱", "4장: 마진율을 극대화하는 가격 방어 전략"] },
  { id: "course-2", title: "[초&중급] 실제 소싱 노하우, 수익 구조화, 돈되는 셀링", summary: "[초&중급]처음 소싱부터,상품등록 , 수입방법, 광고 셋팅까지", description: "지속할 수 있는 판매 노하우의 정석을 담고 있습니다.", price: 499000, thumbnail: "[https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)", studentCount: 890, category: "설득 기획", curriculum: ["1장: 상세페이지의 본질, 3초 안에 사로잡기", "2장: 섹션별 필수 구성: 고객의 불안 완벽 해소", "3장: 인간적인 스토리텔링 녹여내기", "4장: 구매 전환율 3배 올리는 카피라이팅 템플릿 실습"] },
  { id: "course-3", title: "[고급] 지속 가능한 이커머스, 스토어 매각(Exit) 4억 달성법", summary: "장사꾼에서 사업가로. 내 스토어를 가치 있는 자산으로 만들고 엑싯(Exit)하는 시스템 경영 전략.", description: "단기적인 매출에 만족하지 마십시오. 장기적인 비전이 있어야 살아남습니다.\n시스템을 구축하고, 스토어 자체의 브랜드 가치를 높여 4억 원에 매각한 저의 모든 경험과 데이터를 나눕니다.\n\n지속 가능한 이커머스 비즈니스의 최종 단계를 목표로 하는 1인 기업가들을 위한 심화 강의입니다.", price: 350000, thumbnail: "[https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)", studentCount: 420, category: "브랜드 엑싯", curriculum: ["1장: 내 스토어의 가치 평가: 브랜드 몸값 올리기", "2장: 매각(Exit)을 위한 재무 및 오토 자동화 시스템 세팅", "3장: 구매자(양수자)를 설득하는 완벽한 데이터 준비", "4장: 1인 셀러를 넘어 지속 가능한 경영자로의 도약"] }
];
const INITIAL_COMMUNITY = [
  { id: "comm-1", title: "유튜브 보고 왔다가 인생이 바뀌었습니다.", author: "초보셀러", date: "2026-05-20", content: "무작정 상품 등록만 하다가 건강만 상했는데, 똘기님 강의 듣고 똑똑하게 일하는 법을 배웠어요. 진심으로 감사드립니다." },
  { id: "comm-2", title: "스토어 매각 목표로 달리고 있습니다!", author: "실행력갑", date: "2026-05-21", content: "단기 매출이 아니라 사업으로 접근하라는 말씀, 뼈에 새기고 있습니다. 템플릿 잘 활용하고 있어요." } 
];
const INITIAL_MATERIALS = [
  { id: "mat-1", title: "\uacbd\uc7c1\uc0ac \ud310\ub9e4\ub7c9 \ubd84\uc11d\ud504\ub85c\uadf8\ub7a8", type: "\ud504\ub85c\uadf8\ub7a8", route: "/material/mat-1", icon: "assets/images/9.png" },
  { id: "mat-2", title: "\uc678\ubd80\ub9c1\ud06c \ucd94\uc801 \ud504\ub85c\uadf8\ub7a8", type: "\ud504\ub85c\uadf8\ub7a8", route: "/material/mat-2", icon: "assets/images/10.png" },
  { id: "mat-3", title: "AI \uc591\ubc29\ud5a5 \uc790\ub3d9\ubc88\uc5ed\uae30 + 1688 LV6 \uc544\uc774\ub514 + \uccb4\ud5d8\ub2e8 \uc5c5\uccb4", type: "\ub9ac\uc18c\uc2a4", route: "/material/mat-3", icon: "assets/images/11.png" },
  { id: "mat-4", title: "\uc218\uc785\ub300\ud589 & 3PL \ub3d9\uc2dc\uc6b4\uc601 \uc5c5\uccb4", type: "\uc5c5\uccb4\uc815\ubcf4", route: "/material/mat-4", icon: "assets/images/12.png" },
];

const formatPrice = (price) => price === 0 ? '무료' : new Intl.NumberFormat('ko-KR').format(price) + '원';
const Badge = ({ children, className = "" }) => (<span className={`px-3 py-1.5 text-[11px] md:text-xs font-extrabold rounded-full bg-[#1D1D1D] text-[#FF8A00] shadow-sm shadow-black/20 inline-block tracking-tight ${className}`}>{children}</span>);
const Button = ({ children, variant = 'primary', size = 'md', className = "", onClick, type = "button", disabled = false, style={} }) => {
  const base = "inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300 ease-out active:scale-95 whitespace-nowrap";
  const sz = size === 'sm' ? "px-4 py-2 text-xs md:text-sm" : size === 'lg' ? "px-8 py-4 text-base md:text-lg" : "px-6 py-3 text-sm md:text-base";
  const vars = {
    primary: "bg-gradient-to-r from-[#FF8A00] to-[#FF6C00] text-black shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5",
    secondary: "bg-[#1F1E1B] text-white border border-[#3D3A33] shadow-lg hover:bg-[#2C2A25] hover:shadow-xl hover:-translate-y-0.5",
    outline: "border-2 border-[#FF8A00] text-[#111827] bg-white hover:bg-[#FFF2E0] hover:border-[#FF8A00] shadow-sm",
    ghost: "text-[#111827] bg-[#fff9f2] hover:bg-[#ffe8cb] border border-transparent shadow-sm hover:shadow-md"
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={style} className={`${base} ${sz} ${vars[variant] || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>{children}</button>;
};

const AnimatedCount = ({ target, suffix = '', format }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1400;
    const stepTime = 30;
    const steps = Math.ceil(duration / stepTime);
    const increment = target / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target]);

  const display = format ? format(count) : `${count}${suffix}`;
  return <p className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#FF8A00]">{display}</p>;
};

const HERO_VIDEO_SRC = new URL('assets/videos/1.mp4', document.baseURI).href;
const HERO_VIDEO_FALLBACK_IMAGE = new URL('assets/images/2.png', document.baseURI).href;

// ============================================================================
// 좌우 화살표가 장착된 향상된 슬라이더(Carousel) 컴포넌트
// ============================================================================
const Carousel = ({ items, renderItem }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [items]);

  if (!items || items.length === 0) {
    return <div className="text-center p-10 text-gray-400 font-medium border border-gray-100 rounded-3xl">등록된 데이터가 없습니다.</div>;
  }

  const itemsPerView = isMobile ? 1 : 3;
  const visibleItems = [];
  for (let i = 0; i < itemsPerView; i++) {
    const itemIndex = (currentIndex + i) % items.length;
    if(items[itemIndex]) visibleItems.push(items[itemIndex]);
  }

  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  const handleNext = () => setCurrentIndex(prev => (prev + 1) % items.length);

  return (
    <div className="relative w-full group">
      <div className="flex gap-4 md:gap-6 overflow-hidden w-full transition-all duration-500">
        {visibleItems.map((item, idx) => (
          <div key={`${item.id}-${currentIndex}-${idx}`} className="w-full flex-shrink-0 animate-fade-in-up" style={{ width: isMobile ? '100%' : `calc(${100 / itemsPerView}% - ${(itemsPerView-1)*24/itemsPerView}px)` }}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-[#111111] rounded-full shadow-lg border border-gray-800 flex items-center justify-center text-white hover:text-[#FF8A00] z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <Icon path={ICONS.ChevronLeft} className="w-6 h-6" />
      </button>
      <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-[#111111] rounded-full shadow-lg border border-gray-800 flex items-center justify-center text-white hover:text-[#FF8A00] z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <Icon path={ICONS.ChevronRight} className="w-6 h-6" />
      </button>
    </div>
  );
};

// ============================================================================
// 헤더 & 푸터
// ============================================================================
const Header = ({ currentPath, navigate, user, isAdmin, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClass = isScrolled || currentPath !== '/' ? "bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200" : "bg-white md:bg-white/95";

  const handleNav = (target) => {
    if(target.startsWith('#')) {
      navigate('/'); 
      setTimeout(() => { 
        const el = document.getElementById(target.substring(1));
        if(el) { window.scrollTo({top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth'}); }
      }, 100);
    } else {
      navigate(target);
    }
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${headerClass}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 md:gap-0">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center gap-3 text-xl md:text-2xl font-black tracking-tight cursor-pointer group" onClick={() => navigate('/') }>
              <img src="assets/icons/5.png" alt="logo" className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-full" />
              <span className="bg-gradient-to-r from-[#FF8A00] to-[#FF5000] bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">브랜드빌더, 돈버는 똘기</span>
            </div>
            <div className="md:hidden flex items-center gap-2">
              {user ? <Button variant="outline" size="sm" onClick={() => navigate('/mypage')}>마이페이지</Button> : <Button variant="primary" size="sm" onClick={() => navigate('/login')}>로그인</Button>}
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scroll">
            <nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm font-bold text-gray-700 min-w-max tracking-tight">
              <button onClick={() => handleNav('/enrollment')} className="hover:text-[#FF8A00] transition-colors py-2 px-1">수강신청</button>
              <button onClick={() => navigate('/reviews')} className="hover:text-[#FF8A00] transition-colors py-2 px-1">수강생후기</button>
              <button onClick={() => navigate('/revenues')} className="hover:text-[#FF8A00] transition-colors py-2 px-1">수익인증</button>
              <button onClick={() => handleNav('/community')} className="hover:text-[#FF8A00] transition-colors py-2 px-1">커뮤니티</button>
              <button onClick={() => handleNav('/materials')} className="hover:text-[#FF8A00] transition-colors py-2 px-1">자료실</button>
              <button onClick={() => handleNav('/mypage')} className="hover:text-[#FF8A00] transition-colors py-2 px-1 md:hidden">마이페이지</button>
              
              <div className="hidden md:block w-px h-4 bg-gray-200 mx-1"></div>
              
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/mypage')}>마이페이지</Button>
                    {isAdmin && <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>관리자</Button>}
                    <button onClick={onLogout} className="text-xs font-bold text-gray-400 hover:text-gray-900 ml-2">로그아웃</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2">로그인</button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/login')}>간편 회원가입</Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = ({ showModal, onAdminSecretLogin }) => {
  const handleHiddenAdmin = () => {
    showModal('prompt', '관리자 인증', '관리자 비밀번호를 입력하세요. (초기비밀번호: 6789)', (pwd) => {
      if (pwd === "6789") { onAdminSecretLogin(); } 
      else { showModal('alert', '인증 실패', '비밀번호가 일치하지 않습니다.'); }
    }, '비밀번호 입력', true);
  };
  
  return (
    <footer className="bg-white text-gray-700 pt-20 pb-12 relative border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="text-3xl font-black mb-6 text-[#FF8A00] tracking-tight">브랜드빌더, 돈버는 똘기</div>
            <p className="text-sm md:text-base leading-relaxed mb-6 word-keep text-gray-600">
              무작정 열심히 하는 시대는 끝났습니다.<br/>
              빚 독촉과 건강 악화라는 절망의 늪에서 4억 스토어 매각까지.<br/>
              현역 유튜버(@156cmm)가 여러분의 지속 가능한 성공을 돕겠습니다.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#FFEDD0] transition-colors text-[#FF8A00]"><Icon path={ICONS.PlayCircle} className="w-5 h-5"/></a>
              <span className="text-xs font-bold text-gray-700">YouTube @156cmm</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-gray-100 pb-2 text-gray-800">고객센터</h4>
            <p className="text-2xl font-black text-[#FF8A00] mb-2">02-1234-5678</p>
            <p className="mb-2 text-sm text-gray-600">help@ddolgi.com</p>
            <p className="text-xs text-gray-500">평일 10:00 - 18:00 운영</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-gray-100 pb-2 text-gray-800">이용 안내</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="cursor-pointer hover:text-gray-900 transition-colors">이용약관</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors font-bold">개인정보처리방침</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors">환불규정</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-t border-gray-100 pt-8 text-xs md:text-sm mt-4 relative z-10 text-gray-500 gap-4 md:gap-0">
          <div>
            <p className="mb-2 word-keep">주식회사 브랜드빌더 돈버는똘기 | 대표: 현역 유튜버 | 사업자등록번호: 123-45-67890</p>
            <p className="mb-4 word-keep">서울특별시 강남구 테헤란로 123 | 개인정보보호책임자: 돈버는똘기</p>
            <p>© 2026 브랜드빌더, 돈버는 똘기. All rights reserved.</p>
          </div>
          
          <button onClick={handleHiddenAdmin} className="text-[#FF8A00] hover:text-[#c96a00] text-sm font-black transition-colors cursor-pointer px-4 py-2 pointer-events-auto focus:outline-none">
            admin
          </button>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// 새로운 페이지 뷰: 전체 리뷰 / 전체 수익인증
// ============================================================================
const ReviewsPage = ({ reviewsData, navigate, showModal }) => {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <Badge className="mb-4">리얼 후기</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight word-keep mb-3">수강생 리얼 피드백</h1>
            <p className="text-gray-500 font-medium text-lg">돈버는 똘기의 생존 공식을 증명하는 실제 후기들입니다.</p>
          </div>
          <Button onClick={() => navigate('/write-review')} className="flex-shrink-0 bg-gray-900 text-white">수강후기 작성하기</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviewsData.map(review => (
            <div key={review.id} className="p-8 rounded-[2rem] bg-[#111111] border border-gray-800 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-[380px] md:h-[420px]">
              {review.image && <img src={review.image} className="w-full h-32 md:h-40 object-cover rounded-2xl mb-6 shadow-sm" />}
              <div className="flex justify-between items-start mb-4">
                <div className="flex text-yellow-400">{[...Array(review.rating)].map((_, j) => <Icon key={j} path={ICONS.Star} fill="#facc15" className="w-4 h-4" />)}</div>
                <span className="text-[10px] md:text-xs font-extrabold text-[#FF8A00] bg-white/5 px-2.5 py-1 rounded-md word-keep tracking-tight">{review.tag}</span>
              </div>
              <p className="text-gray-300 text-sm md:text-base font-medium leading-relaxed mb-6 flex-1 word-keep overflow-hidden">"{review.comment}"</p>
              <div className="border-t border-gray-800 pt-5 mt-auto"><div className="font-bold text-white text-sm word-keep">{review.name} 수강생</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RevenuesPage = ({ revenuesData, navigate, showModal }) => {
  return (
    <div className="min-h-screen bg-gray-900 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <Badge className="bg-gray-800 text-indigo-400 border-gray-700 mb-4">수익인증</Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight word-keep mb-3">수익 인증 전체보기</h1>
          <p className="text-gray-400 font-medium text-lg">철저하게 계산된 전략이 만들어낸 실제 계좌 입금 내역입니다.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {revenuesData.map(rev => (
            <div key={rev.id} className="bg-[#111111] rounded-3xl overflow-hidden border border-gray-800 shadow-lg hover:shadow-xl transition-shadow flex flex-col h-[360px] cursor-pointer" onClick={() => showModal('postView', rev.title, rev.content)}>
               <div className="h-48 overflow-hidden relative border-b border-gray-800">
                  <img src={rev.thumbnail} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-[#FF8A00] text-black font-black px-3 py-1 rounded-lg shadow-md word-keep text-xs">{rev.amount}</div>
               </div>
               <div className="p-6 flex-1 flex flex-col justify-between bg-[#111111]">
                  <h3 className="font-bold text-base md:text-lg text-white mb-2 line-clamp-2 word-keep">{rev.title}</h3>
                  <div className="mt-auto text-xs text-gray-400 font-medium flex items-center justify-between">
                     <span>{rev.author}</span>
                     <span>{rev.date} · 조회 {rev.views}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 메인 페이지 뷰
// ============================================================================
const HomePage = ({ courses, reviewsData, revenuesData, navigate, showModal }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCounseling = () => { showModal('alert', '상담 신청 완료', '무료 상담 신청이 완료되었습니다. 담당자가 업무 시간 내에 입력하신 번호로 연락드리겠습니다.'); };
  
  const top10Reviews = reviewsData.slice(0, 10);
  const top10Revenues = revenuesData.slice(0, 10);

  return (
    <div className="bg-main text-main">
      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center min-h-screen pt-24 pb-12 md:py-0 overflow-hidden bg-[#050608] text-white text-center">
        {/* Video & Overlay Wrapper */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            key={isMobile ? 'mobile-video' : 'desktop-video'}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center"
          >
            <source src={new URL(isMobile ? 'assets/videos/7.mp4' : 'assets/videos/6.mp4', document.baseURI).href} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        {/* Content Wrapper */}
        <div className="w-full max-w-7xl mx-auto px-5 py-8 md:py-0 relative z-20 min-w-0">
          <h1 className="text-white text-center mb-6 word-keep w-full">
            <span className="block text-center text-sm sm:text-base md:text-lg lg:text-xl font-extrabold mb-3 text-white/90 tracking-tight">쉽게 접근하면, 쉽게 무너집니다</span>
            <span className="block text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-white whitespace-nowrap tracking-tighter">빡세게 4주동안, 내 브랜드 제품 런칭 목표 🔥</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-white/80 leading-relaxed mb-8 word-keep">
            실패의 무서움을 너무 잘 알기에, 진짜 이커머스를 배워 평생 이커머스 같이 합시다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-10">
            <Button size="lg" className="w-full sm:w-auto py-4 px-10 text-base sm:text-lg bg-[#FF8A00] text-black shadow-xl shadow-[#FF8A00]/25" onClick={() => navigate('/enrollment')}>지원서 접수 하기 🔥</Button>
          </div>
          <div className="mt-12 rounded-[2rem] md:border md:border-[#4b2a15] md:bg-[#111111] px-5 py-6 md:py-8 md:shadow-[0_8px_30px_rgb(0,0,0,0.24)]">
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 md:gap-5">
              {[
                { label: '누적 브랜드 매각', target: 4, suffix: '+' },
                { label: '신규 운영 브랜드', target: 3, suffix: '+' },
                { label: '이커머스 수익', target: 20, suffix: '억+' },
                { label: '수강생 성공확률', target: 50, suffix: '%+' }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <AnimatedCount target={item.target} suffix={item.suffix} />
                  <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-[0.2em]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="py-24 bg-[#EDEDED] text-gray-900 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[#FF8A00] text-lg sm:text-xl md:text-2xl font-bold">아래 내용만으로 월200만원은 충분합니다.</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight word-keep">
              그럼에도 불구하고 압도적인 성과를 원하신다면
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight word-keep">
              강의 신청서를 접수 해 주세요!
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { src: 'assets/images/6.webp', title: '권리금 수익만 4.5억 + 이상', desc: <>찐 이커머스 판에서 검증 완료된<br/>전문가</>, link: 'https://newneek.co/@windly/article/38837' },
              { src: 'assets/images/7.webp', title: 'CEO저널 언론사 인터뷰', desc: '돈버는 똘기의 철학과 가치관이 담겨있어요.', link: 'https://www.ceojhn.com/news/articleView.html?idxno=9181' },
              { src: 'assets/images/8.png', title: '시작하신다면 위 영상 정주행!', desc: '시리즈 정주행이면 월200충분', link: 'https://www.youtube.com/@156cmm' }
            ].map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="block text-center px-4 hover:-translate-y-2 transition-transform duration-300 group">
                <div className="flex justify-center mb-6">
                  <div className="w-full h-36 md:h-48 rounded-3xl bg-white flex items-center justify-center shadow-md border border-gray-200 overflow-hidden">
                    <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </div>
                <div className="text-lg md:text-xl font-bold mb-2 text-gray-900 word-keep tracking-normal">{item.title}</div>
                <div className="text-sm text-gray-500 font-medium word-keep leading-relaxed tracking-normal">{item.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </section>


      <section id="courses" className="py-16 md:py-24 bg-[#fff7f0] border-b border-[#ffe5c8]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-lg md:text-xl font-bold text-[#FF8A00] mb-3 flex items-center gap-1">
            이 강의는 지속되지 않습니다 ⚠️
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111827] leading-tight mb-8 word-keep">
            단 4주, 성과 위주 실전압축 강의
          </h2>
          <div
            className="inline-block rounded-2xl overflow-hidden shadow-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
            onClick={() => navigate('/enrollment')}
          >
            <img src="assets/images/5.jpg" alt="수강신청 바로가기" className="w-auto max-w-xs sm:max-w-sm md:max-w-md h-auto object-cover block" />
          </div>
          <p className="text-xs md:text-sm text-gray-400 font-medium mt-3">쿠팡부터, 스마트스토어, 브랜드까지</p>
        </div>
      </section>


      <section className="py-24 bg-[#fff7f0] border-b border-[#ffe5c8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-[#111827] mb-4 tracking-tight word-keep">수강생들이 직접 증명하는 생존 공식</h2>
              <p className="text-lg md:text-xl text-[#5b5b5b] font-medium word-keep">철저하게 계산된 전략이 만들어낸 실제 계좌 입금 내역입니다.</p>
            </div>
            <Button variant="ghost" className="hidden md:flex text-[#FF8A00] hover:bg-[#ffe8d0]" onClick={()=>navigate('/revenues')}>전체보기 <Icon path={ICONS.ArrowRight} className="w-4 h-4 ml-1"/></Button>
          </div>
          <Carousel items={top10Revenues} renderItem={(rev) => (
            <div className="bg-white rounded-3xl overflow-hidden border border-[#f4e4ce] shadow-lg hover:shadow-xl transition-shadow flex flex-col h-[360px] cursor-pointer" onClick={() => showModal('postView', rev.title, rev.content)}>
               <div className="h-48 overflow-hidden relative border-b border-[#f4e4ce]">
                  <img src={rev.thumbnail} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-[#FF8A00] text-black font-black px-3 py-1 rounded-lg shadow-md word-keep text-xs">{rev.amount}</div>
               </div>
               <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                  <h3 className="font-bold text-base md:text-lg text-[#111827] mb-2 line-clamp-2 word-keep">{rev.title}</h3>
                  <div className="mt-auto text-xs text-[#6b7280] font-medium flex items-center justify-between">
                     <span>{rev.author}</span>
                     <span>{rev.date} · 조회 {rev.views}</span>
                  </div>
               </div>
            </div>
          )} />
          <div className="mt-8 text-center md:hidden">
             <Button variant="outline" className="w-full" onClick={()=>navigate('/revenues')}>수익인증 전체보기</Button>
          </div>
        </div>
      </section>



      {/* Reviews Slider */}
      <section className="py-24 bg-[#0B0B0B] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight word-keep mb-4">혼자 버티던 셀러들의 변화 🔥</h2>
              <p className="text-gray-400 font-medium text-lg">소싱은 계속하는데, 마진은 줄어들고 광고비는 늘어나고, 포기하지 못해 이어오던 시간들, 새로운 방식으로 재정립해 결과를 만들고 있습니다.</p>
            </div>
          </div>
            <Carousel items={top10Reviews} renderItem={(review) => (
            <div className="p-8 rounded-[2rem] bg-[#111111] border border-gray-800 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-[380px] md:h-[420px]">
              {review.image && <img src={review.image} className="w-full h-32 md:h-40 object-cover rounded-2xl mb-6 shadow-sm" />}
              <div className="flex justify-between items-start mb-4">
                <div className="flex text-yellow-400">{[...Array(review.rating)].map((_, j) => <Icon key={j} path={ICONS.Star} fill="#facc15" className="w-4 h-4" />)}</div>
                <span className="text-[10px] md:text-xs font-extrabold text-[#FF8A00] bg-white/5 px-2.5 py-1 rounded-md word-keep tracking-tight">{review.tag}</span>
              </div>
              <p className="text-gray-300 text-sm md:text-base font-medium leading-relaxed mb-6 flex-1 word-keep overflow-hidden">"{review.comment}"</p>
              <div className="border-t border-gray-800 pt-5 mt-auto"><div className="font-bold text-white text-sm word-keep">{review.name} 수강생</div></div>
            </div>
          )} />
        </div>
      </section>
    </div>
  );
};

const EnrollmentPage = ({ user, enrolledCourses, materials, navigate, showModal, onEnroll, courses }) => {
  const isEnrolled = enrolledCourses && enrolledCourses.length > 0;

  // [TEST MODE] 버튼 클릭 시 바로 수강 처리
  const handleApplyClick = () => {
    if (!user) {
      showModal('alert', '\ub85c\uadf8\uc778 \ud544\uc694', '\ub85c\uadf8\uc778 \ud6c4 \uc218\uac15\uc2e0\uccad\uc774 \uac00\ub2a5\ud569\ub2c8\ub2e4.', () => navigate('/login'));
      return;
    }
    const firstCourse = courses && courses[0];
    if (firstCourse && onEnroll) {
      onEnroll(firstCourse.id);
    } else {
      navigate('/mypage');
    }
  };

  const handleDownloadClick = (mat) => {
    if (!user) {
      showModal('alert', '로그인 필요', '로그인 후 이용이 가능합니다.', () => navigate('/login'));
    } else if (!isEnrolled) {
      showModal('alert', '수강 권한 없음', '수강생 전용 자료입니다. 실전 압축 강의 수강 후 다운로드가 가능합니다.');
    } else {
      showModal('alert', '다운로드 진행', `'${mat.title}' 다운로드가 시작되었습니다.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white">

      {/* Video Hero Section */}
      <section className="relative w-full h-screen flex items-end overflow-hidden pb-14 md:pb-20">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="assets/videos/8.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/45" />
        {/* Text Overlay */}
        <div className="relative z-10 w-full px-8 md:px-16">
          <p className="text-white/75 text-sm md:text-base font-semibold mb-2 tracking-wide">
            {'\uc18c\uaddc\ubaa8\uc5d0 \uc9d1\ucc29\ud569\ub2c8\ub2e4!'}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight word-keep drop-shadow-lg">
            {'\uc81c\ub300\ub85c \ub41c \uc774\ucee4\uba38\uc2a4,'}<br />
            {'\uc9c0\uae08 \uc2dc\uc791\ud558\uc138\uc694!'}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
        
        {/* Premium Benefits Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center gap-2 tracking-tight">
             수강생 혜택 프리미엄 서비스 💎
          </h2>
          <p className="text-gray-400 text-sm md:text-base mt-3 font-medium">압도적 성장을 위해 제공되는 시크릿 템플릿 및 자료집입니다.</p>
        </div>

        {/* Materials List */}
        <div className="w-full grid md:grid-cols-2 gap-6 mb-16">
          {materials.map((mat) => (
            <div key={mat.id} className="bg-[#111111] p-6 rounded-[2rem] border border-gray-800 shadow-lg flex items-center justify-between hover:border-[#FF8A00]/30 hover:shadow-[0_0_20px_rgba(255,138,0,0.05)] transition-all cursor-pointer" onClick={() => handleDownloadClick(mat)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={mat.icon} alt={mat.title} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white word-keep mb-1 tracking-tight text-base">{mat.title}</h3>
                  <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-extrabold">{mat.type}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-gray-800 text-gray-400 hover:border-[#FF8A00] hover:text-[#FF8A00] ml-4 flex-shrink-0">
                {isEnrolled ? '\uc5f4\uae30' : '\ud83d\udd12 \uc804\uc6a9'}
              </Button>
            </div>
          ))}
        </div>

        {/* Section Divider */}
        <div className="w-full border-t border-gray-800 my-4"></div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-black mt-16 mb-8 text-center tracking-tight text-[#FF8A00]">수강신청</h1>
        
        {/* Large Image Button */}
        <div className="w-full max-w-2xl bg-[#111111] rounded-[2rem] p-6 border border-[#FF8A00]/30 shadow-[0_0_30px_rgba(255,138,0,0.15)] flex flex-col items-center hover:scale-[1.01] transition-transform duration-300">
          <button onClick={handleApplyClick} className="block w-full focus:outline-none">
            <img src="assets/images/5.jpg" alt="지원서 접수하기" className="w-full h-auto object-cover rounded-2xl cursor-pointer shadow-md hover:opacity-95 transition-opacity" />
          </button>
          <div className="mt-6 text-center w-full">
            <p className="text-xs text-[#FF8A00] font-bold mb-4">★ 1:1 밀착 코칭 및 실전 압축 실습 ★</p>
            <Button size="lg" onClick={handleApplyClick} className="w-full sm:w-auto px-12 py-4 text-base md:text-lg bg-[#FF8A00] text-black font-black shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all">
              지원서 접수 하기 🔥
            </Button>
          </div>
        </div>

      </div> {/* /max-w-4xl */}
      </div> {/* /pt-16 pb-24 */}
    </div>
  );
};

const CourseDetailPage = ({ course, user, onEnroll, navigate, showModal }) => {
  if (!course) return <div className="pt-32 text-center h-screen font-bold">강의를 찾을 수 없습니다.</div>;

  const handlePaymentRequest = () => {
    // 이제 외부 모듈인 PaymentService를 호출하여 결제 로직을 처리합니다.
    window.PaymentService.requestCoursePayment(course, user, onEnroll, showModal, navigate);
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-16">
      <div className="bg-gray-900 text-white pt-24 pb-32 md:pb-48 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-16 items-center relative z-10">
          <div className="flex-1">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-6 backdrop-blur-md">{course.category}</Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight word-keep">{course.title}</h1>
            <p className="text-lg md:text-xl text-gray-400 mb-8 font-medium leading-relaxed word-keep">{course.summary}</p>
          </div>
          <div className="hidden lg:block w-2/5 rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-gray-800 bg-gray-800">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover aspect-video opacity-90" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 md:-mt-24 relative flex flex-col lg:flex-row gap-8 pb-32 items-start z-20">
        <div className="flex-1 w-full bg-white rounded-[2rem] p-8 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-2xl font-black mb-8 text-gray-900 flex items-center gap-3 word-keep">
            <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block"></span>클래스 상세 및 커리큘럼
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-loose mb-14 whitespace-pre-wrap font-medium word-keep">{course.description}</p>
          <div className="space-y-4">
            {course.curriculum && course.curriculum.map((item, idx) => (
              <div key={idx} className="flex items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-colors">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mr-5 flex-shrink-0"><Icon path={ICONS.PlayCircle} className="w-6 h-6 text-indigo-600"/></div>
                <span className="font-bold text-gray-800 word-keep text-lg tracking-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-[400px] lg:sticky lg:top-28">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_50px_rgb(0,0,0,0.1)] border-2 border-indigo-50">
            <div className="text-sm font-bold text-gray-500 mb-2 tracking-tight">수강 기간: 평생 소장</div>
            <div className="text-4xl font-black text-gray-900 mb-8 tracking-tight">{new Intl.NumberFormat('ko-KR').format(course.price)}원</div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-sm font-bold text-gray-700"><Icon path={ICONS.CheckCircle} className="w-5 h-5 mr-3 text-indigo-500"/>평생 무제한 반복 수강</li>
              <li className="flex items-center text-sm font-bold text-gray-700"><Icon path={ICONS.CheckCircle} className="w-5 h-5 mr-3 text-indigo-500"/>전용 비공개 커뮤니티 연결</li>
              <li className="flex items-center text-sm font-bold text-gray-700"><Icon path={ICONS.CheckCircle} className="w-5 h-5 mr-3 text-indigo-500"/>실무 템플릿 자료실 이용권</li>
            </ul>

            <Button className="w-full py-5 text-lg" onClick={handlePaymentRequest}>안전하게 수강 신청하기</Button>
            <div className="flex items-center justify-center mt-5 gap-4">
              <span className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-1 rounded-full tracking-tight">테스트 결제 모드 지원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ navigate, onLoginSuccess, showModal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '', profileName: '', region: '' });

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleKakaoLogin = () => {
    const dummyEmail = `kakao_${Date.now()}@user.com`;
    window.FirebaseAuth.saveSession({ email: dummyEmail, uid: `uid_${Date.now()}`, name: '카카오 회원' });
    showModal('alert', '카카오 연동 완료', '카카오 간편 로그인이 성공적으로 완료되었습니다.', () => {
      onLoginSuccess();
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); 
    if (!isLogin) {
      if(!formData.name.trim()) return showModal('alert', '안내', "이름을 정확히 입력해주세요.");
      if(!formData.profileName.trim()) return showModal('alert', '안내', "프로필명을 입력해주세요.");
      if(!formData.phone.trim()) return showModal('alert', '안내', "전화번호를 입력해주세요.");
      if(!formData.region.trim()) return showModal('alert', '안내', "거주 지역(시 단위)을 입력해주세요.");
    }
    if(!formData.email.trim() || !formData.email.includes('@')) return showModal('alert', '안내', "유효한 이메일 주소를 입력해주세요.");
    if(formData.password.length < 6) return showModal('alert', '안내', "보안을 위해 비밀번호는 6자리 이상 설정해야 합니다.");

    const mockUser = { 
      email: formData.email, 
      uid: `uid_${Date.now()}`, 
      name: isLogin ? (formData.email.split('@')[0]) : formData.name,
      profileName: formData.profileName,
      region: formData.region,
      phone: formData.phone
    };
    
    window.FirebaseAuth.saveSession(mockUser);
    
    if(!isLogin) {
      const usersDB = window.FirebaseDB.loadData('users_db', []);
      window.FirebaseDB.saveData('users_db', [...usersDB, mockUser]);
    }
    
    showModal('alert', isLogin ? '로그인 성공' : '가입 완료', isLogin ? "정상적으로 로그인되었습니다." : "회원가입이 완료되었습니다. 돈버는 똘기에 오신것을 환영합니다!", () => {
      onLoginSuccess();
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{isLogin ? '환영합니다.' : '지속 가능한 이커머스의 시작'}</h2>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 rounded-[2.5rem]">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">이름</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="홍길동" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">프로필명</label>
                  <input type="text" name="profileName" value={formData.profileName} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="활동할 닉네임" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">전화번호</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="010-1234-5678" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">거주 지역</label>
                    <input type="text" name="region" value={formData.region} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="서울특별시" />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">이메일 주소</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="test@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">비밀번호</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="6자리 이상 입력" />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full py-4 text-base tracking-tight">
                {isLogin ? '이메일로 로그인' : '가입 완료하기'}
              </Button>
            </div>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center text-xs font-bold text-gray-400"><span className="px-4 bg-white">간편 로그인</span></div>
          </div>
          
          <div className="mt-6">
            <button type="button" onClick={handleKakaoLogin} style={{ backgroundColor: '#FEE500', color: '#000000' }} className="w-full py-4 text-base shadow-sm border-none flex items-center justify-center gap-3 tracking-tight hover:opacity-90 font-bold rounded-2xl transition-all duration-300 active:scale-95">
              <svg viewBox="0 0 32 32" className="w-5 h-5"><path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.12 4.16c-.16.56.56.96.96.64l4.8-3.2c.72.16 1.44.24 2.24.24 6.96 0 12.64-4.48 12.64-10.08S22.96 4.64 16 4.64z" fill="#000000"/></svg>
              카카오로 1초 만에 {isLogin ? '로그인' : '시작하기'}
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setFormData({email:'', password:'', name:'', phone:'', profileName:'', region:''}); }} className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {isLogin ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WriteReviewPage = ({ user, updateDB, reviewsData, navigate, showModal }) => {
  const [formData, setFormData] = useState({ rating: 5, comment: '', tag: '생존 매뉴얼 검증', image: '' });
  
  useEffect(() => {
    if(!user) {
      showModal('alert', '권한 없음', '로그인 후 후기 작성이 가능합니다.', () => navigate('/login'));
    }
  }, [user]);

  if(!user) return <div className="h-screen bg-gray-50"></div>;
  
  const handleSubmit = () => {
    if(!formData.comment) return showModal('alert', '안내', '후기 내용을 입력해주세요.');
    const newReview = { id: `review-${Date.now()}`, name: user.name || '수강생', rating: Number(formData.rating), comment: formData.comment, tag: formData.tag, image: formData.image || null };
    updateDB('reviews', [newReview, ...reviewsData]);
    showModal('alert', '작성 완료', '소중한 후기가 등록되었습니다.', () => navigate('/reviews'));
  };
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-3xl font-black mb-8 text-gray-900 word-keep tracking-tight">수강생 피드백 작성</h1>
        <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">별점 (1~5)</label>
            <input type="number" min="1" max="5" value={formData.rating} onChange={(e)=>setFormData({...formData, rating: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">핵심 키워드 (태그)</label>
            <input type="text" value={formData.tag} onChange={(e)=>setFormData({...formData, tag: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">사진 첨부 (URL 입력)</label>
            <input type="text" placeholder="https://..." value={formData.image} onChange={(e)=>setFormData({...formData, image: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">후기 내용</label>
            <textarea rows="6" value={formData.comment} onChange={(e)=>setFormData({...formData, comment: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 leading-relaxed"></textarea>
          </div>
          <Button onClick={handleSubmit} className="w-full py-4 mt-4 text-lg">피드백 등록하기</Button>
        </div>
      </div>
    </div>
  );
};

const CommunityPage = ({ communityPosts, user, onAddPost, showModal }) => {
  const handleWrite = () => {
    if(!user) return showModal('alert', '권한 없음', '로그인 후 글 작성이 가능합니다.');
    showModal('custom', '게시글 작성', '새로운 인사이트를 작성합니다.', (data) => {
      if(!data.title) return showModal('alert', '안내', '제목을 입력해야 합니다.');
      onAddPost({ id: `comm-${Date.now()}`, title: data.title, content: data.content, author: user.name || '수강생', date: new Date().toISOString().split('T')[0] });
      showModal('alert', '작성 완료', '게시글이 성공적으로 등록되었습니다.');
    }, '', false, [
      {name: 'title', type: 'text', placeholder: '게시글 제목'},
      {name: 'content', type: 'textarea', placeholder: '게시글 내용'}
    ]);
  };
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">프리미엄 커뮤니티</h1>
            <p className="text-gray-500 font-medium">유튜브 @156cmm 수강생들과의 소통 공간입니다.</p>
          </div>
          <Button onClick={handleWrite} size="sm"><Icon path={ICONS.Plus} className="w-4 h-4 mr-1"/> 글쓰기</Button>
        </div>
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {communityPosts.map((post, i) => (
            <div key={post.id} className="p-8 border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={()=>showModal('alert', post.title, post.content || "내용이 없습니다.")}>
              <h3 className="font-bold text-xl text-gray-900 mb-3 word-keep tracking-tight">{post.title}</h3>
              <div className="flex justify-between text-sm text-gray-400 font-medium"><span>{post.author}</span><span>{post.date}</span></div>
            </div>
          ))}
          {communityPosts.length === 0 && <div className="p-16 text-center text-gray-400 font-bold">등록된 게시글이 없습니다.</div>}
        </div>
      </div>
    </div>
  );
};

const MaterialsPage = ({ enrolledCourses, materials, navigate }) => {
  const isEnrolled = enrolledCourses && enrolledCourses.length > 0;
  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-50 pt-48 pb-20 flex justify-center text-center">
         <div>
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100"><Icon path={ICONS.Lock} className="w-10 h-10 text-gray-300" /></div>
           <h2 className="text-2xl font-black text-gray-900 mb-4 word-keep">{'\uc218\uac15\uc0dd \uc804\uc6a9 \ud504\ub9ac\ubbf8\uc5c4 \uc790\ub8cc\uc2e4'}</h2>
           <p className="text-gray-500 font-medium word-keep">{'\ud074\ub798\uc2a4 \uacb0\uc81c\ub97c \uc644\ub8cc\ud55c \ubd84\ub4e4\ub9cc \uc811\uadfc \uac00\ub2a5\ud55c \ube44\ubc00 \uac8c\uc2dc\ud310\uc785\ub2c8\ub2e4.'}</p>
         </div>
      </div>
    );
  }

  const icons = { '\ud504\ub85c\uadf8\ub7a8': ICONS.Code || ICONS.FileText, '\ub9ac\uc18c\uc2a4': ICONS.Star || ICONS.FileText, '\uc5c5\uccb4\uc815\ubcf4': ICONS.Users || ICONS.FileText };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-black mb-2 text-gray-900 tracking-tight">{'\uc2e4\uc804 \ud234\ud50c\ub9bf \uc790\ub8cc\uc2e4'}</h1>
        <p className="text-gray-500 mb-10 font-medium">{'\ub3c8\ubc84\ub294 \ub98e\uae30\uac00 \uc9c1\uc811 \uc0ac\uc6a9\ud558\ub294 \uc2e4\uc804 \ud234\uc2a4\uc640 \uc5c5\uccb4 \uc815\ubcf4\uc785\ub2c8\ub2e4.'}</p>
        <div className="grid md:grid-cols-2 gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              onClick={() => navigate(mat.route)}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-[#FF8A00]/40 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner group-hover:opacity-90 transition-opacity">
                  <img src={mat.icon} alt={mat.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 word-keep mb-1 tracking-tight text-base">{mat.title}</h3>
                  <span className="text-[11px] bg-orange-50 text-[#FF8A00] px-2 py-1 rounded font-bold">{mat.type}</span>
                </div>
              </div>
              <Button size="sm" className="ml-4 flex-shrink-0 bg-[#FF8A00] text-black border-none">
                {'\uc5f4\uae30'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 자료실 상세 페이지 (각 자료별)
// ============================================================================
const MATERIAL_DETAIL_DATA = {
  'mat-1': {
    title: '\uacbd\uc7c1\uc0ac \ud310\ub9e4\ub7c9 \ubd84\uc11d\ud504\ub85c\uadf8\ub7a8',
    type: '\ud504\ub85c\uadf8\ub7a8',
    icon: 'assets/images/9.png',
    desc: '\ucfe0\ud321, \uc2a4\ub9c8\ud2b8\uc2a4\ud1a0\uc5b4\uc5d0\uc11c \uacbd\uc7c1 \uc140\ub7ec\uc758 \uc2e4\uc81c \ud310\ub9e4\ub7c9\uc744 \ucd94\uc801\ud558\ub294 \ud504\ub85c\uadf8\ub7a8\uc785\ub2c8\ub2e4. \uc0c1\uc704 \ub178\ucd9c \uc0c1\ud488\uc758 \uc6d4\ubcc4 \ub9e4\ucd9c\ub7c9\uc744 \uc77c\uc77c\uc774 \ud655\uc778\ud558\uc5ec \uc548\uc815\uc801\uc778 \uc544\uc774\ud15c\uc744 \uc120\ubcc4\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
    steps: [
      '\ud504\ub85c\uadf8\ub7a8 \ub2e4\uc6b4\ub85c\ub4dc \ud6c4 \uc2e4\ud589',
      '\ucfe0\ud321 or \uc2a4\ub9c8\ud2b8\uc2a4\ud1a0\uc5b4 \ud0ed \uc120\ud0dd',
      '\ubd84\uc11d\ud560 \ud0a4\uc6cc\ub4dc \uc785\ub825',
      '\uc6d4\ubcc4/\uc8fc\ubcc4 \ub9e4\ucd9c \uc2e4\uc801 \ud655\uc778',
      '\uc81c\ud488 \ub4f1\ub85d \uc5ec\ubd80 \ud310\ub2e8\uc5d0 \ud65c\uc6a9',
    ],
    downloadLabel: '\ud504\ub85c\uadf8\ub7a8 \ub2e4\uc6b4\ub85c\ub4dc',
    downloadUrl: '#',
  },
  'mat-2': {
    title: '\uc678\ubd80\ub9c1\ud06c \ucd94\uc801 \ud504\ub85c\uadf8\ub7a8',
    type: '\ud504\ub85c\uadf8\ub7a8',
    icon: 'assets/images/10.png',
    desc: '\uc678\ubd80 \ub9c1\ud06c(\ube14\ub85c\uadf8, SNS, \uce74\ud398 \ub4f1)\uc5d0\uc11c \uc720\uc785\ub418\ub294 \ud2b8\ub798\ud53d\uc744 \ucd94\uc801\ud558\ub294 \ud234\uc785\ub2c8\ub2e4. \uc5b4\ub5a4 \ub9c1\ud06c\uac00 \uc2e4\uc81c \ub9e4\ucd9c\ub85c \uc774\uc5b4\uc9c0\ub294\uc9c0 \ub370\uc774\ud130\ub85c \ud655\uc778\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
    steps: [
      '\ud504\ub85c\uadf8\ub7a8 \uc124\uce58 \ud6c4 \uc2e4\ud589',
      '\uc790\uc2e0\uc758 \uc2a4\ud1a0\uc5b4 URL \uc785\ub825',
      '\ucd94\uc801\ud560 \uc678\ubd80 \ub9c1\ud06c URL \uc785\ub825',
      '\uc720\uc785 \uba85\uc218 / \uc804\ud658\uc728 \ud655\uc778',
      '\ub9c1\ud06c\ubcc4 ROI \uc5f0\uc0b0\ud558\uc5ec \ub9c8\ucf80\ud305 \ucd5c\uc801\ud654',
    ],
    downloadLabel: '\ud504\ub85c\uadf8\ub7a8 \ub2e4\uc6b4\ub85c\ub4dc',
    downloadUrl: '#',
  },
  'mat-3': {
    title: 'AI \uc591\ubc29\ud5a5 \uc790\ub3d9\ubc88\uc5ed\uae30 + 1688 LV6 \uc544\uc774\ub514 + \uccb4\ud5d8\ub2e8 \uc5c5\uccb4',
    type: '\ub9ac\uc18c\uc2a4',
    icon: 'assets/images/11.png',
    desc: '3\uac00\uc9c0 \ub9ac\uc18c\uc2a4 \ud328\ud0a4\uc9c0\uc785\ub2c8\ub2e4. AI\ub97c \uc774\uc6a9\ud55c \ud55c\uc911 \uc591\ubc29\ud5a5 \uc790\ub3d9 \ubc88\uc5ed\uae30, 1688 \uace0\ub4f1\uae09(LV6) \ubc14\uc774\uc5b4 \uc544\uc774\ub514, \uc2e4\uc81c \uccb4\ud5d8\ub2e8 \uc5f0\uacc4 \uc5c5\uccb4 \ub9ac\uc2a4\ud2b8\uac00 \ud3ec\ud568\ub418\uc5b4 \uc788\uc2b5\ub2c8\ub2e4.',
    steps: [
      '[\uc790\ub3d9\ubc88\uc5ed\uae30] \ud06c\ub86c \ud655\uc7a5\ud504\ub85c\uadf8\ub7a8 \uc124\uce58 \ud6c4 \uc0ac\uc6a9',
      '[\ub9ac\uc2a4\ud2b8] 1688 LV6 \uc544\uc774\ub514\ub85c \ub3c4\ub9e4\uac00 \ud560\uc778\uc728 \ud655\uc778',
      '[\uccb4\ud5d8\ub2e8] \ub9ac\uc2a4\ud2b8\uc5d0\uc11c \uc5c5\uccb4 \ucee4\ud0dd\ud6c4 \uc870\uac74 \ud611\uc758',
      '\ubb38\uc758\ub294 \uc5c5\uccb4\ubcc4 \ub9de\ucDB4\uc9c0\ub294 \uc591\uc2dd \ud65c\uc6a9 \uad6c\uccb4\uc801 \ubc29\uc2dd \uc548\ub0b4\uc11c \ud3ec\ud568',
    ],
    downloadLabel: '\ub9ac\uc18c\uc2a4 \ud328\ud0a4\uc9c0 \ub2e4\uc6b4\ub85c\ub4dc',
    downloadUrl: '#',
  },
  'mat-4': {
    title: '\uc218\uc785\ub300\ud589 & 3PL \ub3d9\uc2dc\uc6b4\uc601 \uc5c5\uccb4',
    type: '\uc5c5\uccb4\uc815\ubcf4',
    icon: 'assets/images/12.png',
    desc: '\uc911\uad6d\uc0b0 \uc81c\ud488 \uc218\uc785 \ub300\ud589\uacfc 3PL(\ucc3d\uace0/\ubc30\uc1a1) \uc5c5\ubb34\ub97c \ub3d9\uc2dc\uc5d0 \uc6b4\uc601\ud558\ub294 \uc5c5\uccb4 \ub9ac\uc2a4\ud2b8\uc785\ub2c8\ub2e4. \ub3cc\uae30\uac00 \uc9c1\uc811 \uac71\uc5b4\ubcf4\uace0 \uc2e0\ub8b0\ud560 \uc218 \uc788\ub294 \ud30c\ud2b8\ub108\uc785\ub2c8\ub2e4.',
    steps: [
      '\uc5c5\uccb4 \ub9ac\uc2a4\ud2b8 \ub2e4\uc6b4\ub85c\ub4dc',
      '\ub2f4\ub2f9\uc790\uc5d0\uac8c \ud95c\uccb4 \ub2e8\uac00 \uc694\uccad',
      '\ub3d9\ub300\ubb38 vs 3PL \uc870\uac74 \ube44\uad50\ud6c4 \uc120\ud0dd',
      '\uc2dc\uc81c\ud488 \ubc1c\uc8fc \ud6c4 \ud488\uc9c8 \ud655\uc778 \uc808\ucc28 \uc548\ub0b4',
    ],
    downloadLabel: '\uc5c5\uccb4 \ub9ac\uc2a4\ud2b8 \ub2e4\uc6b4\ub85c\ub4dc',
    downloadUrl: '#',
  },
};

const MaterialDetailPage = ({ matId, enrolledCourses, navigate, showModal }) => {
  const isEnrolled = enrolledCourses && enrolledCourses.length > 0;
  const data = MATERIAL_DETAIL_DATA[matId];

  if (!data) return <div className="pt-48 text-center font-bold">{'\uc790\ub8cc\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.'}</div>;

  const handleDownload = () => {
    if (!isEnrolled) {
      showModal('alert', '\uc218\uac15\uc0dd \uc804\uc6a9', '\uc218\uac15 \ub4f1\ub85d \ud6c4 \ub2e4\uc6b4\ub85c\ub4dc\uac00 \uac00\ub2a5\ud569\ub2c8\ub2e4.');
      return;
    }
    if (data.downloadUrl === '#') {
      showModal('alert', '\uc900\ube44 \uc911', '\ub2e4\uc6b4\ub85c\ub4dc \ud30c\uc77c\uc744 \uc900\ube44 \uc911\uc785\ub2c8\ub2e4. \uc870\ub9cc \uae30\ub2e4\ub824\uc8fc\uc138\uc694!');
    } else {
      window.open(data.downloadUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* 뒤로 가기 */}
        <button onClick={() => navigate('/materials')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold mb-8 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {'\uc790\ub8cc\uc2e4\ub85c \ub3cc\uc544\uac00\uae30'}
        </button>

        {/* 헤더 */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
              <img src={data.icon} alt={data.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xs bg-orange-50 text-[#FF8A00] px-3 py-1 rounded-full font-bold">{data.type}</span>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 mt-2 word-keep tracking-tight">{data.title}</h1>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed font-medium">{data.desc}</p>
        </div>

        {/* 사용 방법 */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-gray-100 shadow-sm mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#FF8A00] rounded-full inline-block"></span>
            {'\uc0ac\uc6a9 \ubc29\ubc95'}
          </h2>
          <ol className="space-y-4">
            {data.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="w-7 h-7 bg-[#FF8A00] text-black text-xs font-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-gray-700 font-medium leading-relaxed word-keep">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* 다운로드 버튼 */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {isEnrolled ? (
            <>
              <p className="text-gray-600 font-medium">{'\uc218\uac15\uc0dd \uc804\uc6a9 \ud30c\uc77c\uc785\ub2c8\ub2e4. \uc544\ub798\uc5d0\uc11c \ub2e4\uc6b4\ub85c\ub4dc\ud558\uc138\uc694.'}</p>
              <Button onClick={handleDownload} className="w-full sm:w-auto bg-[#FF8A00] text-black border-none font-black">
                {'\u2b07\ufe0f '}{data.downloadLabel}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Icon path={ICONS.Lock} className="w-5 h-5 text-gray-400" />
                <p className="text-gray-500 font-medium">{'\uc218\uac15 \ub4f1\ub85d \uc774\ud6c4 \ub2e4\uc6b4\ub85c\ub4dc \uac00\ub2a5\ud569\ub2c8\ub2e4.'}</p>
              </div>
              <Button onClick={() => navigate('/enrollment')} className="w-full sm:w-auto bg-gray-900 text-white border-none">
                {'\uc218\uac15\uc2e0\uccad \ud558\ub7ec\uac00\uae30'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};



const MyPage = ({ user, enrolledCourses, navigate }) => (
  <div className="min-h-screen bg-gray-50 pt-32 pb-20">
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">내 강의실</h1>
      
      <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-8 mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner"><Icon path={ICONS.User} className="w-10 h-10"/></div>
        <div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">{user?.name || user?.email || '수강생'}님</h2>
          <p className="text-gray-500 text-sm font-bold">학습 중인 클래스 <span className="text-indigo-600 text-base ml-1">{enrolledCourses.length}</span>개</p>
        </div>
      </div>

      <h3 className="text-xl font-black text-gray-900 mb-6 px-2">보유 중인 클래스</h3>
      <div className="space-y-6">
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-24 text-gray-400 font-bold border border-gray-100 rounded-[2rem] bg-white">아직 시작한 클래스가 없습니다.</div>
        ) : (
          enrolledCourses.map(course => (
             <div key={course.id} className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm hover:shadow-md transition-shadow">
                <img src={course.thumbnail} className="w-full md:w-48 rounded-2xl object-cover aspect-video shadow-sm" />
                <div className="text-center md:text-left flex-1 w-full pt-2">
                  <div className="inline-block text-xs text-indigo-600 font-extrabold bg-indigo-50 px-3 py-1 rounded-full mb-3">평생 소장</div>
                  <h4 className="text-xl font-black word-keep tracking-tight mb-4">{course.title}</h4>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2"><div className="bg-indigo-500 w-[15%] h-full rounded-full"></div></div>
                  <div className="text-right text-xs font-bold text-gray-400">학습 진행률 15%</div>
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// 관리자 대시보드
// ============================================================================
const AdminDashboard = ({ courses, materials, community, reviewsData, revenuesData, usersDB, updateDB, navigate, showModal }) => {
  const [tab, setTab] = useState('reviews');
  const [form, setForm] = useState({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewThumb, setPreviewThumb] = useState('');

  const resetForm = () => { setForm({}); setPreviewUrl(''); setPreviewThumb(''); };

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleImageFile = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    if (field === 'image') setPreviewUrl(b64);
    if (field === 'thumbnail') setPreviewThumb(b64);
    setForm(f => ({ ...f, [field]: b64 }));
  };

  const handleAddReview = () => {
    if (!form.name?.trim()) return showModal('alert', '\uc548\ub0b4', '\uc791\uc131\uc790 \uc774\ub984\uc744 \uc785\ub825\ud558\uc138\uc694.');
    if (!form.comment?.trim()) return showModal('alert', '\uc548\ub0b4', '\ud6c4\uae30 \ub0b4\uc6a9\uc744 \uc785\ub825\ud558\uc138\uc694.');
    const newItem = {
      id: `review-${Date.now()}`,
      name: form.name,
      rating: Number(form.rating || 5),
      tag: form.tag || '\uc2e4\uc804\uc140\ub7ec',
      image: form.image || null,
      comment: form.comment
    };
    updateDB('reviews', [newItem, ...reviewsData]);
    showModal('alert', '\ub4f1\ub85d \uc131\uacf5', '\ud6c4\uae30\uac00 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    resetForm();
  };

  const handleAddRevenue = () => {
    if (!form.title?.trim()) return showModal('alert', '\uc548\ub0b4', '\uc81c\ubaa9\uc744 \uc785\ub825\ud558\uc138\uc694.');
    if (!form.amount?.trim()) return showModal('alert', '\uc548\ub0b4', '\ub2ec\uc131 \uc131\uacfc\ub97c \uc785\ub825\ud558\uc138\uc694.');
    const contentHTML = `<div class="space-y-6 text-gray-800 leading-relaxed text-sm md:text-base">
      ${(form.content || '').split('\n').map(p => `<p>${p}</p>`).join('')}
      ${form.thumbnail ? `<img src="${form.thumbnail}" class="w-full rounded-2xl border border-gray-200 shadow-sm" alt="\uc218\uc775\uc778\uc99d" />` : ''}
    </div>`;
    const newItem = {
      id: `rev-${Date.now()}`,
      title: form.title,
      amount: form.amount,
      author: form.author || '\uc218\uac15\uc0dd',
      date: form.date || new Date().toISOString().split('T')[0],
      thumbnail: form.thumbnail || '',
      content: contentHTML
    };
    updateDB('revenues', [newItem, ...revenuesData]);
    showModal('alert', '\ub4f1\ub85d \uc131\uacf5', '\uc218\uc775\uc778\uc99d\uc774 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
    resetForm();
  };

  const handleDelete = (type, id) => {
    showModal('confirm', '\uc0ad\uc81c \ud655\uc778', '\uc774 \ud56d\ubaa9\uc744 \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?', () => {
      if (type === 'reviews') updateDB('reviews', reviewsData.filter(r => r.id !== id));
      if (type === 'revenues') updateDB('revenues', revenuesData.filter(r => r.id !== id));
    });
  };

  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const lbl = "block text-xs font-black text-gray-600 mb-1.5 uppercase tracking-wide";

  const ReviewForm = () => (
    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
      <h3 className="font-black text-gray-900 mb-5 text-sm tracking-tight">{'\uc0c8 \ud6c4\uae30 \ub4f1\ub85d'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className={lbl}>{'\uc791\uc131\uc790 \uc774\ub984'}</label>
          <input className={inp} placeholder="\uc608: \uc2e4\uc804\uc140\ub7ec99" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        </div>
        <div>
          <label className={lbl}>{'\ud3c9\uc810 (1~5)'}</label>
          <input className={inp} type="number" min="1" max="5" placeholder="5" value={form.rating||''} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} />
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>{'\ud575\uc2ec \ud0dc\uadf8'}</label>
          <input className={inp} placeholder="\uc608: \uc6d4 \ub9e4\ucd9c 3\ubc30 \uc0c1\uc2b9" value={form.tag||''} onChange={e=>setForm(f=>({...f,tag:e.target.value}))} />
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>{'\uc0ac\uc9c4 \uc5c5\ub85c\ub4dc (\uc120\ud0dd)'}</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center gap-3 cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl px-4 py-3 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm text-gray-500 font-medium">{previewUrl ? '\uc774\ubbf8\uc9c0 \uc120\ud0dd\ub428' : '\uc774\ubbf8\uc9c0 \ud30c\uc77c \uc120\ud0dd'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e=>handleImageFile(e,'image')} />
            </label>
            {previewUrl && <img src={previewUrl} className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="preview" />}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>{'\ud6c4\uae30 \ub0b4\uc6a9'}</label>
          <textarea className={inp+' min-h-[100px] resize-y'} placeholder="\ud6c4\uae30 \ub0b4\uc6a9\uc744 \uc785\ub825\ud558\uc138\uc694" value={form.comment||''} onChange={e=>setForm(f=>({...f,comment:e.target.value}))} />
        </div>
      </div>
      <Button onClick={handleAddReview} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-200">{'\ud6c4\uae30 \ub4f1\ub85d \ud558\uae30'}</Button>
    </div>
  );

  const RevenueForm = () => (
    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
      <h3 className="font-black text-gray-900 mb-5 text-sm tracking-tight">{'\uc0c8 \uc218\uc775\uc778\uc99d \ub4f1\ub85d'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="md:col-span-2">
          <label className={lbl}>{'\uc81c\ubaa9'}</label>
          <input className={inp} placeholder="\uc608: \uadf8\ub85c\uc2a4 21\uae30 \uc6d4 1000\ub9cc \ub2ec\uc131 \ud6c4\uae30" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
        </div>
        <div>
          <label className={lbl}>{'\ub2ec\uc131 \uc131\uacfc'}</label>
          <input className={inp} placeholder="\uc608: \uc6d4 1000\ub9cc \ub2ec\uc131" value={form.amount||''} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
        </div>
        <div>
          <label className={lbl}>{'\uc791\uc131\uc790'}</label>
          <input className={inp} placeholder="\uc608: \ub85c\ucf13\ud2b8\uc6d0" value={form.author||''} onChange={e=>setForm(f=>({...f,author:e.target.value}))} />
        </div>
        <div>
          <label className={lbl}>{'\ub0a0\uc9dc'}</label>
          <input className={inp} placeholder={new Date().toISOString().split('T')[0]} value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        </div>
        <div>
          <label className={lbl}>{'\uc368\ub124\uc77c \uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc'}</label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center gap-3 cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl px-4 py-3 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm text-gray-500 font-medium">{previewThumb ? '\uc774\ubbf8\uc9c0 \uc120\ud0dd\ub428' : '\ud30c\uc77c \uc120\ud0dd'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e=>handleImageFile(e,'thumbnail')} />
            </label>
            {previewThumb && <img src={previewThumb} className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="thumb" />}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>{'\uc0c1\uc138 \ud6c4\uae30 \ub0b4\uc6a9 (\uc904\ubc14\uafc8 \uc9c0\uc6d0)'}</label>
          <textarea className={inp+' min-h-[140px] resize-y'} placeholder="\uc218\uac15 \ud6c4 \ubcc0\ud654\ub098 \uc131\uacfc\ub97c \uc791\uc131\ud558\uc138\uc694..." value={form.content||''} onChange={e=>setForm(f=>({...f,content:e.target.value}))} />
        </div>
      </div>
      <Button onClick={handleAddRevenue} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-200">{'\uc218\uc775\uc778\uc99d \ub4f1\ub85d \ud558\uae30'}</Button>
    </div>
  );

  const renderList = (data, type) => (
    <div className="space-y-3">
      {data.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
          {'\ub4f1\ub85d\ub41c \ud56d\ubaa9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4. \uc704 \uc591\uc2dd\uc5d0\uc11c \uc0c8\ub85c \ub4f1\ub85d\ud558\uc138\uc694.'}
        </div>
      )}
      {data.map(item => (
        <div key={item.id} className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {(item.image || item.thumbnail) && (
              <img src={item.image || item.thumbnail} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" alt="" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{item.name || item.title}</p>
              <p className="text-gray-400 text-xs truncate mt-0.5">{(item.comment || item.amount || '').substring(0, 60)}</p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(type, item.id)}
            className="ml-4 flex-shrink-0 text-red-400 hover:text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100 hover:border-red-200"
          >
            {'\uc0ad\uc81c'}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <div className="w-full md:w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 md:p-8 text-xl font-black border-b border-gray-800 tracking-tighter">ADMIN</div>
        <nav className="flex flex-row md:flex-col overflow-x-auto p-3 md:p-6 gap-2 text-sm font-bold">
          {[['reviews','\ud6c4\uae30 \uad00\ub9ac'],['revenues','\uc218\uc775\uc778\uc99d \uad00\ub9ac']].map(([key,label]) => (
            <button key={key} onClick={()=>{setTab(key);resetForm();}} className={`flex-shrink-0 text-left px-5 py-3 rounded-xl transition-colors ${tab===key?'bg-indigo-600 text-white':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{label}</button>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-800 hidden md:block mt-auto">
          <button onClick={()=>navigate('/')} className="text-gray-500 font-bold hover:text-white transition-colors text-sm flex items-center">
            <Icon path={ICONS.LogOut} className="w-4 h-4 mr-2"/>
            {'\ub098\uac00\uae30'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {tab === 'reviews' ? '\uc218\uac15\uc0dd \ud6c4\uae30 \uad00\ub9ac' : '\uc218\uc775\uc778\uc99d \uad00\ub9ac'}
          </h2>
          <button onClick={()=>navigate('/')} className="md:hidden text-gray-500 font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200">{'\ub098\uac00\uae30'}</button>
        </div>
        {tab === 'reviews' && <ReviewForm />}
        {tab === 'revenues' && <RevenueForm />}
        <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-700 mb-5 text-sm tracking-wide uppercase">
            {tab === 'reviews' ? `\ub4f1\ub85d\ub41c \ud6c4\uae30 (${reviewsData.length}\uac74)` : `\ub4f1\ub85d\ub41c \uc218\uc775\uc778\uc99d (${revenuesData.length}\uac74)`}
          </h3>
          {tab === 'reviews' && renderList(reviewsData, 'reviews')}
          {tab === 'revenues' && renderList(revenuesData, 'revenues')}
        </div>
      </div>
    </div>
  );
};

// ============================================================================

// ============================================================================
// 메인 라우터 앱 & 커스텀 모달 매니저
// ============================================================================
function App() {
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, placeholder: '', isPassword: false, fields: [] });

  // 기존 mock 데이터 초기화 (버전 관리)
  React.useEffect(() => {
    const DATA_VERSION = 'v3';
    if (localStorage.getItem('data_version') !== DATA_VERSION) {
      localStorage.removeItem('reviews');
      localStorage.removeItem('revenues');
      localStorage.setItem('data_version', DATA_VERSION);
      setReviewsData([]);
      setRevenuesData([]);
    }
  }, []);
  
  const showModal = (type, title, message, onConfirm = null, placeholder = '', isPassword = false, fields = []) => {
    setModal({ isOpen: true, type, title, message, onConfirm, placeholder, isPassword, fields });
  };

  const handleModalConfirm = () => {
    let cb = modal.onConfirm;
    let type = modal.type;
    let val = null;
    let data = null;

    if (type === 'prompt') {
      val = document.getElementById('modal-prompt-input')?.value;
    } else if (type === 'custom') {
      const container = document.getElementById('modal-custom-form');
      data = {};
      container.querySelectorAll('input, textarea').forEach(el => {
        if (el.type === 'file') {
          data[el.name] = el.files?.length ? Array.from(el.files).map(file => file.name).join(', ') : '';
        } else {
          data[el.name] = el.value;
        }
      });
    }
    
    setModal(prev => ({ ...prev, isOpen: false }));
    
    if (cb) {
      setTimeout(() => {
        if (type === 'prompt') cb(val);
        else if (type === 'custom') cb(data);
        else cb();
      }, 100);
    }
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  // 외부 모듈(firebase-db.js / firebase-auth.js)을 사용한 데이터 로드
  const [user, setUser] = useState(() => FirebaseAuth.getCurrentUser());
  const [courses, setCourses] = useState(() => loadLocalData('courses', INITIAL_COURSES));
  const [materials, setMaterials] = useState(() => loadLocalData('materials', INITIAL_MATERIALS));
  const [community, setCommunity] = useState(() => loadLocalData('community', INITIAL_COMMUNITY));
  const [reviewsData, setReviewsData] = useState(() => loadLocalData('reviews', generateMockReviews()));
  const [revenuesData, setRevenuesData] = useState(() => loadLocalData('revenues', generateMockRevenues()));
  const [usersDB, setUsersDB] = useState(() => loadLocalData('users_db', []));
  
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [routeState, setRouteState] = useState(null);
  const [isAdminSession, setIsAdminSession] = useState(false);

  // Firebase 실시간 데이터 구독 (Firestore 연동 시)
  React.useEffect(() => {
    if (window.FirebaseDB.isFirebaseActive()) {
      const unsubReviews = window.FirebaseDB.subscribe('reviews', (data) => setReviewsData(data));
      const unsubRevenues = window.FirebaseDB.subscribe('revenues', (data) => setRevenuesData(data));
      const unsubUsers = window.FirebaseDB.subscribe('users_db', (data) => setUsersDB(data));
      const unsubCommunity = window.FirebaseDB.subscribe('community', (data) => setCommunity(data));
      const unsubMaterials = window.FirebaseDB.subscribe('materials', (data) => setMaterials(data));
      const unsubCourses = window.FirebaseDB.subscribe('courses', (data) => setCourses(data));
      
      return () => {
        unsubReviews();
        unsubRevenues();
        unsubUsers();
        unsubCommunity();
        unsubMaterials();
        unsubCourses();
      };
    }
  }, []);

  // 사용자별 수강신청 정보 실시간 동기화
  React.useEffect(() => {
    if (user) {
      if (window.FirebaseDB.isFirebaseActive()) {
        const unsubEnrollments = window.FirebaseDB.subscribe(`enrollments_${user.uid}`, (ids) => {
          setEnrolledCourses(courses.filter(c => ids.includes(c.id)));
        });
        return () => unsubEnrollments();
      } else {
        const encIds = loadLocalData(`enrollments_${user.uid}`, []);
        setEnrolledCourses(courses.filter(c => encIds.includes(c.id)));
      }
    } else {
      setEnrolledCourses([]);
    }
  }, [user, courses]);

  const updateDB = (key, data) => {
    saveLocalData(key, data);
    if(key === 'courses') setCourses(data);
    if(key === 'materials') setMaterials(data);
    if(key === 'community') setCommunity(data);
    if(key === 'reviews') setReviewsData(data);
    if(key === 'revenues') setRevenuesData(data);
    if(key === 'users_db') setUsersDB(data);
  };

  const navigate = (path, state = null) => { window.scrollTo(0, 0); setCurrentPath(path); setRouteState(state); };

  const handleEnroll = (courseId, fromPayment = false) => {
    if(!user) { showModal('alert', '인증 에러', '로그인이 필요합니다.', () => navigate('/login')); return; }
    const encIds = loadLocalData(`enrollments_${user.uid}`, []);
    if(!encIds.includes(courseId)) {
       const newIds = [...encIds, courseId];
       saveLocalData(`enrollments_${user.uid}`, newIds);
       setEnrolledCourses(courses.filter(c => newIds.includes(c.id)));
    }
    navigate('/mypage');
  };

  const handleLogout = () => { FirebaseAuth.logout(); setUser(null); setIsAdminSession(false); navigate('/'); };

  let View;
  switch (currentPath) {
    case '/': View = <HomePage courses={courses} reviewsData={reviewsData} revenuesData={revenuesData} navigate={navigate} showModal={showModal} />; break;
    case '/enrollment': View = <EnrollmentPage user={user} enrolledCourses={enrolledCourses} materials={materials} navigate={navigate} showModal={showModal} onEnroll={handleEnroll} courses={courses} />; break;
    case '/course': View = <CourseDetailPage course={courses.find(c=>c.id===routeState?.courseId)} user={user} onEnroll={handleEnroll} navigate={navigate} showModal={showModal} />; break;
    case '/login': View = <AuthPage navigate={navigate} onLoginSuccess={() => { setUser(FirebaseAuth.getCurrentUser()); navigate('/'); }} showModal={showModal} />; break;
    case '/write-review': View = <WriteReviewPage user={user} reviewsData={reviewsData} updateDB={updateDB} navigate={navigate} showModal={showModal} />; break;
    case '/reviews': View = <ReviewsPage reviewsData={reviewsData} navigate={navigate} showModal={showModal} />; break;
    case '/revenues': View = <RevenuesPage revenuesData={revenuesData} navigate={navigate} showModal={showModal} />; break;
    case '/mypage': View = <MyPage user={user} enrolledCourses={enrolledCourses} navigate={navigate} />; break;
    case '/community': View = <CommunityPage communityPosts={community} user={user} onAddPost={(p)=>updateDB('community', [p, ...community])} showModal={showModal} />; break;
    case '/materials': View = <MaterialsPage enrolledCourses={enrolledCourses} materials={materials} navigate={navigate} />; break;
    case '/material/mat-1': View = <MaterialDetailPage matId="mat-1" enrolledCourses={enrolledCourses} navigate={navigate} showModal={showModal} />; break;
    case '/material/mat-2': View = <MaterialDetailPage matId="mat-2" enrolledCourses={enrolledCourses} navigate={navigate} showModal={showModal} />; break;
    case '/material/mat-3': View = <MaterialDetailPage matId="mat-3" enrolledCourses={enrolledCourses} navigate={navigate} showModal={showModal} />; break;
    case '/material/mat-4': View = <MaterialDetailPage matId="mat-4" enrolledCourses={enrolledCourses} navigate={navigate} showModal={showModal} />; break;
    case '/admin': View = isAdminSession ? <AdminDashboard courses={courses} materials={materials} community={community} reviewsData={reviewsData} revenuesData={revenuesData} usersDB={usersDB} updateDB={updateDB} navigate={navigate} showModal={showModal} /> : <HomePage courses={courses} reviewsData={reviewsData} revenuesData={revenuesData} navigate={navigate} showModal={showModal} />; break;
    default: View = <HomePage courses={courses} reviewsData={reviewsData} revenuesData={revenuesData} navigate={navigate} showModal={showModal} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden relative">
      
      {/* 커스텀 모달 지원 컴포넌트 */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-8">
          {modal.type === 'postView' ? (
            <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in-up border border-gray-100 hide-scroll flex flex-col">
              <div className="flex justify-between items-start mb-6 sticky top-0 bg-white/95 backdrop-blur-sm pb-4 border-b border-gray-100 z-10">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-snug pr-4 word-keep">{modal.title}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full p-2 flex-shrink-0 transition-colors"><Icon path={ICONS.X} className="w-5 h-5"/></button>
              </div>
              <div className="pt-2 text-gray-700 font-medium pb-8" dangerouslySetInnerHTML={{ __html: modal.message }}>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-fade-in-up border border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{modal.title}</h3>
              <p className="text-gray-600 font-medium mb-8 whitespace-pre-wrap leading-relaxed word-keep">{modal.message}</p>
              
              {modal.type === 'prompt' && modal.fields && modal.fields.length === 0 && (
                <input type={modal.isPassword ? "password" : "text"} id="modal-prompt-input" placeholder={modal.placeholder} className="w-full border border-gray-200 rounded-xl p-4 mb-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-shadow font-bold text-gray-900" autoFocus onKeyDown={(e)=>{if(e.key==='Enter') document.getElementById('modal-confirm-btn').click();}} />
              )}

              {modal.type === 'custom' && modal.fields && modal.fields.length > 0 && (
                <div className="space-y-4 mb-8" id="modal-custom-form">
                  {modal.fields.map((f, i) => (
                    f.type === 'textarea' ? 
                    <textarea key={i} name={f.name} placeholder={f.placeholder} defaultValue={f.value !== undefined ? f.value : ''} className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-shadow font-medium" rows="4"></textarea> :
                    <input key={i} type={f.type} name={f.name} placeholder={f.placeholder} defaultValue={f.value !== undefined ? f.value : ''} accept={f.accept || undefined} className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-shadow font-bold" />
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3">
                {modal.type !== 'alert' && <Button variant="outline" size="sm" onClick={closeModal} className="border-gray-200 text-gray-500 py-3.5 px-6">취소</Button>}
                <Button id="modal-confirm-btn" size="sm" className="py-3.5 px-8" onClick={handleModalConfirm}>확인</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentPath !== '/admin' || !isAdminSession ? (
         <>
           <Header currentPath={currentPath} navigate={navigate} user={user} isAdmin={isAdminSession} onLogout={handleLogout} />
           <main className="flex-grow">{View}</main>
           {currentPath !== '/login' && <Footer showModal={showModal} onAdminSecretLogin={() => { setIsAdminSession(true); navigate('/admin'); }} />}
         </>
      ) : (
         <main className="flex-grow h-screen">{View}</main>
      )}

      {/* 우측 하단 1:1 카카오톡 상담 플로팅 버튼 */}
      <a href="#" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#FEE500] w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-110 transition-transform z-[9000] border border-yellow-300">
        <svg viewBox="0 0 32 32" className="w-8 h-8 md:w-9 md:h-9"><path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.12 4.16c-.16.56.56.96.96.64l4.8-3.2c.72.16 1.44.24 2.24.24 6.96 0 12.64-4.48 12.64-10.08S22.96 4.64 16 4.64z" fill="#3A1D1D"/></svg>
      </a>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
