import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface NDAModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => Promise<void>;
    isAccepting: boolean;
}

export default function NDAModal({ isOpen, onClose, onAccept, isAccepting }: NDAModalProps) {
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 border-b pb-4">
                                                Non-Disclosure Agreement
                                            </Dialog.Title>
                                            <div className="mt-4 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded border text-sm text-gray-700 space-y-4">
                                                <p><strong>IMPORTANT: PLEASE READ CAREFULLY.</strong></p>
                                                <p>
                                                    This Non-Disclosure Agreement ("Agreement") is entered into by and between the recipient of these documents ("Recipient") and the Organization providing the documents ("Disclosing Party").
                                                </p>
                                                <p>
                                                    1. <strong>Confidential Information.</strong> "Confidential Information" means all non-public information, technical data, or know-how concerning the Disclosing Party's business, products, or services.
                                                </p>
                                                <p>
                                                    2. <strong>Obligations.</strong> Recipient agrees to: (a) hold Confidential Information in strict confidence; (b) not disclose Confidential Information to any third parties without prior written consent; and (c) use Confidential Information solely for the purpose of evaluating a business relationship with the Disclosing Party.
                                                </p>
                                                <p>
                                                    3. <strong>Term.</strong> The obligations of confidentiality shall survive for a period of five (5) years from the date of disclosure.
                                                </p>
                                                <p>
                                                    By clicking "I Agree" below, you confirm that you have read, understood, and agree to be bound by the terms of this Agreement.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                                        onClick={onAccept}
                                        disabled={isAccepting}
                                    >
                                        {isAccepting ? 'Processing...' : 'I Agree & Download'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
