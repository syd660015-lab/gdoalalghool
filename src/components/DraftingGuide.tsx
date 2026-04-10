import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, BookOpen, Target, HelpCircle, Lightbulb, MessageSquare, Sparkles, ArrowLeft, Printer, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToPDF } from '../services/exportService';

const COMMON_ERRORS = [
  {
    category: 'أخطاء إملائية ونحوية شائعة',
    items: [
      { wrong: 'إختبار', right: 'اختبار', reason: 'همزة وصل وليست قطع (مصدر خماسي)' },
      { wrong: 'مدرسه', right: 'مدرسة', reason: 'التاء المربوطة تنطق هاءً عند الوقف وتاءً عند الوصل' },
      { wrong: 'اللذين', right: 'الذين', reason: 'الاسم الموصول لجمع المذكر يكتب بلام واحدة' },
      { wrong: 'انشاء الله', right: 'إن شاء الله', reason: 'فصل "إن" الشرطية عن الفعل "شاء"' },
      { wrong: 'مدراء', right: 'مديرون / مديرين', reason: 'جمع "مدير" هو جمع مذكر سالم وليس جمع تكسير' },
    ]
  },
  {
    category: 'أخطاء أسلوبية وصياغة',
    items: [
      { wrong: 'تم إجراء الاختبار', right: 'أُجري الاختبار', reason: 'تجنب استخدام "تم" الزائدة للمجهول' },
      { wrong: 'عدم الحضور', right: 'الغياب', reason: 'تفضيل المصدر المباشر على استخدام "عدم"' },
      { wrong: 'سوف لن يحضر', right: 'لن يحضر', reason: 'لا تجتمع "سوف" مع "لن"' },
      { wrong: 'قام بالتدريس', right: 'درّس', reason: 'تجنب الحشو اللغوي باستخدام "قام بـ"' },
      { wrong: 'بالنسبة لـ...', right: 'أما ... فـ...', reason: 'تجنب التعبيرات المترجمة حرفياً من اللغات الأخرى' },
    ]
  }
];

const EXAM_TIPS = [
  {
    title: 'وضوح الصياغة (Clarity)',
    icon: <Target className="text-blue-500" size={18} />,
    tips: [
      'اجعل أصل السؤال (Stem) يحتوي على المشكلة كاملة وبوضوح.',
      'استخدم لغة بسيطة ومباشرة تناسب المستوى المعرفي للطلاب.',
      'تجنب استخدام الكلمات الفضفاضة مثل (غالباً، أحياناً، نادراً).',
      'قلل من استخدام صيغة النفي في أصل السؤال، وإذا استخدمتها ضع تحتها خطاً.',
      'تأكد من أن السؤال يختبر معلومة حقيقية وليس مجرد "ذكاء" في فهم الصياغة.'
    ]
  },
  {
    title: 'جودة المشتتات (Distractor Quality)',
    icon: <AlertTriangle className="text-amber-500" size={18} />,
    tips: [
      'يجب أن تكون المشتتات جذابة للطلاب الذين لم يتقنوا المادة العلمية.',
      'اجعل جميع البدائل متساوية في الطول والتركيب اللغوي تقريباً.',
      'تجنب استخدام "كل ما سبق" لأنها تسهل التخمين إذا عرف الطالب بديلين.',
      'تجنب استخدام "لا شيء مما سبق" لأنها لا تقيس ما يعرفه الطالب فعلياً.',
      'يجب أن تكون المشتتات خاطئة بشكل قاطع ولكنها "منطقية" علمياً.',
      'تجنب المشتتات التي تحتوي على كلمات جازمة مثل (دائماً، أبداً، فقط).'
    ]
  },
  {
    title: 'بناء أسئلة الاختيار من متعدد (MCQs)',
    icon: <CheckCircle2 className="text-green-500" size={18} />,
    tips: [
      'تأكد من وجود إجابة واحدة فقط صحيحة أو هي "الأفضل" بشكل واضح.',
      'رتب البدائل ترتيباً منطقياً (عددي، زمني، أبجدي) لتسهيل القراءة.',
      'لا تضع تلميحات نحوية في أصل السؤال تدل على جنس الإجابة (مذكر/مؤنث).',
      'تجنب تكرار الكلمات في بداية كل بديل؛ ضعها في أصل السؤال بدلاً من ذلك.'
    ]
  }
];

