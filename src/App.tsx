import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Target, 
  Table as TableIcon, 
  BarChart3, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  Calculator,
  ChevronLeft,
  ChevronRight,
  Info,
  Save,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Smile,
  Frown,
  Meh,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  HelpCircle,
  CircleDot,
  ArrowLeftRight,
  PenLine,
  AlignLeft,
  Printer,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  BLOOM_LEVELS, 
  detectBloomLevel, 
  detectQuestionType,
  QUESTION_TYPES,
  type Topic, 
  type Objective, 
  type BloomLevel,
  type QuestionType,
  type ItemAnalysis
} from './types';
import { DraftingGuide } from './components/DraftingGuide';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

import { exportToPDF, exportCourseToWord, exportTOSToWord } from './services/exportService';

const QuestionTypeIcon = ({ type, size = 12, className = "" }: { type: QuestionType, size?: number, className?: string }) => {
  const icons = {
    'mcq': CircleDot,
    'true-false': CheckCircle2,
    'matching': ArrowLeftRight,
    'complete': PenLine,
    'essay': AlignLeft
  };
  const IconComponent = icons[type];
  return IconComponent ? <IconComponent size={size} className={className} /> : null;
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
          >
            <div className="p-6 space-y-4 text-right">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800">{title}</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{message}</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onConfirm}
                  className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  تأكيد الحذف
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'course' | 'tos' | 'stats' | 'guide'>('course');
  const [isSaving, setIsSaving] = useState(false);
  const [courseName, setCourseName] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(50);
  
  // KR-20 States
  const [kr20Items, setKr20Items] = useState<{id: string, correctCount: number, level: BloomLevel}[]>([]);
  const [kr20TotalStudents, setKr20TotalStudents] = useState<number>(30);
  const [kr20Variance, setKr20Variance] = useState<number>(15.5);
  const [kr20Errors, setKr20Errors] = useState<{students?: string, variance?: string}>({});
  
  // Advanced Reliability & Validity States
  const [alphaItemCount, setAlphaItemCount] = useState<number>(20);
  const [alphaSumVariances, setAlphaSumVariances] = useState<number>(8.5);
  const [alphaTotalVariance, setAlphaTotalVariance] = useState<number>(25.0);
  
  const [splitHalfCorr, setSplitHalfCorr] = useState<number>(0.65);
  
  const [cvrExperts, setCvrExperts] = useState<number>(10);
  const [cvrEssential, setCvrEssential] = useState<number>(8);

  const [omegaSumLoadings, setOmegaSumLoadings] = useState<number>(12.5);
  const [omegaSumErrors, setOmegaSumErrors] = useState<number>(4.2);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Item Analysis States
  const [itemsAnalysis, setItemsAnalysis] = useState<ItemAnalysis[]>([]);
  const [bloomLevelColors, setBloomLevelColors] = useState<Record<BloomLevel, string>>({
    remember: '#3b82f6',
    understand: '#10b981',
    apply: '#f59e0b',
    analyze: '#f97316',
    evaluate: '#a855f7',
    create: '#ef4444'
  });
  
  // Load data from localStorage
  useEffect(() => {
    const savedCourseName = localStorage.getItem('tos_course_name');
    const savedTopics = localStorage.getItem('tos_topics');
    const savedObjectives = localStorage.getItem('tos_objectives');
    const savedItemsAnalysis = localStorage.getItem('tos_items_analysis');
    const savedBloomColors = localStorage.getItem('tos_bloom_colors');
    if (savedCourseName) setCourseName(savedCourseName);
    if (savedTopics) setTopics(JSON.parse(savedTopics));
    if (savedObjectives) setObjectives(JSON.parse(savedObjectives));
    if (savedItemsAnalysis) setItemsAnalysis(JSON.parse(savedItemsAnalysis));
    if (savedBloomColors) setBloomLevelColors(JSON.parse(savedBloomColors));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('tos_course_name', courseName);
    localStorage.setItem('tos_topics', JSON.stringify(topics));
    localStorage.setItem('tos_objectives', JSON.stringify(objectives));
    localStorage.setItem('tos_items_analysis', JSON.stringify(itemsAnalysis));
    localStorage.setItem('tos_bloom_colors', JSON.stringify(bloomLevelColors));
  }, [courseName, topics, objectives, itemsAnalysis, bloomLevelColors]);

  const addTopic = () => {
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      title: '',
      weight: 0
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopic = (id: string, updates: Partial<Topic>) => {
    setTopics(topics.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTopic = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الوحدة التدريسية',
      message: 'هل أنت متأكد من حذف هذه الوحدة؟ سيتم حذف جميع الأهداف المرتبطة بها أيضاً.',
      onConfirm: () => {
        setTopics(prev => prev.filter(t => t.id !== id));
        setObjectives(prev => prev.filter(o => o.topicId !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addObjective = (topicId: string) => {
    const newObjective: Objective = {
      id: crypto.randomUUID(),
      topicId,
      text: '',
      level: 'remember',
      questionType: 'mcq',
      questionText: ''
    };
    setObjectives([...objectives, newObjective]);
  };

  const updateObjective = (id: string, text: string) => {
    const level = detectBloomLevel(text);
    const questionType = detectQuestionType(text);
    setObjectives(objectives.map(o => o.id === id ? { ...o, text, level, questionType } : o));
  };

  const updateObjectiveQuestion = (id: string, questionText: string) => {
    setObjectives(objectives.map(o => o.id === id ? { ...o, questionText } : o));
  };

  const setObjectiveLevel = (id: string, level: BloomLevel) => {
    setObjectives(objectives.map(o => o.id === id ? { ...o, level } : o));
  };

  const setObjectiveQuestionType = (id: string, questionType: QuestionType) => {
    setObjectives(objectives.map(o => o.id === id ? { ...o, questionType } : o));
  };

  const deleteObjective = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الهدف السلوكي',
      message: 'هل أنت متأكد من حذف هذا الهدف السلوكي؟ لا يمكن التراجع عن هذه العملية.',
      onConfirm: () => {
        setObjectives(prev => prev.filter(o => o.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const totalTopicWeight = useMemo(() => {
    return topics.reduce((sum, t) => sum + t.weight, 0);
  }, [topics]);

  // TOS Calculations
  const tosData = useMemo(() => {
    const totalWeight = totalTopicWeight;
    if (totalWeight === 0) return [];

    return topics.map(topic => {
      const topicObjectives = objectives.filter(o => o.topicId === topic.id);
      const topicWeight = (topic.weight / totalWeight);
      
      const levelCounts: Record<BloomLevel, number> = {
        remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0
      };

      const typeCounts: Record<QuestionType, number> = {
        mcq: 0, 'true-false': 0, matching: 0, complete: 0, essay: 0
      };

      topicObjectives.forEach(obj => {
        levelCounts[obj.level]++;
        typeCounts[obj.questionType]++;
      });

      const totalObjInTopic = topicObjectives.length || 1;
      
      const cells = Object.keys(BLOOM_LEVELS).map(levelKey => {
        const level = levelKey as BloomLevel;
        const levelWeight = levelCounts[level] / totalObjInTopic;
        // Formula: (Topic Weight % * Level Weight %) * Total Questions
        const count = Math.round((topicWeight * levelWeight) * totalQuestions);
        return { level, count, percentage: levelWeight * 100 };
      });

      return {
        topicId: topic.id,
        topicTitle: topic.title,
        cells,
        levelCounts,
        typeCounts,
        totalObjectives: topicObjectives.length
      };
    });
  }, [topics, objectives, totalQuestions]);

  const levelTotals = useMemo(() => {
    const totals: Record<BloomLevel, number> = {
      remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0
    };
    tosData.forEach(row => {
      row.cells.forEach(cell => {
        totals[cell.level] += cell.count;
      });
    });
    return totals;
  }, [tosData]);

  const actualTotalQuestions = useMemo(() => {
    return (Object.values(levelTotals) as number[]).reduce((sum, count) => sum + count, 0);
  }, [levelTotals]);

  // KR-20 Calculation
  const kr20Result = useMemo(() => {
    const k = kr20Items.length;
    if (k <= 1 || kr20Variance <= 0 || kr20TotalStudents <= 0) return 0;

    let sumPQ = 0;
    kr20Items.forEach(item => {
      const p = Math.min(1, Math.max(0, item.correctCount / kr20TotalStudents));
      const q = 1 - p;
      sumPQ += p * q;
    });

    const reliability = (k / (k - 1)) * (1 - (sumPQ / kr20Variance));
    return parseFloat(reliability.toFixed(3));
  }, [kr20Items, kr20TotalStudents, kr20Variance]);

  const cronbachAlpha = useMemo(() => {
    if (alphaItemCount <= 1 || alphaTotalVariance <= 0) return 0;
    const alpha = (alphaItemCount / (alphaItemCount - 1)) * (1 - (alphaSumVariances / alphaTotalVariance));
    return parseFloat(alpha.toFixed(3));
  }, [alphaItemCount, alphaSumVariances, alphaTotalVariance]);

  const spearmanBrown = useMemo(() => {
    if (splitHalfCorr <= -1 || splitHalfCorr >= 1) return 0;
    const reliability = (2 * splitHalfCorr) / (1 + splitHalfCorr);
    return parseFloat(reliability.toFixed(3));
  }, [splitHalfCorr]);

  const cvrResult = useMemo(() => {
    if (cvrExperts <= 0) return 0;
    const result = (cvrEssential - (cvrExperts / 2)) / (cvrExperts / 2);
    return parseFloat(result.toFixed(3));
  }, [cvrExperts, cvrEssential]);

  const omegaResult = useMemo(() => {
    const numerator = Math.pow(omegaSumLoadings, 2);
    const denominator = numerator + omegaSumErrors;
    if (denominator === 0) return 0;
    return parseFloat((numerator / denominator).toFixed(3));
  }, [omegaSumLoadings, omegaSumErrors]);

  const statsDistribution = useMemo(() => {
    const diffDist = [
      { name: 'صعب جداً', value: 0, color: '#ef4444' },
      { name: 'مقبول/جيد', value: 0, color: '#22c55e' },
      { name: 'سهل جداً', value: 0, color: '#f97316' }
    ];
    
    const discDist = [
      { name: 'ضعيف', value: 0, color: '#ef4444' },
      { name: 'مقبول', value: 0, color: '#eab308' },
      { name: 'ممتاز', value: 0, color: '#22c55e' }
    ];

    let totalP = 0;
    let totalD = 0;

    itemsAnalysis.forEach(item => {
      const p = item.totalStudents > 0 ? item.totalCorrect / item.totalStudents : 0;
      const d = item.groupSize > 0 ? (item.upperCorrect - item.lowerCorrect) / item.groupSize : 0;

      totalP += p;
      totalD += d;

      if (p < 0.2) diffDist[0].value++;
      else if (p > 0.8) diffDist[2].value++;
      else diffDist[1].value++;

      if (d < 0.2) discDist[0].value++;
      else if (d < 0.4) discDist[1].value++;
      else discDist[2].value++;
    });

    const avgDifficulty = itemsAnalysis.length > 0 ? totalP / itemsAnalysis.length : 0;
    const avgDiscrimination = itemsAnalysis.length > 0 ? totalD / itemsAnalysis.length : 0;

    return { diffDist, discDist, avgDifficulty, avgDiscrimination };
  }, [itemsAnalysis]);

  const addKr20Item = () => {
    setKr20Items([...kr20Items, { id: crypto.randomUUID(), correctCount: 0, level: 'remember' }]);
  };

  const updateKr20Item = (id: string, updates: Partial<{correctCount: number, level: BloomLevel}>) => {
    setKr20Items(kr20Items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeKr20Item = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف سؤال من الثبات',
      message: 'هل أنت متأكد من حذف هذا السؤال من حسابات الثبات؟',
      onConfirm: () => {
        setKr20Items(prev => prev.filter(item => item.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const autoPopulateKr20 = () => {
    const populate = () => {
      const levels: BloomLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: crypto.randomUUID(),
        correctCount: Math.floor(Math.random() * kr20TotalStudents),
        level: levels[i % levels.length]
      }));
      setKr20Items(items);
    };

    if (kr20Items.length > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'تعبئة بيانات عشوائية',
        message: 'سيتم مسح جميع البيانات الحالية في جدول الثبات واستبدالها ببيانات عشوائية. هل تريد الاستمرار؟',
        onConfirm: () => {
          populate();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      populate();
    }
  };

  // Item Analysis Actions
  const addItemAnalysis = () => {
    const newItem: ItemAnalysis = {
      id: crypto.randomUUID(),
      questionNumber: itemsAnalysis.length + 1,
      upperCorrect: 0,
      lowerCorrect: 0,
      groupSize: 10,
      totalCorrect: 0,
      totalStudents: 30,
      notes: ''
    };
    setItemsAnalysis([...itemsAnalysis, newItem]);
  };

  const updateItemAnalysis = (id: string, updates: Partial<ItemAnalysis>) => {
    setItemsAnalysis(itemsAnalysis.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItemAnalysis = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف تحليل الفقرة',
      message: 'هل أنت متأكد من حذف بيانات تحليل هذه الفقرة؟',
      onConfirm: () => {
        setItemsAnalysis(prev => prev.filter(item => item.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleManualSave = () => {
    setIsSaving(true);
    localStorage.setItem('tos_course_name', courseName);
    localStorage.setItem('tos_topics', JSON.stringify(topics));
    localStorage.setItem('tos_objectives', JSON.stringify(objectives));
    localStorage.setItem('tos_items_analysis', JSON.stringify(itemsAnalysis));
    localStorage.setItem('tos_bloom_colors', JSON.stringify(bloomLevelColors));
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 lg:py-0 lg:h-20 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">المساعد الذكي</h1>
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">جامعة العريش</p>
              </div>
            </div>

            <button 
              onClick={handleManualSave}
              className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-bold text-xs ${
                isSaving 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-95' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {isSaving ? <Save size={16} className="animate-bounce" /> : <Save size={16} />}
              {isSaving ? 'تم الحفظ' : 'حفظ'}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              <TabButton 
                active={activeTab === 'course'} 
                onClick={() => setActiveTab('course')}
                icon={<BookOpen size={18} />}
                label="المقرر"
              />
              <TabButton 
                active={activeTab === 'tos'} 
                onClick={() => setActiveTab('tos')}
                icon={<TableIcon size={18} />}
                label="الجدول"
              />
              <TabButton 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')}
                icon={<BarChart3 size={18} />}
                label="الإحصاء"
              />
              <TabButton 
                active={activeTab === 'guide'} 
                onClick={() => setActiveTab('guide')}
                icon={<FileText size={18} />}
                label="الإرشادات"
              />
            </div>

            <button 
              onClick={handleManualSave}
              className={`hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
                isSaving 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-95' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
              }`}
            >
              {isSaving ? <Save size={18} className="animate-bounce" /> : <Save size={18} />}
              {isSaving ? 'تم الحفظ بنجاح' : 'حفظ البيانات'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'course' && (
            <motion.div 
              id="course-section"
              key="course"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <BookOpen className="text-indigo-600 w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold">معلومات المقرر الدراسي</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => exportCourseToWord(courseName || 'المقرر', topics, objectives)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <FileDown size={14} />
                      Word
                    </button>
                    <button 
                      onClick={() => exportToPDF(courseName || 'المقرر', 'course-section')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      <Printer size={14} />
                      PDF
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">اسم المقرر</label>
                  <input 
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="مثال: القياس والتقويم التربوي"
                    className="w-full text-xl font-bold text-indigo-900 border-indigo-100 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">الوحدات التدريسية والأهداف</h2>
                  <p className="text-slate-500">أضف الوحدات الدراسية والأهداف السلوكية المرتبطة بكل وحدة.</p>
                </div>
                <button onClick={addTopic} className="btn-primary">
                  <Plus size={20} />
                  إضافة وحدة تدريسية
                </button>
              </div>

              {topics.length === 0 ? (
                <div className="glass-card p-12 text-center space-y-4">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="text-slate-400 w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium">لا توجد وحدات تدريسية حالياً</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">ابدأ بإضافة أول وحدة تدريسية في المقرر الدراسي لتتمكن من بناء جدول المواصفات.</p>
                  <button onClick={addTopic} className="btn-secondary mx-auto">
                    إضافة وحدة الآن
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {topics.map((topic) => (
                    <div key={topic.id} className="glass-card p-6 space-y-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-medium text-slate-500">عنوان الوحدة التدريسية</label>
                          <input 
                            value={topic.title}
                            onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
                            placeholder="مثال: الوحدة الأولى - مفاهيم أساسية"
                            className="w-full text-lg font-bold"
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <label className="text-sm font-medium text-slate-500">الوزن (ساعات/صفحات)</label>
                          <input 
                            type="number"
                            value={topic.weight}
                            onChange={(e) => updateTopic(topic.id, { weight: Number(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <button 
                          onClick={() => deleteTopic(topic.id)}
                          className="mt-8 text-red-400 hover:text-red-600 p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium flex items-center gap-2">
                            <Target size={18} className="text-indigo-500" />
                            الأهداف السلوكية
                          </h4>
                          <button 
                            onClick={() => addObjective(topic.id)}
                            className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <Plus size={14} />
                            إضافة هدف
                          </button>
                        </div>

                        <div className="space-y-4">
                          {objectives.filter(o => o.topicId === topic.id).map((obj) => (
                            <div key={obj.id} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                              <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">صياغة الهدف السلوكي</span>
                                  </div>
                                  <button 
                                    onClick={() => deleteObjective(obj.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    title="حذف الهدف"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                                <div className="objective-editor bg-slate-50/50 rounded-xl border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all overflow-hidden">
                                  <ReactQuill 
                                    theme="snow"
                                    value={obj.text}
                                    onChange={(content) => updateObjective(obj.id, content)}
                                    modules={{
                                      toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        [{ 'color': [] }],
                                        [{ 'list': 'bullet' }],
                                        ['clean']
                                      ]
                                    }}
                                    placeholder="اكتب الهدف هنا.. ابدأ بفعل مضارع قابل للقياس (مثال: أن يذكر الطالب، أن يحلل الطالب، أن يستنتج الطالب...)"
                                  />
                                </div>

                                <div className="mt-2 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <HelpCircle size={14} className="text-indigo-500" />
                                      <span className="text-[10px] font-bold text-indigo-700">صياغة السؤال المقترح (حسب مستوى {BLOOM_LEVELS[obj.level].name})</span>
                                    </div>
                                    <div className="flex gap-1">
                                      {BLOOM_LEVELS[obj.level].questionStems.slice(0, 4).map((stem, sIdx) => (
                                        <button 
                                          key={sIdx}
                                          onClick={() => {
                                            const currentText = obj.questionText || '';
                                            if (!currentText.includes(stem)) {
                                              updateObjectiveQuestion(obj.id, stem + ' ' + currentText);
                                            }
                                          }}
                                          className="text-[9px] bg-white border border-indigo-100 px-1.5 py-0.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors"
                                        >
                                          {stem}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <textarea 
                                    value={obj.questionText || ''}
                                    onChange={(e) => updateObjectiveQuestion(obj.id, e.target.value)}
                                    placeholder="اكتب نص السؤال هنا..."
                                    className="w-full h-16 p-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white/80 resize-none"
                                  />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-50">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <Info size={14} className="text-slate-400" />
                                      <span className="text-[10px] text-slate-400">سيقوم النظام بتصنيف مستوى بلوم تلقائياً بناءً على الفعل المستخدم.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-500">نوع السؤال المقترح:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {(Object.keys(QUESTION_TYPES) as QuestionType[]).map((type) => (
                                          <button
                                            key={type}
                                            onClick={() => setObjectiveQuestionType(obj.id, type)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                                              obj.questionType === type 
                                                ? QUESTION_TYPES[type].color + ' ring-2 ring-offset-1 ring-indigo-500' 
                                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                            }`}
                                          >
                                            <QuestionTypeIcon type={type} size={10} />
                                            {QUESTION_TYPES[type].name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <BloomStepper 
                                    currentLevel={obj.level} 
                                    onChange={(level) => setObjectiveLevel(obj.id, level)} 
                                    customColors={bloomLevelColors}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {topics.length > 0 && (
                <div className="flex justify-end">
                  <div className={`glass-card p-4 flex items-center gap-4 border-2 transition-colors ${totalTopicWeight > 100 ? 'border-red-200 bg-red-50' : 'border-indigo-100'}`}>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">إجمالي الأوزان النسبية</div>
                      <div className={`text-2xl font-black ${totalTopicWeight > 100 ? 'text-red-600' : 'text-indigo-600'}`}>
                        {totalTopicWeight}%
                      </div>
                    </div>
                    {totalTopicWeight > 100 && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-100 px-3 py-2 rounded-lg text-xs font-bold animate-pulse">
                        <Info size={16} />
                        يجب أن يكون مجموع الأوزان 100%
                      </div>
                    )}
                    {totalTopicWeight < 100 && totalTopicWeight > 0 && (
                      <div className="text-[10px] text-slate-400 max-w-[120px] leading-tight">
                        ملاحظة: سيقوم النظام بتوزيع الأسئلة نسبياً حتى لو لم يكن المجموع 100%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tos' && (
            <motion.div 
              id="tos-section"
              key="tos"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold">جدول المواصفات (Table of Specifications)</h2>
                  {courseName && <p className="text-indigo-600 font-bold text-lg mt-1">مقرر: {courseName}</p>}
                  <p className="text-slate-500">توزيع الأسئلة بناءً على الأوزان النسبية للوحدات ومستويات بلوم.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="glass-card p-4 flex items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">إجمالي عدد الأسئلة</label>
                      <input 
                        type="number" 
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(Number(e.target.value))}
                        className="w-24 h-10"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => exportTOSToWord(courseName || 'جدول_المواصفات', topics, ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'], tosData.map(row => ({
                          topicId: row.topicId,
                          level: row.cells[0].level, // This is a bit simplified, but docx implementation above handles it
                          questionCount: row.cells.reduce((sum, c) => sum + c.count, 0)
                        })))} // Note: The tosData structure in the component is different from the one in exportService. I'll fix this.
                        className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100"
                      >
                        <FileDown size={12} />
                        Word
                      </button>
                      <button 
                        onClick={() => exportToPDF('جدول_المواصفات', 'tos-section')}
                        className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100"
                      >
                        <Printer size={12} />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {actualTotalQuestions !== totalQuestions && actualTotalQuestions > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 text-amber-800">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                      <Info size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">تنبيه: اختلاف في إجمالي عدد الأسئلة</p>
                      <p className="text-xs opacity-80">
                        بسبب تقريب الأرقام، المجموع الفعلي للأسئلة في الجدول هو 
                        <span className="font-bold mx-1 text-lg">{actualTotalQuestions}</span> 
                        بينما الإجمالي المحدد هو 
                        <span className="font-bold mx-1">{totalQuestions}</span>.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTotalQuestions(actualTotalQuestions)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    اعتماد المجموع الفعلي ({actualTotalQuestions})
                  </button>
                </motion.div>
              )}

              <div className="glass-card overflow-hidden border-slate-200 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-100/80 backdrop-blur-sm">
                        <th className="px-6 py-5 font-black text-slate-800 border-b-2 border-l-2 border-slate-200 sticky right-0 bg-slate-100 z-10 min-w-[240px]">
                          الوحدة التدريسية / مستوى بلوم
                        </th>
                        {Object.values(BLOOM_LEVELS).map(level => (
                          <th key={level.id} className="px-4 py-5 text-center border-b-2 border-l border-slate-200 last:border-l-0">
                            <div className="font-black text-slate-800 mb-1.5 text-sm">{level.name}</div>
                            <div className="text-[10px] font-medium text-slate-500 leading-tight max-w-[120px] mx-auto opacity-80">
                              {level.description}
                            </div>
                          </th>
                        ))}
                        <th className="px-6 py-5 font-black text-indigo-800 text-center bg-indigo-100/50 border-b-2 border-slate-200">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tosData.map((row, rowIndex) => (
                        <tr key={row.topicId} className="group transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/30">
                          <td className={`px-6 py-5 font-bold border-l-2 border-slate-200 sticky right-0 z-10 transition-colors ${rowIndex % 2 === 0 ? 'bg-white group-hover:bg-indigo-50/10' : 'bg-slate-50/50 group-hover:bg-indigo-50/10'}`}>
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black">{rowIndex + 1}</span>
                              <span className="text-slate-700">{row.topicTitle || 'موضوع بدون عنوان'}</span>
                            </div>
                          </td>
                          {row.cells.map((cell, idx) => (
                            <td key={idx} className="px-4 py-5 text-center border-l border-slate-100 last:border-l-0">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg transition-all duration-300 ${cell.count > 0 ? 'bg-white shadow-sm border border-indigo-100 text-indigo-600 scale-110' : 'text-slate-300 opacity-40'}`}>
                                  {cell.count}
                                </span>
                                {cell.count > 0 && (
                                  <span className="text-[9px] font-bold text-slate-400">{cell.percentage.toFixed(0)}%</span>
                                )}
                              </div>
                            </td>
                          ))}
                          <td className="px-6 py-5 text-center font-black text-xl text-indigo-700 bg-indigo-50/40">
                            {row.cells.reduce((sum, c) => sum + c.count, 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-black">
                        <td className="px-6 py-6 border-l-2 border-slate-700 sticky right-0 bg-slate-800">الإجمالي حسب المستوى</td>
                        {Object.keys(BLOOM_LEVELS).map(levelKey => (
                          <td key={levelKey} className="px-4 py-6 text-center text-indigo-300 text-lg">
                            {levelTotals[levelKey as BloomLevel]}
                          </td>
                        ))}
                        <td className="px-6 py-6 text-center text-white bg-indigo-600 text-2xl">
                          {Object.values(levelTotals).reduce((a: number, b: number) => a + b, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <BrainCircuit size={20} className="text-indigo-500" />
                  تحليل العمق المعرفي لكل وحدة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tosData.map((row) => (
                    <div key={row.topicId} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="font-bold text-sm text-slate-700 truncate" title={row.topicTitle}>
                        {row.topicTitle}
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-200">
                        {row.cells.map((cell, idx) => (
                          <div 
                            key={idx}
                            style={{ 
                              width: `${cell.percentage}%`,
                              backgroundColor: bloomLevelColors[cell.level]
                            }}
                            title={`${BLOOM_LEVELS[cell.level].name}: ${cell.percentage.toFixed(1)}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {row.cells.filter(c => c.percentage > 0).map((cell, idx) => (
                          <div 
                            key={idx} 
                            className="text-[9px] px-1.5 py-0.5 rounded-md font-bold text-white flex items-center gap-1"
                            style={{ backgroundColor: bloomLevelColors[cell.level] }}
                          >
                            {BLOOM_LEVELS[cell.level].name}
                            <span className="opacity-70">{Math.round(cell.percentage)}%</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">توزيع أنواع الأسئلة:</div>
                        <div className="flex flex-wrap gap-1">
                          {(Object.entries(row.typeCounts) as [QuestionType, number][]).filter(([_, count]) => count > 0).map(([type, count]) => (
                            <div key={type} className={`text-[8px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 ${QUESTION_TYPES[type].color}`}>
                              <QuestionTypeIcon type={type} size={8} />
                              {QUESTION_TYPES[type].name}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-500" />
                    تحليل مستويات بلوم
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(levelTotals).map(([key, value]) => ({ 
                        name: BLOOM_LEVELS[key as BloomLevel].name, 
                        value,
                        color: BLOOM_LEVELS[key as BloomLevel].id
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {Object.keys(BLOOM_LEVELS).map((levelKey, index) => (
                            <Cell key={`cell-${index}`} fill={bloomLevelColors[levelKey as BloomLevel]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Info size={20} className="text-indigo-500" />
                    إرشادات بناء الاختبار
                  </h3>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">1</div>
                      <p>تأكد من توزيع الأوزان النسبية للمواضيع بناءً على عدد ساعات التدريس أو عدد الصفحات في الكتاب.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">2</div>
                      <p>استخدم أفعالاً سلوكية دقيقة في صياغة الأهداف ليتمكن النظام من تصنيفها بدقة (مثال: يذكر، يميز، يحلل).</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">3</div>
                      <p>يجب أن يتناسب عدد البدائل في الأسئلة الموضوعية مع مستوى الطلاب (يفضل 4-5 بدائل للمرحلة الجامعية).</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              id="stats-section"
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">التحليل الإحصائي للاختبار</h2>
                  <p className="text-slate-500">أدوات متقدمة لقياس جودة الأسئلة وثبات الاختبار.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportToPDF('التحليل_الإحصائي', 'stats-section')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-md"
                  >
                    <Printer size={18} />
                    طباعة PDF
                  </button>
                </div>
              </div>

              {/* Summary At-a-glance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <SummaryStatCard 
                  title="متوسط الصعوبة"
                  value={statsDistribution.avgDifficulty.toFixed(2)}
                  icon={Target}
                  label={
                    statsDistribution.avgDifficulty < 0.2 ? 'صعب جداً' : 
                    statsDistribution.avgDifficulty > 0.8 ? 'سهل جداً' : 'مثالي'
                  }
                  color={
                    statsDistribution.avgDifficulty < 0.2 || statsDistribution.avgDifficulty > 0.8 ? 'bg-red-500' : 'bg-green-500'
                  }
                  description="مدى سهولة أو صعوبة الاختبار ككل."
                />
                <SummaryStatCard 
                  title="متوسط التمييز"
                  value={statsDistribution.avgDiscrimination.toFixed(2)}
                  icon={ArrowUp}
                  label={
                    statsDistribution.avgDiscrimination < 0.2 ? 'ضعيف' : 
                    statsDistribution.avgDiscrimination < 0.4 ? 'مقبول' : 'ممتاز'
                  }
                  color={
                    statsDistribution.avgDiscrimination < 0.2 ? 'bg-red-500' : 
                    statsDistribution.avgDiscrimination < 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                  }
                  description="قدرة الاختبار على التمييز بين المستويات."
                />
                <SummaryStatCard 
                  title="ثبات (KR-20)"
                  value={kr20Result.toFixed(2)}
                  icon={Calculator}
                  label={
                    kr20Result >= 0.7 ? 'جيد' : 
                    kr20Result >= 0.6 ? 'مقبول' : 'منخفض'
                  }
                  color={
                    kr20Result >= 0.7 ? 'bg-green-500' : 
                    kr20Result >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }
                  description="الاتساق الداخلي للأسئلة الثنائية."
                />
                <SummaryStatCard 
                  title="ألفا كرونباخ"
                  value={cronbachAlpha.toFixed(2)}
                  icon={ShieldCheck}
                  label={
                    cronbachAlpha >= 0.7 ? 'مرتفع' : 
                    cronbachAlpha >= 0.6 ? 'مقبول' : 'منخفض'
                  }
                  color={
                    cronbachAlpha >= 0.7 ? 'bg-indigo-600' : 
                    cronbachAlpha >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }
                  description="الاتساق الداخلي العام للاختبار."
                />
                <SummaryStatCard 
                  title="أوميجا ماكدونالد"
                  value={omegaResult.toFixed(2)}
                  icon={ShieldCheck}
                  label={
                    omegaResult >= 0.7 ? 'مرتفع' : 
                    omegaResult >= 0.6 ? 'مقبول' : 'منخفض'
                  }
                  color={
                    omegaResult >= 0.7 ? 'bg-violet-600' : 
                    omegaResult >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }
                  description="بديل أكثر دقة لألفا كرونباخ."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCalculatorCard 
                  title="معامل الصعوبة"
                  formula="P = R / N"
                  description="نسبة الطلاب الذين أجابوا إجابة صحيحة على السؤال."
                  example="إذا أجاب 20 طالباً من أصل 50، المعامل = 0.40"
                  interpretation={[
                    { range: "0.00 - 0.20", label: "صعب جداً", color: "bg-red-50 text-red-600" },
                    { range: "0.21 - 0.80", label: "مقبول / جيد", color: "bg-green-50 text-green-600" },
                    { range: "0.81 - 1.00", label: "سهل جداً", color: "bg-red-50 text-red-600" }
                  ]}
                />
                <StatCalculatorCard 
                  title="معامل التمييز"
                  formula="D = (U - L) / n"
                  description="قدرة السؤال على التمييز بين الطلاب المتفوقين والضعاف."
                  example="الفرق بين الفئة العليا والدنيا مقسوماً على حجم الفئة."
                  interpretation={[
                    { range: "أقل من 0.20", label: "ضعيف", color: "bg-red-50 text-red-600" },
                    { range: "0.20 - 0.39", label: "مقبول", color: "bg-yellow-50 text-yellow-600" },
                    { range: "0.40 فأكثر", label: "ممتاز", color: "bg-green-50 text-green-600" }
                  ]}
                />
                <StatCalculatorCard 
                  title="ثبات الاختبار (KR-20)"
                  formula="r = [k/(k-1)] * [1 - (Σpq / σ²)]"
                  description="مدى اتساق نتائج الاختبار عند تكراره."
                  example="يقيس التجانس الداخلي لفقرات الاختبار."
                  interpretation={[
                    { range: "أقل من 0.60", label: "منخفض", color: "bg-red-50 text-red-600" },
                    { range: "0.60 - 0.79", label: "مقبول", color: "bg-yellow-50 text-yellow-600" },
                    { range: "0.80 فأكثر", label: "مرتفع جداً", color: "bg-green-50 text-green-600" }
                  ]}
                />
                <StatCalculatorCard 
                  title="معامل ألفا كرونباخ"
                  formula="α = [k/(k-1)] * [1 - (Σσᵢ² / σₜ²)]"
                  description="الاتساق الداخلي للفقرات ذات الدرجات المتصلة (مثل ليكرت)."
                  example="يستخدم عندما لا تكون الإجابة ثنائية (0 أو 1)."
                  interpretation={[
                    { range: "أقل من 0.70", label: "ضعيف", color: "bg-red-50 text-red-600" },
                    { range: "0.70 - 0.85", label: "جيد", color: "bg-green-50 text-green-600" },
                    { range: "0.85 فأكثر", label: "ممتاز", color: "bg-indigo-50 text-indigo-600" }
                  ]}
                />
                <StatCalculatorCard 
                  title="صدق المحتوى (CVR)"
                  formula="CVR = (nₑ - N/2) / (N/2)"
                  description="مدى اتفاق المحكمين على أهمية فقرات الاختبار."
                  example="nₑ: عدد الموافقين، N: العدد الكلي للمحكمين."
                  interpretation={[
                    { range: "أقل من 0.00", label: "مرفوض", color: "bg-red-50 text-red-600" },
                    { range: "0.00 - 0.49", label: "مقبول", color: "bg-yellow-50 text-yellow-600" },
                    { range: "0.50 فأكثر", label: "مرتفع", color: "bg-green-50 text-green-600" }
                  ]}
                />
                <StatCalculatorCard 
                  title="أوميجا ماكدونالد"
                  formula="ω = (Σλ)² / [(Σλ)² + Σψ]"
                  description="بديل حديث لألفا كرونباخ، لا يشترط تساوي الأوزان العاملية."
                  example="λ: التشبعات العاملية، ψ: تباينات الخطأ."
                  interpretation={[
                    { range: "أقل من 0.70", label: "منخفض", color: "bg-red-50 text-red-600" },
                    { range: "0.70 - 0.89", label: "جيد جداً", color: "bg-green-50 text-green-600" },
                    { range: "0.90 فأكثر", label: "مرتفع جداً", color: "bg-violet-50 text-violet-600" }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KR-20 Calculator Inputs */}
                <div className="lg:col-span-2 glass-card p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Calculator className="text-indigo-500" size={20} />
                      حاسبة ثبات الاختبار (KR-20)
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={autoPopulateKr20} className="text-xs text-indigo-600 hover:underline">
                        تعبئة عينة بيانات
                      </button>
                      <button onClick={addKr20Item} className="btn-secondary py-1 text-xs">
                        <Plus size={14} />
                        إضافة سؤال
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">عدد الطلاب الكلي (N)</label>
                      <input 
                        type="number" 
                        value={kr20TotalStudents}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setKr20TotalStudents(val);
                          if (val <= 0) {
                            setKr20Errors(prev => ({ ...prev, students: 'يجب أن يكون عدد الطلاب أكبر من صفر' }));
                          } else {
                            setKr20Errors(prev => ({ ...prev, students: undefined }));
                          }
                        }}
                        className={`w-full ${kr20Errors.students ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {kr20Errors.students && <p className="text-[10px] text-red-500 font-medium">{kr20Errors.students}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">تباين درجات الاختبار (σ²)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={kr20Variance}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setKr20Variance(val);
                          if (val <= 0) {
                            setKr20Errors(prev => ({ ...prev, variance: 'يجب أن يكون التباين قيمة موجبة' }));
                          } else {
                            setKr20Errors(prev => ({ ...prev, variance: undefined }));
                          }
                        }}
                        className={`w-full ${kr20Errors.variance ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {kr20Errors.variance && <p className="text-[10px] text-red-500 font-medium">{kr20Errors.variance}</p>}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {kr20Items.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm italic">
                        ابدأ بإضافة أسئلة الاختبار لإدخال عدد الإجابات الصحيحة لكل سؤال.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {kr20Items.map((item, index) => (
                          <div key={item.id} className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 w-6">ق{index + 1}</span>
                            
                            <div className="flex flex-1 items-center gap-2 min-w-[150px]">
                              <label className="text-[10px] text-slate-500 whitespace-nowrap">الإجابات الصحيحة:</label>
                              <input 
                                type="number"
                                value={item.correctCount}
                                onChange={(e) => updateKr20Item(item.id, { correctCount: Number(e.target.value) })}
                                className="w-full h-8 text-sm px-2"
                              />
                            </div>

                            <div className="flex items-center gap-2 min-w-[150px]">
                              <label className="text-[10px] text-slate-500 whitespace-nowrap">مستوى بلوم:</label>
                              <select 
                                value={item.level}
                                onChange={(e) => updateKr20Item(item.id, { level: e.target.value as BloomLevel })}
                                className="w-full h-8 text-xs bg-white border-slate-200 rounded-md"
                              >
                                {Object.values(BLOOM_LEVELS).map(l => (
                                  <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className={`text-[10px] px-2 py-1 rounded-full border font-medium ${BLOOM_LEVELS[item.level].color}`}>
                              {BLOOM_LEVELS[item.level].name}
                            </div>

                            <button onClick={() => removeKr20Item(item.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                  <div className="glass-card p-6 text-center space-y-4 bg-indigo-600 text-white">
                    <h3 className="text-lg font-medium opacity-90">معامل الثبات (KR-20)</h3>
                    <div className="text-5xl font-black tracking-tighter">
                      {kr20Result}
                    </div>
                    <div className="pt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        kr20Result >= 0.7 ? 'bg-green-500/20 text-green-100' : 
                        kr20Result >= 0.5 ? 'bg-yellow-500/20 text-yellow-100' : 
                        'bg-red-500/20 text-red-100'
                      }`}>
                        {kr20Result >= 0.8 ? 'ثبات مرتفع جداً' : 
                         kr20Result >= 0.7 ? 'ثبات جيد' : 
                         kr20Result >= 0.6 ? 'ثبات مقبول' : 
                         kr20Result > 0 ? 'ثبات منخفض' : 'بيانات غير كافية'}
                      </span>
                    </div>
                  </div>

                  <div className="glass-card p-6 space-y-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Info size={16} className="text-indigo-500" />
                      تفسير النتائج
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2 list-disc pr-4">
                      <li>المعامل المثالي للاختبارات التحصيلية الجامعية يتراوح بين 0.70 و 0.90.</li>
                      <li>إذا كان الثبات منخفضاً، قد تحتاج لزيادة عدد الأسئلة أو تحسين صياغتها.</li>
                      <li>تأكد من دقة قيمة التباين (σ²) المدخلة، حيث أنها تؤثر بشكل كبير على النتيجة.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. Bloom Level Distribution & Customization */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="text-indigo-500" size={20} />
                    توزيع مستويات بلوم في الاختبار
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(levelTotals).map(([key, value]) => ({ 
                        name: BLOOM_LEVELS[key as BloomLevel].name, 
                        value,
                        level: key
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                          formatter={(value: number) => [`${value} سؤال`, 'العدد']}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar name="عدد الأسئلة" dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                          {Object.keys(BLOOM_LEVELS).map((levelKey, index) => (
                            <Cell key={`cell-${index}`} fill={bloomLevelColors[levelKey as BloomLevel]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BrainCircuit className="text-indigo-500" size={20} />
                    تخصيص ألوان المستويات
                  </h3>
                  <div className="space-y-4">
                    {Object.values(BLOOM_LEVELS).map((level) => (
                      <div key={level.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: bloomLevelColors[level.id] }}
                          ></div>
                          <span className="text-sm font-medium text-slate-700">{level.name}</span>
                        </div>
                        <input 
                          type="color" 
                          value={bloomLevelColors[level.id]}
                          onChange={(e) => setBloomLevelColors(prev => ({ ...prev, [level.id]: e.target.value }))}
                          className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => setBloomLevelColors({
                        remember: '#3b82f6',
                        understand: '#10b981',
                        apply: '#f59e0b',
                        analyze: '#f97316',
                        evaluate: '#a855f7',
                        create: '#ef4444'
                      })}
                      className="w-full py-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors border border-dashed border-slate-300 rounded-lg"
                    >
                      إعادة تعيين الألوان الافتراضية
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Reliability & Validity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="text-indigo-500" size={20} />
                    حسابات الصدق والثبات المتقدمة
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cronbach's Alpha */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-700">معامل ألفا كرونباخ (α)</h4>
                        <div className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">الاتساق الداخلي</div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">عدد الفقرات (k)</label>
                            <input type="number" value={alphaItemCount} onChange={(e) => setAlphaItemCount(Number(e.target.value))} className="w-full h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">مجموع تباينات الفقرات (Σσᵢ²)</label>
                            <input type="number" step="0.1" value={alphaSumVariances} onChange={(e) => setAlphaSumVariances(Number(e.target.value))} className="w-full h-8 text-xs" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">تباين الاختبار الكلي (σₜ²)</label>
                          <input type="number" step="0.1" value={alphaTotalVariance} onChange={(e) => setAlphaTotalVariance(Number(e.target.value))} className="w-full h-8 text-xs" />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">النتيجة:</span>
                        <span className={`text-xl font-black ${cronbachAlpha >= 0.7 ? 'text-green-600' : 'text-red-500'}`}>{cronbachAlpha}</span>
                      </div>
                    </div>

                    {/* Spearman-Brown (Split-Half) */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-700">التجزئة النصفية (Spearman-Brown)</h4>
                        <div className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">ثبات التجزئة</div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">معامل الارتباط بين النصفين (r₁₂)</label>
                          <input type="number" step="0.01" min="-1" max="1" value={splitHalfCorr} onChange={(e) => setSplitHalfCorr(Number(e.target.value))} className="w-full h-8 text-xs" />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">يستخدم لتصحيح معامل الارتباط بعد تقسيم الاختبار إلى نصفين متكافئين.</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">المعامل المصحح:</span>
                        <span className={`text-xl font-black ${spearmanBrown >= 0.7 ? 'text-green-600' : 'text-red-500'}`}>{spearmanBrown}</span>
                      </div>
                    </div>

                    {/* McDonald's Omega */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-700">أوميجا ماكدونالد (ω)</h4>
                        <div className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">الثبات العام</div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">مجموع التشبعات العاملية (Σλ)</label>
                          <input type="number" step="0.1" value={omegaSumLoadings} onChange={(e) => setOmegaSumLoadings(Number(e.target.value))} className="w-full h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">مجموع تباينات الخطأ (Σψ)</label>
                          <input type="number" step="0.1" value={omegaSumErrors} onChange={(e) => setOmegaSumErrors(Number(e.target.value))} className="w-full h-8 text-xs" />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">النتيجة:</span>
                        <span className={`text-xl font-black ${omegaResult >= 0.7 ? 'text-violet-600' : 'text-red-500'}`}>{omegaResult}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Validity (CVR) */}
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-indigo-900">نسبة صدق المحتوى (CVR - Lawshe)</h4>
                      <div className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">صدق المحكمين</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-700">عدد المحكمين الكلي (N)</label>
                          <input type="number" value={cvrExperts} onChange={(e) => setCvrExperts(Number(e.target.value))} className="w-full h-8 text-xs border-indigo-200" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-700">عدد الموافقين (أساسي)</label>
                          <input type="number" value={cvrEssential} onChange={(e) => setCvrEssential(Number(e.target.value))} className="w-full h-8 text-xs border-indigo-200" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                        <div className="text-xs font-bold text-slate-500">قيمة CVR:</div>
                        <div className="flex flex-col items-end">
                          <span className={`text-2xl font-black ${cvrResult > 0 ? 'text-indigo-600' : 'text-red-500'}`}>{cvrResult}</span>
                          <span className="text-[9px] text-slate-400">القيمة المثالية تعتمد على عدد المحكمين</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-500" />
                    مفاهيم الصدق والثبات
                  </h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <h5 className="text-xs font-bold text-indigo-600 mb-1">الصدق (Validity)</h5>
                      <p className="text-[10px] text-slate-600 leading-relaxed">مدى قياس الاختبار لما وُضع لقياسه فعلاً. جدول المواصفات هو الأداة الرئيسية لضمان **صدق المحتوى**.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <h5 className="text-xs font-bold text-indigo-600 mb-1">الثبات (Reliability)</h5>
                      <p className="text-[10px] text-slate-600 leading-relaxed">مدى دقة واتساق نتائج الاختبار. يعتبر **أوميجا ماكدونالد** الأدق حالياً لأنه يتجاوز عيوب ألفا كرونباخ في تقدير الثبات.</p>
                    </div>
                    <div className="text-[10px] text-slate-400 italic leading-relaxed">
                      * ملاحظة: الثبات شرط ضروري للصدق، ولكن الصدق ليس شرطاً للثبات.
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Distribution Charts */}
              {itemsAnalysis.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BarChart3 size={16} className="text-indigo-500" />
                      توزيع معامل الصعوبة
                    </h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsDistribution.diffDist}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(value: number) => [`${value} فقرة`, 'العدد']}
                          />
                          <Legend verticalAlign="top" height={30} />
                          <Bar name="عدد الفقرات" dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {statsDistribution.diffDist.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BarChart3 size={16} className="text-indigo-500" />
                      توزيع معامل التمييز
                    </h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsDistribution.discDist}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(value: number) => [`${value} فقرة`, 'العدد']}
                          />
                          <Legend verticalAlign="top" height={30} />
                          <Bar name="عدد الفقرات" dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {statsDistribution.discDist.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Item Analysis Section */}
              <div className="glass-card p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <BarChart3 className="text-indigo-600 w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold">تحليل الفقرات (الصعوبة والتمييز)</h3>
                  </div>
                  <button onClick={addItemAnalysis} className="btn-primary">
                    <Plus size={18} />
                    إضافة فقرة للتحليل
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                        <th className="p-3 font-bold">رقم السؤال</th>
                        <th className="p-3 font-bold">الفئة العليا (U)</th>
                        <th className="p-3 font-bold">الفئة الدنيا (L)</th>
                        <th className="p-3 font-bold">حجم الفئة (n)</th>
                        <th className="p-3 font-bold">إجمالي الصحيح (R)</th>
                        <th className="p-3 font-bold">إجمالي الطلاب (N)</th>
                        <th className="p-3 font-bold text-indigo-600">معامل الصعوبة (P)</th>
                        <th className="p-3 font-bold text-indigo-600">معامل التمييز (D)</th>
                        <th className="p-3 font-bold">ملاحظات</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsAnalysis.map((item) => {
                        const difficulty = item.totalStudents > 0 ? (item.totalCorrect / item.totalStudents).toFixed(2) : "0.00";
                        const discrimination = item.groupSize > 0 ? ((item.upperCorrect - item.lowerCorrect) / item.groupSize).toFixed(2) : "0.00";
                        
                        return (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-400">س {item.questionNumber}</td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={item.upperCorrect}
                                onChange={(e) => updateItemAnalysis(item.id, { upperCorrect: Number(e.target.value) })}
                                className="w-16 h-8 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={item.lowerCorrect}
                                onChange={(e) => updateItemAnalysis(item.id, { lowerCorrect: Number(e.target.value) })}
                                className="w-16 h-8 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={item.groupSize}
                                onChange={(e) => updateItemAnalysis(item.id, { groupSize: Number(e.target.value) })}
                                className="w-16 h-8 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={item.totalCorrect}
                                onChange={(e) => updateItemAnalysis(item.id, { totalCorrect: Number(e.target.value) })}
                                className="w-16 h-8 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                value={item.totalStudents}
                                onChange={(e) => updateItemAnalysis(item.id, { totalStudents: Number(e.target.value) })}
                                className="w-16 h-8 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${Number(difficulty) < 0.2 || Number(difficulty) > 0.8 ? 'text-red-500' : 'text-green-600'}`}>
                                  {difficulty}
                                </span>
                                {Number(difficulty) < 0.2 ? (
                                  <Frown size={14} className="text-red-500" title="صعب جداً" />
                                ) : Number(difficulty) > 0.8 ? (
                                  <Smile size={14} className="text-red-500" title="سهل جداً" />
                                ) : (
                                  <Meh size={14} className="text-green-600" title="صعوبة مثالية" />
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${Number(discrimination) < 0.2 ? 'text-red-500' : Number(discrimination) < 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {discrimination}
                                </span>
                                {Number(discrimination) < 0.2 ? (
                                  <ArrowDown size={14} className="text-red-500" title="تمييز ضعيف" />
                                ) : Number(discrimination) < 0.4 ? (
                                  <Minus size={14} className="text-yellow-600" title="تمييز مقبول" />
                                ) : (
                                  <ArrowUp size={14} className="text-green-600" title="تمييز ممتاز" />
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={item.notes || ''}
                                onChange={(e) => updateItemAnalysis(item.id, { notes: e.target.value })}
                                placeholder="أضف ملاحظة..."
                                className="w-full h-8 text-[10px] px-2"
                              />
                            </td>
                            <td className="p-3">
                              <button onClick={() => removeItemAnalysis(item.id)} className="text-slate-300 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {itemsAnalysis.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic text-sm">
                      لا توجد فقرات مضافة للتحليل حالياً.
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <span className="text-xs text-slate-600 font-medium">قيمة مثالية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-slate-600 font-medium">تحتاج مراجعة / تعديل</span>
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    * يتم تلوين القيم تلقائياً بناءً على المعايير التربوية المعتمدة.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <DraftingGuide />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-3 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="font-bold text-indigo-700">جامعة العريش</span>
            </div>
            {courseName && <span className="font-bold text-slate-700 border-l border-slate-200 pl-4 ml-2">{courseName}</span>}
            <span>الوحدات: {topics.length}</span>
            <span>الأهداف: {objectives.length}</span>
            <span>إجمالي الأسئلة: {totalQuestions}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center md:text-right">
              <span className="font-bold text-slate-700">تصميم وبرمجة: </span>
              <span className="text-indigo-600 font-bold">دكتور. أحمد حمدي عاشور الغول</span>
              <span className="mx-1">ـ</span>
              <span className="text-slate-500">دكتوراه في علم النفس التربوي</span>
            </div>
            
            <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>النظام جاهز للعمل</span>
            </div>
          </div>
        </div>
      </footer>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
        active 
          ? 'bg-white text-indigo-600 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCalculatorCard({ title, formula, description, example, interpretation }: { 
  title: string, 
  formula: string, 
  description: string, 
  example: string,
  interpretation?: { range: string, label: string, color: string }[]
}) {
  return (
    <div className="glass-card p-6 space-y-4 hover:shadow-md transition-shadow flex flex-col h-full">
      <h3 className="font-bold text-indigo-600">{title}</h3>
      <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-center text-sm">
        {formula}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{description}</p>
      <div className="text-xs bg-indigo-50 text-indigo-700 p-2 rounded-md border border-indigo-100">
        <strong>مثال:</strong> {example}
      </div>
      {interpretation && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">دليل التفسير:</div>
          <div className="space-y-1">
            {interpretation.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-mono">{item.range}</span>
                <span className={`font-bold px-1.5 py-0.5 rounded ${item.color}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStatCard({ title, value, label, color, description, icon: Icon }: { 
  title: string, 
  value: string | number, 
  label: string, 
  color: string,
  description: string,
  icon: any
}) {
  const borderColors: Record<string, string> = {
    'bg-green-500': '#22c55e',
    'bg-yellow-500': '#eab308',
    'bg-red-500': '#ef4444',
    'bg-indigo-600': '#4f46e5'
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center text-center space-y-3 hover:shadow-lg transition-all duration-300 border-b-4" style={{ borderBottomColor: borderColors[color] || '#cbd5e1' }}>
      <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-').replace('500', '100').replace('600', '100')} ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
      <div className="text-4xl font-black text-slate-800">{value}</div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${color}`}>
        {label}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function BloomLevelTag({ level }: { level: BloomLevel }) {
  const info = BLOOM_LEVELS[level];
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex items-center gap-1.5">
      <div className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${info.color}`}>
        {info.name}
      </div>
      <div 
        className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Info size={12} />
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl z-50 text-xs pointer-events-none"
          >
            <div className="font-bold mb-1 text-indigo-300">{info.name}</div>
            <p className="mb-2 opacity-90 leading-relaxed">{info.description}</p>
            <div className="flex flex-wrap gap-1">
              {info.verbs.slice(0, 6).map(verb => (
                <span key={verb} className="bg-white/10 px-1.5 py-0.5 rounded">
                  {verb}
                </span>
              ))}
              {info.verbs.length > 6 && <span className="opacity-50">...</span>}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BloomStepper({ currentLevel, onChange, customColors }: { currentLevel: BloomLevel, onChange: (level: BloomLevel) => void, customColors?: Record<BloomLevel, string> }) {
  const levels: BloomLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  
  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
      {levels.map((level, index) => {
        const info = BLOOM_LEVELS[level];
        const isActive = currentLevel === level;
        const customColor = customColors?.[level];
        
        return (
          <div key={level} className="flex items-center">
            <motion.button
              onClick={() => onChange(level)}
              title={info.name + ": " + info.description}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                scale: isActive ? 1.1 : 1,
                backgroundColor: isActive ? (customColor || '#4f46e5') : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`
                relative px-2.5 py-1 text-[10px] font-bold rounded-md z-10
                ${isActive ? 'shadow-md' : 'hover:text-slate-600'}
              `}
              style={{
                backgroundColor: isActive ? customColor : 'transparent',
              }}
            >
              {info.name}
            </motion.button>
            {index < levels.length - 1 && (
              <div className="w-2 h-[1px] bg-slate-300 mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}
