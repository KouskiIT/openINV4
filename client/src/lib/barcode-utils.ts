import { BarcodeFormat } from '@zxing/library';

export interface BarcodeInfo {
  code: string;
  format: string;
  type: 'Code128' | 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'Code39' | 'Code93' | 'Codabar' | 'Unknown';
  isValid: boolean;
  description: string;
  checkDigit?: string;
}

export class BarcodeUtils {
  // Map ZXing formats to readable names
  static formatMap: Record<string, string> = {
    [BarcodeFormat.CODE_128]: 'Code128',
    [BarcodeFormat.CODE_39]: 'Code39', 
    [BarcodeFormat.CODE_93]: 'Code93',
    [BarcodeFormat.EAN_13]: 'EAN-13',
    [BarcodeFormat.EAN_8]: 'EAN-8',
    [BarcodeFormat.UPC_A]: 'UPC-A',
    [BarcodeFormat.UPC_E]: 'UPC-E',
    [BarcodeFormat.CODABAR]: 'Codabar'
  };

  // Analyze barcode and return detailed information
  static analyzeBarcodeType(code: string, format?: BarcodeFormat): BarcodeInfo {
    const cleanCode = code.trim();
    
    // Determine format if not provided
    let detectedFormat = format;
    let formatName = 'Unknown';
    
    if (format && this.formatMap[format]) {
      formatName = this.formatMap[format];
    } else {
      // Auto-detect based on code pattern
      const detection = this.autoDetectFormat(cleanCode);
      detectedFormat = detection.format;
      formatName = detection.name;
    }

    const info: BarcodeInfo = {
      code: cleanCode,
      format: formatName,
      type: this.getType(formatName),
      isValid: this.validateBarcode(cleanCode, formatName),
      description: this.getDescription(formatName),
      checkDigit: this.getCheckDigit(cleanCode, formatName)
    };

    return info;
  }

  // Auto-detect barcode format based on pattern
  private static autoDetectFormat(code: string): { format?: BarcodeFormat; name: string } {
    const length = code.length;
    
    // EAN-13 (13 digits)
    if (length === 13 && /^\d{13}$/.test(code)) {
      return { format: BarcodeFormat.EAN_13, name: 'EAN-13' };
    }
    
    // EAN-8 (8 digits)
    if (length === 8 && /^\d{8}$/.test(code)) {
      return { format: BarcodeFormat.EAN_8, name: 'EAN-8' };
    }
    
    // UPC-A (12 digits)
    if (length === 12 && /^\d{12}$/.test(code)) {
      return { format: BarcodeFormat.UPC_A, name: 'UPC-A' };
    }
    
    // UPC-E (6-8 digits)
    if ((length === 6 || length === 7 || length === 8) && /^\d+$/.test(code)) {
      return { format: BarcodeFormat.UPC_E, name: 'UPC-E' };
    }
    
    // Code39 (alphanumeric with specific characters)
    if (/^[0-9A-Z\-. $/+%*]+$/.test(code) && code.startsWith('*') && code.endsWith('*')) {
      return { format: BarcodeFormat.CODE_39, name: 'Code39' };
    }
    
    // Code128 (mixed characters, most flexible)
    if (length >= 4 && /^[\x00-\x7F]+$/.test(code)) {
      return { format: BarcodeFormat.CODE_128, name: 'Code128' };
    }
    
    return { name: 'Unknown' };
  }

  private static getType(formatName: string): BarcodeInfo['type'] {
    switch (formatName) {
      case 'Code128': return 'Code128';
      case 'EAN-13': return 'EAN-13';
      case 'EAN-8': return 'EAN-8';
      case 'UPC-A': return 'UPC-A';
      case 'UPC-E': return 'UPC-E';
      case 'Code39': return 'Code39';
      case 'Code93': return 'Code93';
      case 'Codabar': return 'Codabar';
      default: return 'Unknown';
    }
  }

  private static getDescription(formatName: string): string {
    switch (formatName) {
      case 'Code128': return 'Code 128 - Format haute densité pour données alphanumériques';
      case 'EAN-13': return 'EAN-13 - Standard européen pour produits de consommation';
      case 'EAN-8': return 'EAN-8 - Version courte pour petits produits';
      case 'UPC-A': return 'UPC-A - Standard américain pour produits de consommation';
      case 'UPC-E': return 'UPC-E - Version compacte UPC pour petits espaces';
      case 'Code39': return 'Code 39 - Format alphanumérique industriel';
      case 'Code93': return 'Code 93 - Version améliorée de Code 39';
      case 'Codabar': return 'Codabar - Format pour bibliothèques et médical';
      default: return 'Format de code-barres non reconnu';
    }
  }