export const DraftingGuide: React.FC = () => {
  const [sampleObjective, setSampleObjective] = useState('');

  const feedback = useMemo(() => {
    if (!sampleObjective.trim()) return [];
    
    const results: { type: 'error' | 'warning' | 'success', message: string, suggestion?: string }[] = [];
    const text = sampleObjective.trim();

    // 1. Spelling & Common Typos
    if (text.includes('إختبار')) {
      results.push({ 
        type: 'error', 
        message: 'خطأ إملائي: همزة القطع في كلمة "اختبار".', 
        suggestion: 'استخدم "اختبار" (همزة وصل) لأنها مصدر لفعل خماسي.' 
      });
    }
    if (text.includes('انشاء الله')) {
      results.push({ 
        type: 'error', 
        message: 'خطأ في كتابة المشيئة: "انشاء" تعني إيجاد.', 
        suggestion: 'اكتبها "إن شاء الله" (إن الشرطية + فعل المشيئة).' 
      });
    }

    // 2. Verb Tense Consistency (Behavioral objectives must be in present tense)
    const pastTenseVerbs = [
      { past: 'ذكر', present: 'يذكر' },
      { past: 'شرح', present: 'يشرح' },
      { past: 'حلل', present: 'يحلل' },
      { past: 'قارن', present: 'يقارن' },
      { past: 'صمم', present: 'يصمم' },
      { past: 'رسم', present: 'يرسم' },
      { past: 'حدد', present: 'يحدد' },
      { past: 'عرف', present: 'يعرف' }
    ];
    for (const verb of pastTenseVerbs) {
      if (text.includes(`أن ${verb.past}`)) {
        results.push({ 
          type: 'error', 
          message: `استخدام صيغة الماضي "${verb.past}" في الهدف السلوكي.`, 
          suggestion: `استخدم الفعل المضارع "أن ${verb.present}" لضمان قابلية القياس في المستقبل.` 
        });
      }
    }

    // 3. Passive Voice & Fillers (Encourage Active Voice)
    const passiveIndicators = [
      { pattern: 'تم إجراء', suggestion: 'أُجري' },
      { pattern: 'تمت دراسة', suggestion: 'دُرس' },
      { pattern: 'تم تنفيذ', suggestion: 'نُفذ' },
      { pattern: 'تم توضيح', suggestion: 'وُضح' },
      { pattern: 'تم استخدام', suggestion: 'استُخدم' }
    ];
    for (const item of passiveIndicators) {
      if (text.includes(item.pattern)) {
        results.push({ 
          type: 'warning', 
          message: `استخدام "تم" الزائدة للمجهول (${item.pattern}).`, 
          suggestion: `استخدم الفعل المباشر (مثلاً: "${item.suggestion}") أو صياغة المعلوم.` 
        });
      }
    }

    const fillers = [
      { pattern: 'قام بـ', suggestion: 'استخدم الفعل مباشرة' },
      { pattern: 'قام بعمل', suggestion: 'استخدم الفعل مباشرة' },
      { pattern: 'من خلال القيام بـ', suggestion: 'احذف الحشو' },
      { pattern: 'بشكل كبير', suggestion: 'حدد المعيار بدقة' },
      { pattern: 'بصورة واضحة', suggestion: 'استخدم معياراً قابلاً للقياس' }
    ];
    for (const item of fillers) {
      if (text.includes(item.pattern)) {
        results.push({ 
          type: 'warning', 
          message: `حشو لغوي أو عبارة فضفاضة (${item.pattern}).`, 
          suggestion: item.suggestion 
        });
      }
    }

    // 4. Subject-Verb Agreement
    if (text.includes('أن تذكر الطالب') || text.includes('أن تشرح الطالب')) {
      results.push({ 
        type: 'error', 
        message: 'عدم المطابقة بين الفعل والفاعل (تذكير/تأنيث).', 
        suggestion: 'استخدم "أن يذكر الطالب" أو "أن تذكر الطالبة".' 
      });
    }

    // 5. Pedagogical Clarity (Measurability & Quantifiability)
    const ambiguousVerbs = [
      { verb: 'يعرف', suggestion: 'يعرّف، يذكر، يعدد، أو يسمي' },
      { verb: 'يفهم', suggestion: 'يشرح، يلخص، يفسر، أو يعيد صياغة' },
      { verb: 'يدرك', suggestion: 'يستنتج، يربط، أو يوضح' },
      { verb: 'يستوعب', suggestion: 'يلخص، يشرح، أو يطبق' },
      { verb: 'يتذوق', suggestion: 'ينقد، يحلل، أو يوازن' },
      { verb: 'يستمتع', suggestion: 'يشارك، يختار، أو يصف شعوره تجاه' },
      { verb: 'يلم بـ', suggestion: 'يعدد، يصف، أو يحدد' },
      { verb: 'يعي', suggestion: 'يوضح، يفسر، أو يستنبط' },
      { verb: 'يكتسب', suggestion: 'يطبق، ينفذ، أو يظهر مهارة في' },
      { verb: 'يتعلم', suggestion: 'يذكر، يطبق، أو يحل' }
    ];

    for (const item of ambiguousVerbs) {
      // Check for the verb specifically (avoiding false positives with verbs like "يعرّف")
      const regex = new RegExp(`(^|\\s)${item.verb}(\\s|$)`, 'i');
      if (regex.test(text)) {
        results.push({ 
          type: 'warning', 
          message: `فعل "${item.verb}" غير قابل للقياس المباشر أو غامض تربوياً.`, 
          suggestion: `استخدم أفعالاً إجرائية محددة مثل: ${item.suggestion}.` 
        });
      }
    }

    // 6. Structure & Redundancy
    if (text.includes('يستطيع الطالب أن') || text.includes('يكون الطالب قادراً على')) {
      results.push({ 
        type: 'warning', 
        message: 'عبارات "يستطيع" أو "يكون قادراً على" تعتبر حشواً في الأهداف السلوكية.', 
        suggestion: 'ابدأ مباشرة بـ "أن + الفعل المضارع" (مثال: أن يذكر الطالب...).' 
      });
    }
    if (text.startsWith('أن') && !text.includes('الطالب')) {
      results.push({ 
        type: 'warning', 
        message: 'يفضل ذكر الفاعل (الطالب) صراحة لضبط صياغة الهدف.', 
        suggestion: 'مثال: "أن يذكر الطالب..." بدلاً من "أن يذكر...".' 
      });
    }

    // 7. Stylistic Checks
    if (text.includes('سوف لن')) {
      results.push({ 
        type: 'error', 
        message: 'خطأ أسلوبي: الجمع بين "سوف" (للمستقبل) و "لن" (للنفي المستقبلي).', 
        suggestion: 'اكتفِ بـ "لن" للنفي المستقبلي.' 
      });
    }

    if (results.length === 0 && text.length > 10) {
      results.push({ 
        type: 'success', 
        message: 'صياغة ممتازة! الهدف السلوكي واضح ومتوافق مع المعايير اللغوية والتربوية.' 
      });
    }

    return results;
  }, [sampleObjective]);

  return (
    <div id="guide-section" className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">دليل صياغة أسئلة الاختبارات</h2>
          <p className="text-slate-500 mt-1">إرشادات تربوية ولغوية لتحسين جودة بناء الاختبارات التحصيلية.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToPDF('دليل_الصياغة', 'guide-section')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-md"
          >
            <Printer size={18} />
            طباعة PDF
          </button>
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <BookOpen size={14} />
            معايير جامعة العريش
          </div>
        </div>
      </div>

      {/* Interactive Analyzer */}
      <div className="glass-card p-8 border-indigo-100 bg-gradient-to-l from-white to-indigo-50/30">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">محلل صياغة الأهداف الذكي</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              قم بكتابة هدف سلوكي أو سؤال اختبار هنا، وسيقوم النظام فوراً بتحليل الصياغة وتقديم نصائح لتحسينها بناءً على المعايير اللغوية والتربوية.
            </p>
            <div className="relative">
              <textarea 
                value={sampleObjective}
                onChange={(e) => setSampleObjective(e.target.value)}
                placeholder="مثال: أن يعرف الطالب أنواع الاختبارات..."
                className="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-white shadow-inner resize-none transition-all text-sm"
              />
              <div className="absolute bottom-3 left-3">
                <MessageSquare size={20} className="text-slate-200" />
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              نتائج التحليل الفوري
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            <div className="flex-1 space-y-3">
              <AnimatePresence mode="popLayout">
                {!sampleObjective.trim() ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl"
                  >
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                      <Lightbulb size={32} className="text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">ابدأ الكتابة في المربع الجانبي لرؤية التحليل</p>
                  </motion.div>
                ) : (
                  feedback.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-2xl border flex gap-4 ${
                        item.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                        item.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                        'bg-green-50 border-green-100 text-green-800'
                      }`}
                    >
                      <div className="shrink-0 mt-1">
                        {item.type === 'error' ? <XCircle size={18} className="text-red-500" /> :
                         item.type === 'warning' ? <AlertTriangle size={18} className="text-amber-500" /> :
                         <CheckCircle2 size={18} className="text-green-500" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold leading-tight">{item.message}</p>
                        {item.suggestion && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current border-opacity-10">
                            <ArrowLeft size={12} className="rotate-180" />
                            <p className="text-xs font-medium opacity-80">مقترح: {item.suggestion}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Common Errors Section */}
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <XCircle size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">تجنب الأخطاء الشائعة</h3>
          </div>
          
          {COMMON_ERRORS.map((group, idx) => (
            <div key={idx} className="glass-card overflow-hidden border-slate-200">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-700 flex justify-between items-center">
                {group.category}
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200">{group.items.length} أمثلة</span>
              </div>
              <div className="p-4 space-y-3">
                {group.items.map((item, i) => (
                  <div key={i} className="group flex flex-col gap-2 p-3 rounded-xl bg-white border border-slate-100 hover:border-red-200 hover:bg-red-50/30 transition-all duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-red-400 line-through text-xs italic">
                        {item.wrong}
                      </div>
                      <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                        <CheckCircle2 size={16} />
                        {item.right}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <Info size={12} className="text-indigo-400" />
                      {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Exam Tips Section */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Lightbulb size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">أفضل الممارسات التربوية</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {EXAM_TIPS.map((group, idx) => (
              <div key={idx} className="glass-card p-6 space-y-4 border-slate-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    {group.icon}
                  </div>
                  <h4 className="font-bold text-slate-800">
                    {group.title}
                  </h4>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {group.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 group-hover:scale-150 transition-transform"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="relative z-10 space-y-4">
              <h4 className="font-black text-white text-xl flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <Target size={24} className="text-white" />
                </div>
                القاعدة الذهبية في القياس
              </h4>
              <p className="text-indigo-50 text-lg leading-relaxed font-medium italic">
                "السؤال الجيد هو الذي يقيس ما وُضع لقياسه بدقة، ولا يتأثر فهم الطالب له بضعف الصياغة اللغوية أو غموض المصطلحات، بل يركز فقط على قياس النواتج التعليمية المستهدفة."
              </p>
              <div className="pt-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/20"></div>
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">وحدة القياس والتقويم</span>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
