import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from '../config/firebase'

export type UserRole = 'admin' | 'reader'

export interface UserProfile {
  displayName: string
  email: string
  photoURL: string
  role: UserRole
  preferences: {
    fontSize: number
    theme: 'light' | 'sepia' | 'dark'
    fontFamily: 'Amiri' | 'Noto Naskh Arabic' | 'Scheherazade New'
    lineHeight: number
  }
  stats: {
    totalBooksRead: number
    totalVocabSaved: number
    currentStreak: number
    lastActiveDate: unknown
  }
  createdAt: unknown
}

const googleProvider = new GoogleAuthProvider()

const defaultUserPayload = (email: string, displayName: string, photoURL = ''): UserProfile => ({
  displayName,
  email,
  photoURL,
  role: 'reader',
  preferences: {
    fontSize: 24,
    theme: 'sepia',
    fontFamily: 'Amiri',
    lineHeight: 1.8,
  },
  stats: {
    totalBooksRead: 0,
    totalVocabSaved: 0,
    currentStreak: 0,
    lastActiveDate: serverTimestamp(),
  },
  createdAt: serverTimestamp(),
})

export async function uploadAvatar(uid: string, file: File) {
  const fileRef = ref(storage, `avatars/${uid}/${Date.now()}-${file.name}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export async function signupWithEmail(
  email: string,
  password: string,
  displayName: string,
  avatarFile?: File,
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { user } = credential

  const photoURL = avatarFile ? await uploadAvatar(user.uid, avatarFile) : ''

  await updateProfile(user, { displayName, photoURL })

  await setDoc(doc(db, 'users', user.uid), defaultUserPayload(email, displayName, photoURL), {
    merge: true,
  })

  return user
}

export async function signinWithEmail(email: string, password: string, rememberMe: boolean) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signinWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  const { user } = credential
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(
      userRef,
      defaultUserPayload(user.email ?? '', user.displayName ?? 'قارئ جديد', user.photoURL ?? ''),
      { merge: true },
    )
  }

  return user
}

export async function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email)
}

export async function updateDisplayName(uid: string, displayName: string) {
  if (!auth.currentUser) {
    throw new Error('المستخدم غير مسجل الدخول')
  }

  await updateProfile(auth.currentUser, { displayName })
  await updateDoc(doc(db, 'users', uid), {
    displayName,
    'stats.lastActiveDate': serverTimestamp(),
  })
}

export async function changeUserPassword(newPassword: string) {
  if (!auth.currentUser) {
    throw new Error('المستخدم غير مسجل الدخول')
  }

  await updatePassword(auth.currentUser, newPassword)
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'حدث خطأ غير متوقع. حاول مرة أخرى.'
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'هذا البريد مستخدم بالفعل.'
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة.'
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة. استخدم 6 أحرف أو أكثر.'
    case 'auth/operation-not-allowed':
      return 'تسجيل البريد/كلمة المرور غير مفعّل في Firebase.'
    case 'auth/network-request-failed':
      return 'مشكلة في الشبكة. تحقق من الاتصال.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'بيانات الدخول غير صحيحة.'
    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة تسجيل الدخول قبل الإكمال.'
    case 'auth/too-many-requests':
      return 'تم تنفيذ محاولات كثيرة. حاول لاحقًا.'
    default:
      return `خطأ Firebase: ${error.code}`
  }
}

