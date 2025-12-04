import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ChildTabNav from '../../components/ChildTabNav';

interface CharacterSlot {
  slot_number: number;
  level: number;
  position_top: string;
  position_left: string;
  background_image: string;
  stage_number: number;
}

interface ProgressTracker {
  current_goal_number: number;
}

interface ChildSession {
  childId: string;
  nickname: string;
  points: number;
  familyId: string;
}

// 기본 슬롯 설정 (DB에서 못 가져올 경우 사용)
const DEFAULT_SLOT_CONFIG = [
  { slot_number: 1, position_top: '71%', position_left: '12%', background_image: '/icons/characters/background-1.png', stage_number: 1 },
  { slot_number: 2, position_top: '49%', position_left: '74%', background_image: '/icons/characters/background-1.png', stage_number: 1 },
  { slot_number: 3, position_top: '33%', position_left: '38%', background_image: '/icons/characters/background-1.png', stage_number: 1 },
];

export default function ChildCharacter() {
  const [slots, setSlots] = useState<CharacterSlot[]>([]);
  const [progressTracker, setProgressTracker] = useState<ProgressTracker>({ current_goal_number: 1 });
  const [loading, setLoading] = useState(true);
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem('child_session');
    if (!session) {
      navigate('/');
      return;
    }

    let parsedSession: ChildSession;
    try {
      parsedSession = JSON.parse(session);
      setChildSession(parsedSession);
      loadCharacterData(parsedSession.childId);
    } catch (e) {
      navigate('/');
      return;
    }

    // 실시간 업데이트 구독 - character_slots 테이블
    const slotsChannel = supabase
      .channel('character-slots-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_slots',
          filter: `child_id=eq.${parsedSession.childId}`,
        },
        () => {
          console.log('Character slots updated');
          loadCharacterData(parsedSession.childId);
        }
      )
      .subscribe();

    // progress_tracker 구독
    const trackerChannel = supabase
      .channel('progress-tracker-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_progress_tracker',
          filter: `child_id=eq.${parsedSession.childId}`,
        },
        () => {
          console.log('Progress tracker updated');
          loadCharacterData(parsedSession.childId);
        }
      )
      .subscribe();

    // points_ledger 변경도 구독 (캐릭터 진화 트리거)
    const pointsChannel = supabase
      .channel('character-points-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_ledger',
          filter: `child_id=eq.${parsedSession.childId}`,
        },
        () => {
          // 포인트 변경 시 캐릭터 진화 상태 다시 로드
          loadCharacterData(parsedSession.childId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(slotsChannel);
      supabase.removeChannel(trackerChannel);
      supabase.removeChannel(pointsChannel);
    };
  }, [navigate]);

  const loadCharacterData = async (childId: string) => {
    try {
      // 1. 슬롯 설정 로드
      const { data: configData } = await supabase
        .from('character_slot_config')
        .select('*')
        .order('slot_number');

      // 2. 자녀의 캐릭터 슬롯 데이터 로드
      const { data: slotsData } = await supabase
        .from('character_slots')
        .select('slot_number, level')
        .eq('child_id', childId)
        .order('slot_number');

      // 3. 진행 상태 로드
      const { data: trackerData } = await supabase
        .from('character_progress_tracker')
        .select('current_goal_number')
        .eq('child_id', childId)
        .single();

      // 설정 데이터 (DB에서 가져오거나 기본값 사용)
      const config = configData && configData.length > 0 ? configData : DEFAULT_SLOT_CONFIG;

      // 슬롯 데이터 병합
      const mergedSlots: CharacterSlot[] = config.map((cfg: any) => {
        const slotData = slotsData?.find((s: any) => s.slot_number === cfg.slot_number);
        return {
          slot_number: cfg.slot_number,
          // DB 데이터 → 설정 기본값 → 1 순서로 우선순위
          level: slotData?.level || cfg.level || 1,
          position_top: cfg.position_top,
          position_left: cfg.position_left,
          background_image: cfg.background_image,
          stage_number: cfg.stage_number,
        };
      });

      setSlots(mergedSlots);
      
      if (trackerData) {
        setProgressTracker(trackerData);
        // 현재 스테이지 결정 (현재 목표 번호 기반)
        const currentSlotConfig = config.find((c: any) => c.slot_number === trackerData.current_goal_number);
        if (currentSlotConfig) {
          setCurrentStage(currentSlotConfig.stage_number);
        }
      }
    } catch (error) {
      console.error('Error loading character data:', error);
      // 오류 시 기본값 사용 (DEFAULT_SLOT_CONFIG의 level 값 사용)
      setSlots(DEFAULT_SLOT_CONFIG.map(cfg => ({
        ...cfg,
        level: cfg.level || 1,
      })));
    } finally {
      setLoading(false);
    }
  };

  // 캐릭터 이미지 경로 생성
  const getCharacterImage = (slotNumber: number, level: number) => {
    return `/icons/characters/${slotNumber}-${level}.png`;
  };

  // 현재 스테이지의 슬롯만 필터링
  const currentStageSlots = slots.filter(slot => slot.stage_number === currentStage);

  // 현재 스테이지의 배경 이미지
  const currentBackground = currentStageSlots.length > 0 
    ? currentStageSlots[0].background_image 
    : '/icons/characters/background-1.png';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#8BC34A]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#8BC34A]">
      {/* Fixed aspect ratio container for background and characters */}
      <div className="absolute inset-0 flex items-center justify-center pb-16">
        {/* 
          배경 이미지와 캐릭터를 감싸는 컨테이너
          - 배경 이미지의 비율(2:3)을 유지
          - 캐릭터는 이 컨테이너 기준으로 % 위치 지정
          - 화면 크기가 변해도 캐릭터는 배경 이미지의 같은 위치에 고정
        */}
        <div 
          className="relative"
          style={{ 
            // 컨테이너 크기를 화면에 맞게 계산
            // 높이 기준으로 비율 유지 (세로가 긴 이미지이므로)
            height: 'calc(100vh - 4rem)',
            width: 'calc((100vh - 4rem) * 0.667)', // 800/1200 = 0.667
            maxWidth: '100vw',
            maxHeight: 'calc(100vw * 1.5)', // 1200/800 = 1.5
          }}
        >
          {/* Background image - 컨테이너에 꽉 차게 */}
          <img
            src={currentBackground}
            alt="Background"
            className="absolute inset-0 w-full h-full object-fill"
          />
          
          {/* Characters - 현재 스테이지의 슬롯만 렌더링 */}
          {/* 캐릭터 위치와 크기는 배경 컨테이너 기준 퍼센트로 고정 */}
          {currentStageSlots.map((slot) => (
            <div
              key={slot.slot_number}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 cursor-pointer"
              style={{
                top: slot.position_top,
                left: slot.position_left,
                // 캐릭터 크기: 배경 컨테이너 너비의 33% (22% * 1.5 = 33%)
                width: '33%',
              }}
            >
              <div className="relative w-full">
                {/* Character shadow */}
                <div 
                  className="absolute -bottom-[8%] left-1/2 transform -translate-x-1/2 w-[80%] h-[12%] bg-black/20 rounded-full blur-sm"
                />
                {/* Character image - 부모 너비에 맞추고 비율 유지 */}
                <img
                  src={getCharacterImage(slot.slot_number, slot.level)}
                  alt={`Character ${slot.slot_number} - Level ${slot.level}`}
                  className="w-full h-auto object-contain drop-shadow-lg transition-all duration-300"
                />
                {/* Level 5 indicator (max evolution) */}
                {slot.level === 5 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-[10px]">⭐</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Progress Info Overlay */}
          <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {childSession?.nickname}'s Characters
                </h2>
                <p className="text-xs text-gray-600">
                  Goal #{progressTracker.current_goal_number}
                  {progressTracker.current_goal_number > slots.length && ' (Max reached!)'}
                </p>
              </div>
              <div className="flex gap-1">
                {currentStageSlots.map((slot) => (
                  <div 
                    key={slot.slot_number}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      slot.level === 5 
                        ? 'bg-yellow-400 text-yellow-900' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {slot.level}/5
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <ChildTabNav />
    </div>
  );
}
