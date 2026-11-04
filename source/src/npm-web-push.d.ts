// The send-notifications Edge Function (Deno) imports web-push through Deno's npm: specifier; the tests replace it.
declare module 'npm:web-push@3.6.7' {
  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void
    sendNotification(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string): Promise<unknown>
  }
  export default webpush
}
