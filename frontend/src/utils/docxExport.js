import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ImageRun,
  VerticalAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  convertMillimetersToTwip,
} from 'docx';
import { formatCurrency, formatOrdinalDate } from './formatters';

// ─── helpers ────────────────────────────────────────────────────────────────

const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const SIG_BORDER  = { style: BorderStyle.SINGLE, size: 6, color: '000000' };

const noBorders = {
  top: NONE_BORDER, bottom: NONE_BORDER,
  left: NONE_BORDER, right: NONE_BORDER,
};

const noTableBorders = { ...noBorders, insideH: NONE_BORDER, insideV: NONE_BORDER };

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Times New Roman',
    size: opts.size ?? 28,          // half-points (28 = 14pt)
    bold: opts.bold ?? false,
    underline: opts.underline ? {} : undefined,
    color: opts.color ?? '000000',
    superScript: opts.superScript ?? false,
  });
}

function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: {
      before: opts.before ?? 0,
      after:  opts.after  ?? 120,
      line:   opts.line   ?? 276,
    },
    border: opts.border,
    indent: opts.indent,
  });
}

function cell(children, opts = {}) {
  return new TableCell({
    children,
    borders: opts.borders ?? noBorders,
    verticalAlign: opts.valign ?? VerticalAlign.TOP,
    width: opts.width,
    columnSpan: opts.span,
  });
}

async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function buildExpenseSuffix(exp) {
  if (exp.pkrAmount) return ` (PKR ${formatCurrency(exp.pkrAmount)})`;
  if (exp.tax > 0)   return ' + tax';
  return '';
}

// ─── main export ────────────────────────────────────────────────────────────

