import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Topic, Objective, ItemAnalysis, BloomLevel, BLOOM_LEVELS, QUESTION_TYPES } from '../types';

// Helper for Arabic text (very basic, jsPDF doesn't support Arabic well without fonts)
// In a real app, we'd need a font like 'Amiri' or 'Cairo' embedded.
// For this environment, we'll try to use standard methods or suggest printing.

export const exportToPDF = async (title: string, elementId: string) => {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${title}.pdf`);
};

export const exportCourseToWord = async (courseName: string, topics: Topic[], objectives: Objective[]) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `توصيف المقرر: ${courseName}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        ...topics.flatMap(topic => [
          new Paragraph({
            text: `الوحدة: ${topic.title} (الوزن: ${topic.weight}%)`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "الهدف السلوكي", alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: "المستوى", alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: "نوع السؤال", alignment: AlignmentType.CENTER })] }),
                ]
              }),
              ...objectives.filter(o => o.topicId === topic.id).map(obj => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: obj.text.replace(/<[^>]*>/g, '') })] }),
                    new TableCell({ children: [new Paragraph({ text: BLOOM_LEVELS[obj.level].name, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: QUESTION_TYPES[obj.questionType].name, alignment: AlignmentType.CENTER })] }),
                  ]
                })
              )
            ]
          }),
          new Paragraph({ text: "" }),
        ])
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${courseName}_توصيف.docx`);
};

export const exportTOSToWord = async (courseName: string, topics: Topic[], bloomLevels: BloomLevel[], tosData: any) => {
  // Implementation for TOS Table in Word
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `جدول المواصفات: ${courseName}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "الموضوع / المستوى", alignment: AlignmentType.CENTER })] }),
                ...bloomLevels.map(level => new TableCell({ children: [new Paragraph({ text: BLOOM_LEVELS[level].name, alignment: AlignmentType.CENTER })] })),
                new TableCell({ children: [new Paragraph({ text: "المجموع", alignment: AlignmentType.CENTER })] }),
              ]
            }),
            ...topics.map(topic => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: topic.title })] }),
                ...bloomLevels.map(level => {
                  const cell = tosData.find((c: any) => c.topicId === topic.id && c.level === level);
                  return new TableCell({ children: [new Paragraph({ text: cell ? cell.questionCount.toString() : "0", alignment: AlignmentType.CENTER })] });
                }),
                new TableCell({ children: [new Paragraph({ text: tosData.filter((c: any) => c.topicId === topic.id).reduce((sum: number, c: any) => sum + c.questionCount, 0).toString(), alignment: AlignmentType.CENTER })] }),
              ]
            }))
          ]
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${courseName}_جدول_المواصفات.docx`);
};
