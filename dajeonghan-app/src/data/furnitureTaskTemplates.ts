/**
 * 관리자 정의 가구별 Task 템플릿 데이터
 */

import { FurnitureTaskTemplate } from '@/types/furnitureTaskTemplate.types';

export const FURNITURE_TASK_TEMPLATES: FurnitureTaskTemplate[] = [
  // 침대
  {
    id: 'bed_template',
    furnitureType: 'bed',
    furnitureName: '침대',
    description: '침구 관리 및 청소',
    tasks: [
      {
        id: 'bed_sheet_wash',
        title: '침대 시트 빨기',
        description: '침대 시트를 세탁하여 위생적으로 관리합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'pillow_cover_wash',
        title: '베개커버 빨기',
        description: '베개커버를 세탁하여 청결하게 유지합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'duvet_wash',
        title: '이불 빨기',
        description: '이불을 세탁하여 쾌적한 수면 환경을 만듭니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 20,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'mattress_clean',
        title: '매트리스 청소',
        description: '매트리스를 청소하고 진드기를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 3 },
        estimatedMinutes: 30,
        priority: 'low',
        category: '관리',
      },
    ],
  },

  // 냉장고
  {
    id: 'fridge_template',
    furnitureType: 'fridge',
    furnitureName: '냉장고',
    description: '식재료 관리 및 냉장고 청소',
    tasks: [
      {
        id: 'fridge_expiry_check',
        title: '유통기한 확인',
        description: '냉장고 내 식재료의 유통기한을 확인합니다.',
        type: 'food',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'high',
        category: '점검',
        whyNeeded: '한국의 1인당 음식물 쓰레기 배출량은 연간 95kg으로 세계 평균(79kg)을 크게 초과합니다. 농촌경제연구원 조사에 따르면 1인 가구·30대 이하에서 "보관방법을 몰라 상한 식재료"로 버리는 비율이 다른 연령대보다 2배 높습니다.\n\n냉장고에 보관 중이더라도 세균은 계속 증식합니다. 외관상 정상으로 보여도 내부에 식중독균이 이미 번식한 경우가 있으며, 개봉한 가공식품은 유통기한이 남아있어도 일주일이 지나면 위험할 수 있습니다.\n\n주 1회 장보기 전 5분만 투자해도 식비 낭비와 식중독 위험을 동시에 줄일 수 있습니다.',
        howTo: '주 1회, 장보기 직전에 진행하면 가장 효율적입니다.\n\n1. 냉장실 앞줄 스캔\n냉장고 문을 열어 앞쪽에 있는 식재료의 유통기한을 빠르게 확인합니다. 유통기한 외에 색·냄새·질감이 변한 것도 함께 처리합니다.\n\n2. 뒤쪽 식재료 꺼내기\n새로 장을 볼 예정이라면 뒤쪽에 묻혀있던 식재료를 앞으로 꺼내 먼저 소비하도록 배치합니다.\n\n3. 개봉 제품 우선 점검\n햄, 두부, 요거트 등 개봉한 식품은 유통기한과 관계없이 일주일 이내 소비를 목표로 합니다. 두부는 표면이 붉게 변색되면 리스테리아균 증식 신호이므로 즉시 폐기합니다.\n\n4. 처리 결정\n버릴 것은 즉시 버리고, 곧 소비해야 할 것은 눈에 잘 띄는 앞쪽에 배치합니다.',
      },
      {
        id: 'fridge_organize',
        title: '냉장고 정리',
        description: '냉장고를 정리하고 오래된 식재료를 처리합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '정리',
        whyNeeded: '냉장고는 세균 증식을 늦출 뿐 완전히 차단하지 못합니다. 리스테리아(Listeria)균은 4℃의 냉장 온도에서도 서서히 증식할 수 있으며, 정리되지 않은 냉장고에서는 생고기 육즙이 채소나 반찬에 떨어져 교차오염이 발생합니다.\n\n또한 식재료가 뒤에 묻히면 유통기한을 놓치기 쉬워 음식물 쓰레기와 식비 낭비로 이어집니다. 냉장고 용량을 60~70% 이상 꽉 채우면 냉기가 골고루 순환되지 않아 전력 소비가 늘고 식재료가 더 빨리 상합니다.\n\n주 1회 15분의 정리 루틴만으로 냉기 순환을 회복하고, 신선도·위생·식비 절약을 동시에 챙길 수 있습니다.',
        howTo: '1. 한 층씩 비우기\n장보기 전날 냉장고를 한 층씩 꺼내 유통기한이 지났거나 색·냄새·질감이 변한 것을 즉시 처리합니다. 전체를 한 번에 비우면 지치므로, 매주 한 층을 돌아가며 점검하는 것이 효율적입니다.\n\n2. 구역별 재배치\n· 상단: 익힌 반찬, 남은 음식, 요거트 등 바로 먹을 것\n· 중단: 계란, 두부, 음료 (온도가 가장 일정한 구역)\n· 하단: 생고기·생선 (밀폐 용기나 트레이에 담아 육즙 누출 방지)\n· 채소칸: 과일과 채소를 분리 보관 (과일의 에틸렌 가스가 채소 숙성을 앞당김)\n· 문칸: 조미료, 잼, 소스류만 배치 — 우유·계란은 문칸에 두지 마세요 (온도 변화가 가장 심한 구역)\n\n3. 선입선출 배치\n새로 구입한 식재료는 뒤에, 기존 것은 앞으로 꺼내 둡니다. 마트 진열대와 같은 원리로, 이것만 지켜도 뒤에서 썩어 발견되는 사고를 크게 줄일 수 있습니다.\n\n4. 용량 조절\n냉장실은 60~70%, 냉동실은 80% 이상 채워 냉기 순환을 유지합니다. 냉장실을 너무 꽉 채우면 뒤쪽에 냉기가 닿지 않아 식재료가 빨리 상합니다.\n\n5. 날짜 표시\n남은 반찬과 소분 식재료 용기 앞면에 날짜를 적어두면 다음 정리 때 한눈에 파악할 수 있습니다. 지퍼백에 식재료명과 냉동 날짜를 마커로 적는 것도 좋습니다.',
      },
      {
        id: 'fridge_deep_clean',
        title: '냉장고 청소',
        description: '냉장고 내부를 깨끗이 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 30,
        priority: 'medium',
        category: '청소',
        whyNeeded: '식품의약품안전처가 권장하는 냉장고 청소 주기는 최소 월 1회입니다. 한국소비자원 조사에서 냉장고 내 세균이 가장 많이 검출된 곳은 채소 보관함이었습니다. 수분이 고이는 구조라 살모넬라·대장균·곰팡이가 번식하기 쉽습니다.\n\n냉장고 문손잡이에도 리스테리아균, 노로바이러스, 포도상구균이 번식할 수 있습니다. 요리 중 손을 씻지 않고 냉장고를 여닫는 일이 반복되기 때문입니다. 청소 범위를 내부뿐 아니라 문손잡이까지 확장해야 진정한 위생 관리가 됩니다.',
        howTo: '1. 내용물 이동\n식재료를 꺼내 아이스박스나 쿨백에 임시 보관합니다. 이 기회에 유통기한 지난 것도 함께 정리합니다.\n\n2. 분리 세척\n선반·서랍을 냉장고에서 꺼내 따뜻한 물과 중성세제로 닦습니다. 세척 후 완전히 건조해야 세균 재번식을 막을 수 있습니다.\n\n3. 내부 닦기\n베이킹소다(물 1L + 베이킹소다 4큰술) 희석액을 행주에 묻혀 내부를 닦고, 마른 행주로 마무리합니다. 냉기 순환이 안 되는 구석과 고무패킹 사이도 면봉으로 꼼꼼히 닦습니다.\n\n4. 외부 마무리\n문손잡이를 알코올 또는 식초 희석액(물 1:식초 1)으로 소독합니다. 냉장고 외부 표면도 함께 닦아줍니다.',
      },
      {
        id: 'freezer_clean',
        title: '냉동실 정리',
        description: '냉동실을 정리하고 서리를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 2 },
        estimatedMinutes: 20,
        priority: 'low',
        category: '정리',
        whyNeeded: '냉동실에 성에(서리)가 1cm 이상 쌓이면 냉각 능력이 저하되고, 압축기가 더 오래 가동되어 전기요금이 증가합니다. 성에 제거만으로도 전기요금을 최대 15~20% 절약할 수 있습니다.\n\n또한 냉동해도 세균이 죽지 않습니다. 냉동은 세균 증식을 멈출 뿐이며, 해동 후 세균은 다시 활동을 재개합니다. 날짜 표기 없이 오래 방치된 냉동 식품은 품질이 급격히 저하되며, 육류·생선은 냉동 6개월이 지나면 풍미와 영양이 크게 떨어집니다.',
        howTo: '1. 날짜 확인 및 정리\n냉동 날짜를 적지 않은 것, 냉동 6개월이 넘은 육류·생선은 처리합니다. 남겨둘 식품은 지퍼백에 식재료명과 날짜를 적어 재정리합니다.\n\n2. 성에 제거 (두껍게 쌓인 경우)\n전원을 끄고 냉동실 문을 열어 자연 해동합니다. 바닥에 수건을 깔아 녹는 물을 받습니다. 날카로운 금속 도구는 냉매 파이프 손상 위험이 있으므로 절대 사용하지 않습니다. 해동이 느리면 따뜻한 물에 적신 수건을 성에 위에 올려두면 효과적입니다.\n\n3. 재배치\n자주 꺼내는 것은 앞쪽에, 장기 보관 식품은 뒤쪽에 배치합니다. 냉동실은 80% 이상 채울수록 식품끼리 서로 냉기를 전달해 보냉 효율이 높아집니다.',
      },
      {
        id: 'fridge_gasket_check',
        title: '고무패킹 점검',
        description: '냉장고 문 고무패킹의 밀폐 상태를 점검하고 오염물을 닦아냅니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '점검',
        whyNeeded: '냉장고 고무패킹(가스켓)이 헐거워지거나 오염되면 냉기가 문틈으로 새어 냉장 성능이 떨어지고 전기요금이 증가합니다. 문을 제대로 닫아도 냉기가 계속 빠져나가기 때문에 냉장고가 더 자주 가동되어 수명도 단축됩니다.\n\n패킹의 홈에 음식물 찌꺼기가 끼면 세균과 곰팡이의 서식지가 됩니다. 삼성전자서비스에 접수되는 냉장고 AS 사례 중 상당수가 패킹 상태 확인과 간단한 청소만으로 해결 가능한 것들입니다.',
        howTo: '1. 밀착도 테스트\n문 사이에 얇은 종이나 지폐를 끼우고 닫은 뒤 당겨봅니다. 쉽게 빠지면 패킹 밀착력이 약해진 것입니다. 냉장고 문 전체 둘레를 돌아가며 확인합니다.\n\n2. 오염물 제거\n부드러운 천에 중성세제를 묻혀 패킹 홈 사이를 닦아냅니다. 면봉을 사용하면 좁고 깊은 홈까지 깨끗이 닦을 수 있습니다. 세척 후 마른 천으로 물기를 제거합니다.\n\n3. 변형 복원\n패킹이 눌려 있거나 변형됐다면 드라이어의 약한 바람을 10~20cm 거리에서 쐬어 고무를 부드럽게 한 뒤 손으로 모양을 잡아줍니다.\n\n4. 교체 판단\n테스트 후에도 냉기 누출이 계속되거나 패킹에 균열이 있다면 교체가 필요합니다. 제조사 AS센터나 냉장고 부품 전문점에서 모델명으로 주문할 수 있습니다.',
        referenceLinks: [
          { label: '냉장고 고무패킹 칫솔로 간단 청소', url: 'https://youtube.com/shorts/72wvgPYAjGQ?si=4yVyvErV-TE1YoYi' },
          { label: '냉장고 고무패킹 청소방법 (심화)', url: 'https://www.youtube.com/shorts/8Ru1vcUoazU' },
        ],
      },
      {
        id: 'fridge_coil_clean',
        title: '냉각 코일/기계실 청소',
        description: '냉장고 하단 기계실의 먼지를 제거해 냉각 효율과 수명을 유지합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 6 },
        estimatedMinutes: 20,
        priority: 'low',
        category: '관리',
        whyNeeded: '냉장고 하단 기계실(콘덴서 코일 주변)에 먼지가 쌓이면 열이 외부로 빠져나가지 못해 압축기가 과열됩니다. 이 상태가 지속되면 냉각 효율이 떨어지고 전기요금이 최대 15~20% 증가하며, 장기적으로는 압축기 수명이 단축되어 고가의 수리비로 이어집니다.\n\n삼성·LG 등 주요 제조사는 모두 연 1회 기계실 청소를 공식 권장합니다. 특히 반려동물 털이나 먼지가 많은 환경이라면 6개월마다 점검하는 것이 좋습니다.',
        howTo: '1. 기계실 위치 확인\n대부분의 냉장고는 하단 전면 하단에 탈착 가능한 커버가 있거나, 냉장고 뒷면 하단에 기계실이 위치합니다. 모델에 따라 다르므로 제품 설명서를 참고하세요.\n\n2. 먼지 제거\n진공청소기의 브러시 노즐로 코일 주변과 팬 주위의 먼지를 빨아들입니다. 부드러운 솔이나 칫솔로 좁은 틈의 먼지를 털어낸 뒤 다시 흡입합니다.\n\n3. 작업 중 주의사항\n청소 전 반드시 전원을 끄거나 콘센트를 뽑을 필요는 없지만, 팬 날개를 건드리지 않도록 주의합니다. 물을 사용하면 감전 위험이 있으므로 건식 청소만 합니다.\n\n4. 원위치 및 간격 확인\n기계실 커버를 다시 닫고 냉장고를 원위치합니다. 냉장고 뒷면과 벽 사이는 최소 5cm 이상 간격을 유지해야 방열이 원활합니다.',
        referenceLinks: [
          { label: '냉각 코일 청소 방법 (영상)', url: 'https://www.youtube.com/shorts/GQz7Vc8MSVM' },
        ],
      },
    ],
  },

  // 싱크대
  {
    id: 'sink_template',
    furnitureType: 'sink',
    furnitureName: '싱크대',
    description: '싱크대 및 배수구 관리',
    tasks: [
      {
        id: 'sink_daily_clean',
        title: '싱크대 청소',
        description: '싱크대를 닦고 물때를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 5,
        priority: 'high',
        category: '청소',
      },
      {
        id: 'drain_clean',
        title: '배수구 청소',
        description: '배수구를 청소하고 막힘을 방지합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'sink_deep_clean',
        title: '싱크대 세척',
        description: '싱크대를 세제로 깨끗이 세척합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
    ],
  },

  // 변기
  {
    id: 'toilet_template',
    furnitureType: 'toilet',
    furnitureName: '변기',
    description: '화장실 위생 관리',
    tasks: [
      {
        id: 'toilet_clean',
        title: '변기 청소',
        description: '변기를 깨끗이 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 10,
        priority: 'high',
        category: '청소',
      },
      {
        id: 'toilet_deep_clean',
        title: '변기 세척',
        description: '변기를 세제로 꼼꼼히 세척합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 20,
        priority: 'high',
        category: '청소',
      },
    ],
  },

  // 세탁기
  {
    id: 'washing_machine_template',
    furnitureType: 'washing_machine',
    furnitureName: '세탁기',
    description: '세탁기 관리 및 청소',
    tasks: [
      {
        id: 'washing_machine_drum_clean',
        title: '세탁조 청소',
        description: '세탁조를 청소하여 곰팡이를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'washing_machine_filter_clean',
        title: '필터 청소',
        description: '세탁기 필터를 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '관리',
      },
      {
        id: 'washing_machine_rubber_clean',
        title: '고무패킹 청소',
        description: '세탁기 문 고무패킹을 닦아냅니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 옷장
  {
    id: 'closet_template',
    furnitureType: 'closet',
    furnitureName: '옷장',
    description: '옷장 정리 및 관리',
    tasks: [
      {
        id: 'closet_organize',
        title: '옷장 정리',
        description: '옷을 정리하고 계절별로 분류합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 30,
        priority: 'low',
        category: '정리',
      },
      {
        id: 'closet_seasonal_change',
        title: '계절 옷 교체',
        description: '계절에 맞춰 옷을 교체합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 3 },
        estimatedMinutes: 60,
        priority: 'low',
        category: '정리',
      },
      {
        id: 'closet_moth_prevention',
        title: '좀약 교체',
        description: '옷장 좀약을 교체합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 2 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '관리',
      },
    ],
  },

  // 욕조
  {
    id: 'bathtub_template',
    furnitureType: 'bathtub',
    furnitureName: '욕조',
    description: '욕조 청소 및 관리',
    tasks: [
      {
        id: 'bathtub_clean',
        title: '욕조 청소',
        description: '욕조를 깨끗이 청소합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 20,
        priority: 'medium',
        category: '청소',
      },
      {
        id: 'bathtub_mold_prevention',
        title: '욕조 곰팡이 제거',
        description: '욕조의 곰팡이를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 15,
        priority: 'medium',
        category: '청소',
      },
    ],
  },

  // 책상
  {
    id: 'desk_template',
    furnitureType: 'desk',
    furnitureName: '책상',
    description: '책상 정리 및 청소',
    tasks: [
      {
        id: 'desk_organize',
        title: '책상 정리',
        description: '책상을 정리하고 불필요한 물건을 치웁니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'daily' },
        estimatedMinutes: 10,
        priority: 'medium',
        category: '정리',
      },
      {
        id: 'desk_clean',
        title: '책상 청소',
        description: '책상을 닦고 먼지를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 소파
  {
    id: 'sofa_template',
    furnitureType: 'sofa',
    furnitureName: '소파',
    description: '소파 청소 및 관리',
    tasks: [
      {
        id: 'sofa_vacuum',
        title: '소파 청소기 돌리기',
        description: '소파에 청소기를 돌려 먼지를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 15,
        priority: 'low',
        category: '청소',
      },
      {
        id: 'sofa_cover_wash',
        title: '소파 커버 빨기',
        description: '소파 커버를 세탁합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 20,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 거울
  {
    id: 'mirror_template',
    furnitureType: 'mirror',
    furnitureName: '거울',
    description: '거울 청소',
    tasks: [
      {
        id: 'mirror_clean',
        title: '거울 닦기',
        description: '거울을 깨끗이 닦습니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 화장대
  {
    id: 'dresser_template',
    furnitureType: 'dresser',
    furnitureName: '화장대',
    description: '화장대 정리 및 청소',
    tasks: [
      {
        id: 'dresser_organize',
        title: '화장대 정리',
        description: '화장품을 정리하고 유통기한을 확인합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 2 },
        estimatedMinutes: 15,
        priority: 'low',
        category: '정리',
      },
      {
        id: 'dresser_clean',
        title: '화장대 청소',
        description: '화장대를 닦고 먼지를 제거합니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'low',
        category: '청소',
      },
    ],
  },

  // 식물
  {
    id: 'plant_template',
    furnitureType: 'plant',
    furnitureName: '식물',
    description: '식물 관리',
    tasks: [
      {
        id: 'plant_water',
        title: '물 주기',
        description: '식물에 물을 줍니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'weekly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'medium',
        category: '관리',
      },
      {
        id: 'plant_fertilize',
        title: '영양제 주기',
        description: '식물 영양제를 줍니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 5,
        priority: 'low',
        category: '관리',
      },
      {
        id: 'plant_trim',
        title: '가지치기',
        description: '시든 잎을 제거하고 가지를 다듬습니다.',
        type: 'cleaning',
        defaultRecurrence: { type: 'monthly', interval: 1 },
        estimatedMinutes: 10,
        priority: 'low',
        category: '관리',
      },
    ],
  },
];

/**
 * 가구 타입으로 템플릿 찾기
 */
export function getTemplateByFurnitureType(furnitureType: string): FurnitureTaskTemplate | undefined {
  return FURNITURE_TASK_TEMPLATES.find(t => t.furnitureType === furnitureType);
}
