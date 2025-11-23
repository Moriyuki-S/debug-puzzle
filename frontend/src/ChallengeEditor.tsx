import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  PlayCircle,
  Terminal,
} from 'lucide-react';
import Modal from './components/ui/Modal';
import { Challenge } from './types/challenge';
import { challengeService } from './services/challengeService';
import stageCharacterImg from '../images/character.png';
import './styles/scratchWorkspace.css';

type ScratchBlockId =
  | 'event_flag'
  | 'motion_move'
  | 'motion_move_small'
  | 'motion_jump'
  | 'looks_hello'
  | 'looks_goal'
  | 'looks_jump'
  | 'looks_arrived'
  | 'control_for_loop'
  | 'control_if_goal'
  | 'condition_goal_reached';

type WorkspaceBlockType = ScratchBlockId | 'control_end';

type WorkspaceBlock = {
  id: string;
  type: WorkspaceBlockType;
  conditionId?: ScratchBlockId;
  loopCount?: number;
};

type ScratchPaletteItem = {
  id: ScratchBlockId;
  label: string;
  color: string;
  group: 'イベント' | 'モーション' | '見た目' | 'コントロール' | '条件';
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

const CONTROL_GOAL_TARGET_X = 4;
const CONTROL_GOAL_MESSAGE = 'ゴールできたよ！';
const DEFAULT_CONTROL_FOR_LOOP_COUNT = 4;
const CONTROL_FOR_LOOP_PALETTE_LABEL = 'for (回数を選んでくり返す)';
const MIN_CONTROL_FOR_LOOP_COUNT = 1;
const MAX_CONTROL_FOR_LOOP_COUNT = 10;
const INDENT_UNIT_REM = 2;

const formatLoopLabel = (count: number) => `for (${count}回くり返す)`;
const normalizeLoopCount = (value?: number) => {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : DEFAULT_CONTROL_FOR_LOOP_COUNT;
  return Math.min(MAX_CONTROL_FOR_LOOP_COUNT, Math.max(MIN_CONTROL_FOR_LOOP_COUNT, parsed));
};

const paletteItems: ScratchPaletteItem[] = [
  { id: 'event_flag', label: '⚑ が押されたとき', color: '#FFBF00', group: 'イベント' },
  { id: 'motion_move', label: '右に進む', color: '#4C97FF', group: 'モーション' },
  { id: 'motion_jump', label: 'ジャンプする', color: '#4C97FF', group: 'モーション' },
  { id: 'looks_hello', label: '「こんにちは！」と言う', color: '#9966FF', group: '見た目' },
  { id: 'looks_goal', label: '「着いたよ！」と言う', color: '#9966FF', group: '見た目' },
  { id: 'looks_jump', label: '「ジャンプ成功！」と言う', color: '#9966FF', group: '見た目' },
  { id: 'looks_arrived', label: '「ゴールできたよ！」と言う', color: '#9966FF', group: '見た目' },
  { id: 'control_for_loop', label: CONTROL_FOR_LOOP_PALETTE_LABEL, color: '#FFAB19', group: 'コントロール' },
  { id: 'control_if_goal', label: 'もし [条件] なら', color: '#FFAB19', group: 'コントロール' },
  { id: 'condition_goal_reached', label: 'ゴールした？', color: '#FACC15', group: '条件' },
];

const conditionPaletteItems = paletteItems.filter((item) => item.group === '条件');
const conditionBlockIdSet = new Set<ScratchBlockId>(conditionPaletteItems.map((item) => item.id));

const groupOrder: Array<ScratchPaletteItem['group']> = ['イベント', 'モーション', '見た目', 'コントロール', '条件'];

const defaultPaletteIds: ScratchBlockId[] = [
  'event_flag',
  'motion_move',
  'motion_jump',
  'looks_hello',
  'looks_goal',
  'looks_jump',
  'control_for_loop',
  'control_if_goal',
];

const challengePaletteWhitelist: Record<string, ScratchBlockId[]> = {
  'scratch-boss-run': [...defaultPaletteIds],
};

type ProgramNode = {
  type: ScratchBlockId;
  children: ProgramNode[];
  conditionId?: ScratchBlockId;
  loopCount?: number;
};

const isControlStartBlock = (type: WorkspaceBlockType): type is 'control_for_loop' | 'control_if_goal' =>
  type === 'control_for_loop' || type === 'control_if_goal';
const isControlEndBlock = (type: WorkspaceBlockType): type is 'control_end' => type === 'control_end';
const findMatchingControlEndIndex = (blocks: WorkspaceBlock[], startIndex: number) => {
  let depth = 0;
  for (let i = startIndex + 1; i < blocks.length; i += 1) {
    const currentType = blocks[i]?.type;
    if (!currentType) {
      continue;
    }
    if (isControlStartBlock(currentType)) {
      depth += 1;
      continue;
    }
    if (isControlEndBlock(currentType)) {
      if (depth === 0) {
        return i;
      }
      depth -= 1;
    }
  }
  return -1;
};

const resolvePaletteInfo = (blockType: ScratchBlockId) => {
  const item = paletteItems.find((entry) => entry.id === blockType);
  return {
    label: item?.label ?? blockType,
    color: item?.color ?? '#94a3b8',
    group: item?.group ?? 'ブロック',
  };
};

const computeIndentationGuides = (blocks: WorkspaceBlock[]) => {
  const blockIndentMap = new Map<string, number>();
  const slotIndentLevels: number[] = new Array(blocks.length + 1).fill(0);
  let depth = 0;
  slotIndentLevels[0] = depth;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (isControlEndBlock(block.type)) {
      depth = Math.max(0, depth - 1);
      blockIndentMap.set(block.id, depth);
      slotIndentLevels[i + 1] = depth;
      continue;
    }
    blockIndentMap.set(block.id, depth);
    if (isControlStartBlock(block.type)) {
      depth += 1;
    }
    slotIndentLevels[i + 1] = depth;
  }

  return { blockIndentMap, slotIndentLevels };
};

