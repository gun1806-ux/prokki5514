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

const generateMockReviews = () => {
  const arr = [];
  const comments = [
    "유튜브 @156cmm 영상만 보다가 드디어 수강했습니다. 빚 독촉에 시달리던 제게 한 줄기 빛이 되었습니다. 상품 단 2개로 기적이 일어났네요.", 
    "무작정 상품 수만 늘리다가 건강만 잃었었는데, '돈버는 똘기'님의 생존 소싱법을 배우고 일하는 시간이 반으로 줄었습니다.", 
    "CEO저널 인터뷰 보고 진정성에 반해서 왔습니다. 스토어 매각(Exit)까지 바라보는 거시적인 관점, 정말 돈이 아깝지 않은 강의입니다.", 
    "상세페이지 기획 강의 듣고 이탈률이 확 줄었습니다. 고객의 아픔을 공감하라는 카피라이팅의 비밀, 바로 적용해서 매출 3배 뛰었어요.", 
    "단순한 스킬을 넘어 지속 가능한 비즈니스 마인드를 배웠습니다. 윈들리 솔루션 영상에서 본 그대로, 실전에서 통하는 진짜 노하우입니다."
  ];
  const tags = ["월 매출 3배 상승", "스토어 매각 준비중", "건강과 수익 동시회복", "상품 2개 파워", "진짜 생존 매뉴얼"];
  for(let i=1; i<=30; i++) {
    arr.push({
      id: `review-${i}`, name: `실전셀러${i}`, rating: 5,
      comment: comments[i % 5], tag: tags[i % 5],
      image: i % 3 === 0 ? '[https://images.unsplash.com/photo-1556742049-0cfed4f9a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1556742049-0cfed4f9a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80)' : null
    });
  }
  return arr.reverse();
};

