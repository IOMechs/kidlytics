import jsPDF from 'jspdf';
/**
 * Generate a square-shaped storybook PDF with dark theme
 * @param title The title of the story
 * @param storyParts Array of story parts { content: string; imageUri: string }
 */
export async function generateStoryPdf(
  title: string,
  storyParts: { content: string; imageUri: string }[]
) {
  if (!storyParts || storyParts.length === 0) {
    console.error('No story parts found.');
    return;
  }
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 210], // Square PDF
  });

  const margin = 10;
  const usableWidth = 190 - margin * 2;
  const imageHeight = (usableWidth * 9) / 16; // 16:9 aspect ratio

  for (let i = 0; i < storyParts.length; i++) {
    const part = storyParts[i];

    // Dark background
    pdf.setFillColor(40, 42, 54); // Dracula-ish dark bg
    pdf.rect(0, 0, 210, 210, 'F');

    // Title on first page
    if (i === 0) {
      pdf.setFontSize(24);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(248, 248, 242); // Dracula foreground
      pdf.text(title, 105, 20, { align: 'center' });
    }
    console.log(pdf.getFontList());

    // Add image
    const imageBase64 = await toBase64(part.imageUri);
    if (imageBase64) {
      const yPos = i === 0 ? 30 : margin;
      const xPos = (210 - usableWidth) / 2;

      pdf.addImage(imageBase64, 'JPEG', xPos, yPos, usableWidth, imageHeight);
    }

    // Add text
    const textStartY = (i === 0 ? 30 : margin) + imageHeight + 10;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(248, 248, 242); // Dracula foreground

    const textLines = pdf.splitTextToSize(part.content, usableWidth);
    pdf.text(textLines, 105, textStartY, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(200, 200, 200);

    pdf.textWithLink('Generated on Kidlytics', 105, 200, {
      url: 'https://kidlytics--kidlytics.europe-west4.hosted.app/',
      align: 'center',
    });

    // Add new page unless it's the last one
    if (i < storyParts.length - 1) {
      pdf.addPage();
    }
  }

  pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Convert image URL to base64
 */
function toBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