type ParseResult = {
  nodes: ProgramNode[];
  nextIndex: number;
  ended: boolean;
  error?: string;
};

const buildProgramTree = (blocks: WorkspaceBlock[]): { nodes?: ProgramNode[]; error?: string } => {
  const parseFromIndex = (startIndex: number): ParseResult => {
    const nodes: ProgramNode[] = [];
    let index = startIndex;

    while (index < blocks.length) {
      const current = blocks[index];

      if (isControlEndBlock(current.type)) {
        return { nodes, nextIndex: index + 1, ended: true };
      }

      if (isControlStartBlock(current.type)) {
        const childResult = parseFromIndex(index + 1);
        if (childResult.error) {
          return childResult;
        }
        if (!childResult.ended) {
          const info = resolvePaletteInfo(current.type);
          return {
            nodes: [],
            nextIndex: childResult.nextIndex,
            ended: false,
            error: `${info.label} の終わりはインデントで表そう！ブロックの並びをもう一度チェックしてみてね。`,
          };
        }
        nodes.push({ type: current.type, children: childResult.nodes, conditionId: current.conditionId, loopCount: current.loopCount });
        index = childResult.nextIndex;
        continue;
      }

      nodes.push({ type: current.type, children: [] });
      index += 1;
    }

    return { nodes, nextIndex: index, ended: false };
  };

  const result = parseFromIndex(0);
  if (result.error) {
    return { error: result.error };
  }
  if (result.ended) {
    return { error: 'インデントの戻し方がおかしいみたい。ブロックの順番を確認してね。' };
  }
  return { nodes: result.nodes };
};

const newBlockId = (() => {
  let count = 0;
  return () => {
    count += 1;
    return `block-${count}`;
  };
})();

const allowedWorkspaceTypes = new Set<WorkspaceBlockType>([
  'event_flag',
  'motion_move',
  'motion_jump',
  'looks_hello',
  'looks_goal',
  'looks_jump',
  'looks_arrived',
  'control_for_loop',
  'control_if_goal',
  'condition_goal_reached',
  'control_end',
]);

const hydrateGeneratedBlocks = (rawBlocks: unknown[]): WorkspaceBlock[] => {
  if (!Array.isArray(rawBlocks)) return [];

  const result: WorkspaceBlock[] = [];
  let openControls = 0;

  rawBlocks.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const blockType = (entry as Record<string, unknown>).type;
    if (typeof blockType !== 'string') {
      return;
    }
    if (!allowedWorkspaceTypes.has(blockType as WorkspaceBlockType)) {
      return;
    }

    if (blockType === 'control_end') {
      if (openControls > 0) {
        openControls -= 1;
        result.push({ id: newBlockId(), type: 'control_end' });
      }
      return;
    }

    const base: WorkspaceBlock = { id: newBlockId(), type: blockType as WorkspaceBlockType };
    if (blockType === 'control_for_loop' && typeof (entry as Record<string, unknown>).loopCount === 'number') {
      base.loopCount = (entry as Record<string, number>).loopCount;
    }
    if (blockType === 'control_if_goal') {
      const candidate = (entry as Record<string, unknown>).conditionId;
      if (typeof candidate === 'string' && conditionBlockIdSet.has(candidate as ScratchBlockId)) {
        base.conditionId = candidate as ScratchBlockId;
      }
    }

    result.push(base);
    if (isControlStartBlock(base.type)) {
      openControls += 1;
    }
  });

  while (openControls > 0) {
    result.push({ id: newBlockId(), type: 'control_end' });
    openControls -= 1;
  }

  return result;
};