export const exportToDocx = async (reimbursement) => {
  const formattedDate = formatOrdinalDate(reimbursement.date);

  // Fetch letterhead background
  const letterheadData = await fetchImageBuffer('/letter-head.png');

  // ── LETTERHEAD BACKGROUND PARAGRAPH ──────────────────────────────────────
  // Places letter-head.png as a full-page floating image behind all text.
  const letterheadPara = letterheadData
    ? new Paragraph({
        children: [
          new ImageRun({
            data: letterheadData,
            transformation: {
              width:  794,   // A4 at 96dpi: 210mm / 25.4 * 96 ≈ 794px
              height: 1123,  // A4 at 96dpi: 297mm / 25.4 * 96 ≈ 1123px
            },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                offset: 0,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                offset: 0,
              },
              allowOverlap: true,
              behindDocument: true,
              wrap: { type: TextWrappingType.NONE },
            },
          }),
        ],
        spacing: { before: 0, after: 0 },
      })
    : null;

  // ── DATE ──────────────────────────────────────────────────────────────────
  const datePara = para(
    [run(`Dated: ${formattedDate}`, { bold: true })],
    { before: 0, after: 160 }
  );

  // ── SUBJECT ───────────────────────────────────────────────────────────────
  const subjectPara = para(
    [
      run('Subject:', { bold: true }),
      run('    '),
      run(reimbursement.subject || 'Reimbursement Request', { bold: true, underline: true }),
    ],
    { after: 200 }
  );

  // ── BODY PARA 1 ───────────────────────────────────────────────────────────
  const bodyPara1 = para(
    [run('With reference to the attached approval letter, I kindly request reimbursement for the following official expenses:')],
    { align: AlignmentType.JUSTIFIED, after: 120 }
  );

  // ── EXPENSE BULLET LIST ───────────────────────────────────────────────────
  const bulletItems = reimbursement.expenses.map((exp) => {
    const suffix = buildExpenseSuffix(exp);
    return para(
      [
        run('\u2022  '),
        run(exp.vendor, { bold: true }),
        run(` \u2013 ${exp.currency} ${formatCurrency(exp.amount)}${suffix}`),
      ],
      {
        indent: { left: convertMillimetersToTwip(7) },
        after: 80,
      }
    );
  });

  // ── BODY PARA 2 ───────────────────────────────────────────────────────────
  const bodyPara2 = para(
    [run('The above payments were made from my personal account for official use. Relevant invoices/receipts are attached for your processing.')],
    { align: AlignmentType.JUSTIFIED, before: 120, after: 120 }
  );

  // ── BODY PARA 3 ───────────────────────────────────────────────────────────
  const bodyPara3 = para(
    [run('I kindly request reimbursement of the amount, including applicable taxes, at your earliest convenience.')],
    { align: AlignmentType.JUSTIFIED, after: 240 }
  );

  // ── ACCOUNT DETAILS ───────────────────────────────────────────────────────
  const accountHeader = para(
    [run('Account Details:', { bold: true, underline: true })],
    { after: 100 }
  );

  const holderPara = para(
    [run('Account Holder: ', { bold: true }), run(reimbursement.accountDetails.accountHolder)],
    { after: 60 }
  );

  const bankPara = para(
    [run('Bank: ', { bold: true }), run(reimbursement.accountDetails.bank)],
    { after: 60 }
  );

  const accountPara = para(
    [run('Account: ', { bold: true }), run(reimbursement.accountDetails.accountNumber)],
    { after: 0 }
  );

  // ── SIGNATURE TABLES ──────────────────────────────────────────────────────
  function sigBlock(title, line1, line2, spacingBefore = 0) {
    return [
      para([run('')], {
        before: spacingBefore,
        after: 60,
        border: { top: SIG_BORDER },
      }),
      para([run(title, { bold: true })],  { align: AlignmentType.CENTER, after: 40 }),
      ...(line1 ? [para([run(line1)], { align: AlignmentType.CENTER, after: 40 })] : []),
      ...(line2 ? [para([run(line2)], { align: AlignmentType.CENTER, after: 0  })] : []),
    ];
  }

  // Right: Assistant Director + Additional Director
  const sigRightTable = new Table({
    rows: [
      new TableRow({
        children: [
          cell([para([run('')], { after: 0 })], {
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          cell(
            [
              ...sigBlock('Assistant Director', 'Software Development & Operations', 'Punjab Sahulat Bazaars Authority', 800),
              para([run('')], { before: 400, after: 0 }),
              ...sigBlock('Additional Director', 'Project Planning & Special Initiatives', 'Punjab Sahulat Bazaars Authority', 0),
            ],
            { width: { size: 50, type: WidthType.PERCENTAGE } }
          ),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
  });

  // Left: Director General
  const sigDgTable = new Table({
    rows: [
      new TableRow({
        children: [
          cell(
            sigBlock('Director General', 'Punjab Sahulat Bazaars Authority', '', 600),
            { width: { size: 50, type: WidthType.PERCENTAGE } }
          ),
          cell([para([run('')], { after: 0 })], {
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
  });

  // ── BUILD DOCUMENT ────────────────────────────────────────────────────────
  const children = [
    // letterhead MUST be first so it sits behind all content
    ...(letterheadPara ? [letterheadPara] : []),
    datePara,
    subjectPara,
    bodyPara1,
    ...bulletItems,
    bodyPara2,
    bodyPara3,
    accountHeader,
    holderPara,
    bankPara,
    accountPara,
    sigRightTable,
    sigDgTable,
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 28 }, // 28 half-points = 14pt
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width:  convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            // Margins match the letterhead content area.
            // Adjust top/bottom if content appears too high or too low.
            margin: {
              top:    convertMillimetersToTwip(55),
              bottom: convertMillimetersToTwip(28),
              left:   convertMillimetersToTwip(22),
              right:  convertMillimetersToTwip(22),
            },
          },
        },
        children,
      },
    ],
  });

  // ── TRIGGER DOWNLOAD ──────────────────────────────────────────────────────
  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Reimbursement_${formattedDate.replace(/ /g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
