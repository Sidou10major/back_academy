/**
 * WhatsApp Notification Service
 * Uses Meta Cloud API to send WhatsApp messages.
 *
 * Setup:
 *   1. Create a Meta Business account at https://business.facebook.com
 *   2. Go to https://developers.facebook.com → Create App → Business → WhatsApp
 *   3. Get your WHATSAPP_TOKEN (permanent token) and WHATSAPP_PHONE_NUMBER_ID
 *   4. Add them to your .env file
 *
 * Note: All WhatsApp calls are fire-and-forget. Failures are logged
 * but never block the main business operation.
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Strips a phone number down to digits only (removes +, spaces, dashes).
 * Meta API expects the number without '+' prefix.
 */
const sanitizePhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/[^0-9]/g, '');
    return cleaned.length >= 10 ? cleaned : null;
};

/**
 * Send a freeform text message via WhatsApp.
 * Works only within the 24-hour customer service window or
 * when the user has opted in via a template first.
 *
 * @param {string} phone  - Recipient phone with country code (e.g., +213xxxxxxxx)
 * @param {string} text   - The message body
 */
export const sendWhatsAppText = async (phone, text) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        console.log('⚠️  WhatsApp not configured — skipping notification');
        return null;
    }

    const recipient = sanitizePhone(phone);
    if (!recipient) {
        console.log('⚠️  Invalid phone number — skipping WhatsApp:', phone);
        return null;
    }

    try {
        const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: recipient,
                type: 'text',
                text: { body: text },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ WhatsApp API error:', data.error?.message || data);
            return null;
        }

        console.log(`✅ WhatsApp sent to ${recipient}`);
        return data;
    } catch (error) {
        console.error('❌ WhatsApp send failed:', error.message);
        return null;
    }
};

/**
 * Send a pre-approved template message via WhatsApp.
 * Templates must be created and approved in the Meta Business dashboard first.
 *
 * @param {string} phone          - Recipient phone with country code
 * @param {string} templateName   - The template name (e.g., 'enrollment_confirmation')
 * @param {string} languageCode   - Template language (e.g., 'en', 'fr', 'ar')
 * @param {Array}  parameters     - Array of { type: 'text', text: 'value' } objects
 */
export const sendWhatsAppTemplate = async (phone, templateName, languageCode = 'en', parameters = []) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        console.log('⚠️  WhatsApp not configured — skipping template notification');
        return null;
    }

    const recipient = sanitizePhone(phone);
    if (!recipient) {
        console.log('⚠️  Invalid phone number — skipping WhatsApp template:', phone);
        return null;
    }

    try {
        const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

        const body = {
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
            },
        };

        // Add template parameters if provided
        if (parameters.length > 0) {
            body.template.components = [
                {
                    type: 'body',
                    parameters: parameters,
                },
            ];
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ WhatsApp template error:', data.error?.message || data);
            return null;
        }

        console.log(`✅ WhatsApp template "${templateName}" sent to ${recipient}`);
        return data;
    } catch (error) {
        console.error('❌ WhatsApp template send failed:', error.message);
        return null;
    }
};

/**
 * Convenience: send a notification to a user if they have a phone number.
 * This is the main function controllers should call.
 *
 * @param {Object} user     - Mongoose user document (must have .phone)
 * @param {string} message  - The notification text
 */
export const notifyUserViaWhatsApp = async (user, message) => {
    if (!user?.phone) return null;
    return sendWhatsAppText(user.phone, message);
};

/**
 * Convenience: send notifications to multiple users.
 * Runs all sends in parallel for speed.
 *
 * @param {Array}  users    - Array of user documents
 * @param {string} message  - The notification text
 */
export const notifyUsersViaWhatsApp = async (users, message) => {
    const usersWithPhone = users.filter(u => u.phone);
    if (usersWithPhone.length === 0) return;

    await Promise.allSettled(
        usersWithPhone.map(u => sendWhatsAppText(u.phone, message))
    );
};
