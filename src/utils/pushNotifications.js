import { supabase } from '../lib/supabase'

export const VAPID_PUBLIC_KEY = 'BO7wPlOuepvEl5kkVt-skJ8tSIKukX-yhRvLzHxYVA-VQpnTdghZQgHBdnPpL-E7fx8kcsaez3cX6Xz_9XAULlM'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPushPermissionState() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return registration
  } catch (err) {
    console.error('Service Worker registration error:', err)
    return null
  }
}

export async function subscribeUserToPush(userId) {
  if (!userId) return { success: false, error: 'Usuário não autenticado' }

  try {
    const supported = await isPushSupported()
    if (!supported) return { success: false, error: 'Navegador não suporta Notificações Push' }

    // 1. Request Notification Permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Permissão para notificações foi negada' }
    }

    // 2. Register Service Worker
    const registration = await registerServiceWorker()
    if (!registration) {
      return { success: false, error: 'Falha ao registrar Service Worker' }
    }

    await navigator.serviceWorker.ready

    // 3. Subscribe with PushManager
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    }

    const subJson = subscription.toJSON()
    const endpoint = subJson.endpoint
    const p256dh = subJson.keys?.p256dh
    const auth = subJson.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return { success: false, error: 'Falha ao obter chaves de subscrição' }
    }

    // 4. Save to Supabase notificacoes_push table
    const { error: dbError } = await supabase.from('notificacoes_push').upsert({
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' })

    if (dbError) {
      console.error('Error saving subscription to DB:', dbError)
      return { success: false, error: dbError.message }
    }

    return { success: true, subscription }
  } catch (err) {
    console.error('subscribeUserToPush error:', err)
    return { success: false, error: err.message || 'Erro ao ativar notificações' }
  }
}

export async function unsubscribeUserFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      if (userId && endpoint) {
        await supabase.from('notificacoes_push').delete().eq('endpoint', endpoint).eq('user_id', userId)
      }
    }
    return { success: true }
  } catch (err) {
    console.error('unsubscribeUserFromPush error:', err)
    return { success: false, error: err.message }
  }
}
