import crypto from 'crypto';
import QRCode from 'qrcode';

export const generateShortUrl = (length = 7) => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += characters[bytes[i] % characters.length];
  }
  
  return result;
};

export const validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const generateQRCode = async (url) => {
  try {
    const qrcodeData = await QRCode.toDataURL(url);
    return qrcodeData;
  } catch (error) {
    throw new Error('QR Code generation failed');
  }
};

export const fetchUrlMetadata = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkerlyBot/1.0; +http://linkerly.com/bot)'
      }
    });
    const html = await response.text();

    const getMetaTag = (name) => {
      const match = html.match(new RegExp(`<meta\\s+(?:name|property)=["'](?:og:|twitter:)?${name}["']\\s+content=["']([^"']+)["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMetaTag('title') || (titleMatch ? titleMatch[1] : '') || '';
    const description = getMetaTag('description') || '';
    const image = getMetaTag('image') || '';

    return { title, description, image };
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return {
      title: null,
      description: null,
      image: null,
    };
  }
};