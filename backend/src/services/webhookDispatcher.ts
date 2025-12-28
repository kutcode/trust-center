import { supabase } from '../server';
import crypto from 'crypto';

export async function dispatchWebhook(eventType: string, payload: any) {
    try {
        // Fetch active webhooks that subscribe to this event
        const { data: webhooks, error } = await supabase
            .from('outbound_webhooks')
            .select('*')
            .eq('is_active', true)
            .contains('event_types', [eventType]);

        if (error) {
            console.error('Failed to fetch webhooks:', error);
            return;
        }

        if (!webhooks || webhooks.length === 0) return;

        console.log(`Dispatching event ${eventType} to ${webhooks.length} webhooks`);

        const promises = webhooks.map(async (webhook) => {
            try {
                const signature = crypto
                    .createHmac('sha256', webhook.secret)
                    .update(JSON.stringify(payload))
                    .digest('hex');

                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-TrustCenter-Event': eventType,
                        'X-TrustCenter-Signature': signature,
                        'User-Agent': 'TrustCenter-Webhook/1.0'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    console.error(`Webhook ${webhook.id} failed: ${response.statusText}`);
                    // TODO: Retry logic?
                }
            } catch (err: any) {
                console.error(`Webhook ${webhook.id} error:`, err.message);
            }
        });

        // Don't await strictly if we want fire-and-forget? 
        // But better to await Promise.allSettled to not block too long but ensure execution.
        await Promise.allSettled(promises);

    } catch (error: any) {
        console.error('Webhook dispatch error:', error);
    }
}