  // Calculate and validate check digits
  private static getCheckDigit(code: string, formatName: string): string | undefined {
    switch (formatName) {
      case 'EAN-13':
      case 'UPC-A':
        return this.calculateEAN13CheckDigit(code);
      case 'EAN-8':
        return this.calculateEAN8CheckDigit(code);
      default:
        return undefined;
    }
  }

  private static calculateEAN13CheckDigit(code: string): string {
    if (code.length !== 13) return '';
    
    const digits = code.slice(0, 12).split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  private static calculateEAN8CheckDigit(code: string): string {
    if (code.length !== 8) return '';
    
    const digits = code.slice(0, 7).split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  // Validate barcode based on its format
  private static validateBarcode(code: string, formatName: string): boolean {
    // First check for invalid characters that indicate false positives
    if (this.containsInvalidCharacters(code)) {
      return false;
    }

    switch (formatName) {
      case 'EAN-13':
        return this.validateEAN13(code);
      case 'EAN-8':
        return this.validateEAN8(code);
      case 'UPC-A':
        return this.validateUPC_A(code);
      case 'Code128':
        return this.validateCode128(code);
      case 'Code39':
        return this.validateCode39(code);
      case 'Code93':
      case 'Codabar':
      case 'UPC-E':
        return code.length >= 3 && code.length <= 50; // Reasonable length validation
      default:
        return false;
    }
  }

  // Check for invalid characters that indicate false positives
  private static containsInvalidCharacters(code: string): boolean {
    // Check for accented characters, special symbols that don't belong in barcodes
    const invalidChars = /[àáâãäåæçèéêëìíîïñòóôõöøùúûüý'"„""''–—…‚]/i;
    const tooManySpecialChars = /[&"'<>%@#$]{3,}/; // Multiple special chars in sequence
    const randomPattern = /^[^a-zA-Z0-9]{2,}$/; // Only special characters
    
    return invalidChars.test(code) || 
           tooManySpecialChars.test(code) || 
           randomPattern.test(code) ||
           code.length < 3 ||
           code.length > 50;
  }

  // Enhanced Code128 validation
  private static validateCode128(code: string): boolean {
    // Code128 should be alphanumeric with basic ASCII characters
    if (!/^[\x20-\x7E]+$/.test(code)) return false;
    if (code.length < 4 || code.length > 48) return false;
    
    // Reject patterns that look like UI text or random characters
    const suspiciousPatterns = [
      /^[-&"'àéèç\s]+$/,  // Pattern matching the user's issue
      /^[^\w\s]{3,}$/,    // Only special characters
      /[àáâãäåæçèéêëìíîïñòóôõöøùúûüý]/i, // Accented characters
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(code));
  }

  // Enhanced Code39 validation
  private static validateCode39(code: string): boolean {
    // Code39 character set: 0-9, A-Z, space, and symbols: - . $ / + % *
    if (!/^[0-9A-Z\-. $/+%*]+$/.test(code)) return false;
    if (code.length < 3 || code.length > 43) return false;
    
    // Should start and end with *
    return code.startsWith('*') && code.endsWith('*');
  }

  private static validateEAN13(code: string): boolean {
    if (!/^\d{13}$/.test(code)) return false;
    
    const calculatedCheckDigit = this.calculateEAN13CheckDigit(code);
    const actualCheckDigit = code.slice(-1);
    
    return calculatedCheckDigit === actualCheckDigit;
  }

  private static validateEAN8(code: string): boolean {
    if (!/^\d{8}$/.test(code)) return false;
    
    const calculatedCheckDigit = this.calculateEAN8CheckDigit(code);
    const actualCheckDigit = code.slice(-1);
    
    return calculatedCheckDigit === actualCheckDigit;
  }

  private static validateUPC_A(code: string): boolean {
    if (!/^\d{12}$/.test(code)) return false;
    
    // UPC-A uses same algorithm as EAN-13 with leading zero
    const ean13Code = '0' + code;
    return this.validateEAN13(ean13Code);
  }

  // Get color coding for different barcode types
  static getTypeColor(type: BarcodeInfo['type']): string {
    switch (type) {
      case 'Code128': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EAN-13': return 'bg-green-100 text-green-800 border-green-200';
      case 'EAN-8': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPC-A': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'UPC-E': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Code39': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Code93': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Codabar': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Get icon for barcode type
  static getTypeIcon(type: BarcodeInfo['type']): string {
    switch (type) {
      case 'Code128': return '📊';
      case 'EAN-13': return '🛒';
      case 'EAN-8': return '🛒';
      case 'UPC-A': return '🇺🇸';
      case 'UPC-E': return '🇺🇸';
      case 'Code39': return '🏭';
      case 'Code93': return '🏭';
      case 'Codabar': return '📚';
      default: return '❓';
    }
  }
}