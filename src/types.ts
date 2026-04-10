
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export type QuestionType = 'mcq' | 'true-false' | 'matching' | 'complete' | 'essay';

export interface QuestionTypeInfo {
  id: QuestionType;
  name: string;
  color: string;
}

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeInfo> = {
  'mcq': { id: 'mcq', name: 'اختيار من متعدد', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'true-false': { id: 'true-false', name: 'صح وخطأ', color: 'bg-green-50 text-green-700 border-green-200' },
  'matching': { id: 'matching', name: 'مزاوجة', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'complete': { id: 'complete', name: 'أكمل', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'essay': { id: 'essay', name: 'سؤال مقالي', color: 'bg-slate-50 text-slate-700 border-slate-200' }
};

export interface BloomLevelInfo {
  id: BloomLevel;
  name: string;
  description: string;
  color: string;
  verbs: string[];
}

export const BLOOM_LEVELS: Record<BloomLevel, BloomLevelInfo> = {
  remember: {
    id: 'remember',
    name: 'تذكر',
    description: 'استرجاع الحقائق والمعلومات الأساسية من الذاكرة دون تغيير.',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    verbs: [
      'يذكر', 'يعدد', 'يسمي', 'يحدد', 'يعرف', 'يسترجع', 'يختار', 'يكتب', 'قائمة', 'يتعرف',
      'يتلو', 'يستظهر', 'يصف', 'يطابق', 'ينسخ', 'يكرر', 'يعين', 'يدرج', 'يضع قائمة', 'يستخرج',
      'يعيد ذكر', 'يسرد', 'ينسب', 'يؤشر', 'يختار'
    ]
  },
  understand: {
    id: 'understand',
    name: 'فهم',
    description: 'إدراك معنى المعلومات وتفسيرها بأسلوب الطالب الخاص.',
    color: 'bg-green-100 text-green-700 border-green-200',
    verbs: [
      'يفسر', 'يشرح', 'يميز', 'يفرق', 'يلخص', 'يعيد صياغة', 'يوضح', 'يعلل', 'يستنتج', 'يترجم',
      'يحول', 'يعطي أمثلة', 'يتنبأ', 'يربط', 'يعبر', 'يناقش', 'يصف بأسلوبه', 'يكتشف', 'يستخلص',
      'يستبصر', 'يستقرئ', 'يصيغ بأسلوبه', 'يراجع', 'يستعرض'
    ]
  },
  apply: {
    id: 'apply',
    name: 'تطبيق',
    description: 'استخدام المعلومات والقواعد في مواقف أو مشكلات جديدة.',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    verbs: [
      'يطبق', 'يستخدم', 'يحل', 'يحسب', 'يعرض', 'يوظف', 'يجرب', 'ينفذ', 'يرسم', 'يشغل',
      'يجهز', 'يجدول', 'يغير', 'يخطط', 'يبرهن', 'يستعمل', 'يقيس', 'يعدل', 'يمارس',
      'يشيد', 'ينتج', 'يكتشف', 'يستعمل'
    ]
  },
  analyze: {
    id: 'analyze',
    name: 'تحليل',
    description: 'تفكيك المعلومات إلى أجزاء وفهم العلاقات بينها.',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    verbs: [
      'يحلل', 'يجزئ', 'يقارن', 'يصنف', 'يفحص', 'يختبر', 'ينقد', 'يفرق بين', 'يخطط', 'يستنبط',
      'يبحث', 'يدقق', 'يكتشف العلاقات', 'يحلل العناصر', 'يستخلص النتائج', 'يميز بين',
      'يعزل', 'يفصل', 'يستقصي', 'يستدل'
    ]
  },
  evaluate: {
    id: 'evaluate',
    name: 'تقويم',
    description: 'إصدار أحكام بناءً على معايير محددة وتبرير القرارات.',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    verbs: [
      'يقوم', 'ينتقد', 'يحكم', 'يقيم', 'يفاضل', 'يبرر', 'يدعم', 'يقدر', 'يدافع', 'يختار الأفضل',
      'يوصي', 'يثبت', 'يدحض', 'يفسر النتائج', 'يعطي رأياً', 'يقرر', 'يستخلص حكماً',
      'يفند', 'يعارض', 'يؤيد', 'يوازن'
    ]
  },
  create: {
    id: 'create',
    name: 'ابتكار',
    description: 'تجميع الأجزاء لبناء شيء جديد أو اقتراح حلول مبتكرة.',
    color: 'bg-red-100 text-red-700 border-red-200',
    verbs: [
      'يبتكر', 'يصمم', 'يؤلف', 'يركب', 'ينتج', 'يقترح', 'يبني', 'يطور', 'ينظم', 'يعدل',
      'يخطط', 'يجمع', 'يشكل', 'يعيد ترتيب', 'يخترع', 'يكتب قصة', 'يضع خطة', 'يصيغ',
      'يشتق', 'يولد', 'يعد', 'يؤطر'
    ]
  }
};

export function detectBloomLevel(objective: string): BloomLevel {
  // Strip HTML tags if any (from rich text editor)
  const plainText = objective.replace(/<[^>]*>/g, ' ');
  
  // Normalize text: remove common prefixes and extra spaces
  let text = plainText.trim().toLowerCase();
  
  // Remove common Arabic objective prefixes
  const prefixes = [
    'أن يذكر', 'أن يعدد', 'أن يسمي', 'أن يحدد', 'أن يعرف', 'أن يفسر', 'أن يشرح',
    'أن يطبق', 'أن يحلل', 'أن يقارن', 'أن يقوم', 'أن يبتكر', 'أن يصمم',
    'أن يستطيع الطالب', 'أن يكون الطالب قادراً على أن', 'أن يوضح', 'أن يفرق',
    'أن يكتب', 'أن يرسم', 'أن يحسب', 'أن يستخدم', 'أن يصف', 'أن يلخص',
    'يستطيع الطالب أن', 'على الطالب أن', 'أن', 'يجب أن', 'من المتوقع أن'
  ];

  // Sort prefixes by length descending to match longest first
  prefixes.sort((a, b) => b.length - a.length);

  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      text = text.substring(prefix.length).trim();
      break; 
    }
  }

  // Check from highest to lowest level
  const levels: BloomLevel[] = ['create', 'evaluate', 'analyze', 'apply', 'understand', 'remember'];
  
  for (const level of levels) {
    const info = BLOOM_LEVELS[level];
    
    for (const verb of info.verbs) {
      // Improved regex for Arabic: 
      // 1. Handles common prefixes (و، ف، ل)
      // 2. Ensures word boundaries or end of string
      // 3. Handles variations like "يستنتج" vs "استنتاج" (simplified by checking verb root/stem)
      const regex = new RegExp(`(^|\\s|[وفل])${verb}(\\s|$|\\.)`, 'i');
      
      if (regex.test(text) || text.startsWith(verb)) {
        return level;
      }
      
      // Check for noun form (مصدر) if verb starts with 'ي'
      if (verb.startsWith('ي')) {
        const nounForm = verb.substring(1); // e.g., يستنتج -> ستنتج (approximate)
        if (text.includes(nounForm)) {
          return level;
        }
      }
    }
  }
  
  return 'remember'; // Default
}

export function detectQuestionType(objective: string): QuestionType {
  const plainText = objective.replace(/<[^>]*>/g, ' ').trim().toLowerCase();
  
  // Keywords for detection
  const matchingKeywords = ['يربط', 'يطابق', 'يوصل', 'يزاوج', 'المزاوجة'];
  const trueFalseKeywords = ['صح وخطأ', 'صواب وخطأ', 'يميز بين الخطأ والصواب', 'صحة أو خطأ'];
  const completeKeywords = ['يعدد', 'يذكر', 'يسمي', 'أكمل', 'يملأ الفراغ', 'قائمة'];
  const essayKeywords = ['يشرح', 'يلخص', 'ينقد', 'يصمم', 'يبتكر', 'يبرهن', 'يكتب', 'يؤلف', 'يقترح', 'يوضح', 'يقارن', 'يفسر'];
  const mcqKeywords = ['يختار', 'يميز', 'يحدد', 'ينتقي', 'اختيار'];

  for (const kw of matchingKeywords) if (plainText.includes(kw)) return 'matching';
  for (const kw of trueFalseKeywords) if (plainText.includes(kw)) return 'true-false';
  for (const kw of essayKeywords) if (plainText.includes(kw)) return 'essay';
  for (const kw of completeKeywords) if (plainText.includes(kw)) return 'complete';
  for (const kw of mcqKeywords) if (plainText.includes(kw)) return 'mcq';

  // Fallback based on Bloom Level if text detection fails
  const level = detectBloomLevel(objective);
  if (level === 'evaluate' || level === 'create') return 'essay';
  
  return 'mcq'; // Default
}

export interface Topic {
  id: string;
  title: string;
  weight: number; // Percentage or number of lectures
}

export interface Objective {
  id: string;
  topicId: string;
  text: string;
  level: BloomLevel;
  questionType: QuestionType;
}

export interface TOSCell {
  topicId: string;
  level: BloomLevel;
  questionCount: number;
}

export interface ItemAnalysis {
  id: string;
  questionNumber: number;
  upperCorrect: number; // Correct in upper 27%
  lowerCorrect: number; // Correct in lower 27%
  groupSize: number;    // Size of one group (upper or lower)
  totalCorrect: number; // Total correct in whole sample
  totalStudents: number; // Total students in whole sample
}
