import { formatCurrency, getOrdinalParts } from '../utils/formatters';

function expenseLine(exp) {
  if (exp.pkrAmount) {
    return ` \u2013 ${exp.currency} ${formatCurrency(exp.amount)} (PKR ${formatCurrency(exp.pkrAmount)})`;
  }
  if (exp.tax > 0) {
    return ` \u2013 ${exp.currency} ${formatCurrency(exp.amount)} + tax`;
  }
  return ` \u2013 ${exp.currency} ${formatCurrency(exp.amount)}`;
}

function getNormalizedSubject(subject) {
  const cleaned = String(subject || '').trim();
  if (!cleaned) return 'Request for Reimbursement';
  return cleaned
    .replace(/reuqest/gi, 'Request')
    .replace(/reimbursement request/gi, 'Request for Reimbursement');
}

/* Signature block: line immediately followed by tight text — no gap */
function SigBlock({ title, dept, org }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ borderTop: '1px solid #000' }} />  {/* line — zero padding below */}
      <div style={{
        fontSize: '13.5px',
        lineHeight: '1.2',
        fontFamily: "'Times New Roman', Times, serif",
        marginTop: '1px',   /* only 1px between line and first text row */
      }}>
        <div style={{ fontWeight: 'bold' }}>{title}</div>
        {dept && <div>{dept}</div>}
        <div>{org}</div>
      </div>
    </div>
  );
}

function getStampPlacements(data) {
  if (Array.isArray(data.stampPlacements) && data.stampPlacements.length > 0) {
    return data.stampPlacements
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item, index) => {
        const stamp = item.stamp || {};
        return {
          key: `${stamp._id || 'stamp'}-${index}`,
          title: stamp.title || 'Stamp',
          dept: stamp.department || '',
          org: stamp.organization || '',
          alignment: item.alignment || stamp.defaultAlignment || 'right',
          lineWidthMm: item.lineWidthMm || stamp.defaultLineWidthMm || 62,
          spacingBeforeMm: item.spacingBeforeMm || 0,
        };
      });
  }

  return [
    {
      key: 'default-1',
      title: 'Assistant Director',
      dept: 'Software Development & Operations',
      org: 'Punjab Sahulat Bazaars Authority',
      alignment: 'right',
      lineWidthMm: 62,
      spacingBeforeMm: 15,
    },
    {
      key: 'default-2',
      title: 'Additional Director',
      dept: 'Project Planning & Special Initiatives',
      org: 'Punjab Sahulat Bazaars Authority',
      alignment: 'right',
      lineWidthMm: 62,
      spacingBeforeMm: 25,
    },
    {
      key: 'default-3',
      title: 'Director General',
      dept: '',
      org: 'Punjab Sahulat Bazaars Authority',
      alignment: 'left',
      lineWidthMm: 55,
      spacingBeforeMm: 25,
    },
  ];
}

export default function LetterTemplate({ data }) {
  const { day, suffix, month, year } = getOrdinalParts(data.date);
  const placements = getStampPlacements(data);

  return (
    <div
      className="letter-body"
      style={{
        width: '210mm',
        height: '297mm',
        overflow: 'hidden',
        position: 'relative',
        backgroundImage: 'url(/top-letter-head.png), url(/bottom-letter-head.png)',
        backgroundSize: '188mm auto, 188mm auto',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: 'top center, bottom center',
        paddingTop: '52mm',
        paddingBottom: '25mm',
        paddingLeft: '20mm',
        paddingRight: '20mm',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '16.5px',
        lineHeight: '1.45',
        color: '#000',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* DATE */}
      <p style={{ margin: '0 0 2mm', fontWeight: 'bold' }}>
        Dated: {day}<sup style={{ fontSize: '8px' }}>{suffix}</sup> {month} {year}
      </p>

      {/* SUBJECT */}
      <p style={{ margin: '0 0 2.5mm' }}>
        <strong>Subject:</strong>&nbsp;
        <strong><u>{getNormalizedSubject(data.subject)}</u></strong>
      </p>

      {/* BODY 1 */}
      <p style={{ margin: '0 0 1.5mm', textAlign: 'justify' }}>
        With reference to the attached approval letter, I kindly request reimbursement
        for the following official expenses:
      </p>

      {/* BULLET LIST */}
      <ul style={{ margin: '0 0 1.5mm', paddingLeft: '6mm', lineHeight: '1.4' }}>
        {data.expenses.map((exp, idx) => (
          <li key={idx} style={{ marginBottom: '0.5mm' }}>
            <strong>{exp.vendor}</strong>{expenseLine(exp)}
          </li>
        ))}
      </ul>

      {/* BODY 2 */}
      <p style={{ margin: '0 0 1.5mm', textAlign: 'justify' }}>
        The above payments were made from my personal account for official use. Relevant
        invoices/receipts are attached for your processing.
      </p>

      {/* BODY 3 */}
      <p style={{ margin: '0 0 3mm', textAlign: 'justify' }}>
        I kindly request reimbursement of the amount, including applicable taxes, at your
        earliest convenience.
      </p>

      {/* ACCOUNT DETAILS */}
      <div style={{ marginBottom: '1mm', fontWeight: 'bold', textDecoration: 'underline' }}>
        Account Details:
      </div>
      <div style={{ marginBottom: '0.5mm' }}>
        <strong>Account Holder:</strong> {data.accountDetails.accountHolder}
      </div>
      <div style={{ marginBottom: '0.5mm' }}>
        <strong>Bank:</strong> {data.accountDetails.bank}
      </div>
      <div><strong>Account:</strong> {data.accountDetails.accountNumber}</div>

      {/* SPACER — fills remaining space before signatures */}
      <div style={{ flex: 1 }} />

      {/* DYNAMIC STAMPS */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {placements.map((placement) => (
          <div
            key={placement.key}
            style={{
              display: 'flex',
              justifyContent:
                placement.alignment === 'left'
                  ? 'flex-start'
                  : placement.alignment === 'center'
                    ? 'center'
                    : 'flex-end',
              marginTop: `${placement.spacingBeforeMm}mm`,
            }}
          >
            <div style={{ width: `${placement.lineWidthMm}mm` }}>
              <SigBlock title={placement.title} dept={placement.dept} org={placement.org} />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
