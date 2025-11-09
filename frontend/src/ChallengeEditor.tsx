import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  PlayCircle,
  Terminal,
} from 'lucide-react';
import { Challenge } from './types/challenge';
import { challengeService } from './services/challengeService';
import './styles/scratchWorkspace.css';

type WorkspaceBlock = {
  id: string;
  type: ScratchBlockId;
};

type ScratchBlockId =
  | 'event_flag'
  | 'motion_move'
  | 'motion_move_small'
  | 'motion_set_y_zero'
  | 'motion_change_y'
  | 'looks_hello'
  | 'looks_goal'
  | 'looks_jump';

type ScratchPaletteItem = {
  id: ScratchBlockId;
  label: string;
  color: string;
  group: 'イベント' | 'モーション' | '見た目';
};

type DragSource =
  | { type: 'palette'; item: ScratchPaletteItem; pointerId: number }
  | { type: 'workspace'; blockId: string; index: number; pointerId: number };

type DropTarget =
  | { type: 'workspace'; index: number }
  | { type: 'palette' };

type DragPreviewState = {
  label: string;
  group: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  source: 'palette' | 'workspace';
};

const paletteItems: ScratchPaletteItem[] = [
  { id: 'event_flag', label: '⚑ が押されたとき', color: '#FFBF00', group: 'イベント' },
  { id: 'motion_move', label: '10歩うごかす', color: '#4C97FF', group: 'モーション' },
  { id: 'motion_move_small', label: '3歩うごかす', color: '#4C97FF', group: 'モーション' },
  { id: 'motion_change_y', label: 'y座標を 50 ずつ変える', color: '#4C97FF', group: 'モーション' },
  { id: 'motion_set_y_zero', label: 'y座標を 0 にする', color: '#4C97FF', group: 'モーション' },
  { id: 'looks_hello', label: '「こんにちは！」と言う', color: '#9966FF', group: '見た目' },
  { id: 'looks_goal', label: '「着いたよ！」と言う', color: '#9966FF', group: '見た目' },
  { id: 'looks_jump', label: '「ジャンプ成功！」と言う', color: '#9966FF', group: '見た目' },
];

const groupOrder: Array<ScratchPaletteItem['group']> = ['イベント', 'モーション', '見た目'];

const resolvePaletteInfo = (blockType: ScratchBlockId) => {
  const item = paletteItems.find((entry) => entry.id === blockType);
  return {
    label: item?.label ?? blockType,
    color: item?.color ?? '#94a3b8',
    group: item?.group ?? 'ブロック',
  };
};

const newBlockId = (() => {
  let count = 0;
  return () => {
    count += 1;
    return `block-${count}`;
  };
})();

type TestResult = {
  status: 'success' | 'failure' | 'error';
  message: string;
  testCase: number | string;
  state?: ScratchState;
};

type ScratchState = {
  x: number;
  y: number;
  moveTotal: number;
  maxY: number;
  minY: number;
  messages: string[];
};

const createInitialState = (overrides?: Partial<ScratchState>): ScratchState => {
  const base = {
    x: overrides?.x ?? 0,
    y: overrides?.y ?? 0,
    moveTotal: overrides?.moveTotal ?? 0,
    maxY: overrides?.maxY ?? 0,
    minY: overrides?.minY ?? 0,
    messages: overrides?.messages ? [...overrides.messages] : [],
  };

  if (base.maxY < base.y) {
    base.maxY = base.y;
  }
  if (base.minY > base.y) {
    base.minY = base.y;
  }

  return base;
};

const updateVerticalExtremes = (state: ScratchState) => {
  if (state.y > state.maxY) {
    state.maxY = state.y;
  }
  if (state.y < state.minY) {
    state.minY = state.y;
  }
};

