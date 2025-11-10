import QRCode from 'qrcode';

/**
 * Genera un código QR como Data URL (base64)
 * @param {string} data - Datos a codificar en el QR
 * @param {object} options - Opciones de QRCode
 * @returns {Promise<string>} Data URL del QR generado
 */
export const generateQRCode = async (data, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: parseInt(process.env.QR_CODE_SIZE) || 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    const qrDataUrl = await QRCode.toDataURL(data, qrOptions);
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Error al generar código QR');
  }
};

/**
 * Genera un código QR como buffer
 * @param {string} data - Datos a codificar
 * @returns {Promise<Buffer>} Buffer del QR
 */
export const generateQRCodeBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      width: parseInt(process.env.QR_CODE_SIZE) || 300
    });
    
    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Error al generar código QR');
  }
};

export default {
  generateQRCode,
  generateQRCodeBuffer
};