const ensureEventFlag = (blocks: WorkspaceBlock[]): WorkspaceBlock[] => {
  if (blocks.length === 0) {
    return [{ id: newBlockId(), type: 'event_flag' }];
  }
  if (blocks[0].type !== 'event_flag') {
    return [{ id: newBlockId(), type: 'event_flag' }, ...blocks];
  }
  return blocks;
};

const generateBuggyWorkspace = (challengeId?: string): WorkspaceBlock[] => {
  const createBlock = (type: WorkspaceBlockType, extras?: Partial<WorkspaceBlock>): WorkspaceBlock => ({
    id: newBlockId(),
    type,
    ...extras,
  });

  switch (challengeId) {
    case 'scratch-greeting':
      // Missing the greeting block on purpose.
      return [createBlock('event_flag')];
    case 'scratch-walk':
      // Not enough steps to reach 30; still says arrived.
      return [
        createBlock('event_flag'),
        createBlock('motion_move'),
        createBlock('motion_move'),
        createBlock('looks_goal'),
      ];
    case 'scratch-jump':
      // Jumps but forgets to greet.
      return [createBlock('event_flag'), createBlock('motion_jump'), createBlock('looks_jump')];
    case 'scratch-control-loop': {
      // Loops only 3 times and leaves the if-condition empty to surface an error.
      const loopStart = createBlock('control_for_loop', { loopCount: 3 });
      const loopEnd = createBlock('control_end');
      const ifStart = createBlock('control_if_goal');
      const ifEnd = createBlock('control_end');
      return [
        createBlock('event_flag'),
        loopStart,
        createBlock('motion_move'),
        loopEnd,
        ifStart,
        createBlock('looks_goal'),
        ifEnd,
      ];
    }
    default:
      return [createBlock('event_flag')];
  }
};

type TestResult = {
  status: 'success' | 'failure' | 'error';
  message: string;
  testCase: number | string;
  state?: ScratchState;
  trace?: ScratchState[];
};

type ScratchState = {
  x: number;
  y: number;
  moveTotal: number;
  maxY: number;
  minY: number;
  jumpCount: number;
  messages: string[];
};