const runWorkspaceProgram = (
  blocks: WorkspaceBlock[],
  overrides?: Partial<ScratchState>
): { state?: ScratchState; error?: string } => {
  if (!blocks.length) {
    return { error: 'まずはブロックを配置してみよう！' };
  }

  if (blocks[0].type !== 'event_flag') {
    return { error: '一番上には「⚑ が押されたとき」を置いてみよう！' };
  }

  const state = createInitialState(overrides);
  let eventSeen = false;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    switch (block.type) {
      case 'event_flag':
        if (eventSeen && i > 0) {
          return { error: 'イベントブロックは一番上の1つだけにしよう！' };
        }
        eventSeen = true;
        break;
      case 'motion_move':
        state.x += 10;
        state.moveTotal += 10;
        break;
      case 'motion_move_small':
        state.x += 3;
        state.moveTotal += 3;
        break;
      case 'motion_change_y':
        state.y += 50;
        updateVerticalExtremes(state);
        break;
      case 'motion_set_y_zero':
        state.y = 0;
        updateVerticalExtremes(state);
        break;
      case 'looks_hello':
        state.messages.push('こんにちは！');
        break;
      case 'looks_goal':
        state.messages.push('着いたよ！');
        break;
      case 'looks_jump':
        state.messages.push('ジャンプ成功！');
        break;
      default:
        return { error: 'まだ対応していないブロックが含まれています。' };
    }
  }

  return { state };
};

const checkExpectation = (state: ScratchState, expected: unknown) => {
  if (!expected || typeof expected !== 'object') {
    return { success: true, message: '期待通りに動きました！' };
  }

  const issues: string[] = [];
  const obj = expected as Record<string, unknown>;

  if (typeof obj.x === 'number' && state.x !== obj.x) {
    issues.push(`x座標を ${obj.x} にそろえよう（いまは ${state.x}）。`);
  }
  if (typeof obj.y === 'number' && state.y !== obj.y) {
    issues.push(`y座標を ${obj.y} に戻そう（いまは ${state.y}）。`);
  }
  if (typeof obj.moveTotal === 'number' && state.moveTotal !== obj.moveTotal) {
    issues.push(`合計 ${obj.moveTotal} 歩動かそう（いまは ${state.moveTotal} 歩）。`);
  }
  if (typeof obj.maxY === 'number' && state.maxY < obj.maxY) {
    issues.push(`もっと高くジャンプしてみよう！（最高 y は ${state.maxY} → 目標 ${obj.maxY}）`);
  }
  if (typeof obj.minY === 'number' && state.minY > obj.minY) {
    issues.push(`y座標を ${obj.minY} 以下まで下げてみよう（最小値は ${state.minY}）。`);
  }
  if (typeof obj.messageIncludes === 'string') {
    const target = obj.messageIncludes;
    if (!state.messages.includes(target)) {
      issues.push(`「${target}」と言うブロックを入れてみよう。`);
    }
  }
  if (typeof obj.lastMessage === 'string') {
    const last = state.messages[state.messages.length - 1] ?? '';
    if (last !== obj.lastMessage) {
      issues.push(`最後に「${obj.lastMessage}」と言うようにしよう（いまは「${last || '（なし）'}」）。`);
    }
  }

  if (issues.length > 0) {
    return { success: false, message: issues.join(' ') };
  }

  return { success: true, message: 'バッチリ！ 期待通りの動きだよ。' };
};

