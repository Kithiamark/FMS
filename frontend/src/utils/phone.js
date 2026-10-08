/**
 * Normalizes user-entered mobile numbers to standard E.164 Kenyan format (+254...)
 * Handles inputs like:
 *   '712345678'    -> '+254712345678'
 *   '0712345678'   -> '+254712345678'
 *   '254712345678' -> '+254712345678'
 *   '+254712345678'-> '+254712345678'
 */
export const normalizeKenyanPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.toString().trim().replace(/[\s-]/g, '');
    if (cleaned.startsWith('+254')) return cleaned;
    if (cleaned.startsWith('254')) return '+' + cleaned;
    if (cleaned.startsWith('0')) return '+254' + cleaned.substring(1);
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) return '+254' + cleaned;
    if (!cleaned.startsWith('+')) return '+254' + cleaned;
    return cleaned;
};
