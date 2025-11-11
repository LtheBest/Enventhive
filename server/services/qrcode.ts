import QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL for an event
 * @param eventId - The event ID
 * @returns Data URL containing the QR code image (base64 PNG)
 */
export async function generateEventQRCode(eventId: string): Promise<string> {
  try {
    // Build base URL based on environment
    let baseUrl: string;
    
    if (process.env.REPLIT_DOMAIN) {
      // Production on Replit - use REPLIT_DOMAIN (singular)
      baseUrl = `https://${process.env.REPLIT_DOMAIN}`;
    } else {
      // Local development
      baseUrl = 'http://localhost:5000';
    }
    
    // Generate QR code URL pointing to the event
    const eventUrl = `${baseUrl}/events/${eventId}`;
    
    // Generate QR code as data URL (base64 encoded PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(eventUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
