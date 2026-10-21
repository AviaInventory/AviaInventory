// Minimal types for @paystack/inline-js (the package ships none). Only what the app uses.
declare module "@paystack/inline-js" {
  interface PaystackCallbacks {
    onLoad?: (transaction: { id: number; accessCode: string }) => void;
    onSuccess?: (transaction: { id: number; reference: string; message: string }) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
  }

  export default class PaystackPop {
    /** Opens the checkout pop-up for a transaction initialised on the server. */
    resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): unknown;
  }
}