const generateMockRevenues = () => {
  const arr = [
    {
      id: `rev-1`, 
      title: "[돈버는하마] 20기 홍대 일요일반 그로스 매출 1000만원 달성 후기", 
      author: "로켓트원", date: "2026-03-09", views: 261,
      amount: "월 1000만 달성",
      thumbnail: '[https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80)', 
      content: `<div class="space-y-6 text-gray-800 leading-relaxed text-sm md:text-base">
          <p>안녕하세요! 20기 일요일반 수강생입니다.<br/>수강 이후 어느덧 1년에 가까운 시간이 흘렀습니다.</p>
          <img src="[https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)" class="w-full rounded-2xl border border-gray-200 shadow-sm" alt="차트" />
          <p>뒤늦게 강의 후기를 쓰게 되어 조금 부끄럽지만, 강의를 들은 이후 어떤 변화가 있었는지 솔직하게 공유해보고 싶어 글을 적어봅니다.<br/><br/>9개월이 지난 지금도 똘기님의 강의는 저의 셀러 활동의 핵심 중심이 되고 있습니다. 그래프 보이시나요? 앞으로도 배운 대로만 가겠습니다.</p>
        </div>`
    },
    {
      id: `rev-2`, 
      title: "[돈버는하마] 10기 송도반 반장 / 발리 여행 중 월 매출 1000 찍었습니다.", 
      author: "서퍼", date: "2026-03-06", views: 391,
      amount: "월 1000만 달성",
      thumbnail: '[https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80)', 
      content: `<div class="space-y-6 text-gray-800 leading-relaxed text-sm md:text-base">
          <p>안녕하세요! 10기 송도반 수강생입니다.</p>
          <p>지난 4월에는 육아휴직을 하며 둘째 아이 출산과 첫째 케어까지 병행해야 했습니다.<br/>입고된 제품 재포장, 상품 등록, 소싱까지 직접 처리하다 보니 쉽지 않은 시간이었습니다.</p>
          <p>그럼에도 똘기님의 강의에서 제시해주신 기준을 중심으로 하루 루틴을 만들었고, 흔들리지 않고 나아갈 수 있었습니다.</p>
          <h3 class="font-bold text-lg text-indigo-600 mt-6 bg-indigo-50 p-4 rounded-xl">건방진 말일 수도 있지만, 이제 월매출 1,000만 원은 시작을 알려주는 숫자처럼 느껴집니다.</h3>
          <p>올해 목표를 월매출 3,000만 원으로 잡은 만큼, 더 좋은 성과를 만들어보고 싶습니다.</p>
          <img src="[https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)" class="w-full rounded-2xl border border-gray-200 shadow-sm" alt="차트" />
        </div>`
    },
    {
      id: `rev-3`, 
      title: "[돈버는하마] 그로스 11기 강남 주말 월 1000 & 연 2억 달성 후기", 
      author: "뜬구름", date: "2026-01-23", views: 349,
      amount: "연 2억 달성",
      thumbnail: '[https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80)', 
      content: `<div class="space-y-6 text-gray-800 leading-relaxed text-sm md:text-base">
          <p>안녕하세요~ 저는 24년도 10월에 똘기님 강의듣고 꾸준히 판매 이어나가고 있는 수강생입니다.</p>
          <p>저는 강의 들은지 3개월만인 25년도 1월에 월 1000만원을 달성했고요.<br/>그 이후로 1500~1700선을 유지하며 25년도 연매출 2억을 달성했습니다.</p>
          <img src="[https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)" class="w-full rounded-2xl border border-gray-200 shadow-sm" alt="차트" />
          <h3 class="font-bold text-lg text-gray-900 mt-6 border-b border-gray-200 pb-2">실전형 알짜배기 수업</h3>
          <p>초심자들에게 똘기님 수업 과제가 빡세게 느껴질 수 있습니다.<br/>그치만 초심자들을 정말 빠른 시간내에 셀러로 바꿔주는 꼭 필요한 과정이었습니다.</p>
          <h3 class="font-bold text-lg text-gray-900 mt-6 border-b border-gray-200 pb-2">이런 강사 없다! 확실한 애프터 서비스ㅎㅎ</h3>
          <p>이렇게 오래도록 수강생 관리를 해주시다니- 정말 든든합니다 ^^</p>
        </div>`
    }
  ];

  for(let i=4; i<=30; i++) {
    arr.push({
      id: `rev-${i}`, 
      title: `[돈버는똘기] ${i}주차 - 배운대로 똑똑하게 실행한 결과, 꾸준한 수익 발생!`, 
      author: `수강생${i}`, date: "2026-04-10", views: 120 + i,
      amount: `월 ${1000 + i*15}만원 달성`,
      thumbnail: '[https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80](https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80)',
      content: `<div class="space-y-6 text-gray-800 leading-relaxed text-sm md:text-base">
          <p>강의에서 배운 대로 상품을 소싱하고 기획한 결과입니다.</p>
          <img src="[https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80](https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)" class="w-full rounded-2xl border border-gray-200 shadow-sm" alt="차트" />
          <p>앞으로도 초심 잃지 않고 꾸준히 나아가겠습니다. 감사합니다!</p>
        </div>`
    });
  }
  return arr;
};

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
  { id: "mat-1", title: "매출 3억 달성 상세페이지 기획안 템플릿", type: "기획서", url: "#" },
  { id: "mat-2", title: "스토어 매각(Exit) 필수 체크리스트 엑셀", type: "문서", url: "#" },
  { id: "mat-3", title: "경쟁강도 분석 및 소싱 아이템 관리표", type: "엑셀", url: "#" }
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
            <div className="flex items-center gap-3 text-xl md:text-2xl font-black tracking-tight cursor-pointer text-[#FF8A00] hover:text-[#FFC16A] transition-colors" onClick={() => navigate('/') }>
              <img src="assets-icons/5.png" alt="logo" className="w-8 h-8 md:w-9 md:h-9 object-contain" />
              <span>돈버는 똘기</span>
            </div>
            <div className="md:hidden flex items-center gap-2">
              {user ? <Button variant="outline" size="sm" onClick={() => navigate('/mypage')}>마이페이지</Button> : <Button variant="primary" size="sm" onClick={() => navigate('/login')}>로그인</Button>}
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scroll">
            <nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm font-bold text-gray-700 min-w-max tracking-tight">
              <button onClick={() => handleNav('#courses')} className="hover:text-[#FF8A00] transition-colors py-2 px-1">수강신청</button>
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
            <div className="text-3xl font-black mb-6 text-[#FF8A00] tracking-tight">돈버는 똘기</div>
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
            <p className="mb-2 word-keep">주식회사 돈버는똘기 | 대표: 현역 유튜버 | 사업자등록번호: 123-45-67890</p>
            <p className="mb-4 word-keep">서울특별시 강남구 테헤란로 123 | 개인정보보호책임자: 돈버는똘기</p>
            <p>© 2026 돈버는 똘기. All rights reserved.</p>
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
            <div key={review.id} className="p-8 rounded-[2rem] bg-[#111111] border border-gray-800 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-[380px]">
              {review.image && <img src={review.image} className="w-full h-32 object-cover rounded-2xl mb-6 shadow-sm" />}
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
  const handleCounseling = () => { showModal('alert', '상담 신청 완료', '무료 상담 신청이 완료되었습니다. 담당자가 업무 시간 내에 입력하신 번호로 연락드리겠습니다.'); };
  
  const top10Reviews = reviewsData.slice(0, 10);
  const top10Revenues = revenuesData.slice(0, 10);

  return (
    <div className="bg-main text-main">
      {/* Hero Section */}
      <section className="relative flex flex-col md:block min-h-[auto] md:min-h-screen pt-24 md:pt-0 overflow-hidden bg-[#050608] text-white text-center">
        {/* Video & Overlay Wrapper */}
        <div className="relative w-full aspect-video md:absolute md:inset-0 md:h-full md:aspect-auto z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center"
          >
            <source src={new URL('assets/videos/6.mp4', document.baseURI).href} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30"></div>
        </div>
        
        {/* Content Wrapper */}
        <div className="w-full max-w-5xl mx-auto px-5 py-8 md:py-0 relative z-20 md:absolute md:bottom-12 md:left-1/2 md:-translate-x-1/2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-10">
            <Button size="lg" className="w-full sm:w-auto py-4 px-10 text-base sm:text-lg bg-[#FF8A00] text-black shadow-xl shadow-[#FF8A00]/25" onClick={() => {
              const el = document.getElementById('courses');
              if(el) window.scrollTo({top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth'});
            }}>지금 바로 멱살 잡히기 🔥</Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto py-4 px-10 text-base sm:text-lg border border-[#FF8A00] bg-white/5 hover:bg-[#FF8A00]/10" style={{ color: '#000' }} onClick={() => {
              navigate('/reviews');
            }}>수강생 성과 먼저 확인하기 👀</Button>
          </div>

          <div className="mt-12 rounded-[2rem] border border-[#4b2a15] bg-[#111111] px-5 py-8 shadow-[0_8px_30px_rgb(0,0,0,0.24)]">
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 md:gap-5">
              {[
                { label: '누적 브랜드 매각', target: 4, suffix: '+' },
                { label: '신규 운영 브랜드', target: 3, suffix: '+' },
                { label: '이커머스 수익', target: 20, suffix: '억+' },
                { label: '수강생 성공확률', target: 50, suffix: '%+' }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <AnimatedCount target={item.target} suffix={item.suffix} />
                  <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-[0.2em]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="py-24 bg-[#0B0B0B] text-white relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">직접 만들고, 팔고, 매각했습니다</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { image: "2.png", label: "스토어매각(Exit)", value: "4.5억 수익", link: "[https://newneek.co/@windly/article/38837](https://newneek.co/@windly/article/38837)" },
              { image: "3.png", label: "CEO 저널", value: "언론 인터뷰", link: "[https://www.ceojhn.com/news/articleView.html?idxno=9181](https://www.ceojhn.com/news/articleView.html?idxno=9181)" },
              { image: "4.png", label: "@156cmm", value: "유튜브채널", link: "[https://www.youtube.com/@156cmm](https://www.youtube.com/@156cmm)" }
            ].map((stat, i) => (
              <a key={i} href={stat.link} target="_blank" rel="noopener noreferrer" className="block text-center px-4 hover:-translate-y-2 transition-transform duration-300 group">
                <div className="flex justify-center mb-6">
                  <div className="w-full h-32 md:h-48 rounded-3xl bg-gray-800 flex items-center justify-center shadow-inner border border-gray-700 overflow-hidden">
                    <img src={stat.image} alt={stat.value} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black mb-2 text-white word-keep tracking-tight">{stat.value}</div>
                <div className="text-sm md:text-base text-gray-400 font-medium word-keep">{stat.label}</div>
              </a>
            ))}
          </div>
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

      {/* Courses */}
      <section id="courses" className="relative py-20 bg-gradient-to-b from-[#FFF7F0] to-[#FFF2E0] text-[#111827]">
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none" id="강의신청"></div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col items-start">
              <p className="text-sm md:text-sm font-bold text-[#FF8A00] mb-3">이 강의는 지속되지 않습니다 <span className="ml-2">⚠️</span></p>
              <h2 className="text-3xl md:text-4xl font-black text-[#111827] leading-tight mb-6">단 4주, 성과 위주 실전압축 강의</h2>

              <div className="w-full max-w-md mt-6">
                {courses.slice(0,1).map(course => (
                  <div key={course.id} className="rounded-xl overflow-hidden shadow-lg border border-[#111827]">
                    <a href="#courses-enrollment" onClick={(e) => { e.preventDefault(); navigate('#courses-enrollment'); const el = document.getElementById('courses-enrollment'); if(el) window.scrollTo({top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth'}); }} className="block w-full">
                      <img src={'assets/images/5.png'} alt="instructor" className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    </a>
                  </div>
                ))}
                <p className="text-sm text-[#8b8b8b] mt-4">쿠팡부터, 스마트스토어, 브랜드까지</p>
              </div>
            </div>

            <div className="hidden lg:block">&nbsp;</div>
          </div>
        </div>
      </section>

      {/* Enrollment Tab */}
      <section id="courses-enrollment" className="relative py-24 bg-white text-[#111827]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4">수강신청</h2>
            <p className="text-lg text-gray-600">강의에 신청하고 성과를 만들어보세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map(course => (
              <div key={course.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="h-48 bg-gradient-to-br from-[#FF8A00] to-[#FF6C00] flex items-center justify-center">
                  <span className="text-white text-6xl">📚</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black mb-3">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{course.summary}</p>
                  <div className="text-2xl font-black text-[#FF8A00] mb-4">{formatPrice(course.price)}</div>
                  <Button size="md" variant="primary" className="w-full" onClick={() => {
                    if (!user) {
                      showModal('alert', '로그인 필요', '로그인 후 수강신청 및 결제가 가능합니다.', () => navigate('/login'));
                    } else {
                      handleEnrollment(course);
                    }
                  }}>수강신청하기</Button>
                </div>
              </div>
            ))}
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

const MaterialsPage = ({ enrolledCourses, materials, showModal }) => {
  if(enrolledCourses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-48 pb-20 flex justify-center text-center">
         <div>
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100"><Icon path={ICONS.Lock} className="w-10 h-10 text-gray-300" /></div>
           <h2 className="text-2xl font-black text-gray-900 mb-4 word-keep">수강생 전용 프리미엄 자료실</h2>
           <p className="text-gray-500 font-medium word-keep">클래스 결제를 완료한 분들만 접근 가능한 비밀 게시판입니다.</p>
         </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-black mb-3 text-gray-900 tracking-tight">실전 템플릿 자료실</h1>
        <p className="text-gray-500 mb-10 font-medium">압도적 성장을 위해 '돈버는 똘기'가 직접 사용하는 엑셀/기획안 템플릿입니다.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {materials.map((mat) => (
            <div key={mat.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"><Icon path={ICONS.FileText} /></div>
                <div>
                  <h3 className="font-bold text-gray-900 word-keep mb-1 tracking-tight text-lg">{mat.title}</h3>
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold">{mat.type}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={()=>showModal('alert', '다운로드 진행', `'${mat.title}' 다운로드가 안전하게 시작되었습니다.`)} className="border-gray-200 text-gray-600">다운로드</Button>
            </div>
          ))}
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
const AdminDashboard = ({ courses, materials, community, usersDB, updateDB, navigate, showModal }) => {
  const [tab, setTab] = useState('courses');

  const handleAdd = () => {
    showModal(
      'custom',
      '새 데이터 추가',
      '제목, 내용, 파일, 이미지, 동영상 업로드가 가능합니다.',
      (data) => {
        if(!data.title?.trim()) return showModal('alert', '안내', '제목을 입력해야 합니다.');
        const newItem = {
          id: `item-${Date.now()}`,
          title: data.title,
          content: data.content || '',
          attachment: data.attachment || '',
          image: data.image || '',
          video: data.video || ''
        };
        if(tab === 'courses') {
          newItem.price = 199000;
          newItem.category = '신규강의';
          updateDB('courses', [...courses, newItem]);
        }
        if(tab === 'materials') {
          newItem.type = '일반문서';
          updateDB('materials', [...materials, newItem]);
        }
        if(tab === 'community') {
          newItem.author = '관리자';
          newItem.date = new Date().toISOString().split('T')[0];
          updateDB('community', [newItem, ...community]);
        }
        showModal('alert', '등록 성공', '데이터가 성공적으로 등록되었습니다.');
      },
      '',
      false,
      [
        { name: 'title', type: 'text', placeholder: '게시글 제목' },
        { name: 'content', type: 'textarea', placeholder: '게시글 내용' },
        { name: 'attachment', type: 'file', placeholder: '파일 업로드' },
        { name: 'image', type: 'file', placeholder: '이미지 업로드', accept: 'image/*' },
        { name: 'video', type: 'file', placeholder: '동영상 업로드', accept: 'video/*' }
      ]
    );
  };

  const handleDelete = (id, list, key) => {
    showModal('confirm', '삭제 경고', '이 데이터를 영구적으로 삭제하시겠습니까?', () => {
      updateDB(key, list.filter(i => i.id !== id));
      showModal('alert', '삭제 완료', '데이터가 삭제되었습니다.');
    });
  };

  const handleEdit = (id, list, key) => {
    const item = list.find(i => i.id === id);
    showModal('prompt', '데이터 수정', '수정할 제목을 입력하세요.', (newTitle) => {
      if(newTitle) {
        updateDB(key, list.map(i => i.id === id ? { ...i, title: newTitle } : i));
        showModal('alert', '수정 완료', '성공적으로 수정되었습니다.');
      }
    }, '제목 입력');
  };

  const renderList = (list, key) => (
    list.length === 0 ? <div className="p-10 text-center text-gray-400 font-bold border rounded-2xl">데이터가 없습니다.</div> :
    list.map(item => (
      <div key={item.id} className="p-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50/50 gap-3 transition-colors">
        <span className="font-bold text-gray-800 word-keep text-sm md:text-base">{item.title || item.email || item.name}</span>
        {key !== 'users_db' && (
          <div className="flex gap-4 w-full md:w-auto justify-end">
            <button onClick={() => handleEdit(item.id, list, key)} className="text-indigo-500 text-sm font-bold flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"><Icon path={ICONS.Edit} className="w-4 h-4 mr-1"/>수정</button>
            <button onClick={() => handleDelete(item.id, list, key)} className="text-red-500 text-sm font-bold flex items-center bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"><Icon path={ICONS.Trash2} className="w-4 h-4 mr-1"/>삭제</button>
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <div className="w-full md:w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 md:p-8 text-xl font-black border-b border-gray-800 cursor-pointer flex justify-between items-center" onClick={()=>navigate('/')}>
          <span className="tracking-tighter">ADMIN</span>
          <button onClick={()=>navigate('/')} className="md:hidden text-gray-400 font-bold text-xs bg-gray-800 px-3 py-1 rounded">EXIT</button>
        </div>
        <nav className="flex flex-row md:flex-col overflow-x-auto p-3 md:p-6 space-x-2 md:space-x-0 md:space-y-2 text-sm hide-scroll font-bold">
          <button onClick={()=>setTab('courses')} className={`flex-shrink-0 text-left px-5 py-3 rounded-xl transition-colors ${tab==='courses'?'bg-indigo-600 text-white':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>클래스 관리</button>
          <button onClick={()=>setTab('materials')} className={`flex-shrink-0 text-left px-5 py-3 rounded-xl transition-colors ${tab==='materials'?'bg-indigo-600 text-white':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>자료실 관리</button>
          <button onClick={()=>setTab('community')} className={`flex-shrink-0 text-left px-5 py-3 rounded-xl transition-colors ${tab==='community'?'bg-indigo-600 text-white':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>커뮤니티 관리</button>
          <button onClick={()=>setTab('users')} className={`flex-shrink-0 text-left px-5 py-3 rounded-xl transition-colors ${tab==='users'?'bg-indigo-600 text-white':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>수강생 현황</button>
        </nav>
        <div className="p-6 border-t border-gray-800 hidden md:block mt-auto"><button onClick={()=>navigate('/')} className="text-gray-500 font-bold hover:text-white transition-colors text-sm flex items-center"><Icon path={ICONS.LogOut} className="w-4 h-4 mr-2"/>시스템 종료</button></div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-10">
        <h2 className="text-2xl font-black mb-8 text-gray-900 tracking-tight">{tab === 'courses' ? '클래스 및 커리큘럼 관리' : tab === 'materials' ? '프리미엄 자료실 관리' : tab === 'users' ? '가입된 수강생 현황' : '커뮤니티 글 관리'}</h2>
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
           {tab === 'courses' && renderList(courses, 'courses')}
           {tab === 'materials' && renderList(materials, 'materials')}
           {tab === 'community' && renderList(community, 'community')}
           {tab === 'users' && renderList(usersDB, 'users_db')}
           
           {tab !== 'users' && <Button onClick={handleAdd} className="mt-8 w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg border-none">새로운 데이터 등록하기</Button>}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 메인 라우터 앱 & 커스텀 모달 매니저
// ============================================================================
function App() {
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, placeholder: '', isPassword: false, fields: [] });
  
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

  useEffect(() => {
    if(user) {
      const encIds = loadLocalData(`enrollments_${user.uid}`, []);
      setEnrolledCourses(courses.filter(c => encIds.includes(c.id)));
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
    case '/course': View = <CourseDetailPage course={courses.find(c=>c.id===routeState?.courseId)} user={user} onEnroll={handleEnroll} navigate={navigate} showModal={showModal} />; break;
    case '/login': View = <AuthPage navigate={navigate} onLoginSuccess={() => { setUser(FirebaseAuth.getCurrentUser()); navigate('/'); }} showModal={showModal} />; break;
    case '/write-review': View = <WriteReviewPage user={user} reviewsData={reviewsData} updateDB={updateDB} navigate={navigate} showModal={showModal} />; break;
    case '/reviews': View = <ReviewsPage reviewsData={reviewsData} navigate={navigate} showModal={showModal} />; break;
    case '/revenues': View = <RevenuesPage revenuesData={revenuesData} navigate={navigate} showModal={showModal} />; break;
    case '/mypage': View = <MyPage user={user} enrolledCourses={enrolledCourses} navigate={navigate} />; break;
    case '/community': View = <CommunityPage communityPosts={community} user={user} onAddPost={(p)=>updateDB('community', [p, ...community])} showModal={showModal} />; break;
    case '/materials': View = <MaterialsPage enrolledCourses={enrolledCourses} materials={materials} showModal={showModal} />; break;
    case '/admin': View = isAdminSession ? <AdminDashboard courses={courses} materials={materials} community={community} usersDB={usersDB} updateDB={updateDB} navigate={navigate} showModal={showModal} /> : <HomePage courses={courses} reviewsData={reviewsData} revenuesData={revenuesData} navigate={navigate} showModal={showModal} />; break;
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
                    <textarea key={i} name={f.name} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-shadow font-medium" rows="4"></textarea> :
                    <input key={i} type={f.type} name={f.name} placeholder={f.placeholder} accept={f.accept || undefined} className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-shadow font-bold" />
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