const ChallengeEditor = () => {
  const { themeId } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [runError, setRunError] = useState<string>('');
  const [isPaletteHovered, setIsPaletteHovered] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const workspaceSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const workspaceAreaRef = useRef<HTMLDivElement>(null);
  const paletteAreaRef = useRef<HTMLDivElement>(null);
  const previousSlotPositions = useRef<Map<string, DOMRect>>(new Map());
  const dragSourceRef = useRef<DragSource | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);

  useEffect(() => {
    return () => {
      workspaceSlotRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (themeId) {
          const data = await challengeService.getChallengeById(themeId);
          setChallenge(data);
        } else {
          const all = await challengeService.getAllChallenges();
          setChallenge(all[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [themeId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const groupedPalette = useMemo(() => {
    return groupOrder.map((group) => ({
      group,
      items: paletteItems.filter((item) => item.group === group),
    }));
  }, []);

  const resetDragState = useCallback(() => {
    dragSourceRef.current = null;
    dropTargetRef.current = null;
    setIsDraggingBlock(false);
    setIsPaletteHovered(false);
    setHoverIndex(null);
    setDragIndex(null);
    setDragPreview(null);
  }, []);

  const handlePalettePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, block: ScratchPaletteItem) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      dragSourceRef.current = {
        type: 'palette',
        item: block,
        pointerId: event.pointerId,
      };
      dropTargetRef.current = null;
      setDragIndex(null);
      setHoverIndex(null);
      setIsDraggingBlock(true);
      setDragPreview({
        label: block.label,
        group: block.group,
        color: block.color,
        x: event.clientX,
        y: event.clientY,
        width: rect.width,
        height: rect.height,
        offsetX,
        offsetY,
        source: 'palette',
      });
    },
    []
  );

  const handleWorkspacePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const block = workspace[index];
      if (!block) {
        return;
      }
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const paletteInfo = resolvePaletteInfo(block.type);
      dragSourceRef.current = {
        type: 'workspace',
        blockId: block.id,
        index,
        pointerId: event.pointerId,
      };
      dropTargetRef.current = null;
      setDragIndex(index);
      setHoverIndex(index);
      setIsDraggingBlock(true);
      setDragPreview({
        label: paletteInfo.label,
        group: paletteInfo.group,
        color: paletteInfo.color,
        x: event.clientX,
        y: event.clientY,
        width: rect.width,
        height: rect.height,
        offsetX,
        offsetY,
        source: 'workspace',
      });
    },
    [workspace]
  );

  const findNearestDropIndex = useCallback(
    (pointerY: number) => {
      if (!Number.isFinite(pointerY)) {
        return workspace.length;
      }
      let targetIndex = workspace.length;

      for (let i = 0; i < workspace.length; i += 1) {
        const slotElement = workspaceSlotRefs.current.get(workspace[i].id);
        if (!slotElement) {
          continue;
        }
        const rect = slotElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (pointerY < midpoint) {
          targetIndex = i;
          break;
        }
      }

      return targetIndex;
    },
    [workspace]
  );

  useEffect(() => {
    if (!isDraggingBlock) {
      return;
    }

    const isInsideRect = (rect: DOMRect | null, x: number, y: number) => {
      if (!rect) return false;
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const source = dragSourceRef.current;
      if (!source || event.pointerId !== source.pointerId) {
        return;
      }
      event.preventDefault();

      setDragPreview((prev) =>
        prev
          ? {
              ...prev,
              x: event.clientX,
              y: event.clientY,
            }
          : prev
      );

      const workspaceRect = workspaceAreaRef.current?.getBoundingClientRect() ?? null;
      const paletteRect = paletteAreaRef.current?.getBoundingClientRect() ?? null;
      const insideWorkspace = isInsideRect(workspaceRect, event.clientX, event.clientY);
      const insidePalette = isInsideRect(paletteRect, event.clientX, event.clientY);

      if (insideWorkspace) {
        const nearest = findNearestDropIndex(event.clientY);
        dropTargetRef.current = { type: 'workspace', index: nearest };
        setHoverIndex((prev) => (prev === nearest ? prev : nearest));
        setIsPaletteHovered(false);
      } else {
        if (dropTargetRef.current?.type === 'workspace') {
          dropTargetRef.current = null;
        }
        setHoverIndex((prev) => (prev === null ? prev : null));
        if (source.type === 'workspace' && insidePalette) {
          dropTargetRef.current = { type: 'palette' };
          setIsPaletteHovered(true);
        } else {
          if (dropTargetRef.current?.type === 'palette') {
            dropTargetRef.current = null;
          }
          setIsPaletteHovered(false);
        }
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const source = dragSourceRef.current;
      if (!source || event.pointerId !== source.pointerId) {
        return;
      }
      event.preventDefault();

      const target = dropTargetRef.current;
      if (target?.type === 'workspace') {
        const targetIndex = target.index;
        if (source.type === 'palette') {
          setWorkspace((prev) => {
            const next = [...prev];
            const insertIndex = Math.max(0, Math.min(targetIndex, next.length));
            next.splice(insertIndex, 0, { id: newBlockId(), type: source.item.id });
            return next;
          });
        } else {
          setWorkspace((prev) => {
            if (!prev.length) {
              return prev;
            }
            const next = [...prev];
            const fromIndex = next.findIndex((block) => block.id === source.blockId);
            if (fromIndex === -1) {
              return next;
            }
            const [moved] = next.splice(fromIndex, 1);
            if (!moved) {
              return next;
            }
            let insertIndex = Math.max(0, Math.min(targetIndex, next.length));
            if (fromIndex < insertIndex) {
              insertIndex -= 1;
            }
            insertIndex = Math.max(0, Math.min(insertIndex, next.length));
            next.splice(insertIndex, 0, moved);
            return next;
          });
        }
      } else if (target?.type === 'palette' && source.type === 'workspace') {
        setWorkspace((prev) => {
          const next = [...prev];
          const removeIndex = next.findIndex((block) => block.id === source.blockId);
          if (removeIndex >= 0) {
            next.splice(removeIndex, 1);
          }
          return next;
        });
      }

      resetDragState();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      const source = dragSourceRef.current;
      if (!source || event.pointerId !== source.pointerId) {
        return;
      }
      event.preventDefault();
      resetDragState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [findNearestDropIndex, isDraggingBlock, resetDragState]);


  useEffect(() => {
    setRunError('');
    setTestResults([]);
    setSelectedResultIndex(0);
  }, [workspace]);

  useLayoutEffect(() => {
    const prev = previousSlotPositions.current;
    const nextPositions = new Map<string, DOMRect>();

    workspace.forEach((block) => {
      const element = workspaceSlotRefs.current.get(block.id);
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      nextPositions.set(block.id, rect);
      const previous = prev.get(block.id);

      if (previous) {
        const deltaY = previous.top - rect.top;
        if (Math.abs(deltaY) > 1 && typeof element.animate === 'function') {
          element.animate(
            [
              { transform: `translateY(${deltaY}px)` },
              { transform: 'translateY(0)' },
            ],
            {
              duration: 260,
              easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            }
          );
        }
      } else if (typeof element.animate === 'function') {
        element.animate(
          [
            { opacity: 0, transform: 'translateY(-6px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 220,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
          }
        );
      }
    });

    previousSlotPositions.current = nextPositions;
  }, [workspace]);

  const handleRemove = (event: MouseEvent<HTMLButtonElement>, blockId: string) => {
    event.stopPropagation();
    event.preventDefault();
    setWorkspace((prev) => prev.filter((block) => block.id !== blockId));
  };

  const blockLabel = (blockId: ScratchBlockId) => {
    const item = paletteItems.find((i) => i.id === blockId);
    return item?.label ?? blockId;
  };

  const handleRun = useCallback(() => {
    if (!challenge) return;

    setIsRunning(true);
    setRunError('');

    const testCases = challenge.testCases ?? [];
    const results: TestResult[] = [];

    if (testCases.length === 0) {
      const single = runWorkspaceProgram(workspace);
      if (single.error) {
        results.push({ status: 'error', message: single.error, testCase: '-' });
        setRunError(single.error);
      } else if (single.state) {
        results.push({ status: 'success', message: '自由に動かせたね！', testCase: '-', state: single.state });
      }
    } else {
      testCases.forEach((testCase, index) => {
        const overrides =
          Array.isArray(testCase.input) && testCase.input.length > 0
            ? (testCase.input[0] as Partial<ScratchState>)
            : undefined;
        const outcome = runWorkspaceProgram(workspace, overrides);
        if (outcome.error) {
          results.push({
            status: 'error',
            message: outcome.error,
            testCase: index + 1,
          });
          return;
        }
        if (outcome.state) {
          const expectation = checkExpectation(outcome.state, testCase.expected);
          results.push({
            status: expectation.success ? 'success' : 'failure',
            message: expectation.message,
            testCase: index + 1,
            state: outcome.state,
          });
        }
      });
    }

    const firstError = results.find((item) => item.status === 'error');
    setRunError(firstError?.message ?? '');
    setTestResults(results);
    setSelectedResultIndex(0);
    setIsRunning(false);
  }, [challenge, workspace]);

  const workspaceAreaClass = [
    'workspace-drop-area',
    isDraggingBlock || hoverIndex !== null ? 'workspace-drop-area--highlight' : '',
    workspace.length === 0 ? 'workspace-drop-area--empty' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const showDropGuides = isDraggingBlock;

  const renderDropGuide = (index: number) => {
    if (!showDropGuides) {
      return null;
    }
    const shouldHideGuide = dragPreview?.source === 'workspace' && dragIndex !== null && index === dragIndex;
    if (shouldHideGuide) {
      return null;
    }
    const isActive = hoverIndex === index;
    return (
      <div
        key={`placeholder-${index}`}
        className={`workspace-drop-placeholder ${isActive ? 'workspace-drop-placeholder--active' : 'workspace-drop-placeholder--inactive'}`}
      >
        <span>ここにブロックを置く</span>
      </div>
    );
  };

  const resolvedSelectedIndex = testResults.length > 0
    ? Math.min(selectedResultIndex, testResults.length - 1)
    : 0;
  const selectedResult = testResults[resolvedSelectedIndex] ?? null;
  const selectedState = selectedResult?.state;
  const stageCatX = selectedState ? Math.max(-120, Math.min(120, selectedState.x * 4)) : 0;
  const stageCatY = selectedState ? Math.max(-60, Math.min(60, -selectedState.y * 1.5)) : 0;
  const stageSpeech = selectedState && selectedState.messages.length > 0
    ? selectedState.messages[selectedState.messages.length - 1]
    : '';

  if (isLoading || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
          <p className="mt-4 text-indigo-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-rose-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur border-b border-indigo-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-500"
          >
            <ArrowLeft className="w-5 h-5" />
            一覧に戻る
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-indigo-700">Scratch チャレンジ</h1>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <section className="bg-white/90 rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:flex-1 space-y-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  <Code2 className="w-4 h-4" />
                  {challenge.difficulty} チャレンジ
                </p>
                <h2 className="text-2xl font-bold text-slate-800">{challenge.title}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {challenge.description}
                </p>
              </div>
              <div className="lg:w-56 shrink-0">
                <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-300 rounded-2xl h-full p-4 flex flex-col items-center justify-center text-center">
                  <Code2 className="w-10 h-10 text-indigo-600 mb-2" />
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    ブロックを並べて目標をクリアしよう！
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 whitespace-pre-wrap text-sm text-indigo-900 leading-relaxed">
              {challenge.instructions}
            </div>
            {challenge.examples && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-700">
                {challenge.examples}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5 text-slate-200" />
                <span className="font-semibold">ブロックパレット</span>
              </div>
              <div className="flex-1 bg-slate-50 p-4">
                <div 
                  ref={paletteAreaRef}
                  className={`rounded-xl bg-white border border-slate-200 p-4 space-y-3 palette-drop-zone ${isPaletteHovered ? 'palette-drop-zone--active' : ''}`}
                >
                  <h4 className="text-sm font-semibold text-slate-800">使えるブロック</h4>
                  <div className="space-y-3">
                    {groupedPalette.map(({ group, items }) => (
                      <div key={group} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</p>
                        <div className="flex flex-col gap-2">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onPointerDown={(event) => handlePalettePointerDown(event, item)}
                              className="scratch-block-btn"
                              style={{ backgroundColor: item.color }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 text-white">
                  <Code2 className="w-5 h-5 text-indigo-200" />
                  <span className="font-semibold">ワークスペース</span>
                </div>
                <div className="flex-1 bg-slate-50 p-4">
                <div
                  ref={workspaceAreaRef}
                  className={workspaceAreaClass}
                >
                    {workspace.length === 0 ? (
                      <div
                        className={`workspace-drop-empty ${isDraggingBlock ? 'workspace-drop-empty--active' : ''}`}
                      >
                        <PlayCircle className="w-6 h-6" />
                        <p className="font-semibold">ここにブロックをドロップ！</p>
                        <p className="text-xs opacity-80">左のパレットからドラッグしてみよう</p>
                      </div>
                    ) : (
                      <>
                        {renderDropGuide(0)}
                        {workspace.map((block, index) => {
                          const paletteBlock = paletteItems.find((item) => item.id === block.type);
                          const background = paletteBlock?.color ?? '#94a3b8';
                          const isDragging = dragIndex === index;
                          const isSlotActive = hoverIndex === index && dragIndex === index;
                          const label = blockLabel(block.type);

                          return (
                            <Fragment key={block.id}>
                            <div
                              ref={(element) => {
                                if (element) {
                                  workspaceSlotRefs.current.set(block.id, element);
                                } else {
                                  workspaceSlotRefs.current.delete(block.id);
                                }
                              }}
                              className={`workspace-slot ${isSlotActive ? 'workspace-slot--active' : ''}`}
                            >
                                <div className="workspace-slot__rail">
                                  <span className="workspace-slot__dot" aria-hidden />
                                </div>
                                <div
                                  onPointerDown={(event) => handleWorkspacePointerDown(event, index)}
                                  className={`workspace-block ${isDragging ? 'workspace-block--dragging' : ''}`}
                                  style={{ backgroundColor: background }}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="tracking-wide font-semibold">{label}</span>
                                    <span className="text-[10px] text-white/80 uppercase tracking-wide">{paletteBlock?.group ?? "ブロック"}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, block.id)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="workspace-remove"
                                    aria-label="ブロックを削除"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              {renderDropGuide(index + 1)}
                            </Fragment>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-200" />
                    <span className="font-semibold">テスト結果</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow transition-transform ${
                      isRunning
                        ? 'bg-slate-400 cursor-wait'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        実行中...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        ブロックをテスト
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 bg-slate-50 p-4 space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>テスト結果</span>
                    <span>
                      {testResults.length > 0
                        ? `${testResults.filter((item) => item.status === 'success').length} / ${testResults.length} テスト成功`
                        : '未実行'}
                    </span>
                  </div>

                  {runError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {runError}
                    </div>
                  )}

                  {selectedResult?.state && (
                    <div className="stage-preview">
                      <div className="stage-preview__scene">
                        <div className="stage-preview__sky" aria-hidden />
                        <div className="stage-preview__ground" aria-hidden />
                        <div
                          className="stage-preview__cat"
                          style={{ '--cat-x': `${stageCatX}px`, '--cat-y': `${stageCatY}px` } as CSSProperties}
                        >
                          <span role="img" aria-label="cat">🐱</span>
                          {stageSpeech && (
                            <div className="stage-preview__speech">
                              <span>{stageSpeech}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <dl className="stage-preview__stats">
                        <div><dt>X</dt><dd>{selectedState?.x ?? 0}</dd></div>
                        <div><dt>Y</dt><dd>{selectedState?.y ?? 0}</dd></div>
                        <div><dt>合計歩数</dt><dd>{selectedState?.moveTotal ?? 0}</dd></div>
                      </dl>
                    </div>
                  )}

                  {testResults.length === 0 && !runError && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      実行ボタンを押してブロックの動きをチェックしよう！
                    </div>
                  )}

                  {testResults.length > 0 && (
                    <ul className="space-y-3">
                      {testResults.map((result, index) => (
                        <li
                          key={`${result.testCase}-${index}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedResultIndex(index)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedResultIndex(index);
                            }
                          }}
                          className={`result-card ${
                            result.status === 'success'
                              ? 'result-card--success'
                              : result.status === 'failure'
                                ? 'result-card--warn'
                                : 'result-card--error'
                          } ${index === resolvedSelectedIndex ? 'result-card--active' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">テスト {result.testCase}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              {result.status === 'success'
                                ? 'Success'
                                : result.status === 'failure'
                                  ? 'Check'
                                  : 'Error'}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{result.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
      {dragPreview && (
        <div
          className="drag-preview"
          style={{
            top: `${dragPreview.y - dragPreview.offsetY}px`,
            left: `${dragPreview.x - dragPreview.offsetX}px`,
            width: `${dragPreview.width}px`,
            height: `${dragPreview.height}px`,
          }}
        >
          {dragPreview.source === 'palette' ? (
            <div
              className="scratch-block-btn drag-preview__palette"
              style={{ backgroundColor: dragPreview.color, width: '100%', height: '100%' }}
            >
              {dragPreview.label}
            </div>
          ) : (
            <div
              className="workspace-block drag-preview__workspace"
              style={{ backgroundColor: dragPreview.color, width: '100%', height: '100%' }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="tracking-wide font-semibold">{dragPreview.label}</span>
                <span className="text-[10px] text-white/80 uppercase tracking-wide">{dragPreview.group}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeEditor;