const createInitialState = (overrides?: Partial<ScratchState>): ScratchState => {
  const base = {
    x: overrides?.x ?? 0,
    y: overrides?.y ?? 0,
    moveTotal: overrides?.moveTotal ?? 0,
    maxY: overrides?.maxY ?? 0,
    minY: overrides?.minY ?? 0,
    jumpCount: overrides?.jumpCount ?? 0,
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

const cloneState = (state: ScratchState): ScratchState => ({
  x: state.x,
  y: state.y,
  moveTotal: state.moveTotal,
  maxY: state.maxY,
  minY: state.minY,
  jumpCount: state.jumpCount,
  messages: [...state.messages],
});

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
  overrides?: Partial<ScratchState>,
  recordTrace = false
): { state?: ScratchState; error?: string; trace?: ScratchState[] } => {
  if (!blocks.length) {
    return { error: 'まずはブロックを配置してみよう！' };
  }

  const tree = buildProgramTree(blocks);
  if (tree.error || !tree.nodes) {
    return { error: tree.error ?? 'ブロック構造の解析中にエラーが発生しました。' };
  }

  if (tree.nodes.length === 0 || tree.nodes[0].type !== 'event_flag') {
    return { error: '一番上には「⚑ が押されたとき」を置いてみよう！' };
  }

  const state = createInitialState(overrides);
  let eventSeen = false;
  const trace: ScratchState[] = recordTrace ? [cloneState(state)] : [];

  const pushTrace = () => {
    if (recordTrace) {
      trace.push(cloneState(state));
    }
  };

  const evaluateCondition = (conditionId?: ScratchBlockId): { error?: string; value?: boolean } => {
    if (!conditionId) {
      return { error: 'もしブロックの条件を選んでみよう！' };
    }
    switch (conditionId) {
      case 'condition_goal_reached':
        return { value: state.x >= CONTROL_GOAL_TARGET_X };
      default:
        return { error: 'まだ対応していない条件が含まれています。' };
    }
  };

const executeNode = (node: ProgramNode): { error?: string } => {
  switch (node.type) {
      case 'event_flag':
        if (eventSeen) {
          return { error: 'イベントブロックは一番上の1つだけにしよう！' };
        }
        eventSeen = true;
        pushTrace();
        return {};
      case 'motion_move':
        state.x += 1;
        state.moveTotal += 1;
        pushTrace();
        return {};
      case 'motion_jump':
        state.jumpCount += 1;
        state.y += 50;
        updateVerticalExtremes(state);
        pushTrace();
        state.y = 0;
        updateVerticalExtremes(state);
        pushTrace();
        return {};
      case 'looks_hello':
        state.messages.push('こんにちは！');
        pushTrace();
        return {};
      case 'looks_goal':
        state.messages.push('着いたよ！');
        pushTrace();
        return {};
      case 'looks_jump':
        state.messages.push('ジャンプ成功！');
        pushTrace();
        return {};
      case 'looks_arrived':
        state.messages.push(CONTROL_GOAL_MESSAGE);
        pushTrace();
        return {};
      case 'control_for_loop': {
        if (node.children.length === 0) {
          return { error: 'for ブロックの中に動作させたいブロックを入れてみよう！' };
        }
        const loopCount = normalizeLoopCount(node.loopCount);
        for (let iteration = 0; iteration < loopCount; iteration += 1) {
          const bodyOutcome = executeNodes(node.children);
          if (bodyOutcome.error) {
            return bodyOutcome;
          }
        }
        return {};
      }
      case 'control_if_goal': {
        const conditionResult = evaluateCondition(node.conditionId);
        if (conditionResult.error) {
          return { error: conditionResult.error };
        }
        if (conditionResult.value) {
          if (node.children.length === 0) {
            state.messages.push(CONTROL_GOAL_MESSAGE);
            pushTrace();
            return {};
          }
          return executeNodes(node.children);
        }
        return {};
      }
      case 'control_end':
        return {};
      default:
        return { error: 'まだ対応していないブロックが含まれています。' };
    }
  };

  const executeNodes = (nodeList: ProgramNode[]): { error?: string } => {
    for (const node of nodeList) {
      const outcome = executeNode(node);
      if (outcome.error) {
        return outcome;
      }
    }
    return {};
  };

  const result = executeNodes(tree.nodes);
  if (result.error) {
    return { error: result.error };
  }

  if (!eventSeen) {
    return { error: '一番上には「⚑ が押されたとき」を置いてみよう！' };
  }

  return { state, trace: recordTrace ? trace : undefined };
};

const checkExpectation = (state: ScratchState, expected: unknown) => {
  if (!expected || typeof expected !== 'object') {
    return { success: true, message: '期待通りに動きました！' };
  }

  const issues: string[] = [];
  const obj = expected as Record<string, unknown>;

  if (typeof obj.x === 'number' && state.x !== obj.x) {
    issues.push(`右への回数を ${obj.x} 回にそろえよう（いまは ${state.x} 回）。`);
  }
  if (typeof obj.y === 'number' && state.y !== obj.y) {
    issues.push(`上を ${obj.y} に戻そう（いまは ${state.y}）。`);
  }
  if (typeof obj.jumpCount === 'number' && state.jumpCount !== obj.jumpCount) {
    issues.push(`ジャンプする回数を ${obj.jumpCount} 回に合わせよう（いまは ${state.jumpCount} 回）。`);
  }
  if (typeof obj.moveTotal === 'number' && state.moveTotal !== obj.moveTotal) {
    issues.push(`合計 ${obj.moveTotal} 回「右に進む」を使おう（いまは ${state.moveTotal} 回）。`);
  }
  if (typeof obj.maxY === 'number' && state.maxY < obj.maxY) {
    issues.push(`もっと高くジャンプしてみよう！（最高 y は ${state.maxY} → 目標 ${obj.maxY}）`);
  }
  if (typeof obj.minY === 'number' && state.minY > obj.minY) {
    issues.push(`上を ${obj.minY} 以下まで下げてみよう（最小値は ${state.minY}）。`);
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerateError, setAiGenerateError] = useState('');
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [runError, setRunError] = useState<string>('');
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
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
    let isCancelled = false;
    const seedWorkspace = async () => {
      if (!challenge) return;
      setAiGenerating(true);
      setAiGenerateError('');
      try {
        const generated = await challengeService.generateWorkspace(challenge);
        const hydrated = ensureEventFlag(hydrateGeneratedBlocks(generated?.blocks ?? []));
        if (!isCancelled && hydrated.length > 0) {
          setWorkspace(hydrated);
          setAiGenerating(false);
          return;
        }
      } catch (error) {
        console.warn('Failed to generate AI workspace, falling back to local template.', error);
        if (!isCancelled) {
          setAiGenerateError('AI生成に失敗したのでテンプレートで初期化しました。');
        }
      }
      if (!isCancelled) {
        setWorkspace(generateBuggyWorkspace(challenge.id));
        setAiGenerating(false);
      }
    };
    seedWorkspace();
    return () => {
      isCancelled = true;
    };
  }, [challenge]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const groupedPalette = useMemo(() => {
    const allowedIds = new Set(challengePaletteWhitelist[challenge?.id ?? 'default'] ?? defaultPaletteIds);
    const paletteForChallenge = paletteItems.filter((item) => allowedIds.has(item.id));
    return groupOrder
      .map((group) => ({
        group,
        items: paletteForChallenge.filter(
          (item) =>
            item.group === group &&
            group !== '条件'
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [challenge]);

  const { blockIndentMap, slotIndentLevels } = useMemo(() => computeIndentationGuides(workspace), [workspace]);

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
      if (!block || isControlEndBlock(block.type)) {
        return;
      }
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
    const paletteInfo = resolvePaletteInfo(block.type);
    const previewLabel =
      block.type === 'control_for_loop'
        ? formatLoopLabel(normalizeLoopCount(block.loopCount))
        : paletteInfo.label;
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
        label: previewLabel,
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
            const newBlock: WorkspaceBlock = {
              id: newBlockId(),
              type: source.item.id,
              loopCount: source.item.id === 'control_for_loop' ? DEFAULT_CONTROL_FOR_LOOP_COUNT : undefined,
            };
            const blocksToInsert: WorkspaceBlock[] = [newBlock];
            if (isControlStartBlock(source.item.id)) {
              blocksToInsert.push({ id: newBlockId(), type: 'control_end' });
            }
            next.splice(insertIndex, 0, ...blocksToInsert);
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
            const movingBlock = next[fromIndex];
            if (!movingBlock || isControlEndBlock(movingBlock.type)) {
              return next;
            }
            let sliceLength = 1;
            if (isControlStartBlock(movingBlock.type)) {
              const matchingEnd = findMatchingControlEndIndex(next, fromIndex);
              if (matchingEnd === -1) {
                return next;
              }
              sliceLength = matchingEnd - fromIndex + 1;
              if (targetIndex > fromIndex && targetIndex < matchingEnd + 1) {
                return next;
              }
            } else if (targetIndex === fromIndex || targetIndex === fromIndex + 1) {
              return next;
            }
            const extracted = next.splice(fromIndex, sliceLength);
            if (!extracted.length) {
              return next;
            }
            let insertIndex = targetIndex;
            if (fromIndex < targetIndex) {
              insertIndex -= extracted.length;
            }
            insertIndex = Math.max(0, Math.min(insertIndex, next.length));
            next.splice(insertIndex, 0, ...extracted);
            return next;
          });
        }
      } else if (target?.type === 'palette' && source.type === 'workspace') {
        setWorkspace((prev) => {
          const next = [...prev];
          const removeIndex = next.findIndex((block) => block.id === source.blockId);
          if (removeIndex >= 0) {
            const block = next[removeIndex];
            if (!block) {
              return next;
            }
            if (isControlStartBlock(block.type)) {
              const endIndex = findMatchingControlEndIndex(next, removeIndex);
              if (endIndex === -1) {
                next.splice(removeIndex, 1);
              } else {
                next.splice(removeIndex, endIndex - removeIndex + 1);
              }
            } else if (!isControlEndBlock(block.type)) {
              next.splice(removeIndex, 1);
            }
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
    setWorkspace((prev) => {
      const next = [...prev];
      const targetIndex = next.findIndex((block) => block.id === blockId);
      if (targetIndex === -1) {
        return prev;
      }
      const block = next[targetIndex];
      if (!block) {
        return prev;
      }
      if (isControlStartBlock(block.type)) {
        const endIndex = findMatchingControlEndIndex(next, targetIndex);
        if (endIndex === -1) {
          next.splice(targetIndex, 1);
          return next;
        }
        next.splice(targetIndex, endIndex - targetIndex + 1);
        return next;
      }
      if (isControlEndBlock(block.type)) {
        return next;
      }
      next.splice(targetIndex, 1);
      return next;
    });
  };

  const blockLabel = (block: WorkspaceBlock) => {
    if (block.type === 'control_for_loop') {
      const count = normalizeLoopCount(block.loopCount);
      return formatLoopLabel(count);
    }
    const item = paletteItems.find((i) => i.id === block.type);
    return item?.label ?? block.type;
  };

  const handleLoopCountChange = useCallback((loopBlockId: string, rawValue: string) => {
    if (rawValue.trim() === '') {
      return;
    }
    const normalized = normalizeLoopCount(Number(rawValue));
    setWorkspace((prev) => {
      const next = [...prev];
      const loopIndex = next.findIndex((block) => block.id === loopBlockId);
      if (loopIndex === -1) {
        return prev;
      }
      const loopBlock = next[loopIndex];
      if (!loopBlock || loopBlock.type !== 'control_for_loop') {
        return prev;
      }
      if (loopBlock.loopCount === normalized) {
        return prev;
      }
      next[loopIndex] = { ...loopBlock, loopCount: normalized };
      return next;
    });
  }, []);

  const handleConditionSelect = useCallback((controlBlockId: string, conditionId: ScratchBlockId) => {
    if (!conditionBlockIdSet.has(conditionId)) {
      return;
    }
    setWorkspace((prev) => {
      const next = [...prev];
      const controlIndex = next.findIndex((block) => block.id === controlBlockId);
      if (controlIndex === -1) {
        return prev;
      }
      const controlBlock = next[controlIndex];
      if (!controlBlock || controlBlock.type !== 'control_if_goal') {
        return prev;
      }
      if (controlBlock.conditionId === conditionId) {
        return prev;
      }
      next[controlIndex] = { ...controlBlock, conditionId };
      return next;
    });
  }, []);

  const handleRun = useCallback(() => {
    if (!challenge) return;

    setIsRunning(true);
    setRunError('');

    const testCases = challenge.testCases ?? [];
    const results: TestResult[] = [];

    if (testCases.length === 0) {
      const single = runWorkspaceProgram(workspace, undefined, true);
      if (single.error) {
        results.push({ status: 'error', message: single.error, testCase: '-' });
        setRunError(single.error);
      } else if (single.state) {
        results.push({ status: 'success', message: '自由に動かせたね！', testCase: '-', state: single.state, trace: single.trace });
      }
    } else {
      testCases.forEach((testCase, index) => {
        const overrides =
          Array.isArray(testCase.input) && testCase.input.length > 0
            ? (testCase.input[0] as Partial<ScratchState>)
            : undefined;
        const outcome = runWorkspaceProgram(workspace, overrides, true);
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
            trace: outcome.trace,
          });
        }
      });
    }

    const firstError = results.find((item) => item.status === 'error');
    setRunError(firstError?.message ?? '');
    setTestResults(results);
    setSelectedResultIndex(0);
    setIsResultModalOpen(true);
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
  const indentStyleForLevel = useCallback(
    (level: number): CSSProperties => ({
      marginLeft: `${level * INDENT_UNIT_REM}rem`,
    }),
    []
  );

  const renderDropGuide = (index: number) => {
    if (!showDropGuides) {
      return null;
    }
    const shouldHideGuide = dragPreview?.source === 'workspace' && dragIndex !== null && index === dragIndex;
    if (shouldHideGuide) {
      return null;
    }
    const isActive = hoverIndex === index;
    const indentLevel = slotIndentLevels[index] ?? 0;
    return (
      <div
        key={`placeholder-${index}`}
        className={`workspace-drop-placeholder ${isActive ? 'workspace-drop-placeholder--active' : 'workspace-drop-placeholder--inactive'}`}
        style={indentStyleForLevel(indentLevel)}
      >
        <span>ここにブロックを置く</span>
      </div>
    );
  };

  const resolvedSelectedIndex = testResults.length > 0
    ? Math.min(selectedResultIndex, testResults.length - 1)
    : 0;
  const selectedResult = testResults[resolvedSelectedIndex] ?? null;
  const activeTrace = selectedResult?.trace ?? [];
  const hasTrace = activeTrace.length > 0;
  const animatedState = hasTrace ? activeTrace[Math.min(replayIndex, activeTrace.length - 1)] : null;
  const selectedState = animatedState ?? selectedResult?.state;
  const stageCatX = selectedState ? Math.max(-200, Math.min(400, selectedState.x * 40)) : 0;
  const stageCatY = selectedState ? Math.max(-200, Math.min(200, -selectedState.jumpCount * 20)) : 0;
  const stageSpeech = selectedState && selectedState.messages.length > 0
    ? selectedState.messages[selectedState.messages.length - 1]
    : '';
  const goalX = CONTROL_GOAL_TARGET_X * 40;
  const selectedStatus = selectedResult?.status ?? null;
  const statusTone =
    selectedStatus === 'success'
      ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', label: '成功' }
      : selectedStatus === 'failure'
        ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: '要チェック' }
        : selectedStatus === 'error'
          ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: 'エラー' }
          : null;

  useEffect(() => {
    if (!hasTrace) {
      setReplayIndex(0);
      setIsReplaying(false);
      return;
    }
    setReplayIndex(0);
    setIsReplaying(true);
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= activeTrace.length) {
        window.clearInterval(timer);
        setIsReplaying(false);
        return;
      }
      setReplayIndex(current);
    }, 400);
    return () => {
      window.clearInterval(timer);
    };
  }, [hasTrace, activeTrace]);

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
                <div className="flex flex-col gap-2 mb-3">
                  {aiGenerating ? (
                    <div className="flex items-center gap-3 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" aria-hidden />
                      <span className="font-semibold">AIがブロックを生成中...</span>
                      <div className="flex-1 h-1 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-indigo-400 animate-pulse" />
                      </div>
                    </div>
                  ) : null}
                  {aiGenerateError ? (
                    <div className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                      {aiGenerateError}
                    </div>
                  ) : null}
                </div>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`w-full inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 text-lg font-bold shadow transition-transform run-button-highlight ${
                      isRunning
                        ? 'bg-slate-400 cursor-wait'
                        : 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 hover:from-rose-600 hover:via-red-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-rose-300'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        実行中...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        テストを実行
                      </>
                    )}
                  </button>
                </div>
                <div
                  ref={workspaceAreaRef}
                  className={workspaceAreaClass}
                >
                    {workspace.length === 0 ? (
                      aiGenerating ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((key) => (
                            <div
                              key={key}
                              className="h-12 w-full rounded-lg bg-white/80 border border-slate-200 shadow-sm animate-pulse"
                              style={{ minWidth: '320px' }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`workspace-drop-empty ${isDraggingBlock ? 'workspace-drop-empty--active' : ''}`}
                        >
                          <PlayCircle className="w-6 h-6" />
                          <p className="font-semibold">ここにブロックをドロップ！</p>
                          <p className="text-xs opacity-80">左のパレットからドラッグしてみよう</p>
                        </div>
                      )
                    ) : (
                      <>
                        {renderDropGuide(0)}
                        {workspace.map((block, index) => {
                          if (isControlEndBlock(block.type)) {
                            const indentLevel = blockIndentMap.get(block.id) ?? 0;
                            const slotStyle = indentStyleForLevel(indentLevel);
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
                                  className="workspace-slot workspace-slot--virtual-end"
                                  style={slotStyle}
                                  aria-hidden
                                >
                                  <div className="workspace-slot__rail">
                                    <span className="workspace-slot__dot" aria-hidden />
                                  </div>
                                </div>
                                {renderDropGuide(index + 1)}
                              </Fragment>
                            );
                          }
                          const paletteBlock = paletteItems.find((item) => item.id === block.type);
                          const background = paletteBlock?.color ?? '#94a3b8';
                          const isDragging = dragIndex === index;
                          const isSlotActive = hoverIndex === index && dragIndex === index;
                          const label = blockLabel(block);
                          const indentLevel = blockIndentMap.get(block.id) ?? 0;
                          const isControlStart = isControlStartBlock(block.type);
                          const isIfBlock = block.type === 'control_if_goal';
                          const isForBlock = block.type === 'control_for_loop';
                          const loopCount = isForBlock ? normalizeLoopCount(block.loopCount) : undefined;
                          const slotStyle = indentStyleForLevel(indentLevel);
                          const blockClassName = [
                            'workspace-block',
                            isDragging ? 'workspace-block--dragging' : '',
                            isControlStart ? 'workspace-block--control-start' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');
                          const blockStyle: CSSProperties = {
                            backgroundColor: background,
                          };
                          const selectedConditionId = isIfBlock ? block.conditionId ?? '' : '';

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
                                style={slotStyle}
                              >
                                <div className="workspace-slot__rail">
                                  <span className="workspace-slot__dot" aria-hidden />
                                </div>
                                <div
                                  onPointerDown={(event) => handleWorkspacePointerDown(event, index)}
                                  className={blockClassName}
                                  style={blockStyle}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    {isIfBlock ? (
                                      <div className="workspace-condition-control">
                                        <span className="workspace-condition-text">もし</span>
                                        <div className="workspace-condition-select-wrapper">
                                          <select
                                            className="workspace-condition-select"
                                            value={selectedConditionId}
                                            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                              handleConditionSelect(block.id, event.target.value as ScratchBlockId);
                                            }}
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onMouseDown={(event) => event.stopPropagation()}
                                          >
                                            <option value="" disabled>
                                              条件を選ぶ
                                            </option>
                                            {conditionPaletteItems.map((item) => (
                                              <option key={item.id} value={item.id}>
                                                {item.label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <span className="workspace-condition-text">なら</span>
                                      </div>
                                    ) : isForBlock ? (
                                      <div className="workspace-loop-control">
                                        <span className="workspace-loop-text">for</span>
                                        <input
                                          type="number"
                                          min={MIN_CONTROL_FOR_LOOP_COUNT}
                                          max={MAX_CONTROL_FOR_LOOP_COUNT}
                                          step={1}
                                          className="workspace-loop-input"
                                          value={loopCount ?? DEFAULT_CONTROL_FOR_LOOP_COUNT}
                                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                            handleLoopCountChange(block.id, event.target.value);
                                          }}
                                          onPointerDown={(event) => event.stopPropagation()}
                                          onMouseDown={(event) => event.stopPropagation()}
                                          aria-label="for文のくり返し回数"
                                        />
                                        <span className="workspace-loop-text">回くり返す</span>
                                      </div>
                                    ) : (
                                      <span className="tracking-wide font-semibold">{label}</span>
                                    )}
                                    <span className="text-[10px] text-white/80 uppercase tracking-wide">{paletteBlock?.group ?? 'ブロック'}</span>
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
      <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">テスト結果</h3>
          </div>
        </div>
        {runError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-3">
            {runError}
          </div>
        )}
        {selectedResult && statusTone && (
          <div className={`rounded-xl border px-4 py-3 text-sm mb-3 ${statusTone.bg} ${statusTone.border} ${statusTone.text}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide">テスト {selectedResult.testCase}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/70">{statusTone.label}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{selectedResult.message}</p>
          </div>
        )}
        {selectedResult?.state && (
          <div className="stage-preview mb-3">
            <div className="stage-preview__scene">
              <div className="stage-preview__sky" aria-hidden />
              <div className="stage-preview__grid" aria-hidden />
              <div className="stage-preview__ground" aria-hidden />
              <div
                className="stage-preview__goal"
                style={{ '--goal-x': `${goalX}px` } as CSSProperties}
              >
                <span className="stage-preview__goal-label">GOAL</span>
              </div>
              {isReplaying && (
                <div className="absolute top-2 right-2 text-[11px] font-semibold text-indigo-900 bg-white/80 px-2 py-1 rounded-full shadow">
                  再生中...
                </div>
              )}
              <div
                className="stage-preview__cat"
                style={{ '--cat-x': `${stageCatX}px`, '--cat-y': `${stageCatY}px` } as CSSProperties}
              >
                <img src={stageCharacterImg} alt="ステージキャラクター" />
                {stageSpeech && (
                  <div className="stage-preview__speech">
                    <span>{stageSpeech}</span>
                  </div>
                )}
              </div>
            </div>
            <dl className="stage-preview__stats">
              <div><dt>右に進んだ回数</dt><dd>{selectedState?.x ?? 0}</dd></div>
              <div><dt>ジャンプした回数</dt><dd>{selectedState?.jumpCount ?? 0}</dd></div>
            </dl>
            <p className="mt-2 text-[11px] text-slate-600">
              右はブロックで進んだ回数、ジャンプは「ジャンプする」を使った回数だよ。回数をそろえてゴールを目指そう。
            </p>
          </div>
        )}
        {testResults.length > 0 && (
          <ul className="space-y-3 max-h-60 overflow-y-auto">
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
        {testResults.length === 0 && !runError && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            実行ボタンを押してブロックの動きをチェックしよう！
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChallengeEditor;
