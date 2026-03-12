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

export default function LetterTemplate({ data }) {
  const { day, suffix, month, year } = getOrdinalParts(data.date);

  return (
    <div
      className="letter-body"
      style={{
        width: '210mm',
        height: '297mm',
        overflow: 'hidden',
        backgroundImage: 'url(/letter-head.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top left',
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
        <strong><u>{data.subject || 'Reimbursement Request'}</u></strong>
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

      {/* SIGNATURES — 3 rows: AD right, Addl Dir right, DG left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25mm' }}>

        {/* Row 1: Assistant Director — right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15mm' }}>
          <div style={{ width: '62mm' }}>
            <SigBlock
              title="Assistant Director"
              dept="Software Development & Operations"
              org="Punjab Sahulat Bazaars Authority"
            />
          </div>
        </div>

        {/* Row 2: Additional Director — right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '62mm' }}>
            <SigBlock
              title="Additional Director"
              dept="Project Planning & Special Initiatives"
              org="Punjab Sahulat Bazaars Authority"
            />
          </div>
        </div>

        {/* Row 3: Director General — left */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ width: '55mm' }}>
            <SigBlock title="Director General" org="Punjab Sahulat Bazaars Authority" />
          </div>
        </div>

      </div>
    </div>
  );
}
