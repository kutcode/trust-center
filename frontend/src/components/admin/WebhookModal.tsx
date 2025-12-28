import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

interface WebhookModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
    onSaved: () => void;
}

const AVAILABLE_EVENTS = [
    { id: 'request.created', label: 'Request Created' },
    { id: 'request.approved', label: 'Request Approved' },
    { id: 'request.denied', label: 'Request Denied' }
];

export default function WebhookModal({ isOpen, onClose, token, onSaved }: WebhookModalProps) {
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (selectedEvents.length === 0) {
            toast.error('Please select at least one event');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/outbound-webhooks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    url,
                    description,
                    event_types: selectedEvents
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create webhook');
            }

            toast.success('Webhook created successfully');
            setUrl('');
            setDescription('');
            setSelectedEvents([]);
            onSaved();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create webhook');
        } finally {
            setLoading(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        if (selectedEvents.includes(eventId)) {
            setSelectedEvents(selectedEvents.filter(e => e !== eventId));
        } else {
            setSelectedEvents([...selectedEvents, eventId]);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <form onSubmit={handleSubmit}>
                                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                                <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                    Add Outbound Webhook
                                                </Dialog.Title>
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                                                            Payload URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            name="url"
                                                            id="url"
                                                            required
                                                            value={url}
                                                            onChange={(e) => setUrl(e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                            placeholder="https://api.yourcrm.com/webhook"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                                            Description
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="description"
                                                            id="description"
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                            placeholder="Sync with SalesForce"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Trigger Events
                                                        </label>
                                                        <div className="space-y-2">
                                                            {AVAILABLE_EVENTS.map(ev => (
                                                                <div key={ev.id} className="flex items-center">
                                                                    <input
                                                                        id={`event-${ev.id}`}
                                                                        type="checkbox"
                                                                        checked={selectedEvents.includes(ev.id)}
                                                                        onChange={() => toggleEvent(ev.id)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <label htmlFor={`event-${ev.id}`} className="ml-2 block text-sm text-gray-900">
                                                                        {ev.label}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                                        >
                                            {loading ? 'Creating...' : 'Create Webhook'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
