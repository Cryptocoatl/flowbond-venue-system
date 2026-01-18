import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'es' | 'fr';

export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

// Translation dictionaries
const translations: Record<Language, Record<string, any>> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try again',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
    },
    onboarding: {
      welcome: 'Welcome to FlowBond',
      selectLanguage: 'Select your language',
      continueAsGuest: 'Continue as Guest',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      guestNote: 'You can create an account later to save your progress',
    },
    scan: {
      title: 'Scan QR Code',
      instruction: 'Point your camera at a QR code to get started',
      scanning: 'Scanning...',
      permissionRequired: 'Camera permission required',
      permissionDenied: 'Camera permission denied. Please enable it in your settings.',
      invalidCode: 'Invalid QR code',
      tryAgain: 'Please try scanning another code',
    },
    quest: {
      title: 'Quest',
      sponsored: 'Sponsored by',
      tasksCompleted: '{{completed}} of {{total}} tasks completed',
      completeToUnlock: 'Complete all tasks to unlock your reward',
      reward: 'Reward',
      claimReward: 'Claim Your Reward',
      rewardClaimed: 'Reward Claimed!',
      viewPass: 'View Your Drink Pass',
      expired: 'This quest has expired',
      maxReached: 'Maximum completions reached',
    },
    task: {
      qrScan: 'Scan QR Code',
      qrScanDescription: 'Scan the QR code at the specified location',
      survey: 'Complete Survey',
      surveyDescription: 'Answer a few quick questions',
      checkin: 'Check In',
      checkinDescription: 'Check in at the specified location',
      socialShare: 'Share on Social',
      socialShareDescription: 'Share your experience on social media',
      custom: 'Complete Task',
      completed: 'Completed',
      markComplete: 'Mark as Complete',
      required: 'Required',
      optional: 'Optional',
    },
    reward: {
      drinkPass: 'Drink Pass',
      code: 'Code',
      expiresAt: 'Expires',
      expiresIn: 'Expires in {{time}}',
      status: {
        active: 'Active',
        redeemed: 'Redeemed',
        expired: 'Expired',
        cancelled: 'Cancelled',
      },
      showToStaff: 'Show this code to staff to redeem',
      redeemNow: 'Redeem Now',
      cancelPass: 'Cancel Pass',
      confirmCancel: 'Are you sure you want to cancel this drink pass?',
      noPasses: 'No drink passes yet',
      completeQuest: 'Complete a quest to earn your first drink pass!',
    },
    staff: {
      title: 'Staff Portal',
      scanToRedeem: 'Scan pass to redeem',
      enterCode: 'Or enter code manually',
      verifying: 'Verifying...',
      passValid: 'Pass Valid',
      passInvalid: 'Pass Invalid',
      alreadyRedeemed: 'Already redeemed',
      expired: 'Pass has expired',
      confirmRedeem: 'Confirm redemption?',
      redeemed: 'Pass Redeemed!',
      drinkDetails: 'Drink Details',
    },
    auth: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signUp: 'Sign Up',
      logIn: 'Log In',
      logOut: 'Log Out',
      invalidCredentials: 'Invalid email or password',
      emailExists: 'This email is already registered',
    },
    errors: {
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      notFound: 'Not found',
      unauthorized: 'Please sign in to continue',
      forbidden: 'You do not have permission to do this',
    },
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Algo salió mal',
      retry: 'Intentar de nuevo',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      back: 'Atrás',
      next: 'Siguiente',
      done: 'Listo',
      close: 'Cerrar',
      yes: 'Sí',
      no: 'No',
    },
    onboarding: {
      welcome: 'Bienvenido a FlowBond',
      selectLanguage: 'Selecciona tu idioma',
      continueAsGuest: 'Continuar como Invitado',
      signIn: 'Iniciar Sesión',
      createAccount: 'Crear Cuenta',
      guestNote: 'Puedes crear una cuenta más tarde para guardar tu progreso',
    },
    scan: {
      title: 'Escanear Código QR',
      instruction: 'Apunta tu cámara a un código QR para comenzar',
      scanning: 'Escaneando...',
      permissionRequired: 'Se requiere permiso de cámara',
      permissionDenied: 'Permiso de cámara denegado. Por favor, habilítalo en la configuración.',
      invalidCode: 'Código QR inválido',
      tryAgain: 'Por favor, intenta escanear otro código',
    },
    quest: {
      title: 'Misión',
      sponsored: 'Patrocinado por',
      tasksCompleted: '{{completed}} de {{total}} tareas completadas',
      completeToUnlock: 'Completa todas las tareas para desbloquear tu recompensa',
      reward: 'Recompensa',
      claimReward: 'Reclamar Recompensa',
      rewardClaimed: '¡Recompensa Reclamada!',
      viewPass: 'Ver Tu Pase de Bebida',
      expired: 'Esta misión ha expirado',
      maxReached: 'Se alcanzó el máximo de completaciones',
    },
    task: {
      qrScan: 'Escanear Código QR',
      qrScanDescription: 'Escanea el código QR en la ubicación especificada',
      survey: 'Completar Encuesta',
      surveyDescription: 'Responde algunas preguntas rápidas',
      checkin: 'Registrarse',
      checkinDescription: 'Regístrate en la ubicación especificada',
      socialShare: 'Compartir en Redes',
      socialShareDescription: 'Comparte tu experiencia en redes sociales',
      custom: 'Completar Tarea',
      completed: 'Completado',
      markComplete: 'Marcar como Completado',
      required: 'Requerido',
      optional: 'Opcional',
    },
    reward: {
      drinkPass: 'Pase de Bebida',
      code: 'Código',
      expiresAt: 'Expira',
      expiresIn: 'Expira en {{time}}',
      status: {
        active: 'Activo',
        redeemed: 'Canjeado',
        expired: 'Expirado',
        cancelled: 'Cancelado',
      },
      showToStaff: 'Muestra este código al personal para canjear',
      redeemNow: 'Canjear Ahora',
      cancelPass: 'Cancelar Pase',
      confirmCancel: '¿Estás seguro de que quieres cancelar este pase de bebida?',
      noPasses: 'Aún no hay pases de bebida',
      completeQuest: '¡Completa una misión para ganar tu primer pase de bebida!',
    },
    staff: {
      title: 'Portal del Personal',
      scanToRedeem: 'Escanear pase para canjear',
      enterCode: 'O ingresa el código manualmente',
      verifying: 'Verificando...',
      passValid: 'Pase Válido',
      passInvalid: 'Pase Inválido',
      alreadyRedeemed: 'Ya canjeado',
      expired: 'El pase ha expirado',
      confirmRedeem: '¿Confirmar canje?',
      redeemed: '¡Pase Canjeado!',
      drinkDetails: 'Detalles de la Bebida',
    },
    auth: {
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      hasAccount: '¿Ya tienes una cuenta?',
      signUp: 'Registrarse',
      logIn: 'Iniciar Sesión',
      logOut: 'Cerrar Sesión',
      invalidCredentials: 'Correo o contraseña inválidos',
      emailExists: 'Este correo ya está registrado',
    },
    errors: {
      networkError: 'Error de red. Por favor, verifica tu conexión.',
      serverError: 'Error del servidor. Por favor, intenta más tarde.',
      notFound: 'No encontrado',
      unauthorized: 'Por favor, inicia sesión para continuar',
      forbidden: 'No tienes permiso para hacer esto',
    },
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: "Une erreur s'est produite",
      retry: 'Réessayer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      back: 'Retour',
      next: 'Suivant',
      done: 'Terminé',
      close: 'Fermer',
      yes: 'Oui',
      no: 'Non',
    },
    onboarding: {
      welcome: 'Bienvenue sur FlowBond',
      selectLanguage: 'Sélectionnez votre langue',
      continueAsGuest: 'Continuer en tant qu\'invité',
      signIn: 'Se connecter',
      createAccount: 'Créer un compte',
      guestNote: 'Vous pouvez créer un compte plus tard pour sauvegarder votre progression',
    },
    scan: {
      title: 'Scanner le code QR',
      instruction: 'Pointez votre caméra vers un code QR pour commencer',
      scanning: 'Scan en cours...',
      permissionRequired: 'Autorisation de caméra requise',
      permissionDenied: 'Autorisation de caméra refusée. Veuillez l\'activer dans vos paramètres.',
      invalidCode: 'Code QR invalide',
      tryAgain: 'Veuillez scanner un autre code',
    },
    quest: {
      title: 'Quête',
      sponsored: 'Sponsorisé par',
      tasksCompleted: '{{completed}} sur {{total}} tâches complétées',
      completeToUnlock: 'Complétez toutes les tâches pour débloquer votre récompense',
      reward: 'Récompense',
      claimReward: 'Réclamer votre récompense',
      rewardClaimed: 'Récompense réclamée !',
      viewPass: 'Voir votre Pass Boisson',
      expired: 'Cette quête a expiré',
      maxReached: 'Nombre maximum de complétions atteint',
    },
    task: {
      qrScan: 'Scanner le code QR',
      qrScanDescription: 'Scannez le code QR à l\'emplacement indiqué',
      survey: 'Compléter le sondage',
      surveyDescription: 'Répondez à quelques questions rapides',
      checkin: 'Enregistrement',
      checkinDescription: 'Enregistrez-vous à l\'emplacement indiqué',
      socialShare: 'Partager sur les réseaux',
      socialShareDescription: 'Partagez votre expérience sur les réseaux sociaux',
      custom: 'Compléter la tâche',
      completed: 'Complété',
      markComplete: 'Marquer comme complété',
      required: 'Requis',
      optional: 'Optionnel',
    },
    reward: {
      drinkPass: 'Pass Boisson',
      code: 'Code',
      expiresAt: 'Expire',
      expiresIn: 'Expire dans {{time}}',
      status: {
        active: 'Actif',
        redeemed: 'Utilisé',
        expired: 'Expiré',
        cancelled: 'Annulé',
      },
      showToStaff: 'Montrez ce code au personnel pour l\'utiliser',
      redeemNow: 'Utiliser maintenant',
      cancelPass: 'Annuler le pass',
      confirmCancel: 'Êtes-vous sûr de vouloir annuler ce pass boisson ?',
      noPasses: 'Pas encore de pass boisson',
      completeQuest: 'Complétez une quête pour gagner votre premier pass boisson !',
    },
    staff: {
      title: 'Portail du personnel',
      scanToRedeem: 'Scanner le pass pour l\'utiliser',
      enterCode: 'Ou entrez le code manuellement',
      verifying: 'Vérification...',
      passValid: 'Pass valide',
      passInvalid: 'Pass invalide',
      alreadyRedeemed: 'Déjà utilisé',
      expired: 'Le pass a expiré',
      confirmRedeem: 'Confirmer l\'utilisation ?',
      redeemed: 'Pass utilisé !',
      drinkDetails: 'Détails de la boisson',
    },
    auth: {
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      forgotPassword: 'Mot de passe oublié ?',
      noAccount: 'Vous n\'avez pas de compte ?',
      hasAccount: 'Vous avez déjà un compte ?',
      signUp: 'S\'inscrire',
      logIn: 'Se connecter',
      logOut: 'Se déconnecter',
      invalidCredentials: 'Email ou mot de passe invalide',
      emailExists: 'Cet email est déjà enregistré',
    },
    errors: {
      networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
      serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
      notFound: 'Non trouvé',
      unauthorized: 'Veuillez vous connecter pour continuer',
      forbidden: 'Vous n\'avez pas la permission de faire cela',
    },
  },
};

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'flowbond-language',
    }
  )
);

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Main translation function
export function t(key: string, params?: Record<string, string | number>): string {
  const { language } = useI18nStore.getState();
  
  let translation = getNestedValue(translations[language], key);
  
  // Fallback to English if translation not found
  if (!translation && language !== 'en') {
    translation = getNestedValue(translations.en, key);
  }
  
  // Return key if translation not found
  if (!translation) {
    console.warn(`Translation not found: ${key}`);
    return key;
  }
  
  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation!.replace(`{{${paramKey}}}`, String(value));
    });
  }
  
  return translation;
}

// Hook for using translations in components
export function useTranslation() {
  const { language, setLanguage } = useI18nStore();
  
  const translate = (key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations[language], key);
    
    if (!translation && language !== 'en') {
      translation = getNestedValue(translations.en, key);
    }
    
    if (!translation) {
      return key;
    }
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation!.replace(`{{${paramKey}}}`, String(value));
      });
    }
    
    return translation;
  };
  
  return { t: translate, language, setLanguage, languages: LANGUAGES };
}

export default translations;
