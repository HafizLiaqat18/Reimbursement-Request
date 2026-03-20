import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatOrdinalDate } from './formatters';
import LetterTemplate from '../components/LetterTemplate';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, ImageRun, convertMillimetersToTwip } from 'docx';

export const getLetterMarkup = (reimbursement) => {
  const contentHtml = renderToStaticMarkup(createElement(LetterTemplate, { data: reimbursement }));
  const origin = window.location.origin;
  return contentHtml
    .replaceAll('url(/top-letter-head.png)', `url(${origin}/top-letter-head.png)`)
    .replaceAll('url(/bottom-letter-head.png)', `url(${origin}/bottom-letter-head.png)`);
};

export const buildLetterDocumentHtml = (reimbursement) => {
  const normalizedHtml = getLetterMarkup(reimbursement);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Reimbursement Letter</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        background: white;
      }
      .letter-body {
        width: 210mm !important;
        height: 297mm !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  </head>
  <body>${normalizedHtml}</body>
</html>`;
};

export const exportToDocx = async (reimbursement) => {
  const formattedDate = formatOrdinalDate(reimbursement.date);
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0';
  wrapper.innerHTML = getLetterMarkup(reimbursement);
  document.body.appendChild(wrapper);

  try {
    const element = wrapper.firstElementChild;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const imageData = canvas.toDataURL('image/png');
    const imageWidth = convertMillimetersToTwip(210);
    const imageHeight = convertMillimetersToTwip(297);

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 0, right: 0, bottom: 0, left: 0 },
              size: { width: imageWidth, height: imageHeight },
            },
          },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new ImageRun({
                  data: imageData,
                  transformation: { width: 794, height: 1123 },
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reimbursement_${formattedDate.replace(/ /g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const printLetter = (reimbursement) => {
  const html = buildLetterDocumentHtml(reimbursement);
  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) {
    throw new Error('Unable to open print window');
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
    win.close();
  };
};
