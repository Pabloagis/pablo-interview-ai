'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'es' | 'it' | 'pt';

export const LANG_FLAGS: Record<Lang, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
};

function detectLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const code = navigator.language.split('-')[0].toLowerCase();
  if (code === 'es') return 'es';
  if (code === 'it') return 'it';
  if (code === 'pt') return 'pt';
  return 'en';
}

export type Topic = { label: string; question: string };

export type Translations = {
  // IntakeScreen
  tagline: string;
  visionTitle: string;
  visionHighlight: string;
  visionBody: string;
  visionP2: string;
  visionClosing: string;
  visionP3: string;
  visionP3Emphasis: string;
  howItWorksTitle: string;
  step1: string;
  step2: string;
  step3: string;
  step3Label: string;
  step3Action: string;
  step3Rest: string;
  captchaLabel: string;
  captchaSub: string;
  gdprText: string;
  formTitle: string;
  labelName: string;
  placeholderName: string;
  labelEmail: string;
  placeholderEmail: string;
  labelCompany: string;
  placeholderCompany: string;
  labelRole: string;
  placeholderRole: string;
  consentText: string;
  buttonStart: string;
  buttonStarting: string;
  footerNote: string;
  emailError: string;
  nameError: string;
  intakeSubtitle: string;
  timeHint: string;
  // ChatPanel
  emptyGreeting: string;
  emptySubtitle: string;
  tryAsking: string;
  q1: string;
  q2: string;
  q3: string;
  inputPlaceholder: string;
  topicsLabel: string;
  playingIndicator: string;
  downloadTranscript: string;
  reset: string;
  interviewEndedTitle: string;
  interviewEndedMsg: string;
  allDoneTitle: string;
  allDoneMsg: string;
  allDoneSignature: string;
  conversationReset: string;
  connectionIssue: string;
  microphoneDenied: string;
  transcribeFailed: string;
  thinking: string[];
  topics: Topic[];
  // EndInterviewButton
  endButtonShort: string;
  endButtonFull: string;
  endTooltipActive: string;
  endTooltipInactive: string;
  startVoiceInput: string;
  stopRecording: string;
  changeLanguage: string;
  sendTooltip: string;
  clearConversation: string;
  meetPablo: string;
  endModalTitle: string;
  endModalWithConsent: string;
  endModalWithoutConsent: string;
  endModalCancel: string;
  endModalConfirm: string;
  endModalSending: string;
  endModalError: string;
  // Footer
  footerPrivacy: string;
  footerContact: string;
  footerPrivateNote: string;
  // PrivacyModal — UI chrome
  privacyTitle: string;
  privacyLastUpdated: string;
  privacyClose: string;
  privacyIntro: string;
  privacyCollectTitle: string;
  privacyCollectItems: string[];
  privacyCollectNote: string;
  privacyUsedTitle: string;
  privacyUsedItems: string[];
  privacyUsedNote: string;
  privacyServicesTitle: string;
  privacyServicesIntro: string;
  privacyServiceRoles: string[];
  privacyServicesNote: string;
  privacyGaOptout: string;
  privacyStorageTitle: string;
  privacyStorageP1: string;
  privacyStorageP2Pre: string;
  privacyStorageP2Post: string;
  privacyRightsTitle: string;
  privacyRightsIntro: string;
  privacyRightsHaveRight: string;
  privacyRightsItems: string[];
  privacyRightsNote: string;
  privacyContactTitle: string;
  privacyContactP: string;
  // ChatPanel extras
  endReminderPrefix: string;
  endReminderSuffix: string;
  listenModeOn: string;
  listenModeOff: string;
  // Exit intent modal
  exitIntentTitle: string;
  exitIntentBody: string;
  exitIntentCta: string;
  exitIntentLeave: string;
  // Resume banner
  resumeBannerPrefix: string;
  resumeBannerWith: string;
  resumeBannerMsg: string;
  resumeBannerMsgs: string;
  resumeBtn: string;
  dismissBtn: string;
  // HowItWorksModal
  howItWorksChip: string;
  hiwStep: string;
  hiwStep1Title: string;
  hiwStep2Title: string;
  hiwStep3Title: string;
  hiwStep4Title: string;
  hiwStep1Desc: string;
  hiwStep2Desc: string;
  hiwStep3Desc: string;
  hiwStep4Desc: string;
  hiwClose: string;
  hiwNext: string;
};

const EN: Translations = {
  tagline: 'Interview his AI. Then interview him.',
  visionTitle: 'Welcome to the next generation of the CV: a living, intelligent and dynamic professional identity.',
  visionHighlight: 'a living, intelligent, and dynamic professional identity.',
  visionBody: "This is not a static document — it's an AI trained on my real experience, stories, and thinking. Ask me anything you'd ask in a real interview.",
  visionClosing: "Because your professional future can no longer be summed up in a PDF. It's built in real time.",
  visionP2: 'A new standard where artificial intelligence, storytelling and authenticity transform a static résumé into an experience that connects, demonstrates, and evolves with you.',
  visionP3: 'Because your professional future can no longer be summed up in a PDF.',
  visionP3Emphasis: "It's built in real time.",
  howItWorksTitle: 'How it works',
  step1: 'Introduce yourself below — only your name and email are required.',
  step2: 'Ask Pablo anything you would ask in a real interview.',
  step3: 'Every answer is grounded in real stories with concrete outcomes.',
  step3Label: "When you're done, click",
  step3Action: 'End Interview',
  step3Rest: "— don't just close the tab",
  captchaLabel: "I'm a real person, not a bot",
  captchaSub: 'A tiny hospitality-tech sanity check.',
  gdprText: "I understand the conversation's transcription may be stored to improve Pablo's interview preparation. Information shared during the conversation may be used to tailor real-time responses and insights. All data remains private and is never shared with third parties.",
  formTitle: 'Introduce yourself — Pablo will personalise the conversation',
  labelName: 'Your name',
  placeholderName: 'e.g. Alice',
  labelEmail: 'Your email',
  placeholderEmail: 'sarah@company.com',
  labelCompany: 'Company',
  placeholderCompany: 'e.g. Mews, Apaleo, HubOS',
  labelRole: "Role you're filling",
  placeholderRole: 'e.g. SDR, Account Executive, CSM',
  consentText: "I'd like to receive an email with Pablo's interview summary and materials",
  buttonStart: 'Start Interview',
  buttonStarting: 'Starting…',
  footerNote: 'Name, company & role optional · * Email required',
  emailError: 'Please enter a valid email address',
  nameError: 'Please enter your name',
  intakeSubtitle: 'SaaS & Hospitality Tech | Helping hospitality grow through smart solutions',
  timeHint: '⏱ Usually takes 3–5 minutes',
  emptyGreeting: "Hi, I'm Pablo Agis.",
  emptySubtitle: 'Ask me anything!',
  tryAsking: 'Try asking',
  q1: 'What was your role at HubOS?',
  q2: 'Tell me about a difficult client situation',
  q3: 'Why the move from hospitality into tech?',
  inputPlaceholder: 'Ask Pablo anything…',
  topicsLabel: 'Topics',
  playingIndicator: 'Pablo is speaking — tap to stop',
  downloadTranscript: 'Download transcript',
  reset: 'Reset',
  interviewEndedTitle: 'Interview ended.',
  interviewEndedMsg: 'Thanks for chatting! — Pablo',
  allDoneTitle: 'All done!',
  allDoneMsg: "Check your inbox — we've sent everything to",
  allDoneSignature: 'Looking forward to hearing from you. — Pablo',
  conversationReset: 'Conversation reset. Starting fresh.',
  connectionIssue: 'Connection issue. Please try again.',
  microphoneDenied: 'Microphone access denied. Please allow microphone access.',
  transcribeFailed: 'Could not transcribe. Please try again.',
  thinking: [
    'Thinking…',
    'Recalling project experience…',
    'Analyzing previous implementation…',
    'Pulling from memory…',
    'Connecting the dots…',
    'Considering the context…',
    'Looking back at the work history…',
    'Preparing a thoughtful answer…',
  ],
  topics: [
    { label: 'Recent role',          question: 'Tell me about your most recent role' },
    { label: 'Career path',          question: 'Walk me through your career path' },
    { label: 'Why hospitality tech', question: 'Why are you moving into hospitality tech?' },
    { label: 'Tech stack',           question: 'What PMS systems and tools have you worked with?' },
    { label: 'Implementation',       question: 'Walk me through an implementation you led' },
    { label: 'Career goals',         question: 'What kind of role are you looking for?' },
    { label: 'SaaS experience',      question: "What's your experience with SaaS onboarding?" },
    { label: 'Difficult situations', question: "Tell me about a time things didn't go to plan" },
    { label: 'Working style',        question: 'How do you work with non-technical teams?' },
    { label: 'Leaving reason',       question: 'Why did you leave your last role?' },
    { label: 'Strengths',            question: "What's your strongest professional skill?" },
    { label: 'Languages & markets',  question: 'What markets can you cover with your language skills?' },
  ],
  endButtonShort: 'Insights',
  endButtonFull: 'Insights',
  endTooltipActive: 'Click here to properly finish the interview',
  endTooltipInactive: 'Keep chatting — available after min. 3 questions',
  startVoiceInput: 'Voice input',
  stopRecording: 'Stop recording',
  changeLanguage: 'Change language',
  sendTooltip: 'Send (Enter)',
  clearConversation: 'Clear conversation',
  meetPablo: 'Meet Pablo Agis Burgos',
  endModalTitle: 'Get your insights?',
  endModalWithConsent: "We'll send you conversation insights and transcript to your email.",
  endModalWithoutConsent: 'The interview will be closed. Thanks for chatting with Pablo.',
  endModalCancel: 'Cancel',
  endModalConfirm: 'Yes, send insights',
  endModalSending: 'Sending…',
  endModalError: 'Something went wrong. Please try again.',
  footerPrivacy: 'Privacy',
  footerContact: 'Contact',
  footerPrivateNote: 'All conversations remain private and are never shared externally.',
  privacyTitle: 'Privacy Policy',
  privacyLastUpdated: 'Last updated: May 2026',
  privacyClose: 'Got it',
  privacyIntro: "InterviewMind is an AI-powered professional profile built and operated by Pablo Agis Burgos, Barcelona, Spain. It lets recruiters explore Pablo's background through a live conversation. Here's exactly what happens with your data — no legalese.",
  privacyCollectTitle: 'What we collect',
  privacyCollectItems: [
    'Your name, email, company, and role — entered in the intake form',
    'The full transcript of your conversation',
    'Session metadata: timestamps and session ID',
  ],
  privacyCollectNote: 'Company and role are optional. Email is required to start the session.',
  privacyUsedTitle: "How it's used",
  privacyUsedItems: [
    'Personalise AI responses in real time based on your context',
    'Send Pablo an automated notification so he knows someone is chatting',
    "Send you a follow-up email with Pablo's CV if requested at the end",
    'Help Pablo prepare for live interviews and improve the experience over time',
  ],
  privacyUsedNote: 'Your data is never sold or shared for commercial purposes.',
  privacyServicesTitle: 'AI & third-party services',
  privacyServicesIntro: 'To work, InterviewMind shares conversation data with these trusted providers:',
  privacyServiceRoles: [
    'Generates all AI responses',
    'Powers conversation memory',
    'Stores sessions and transcripts',
    'Hosts the platform',
    'Anonymous usage analytics',
    'Sends follow-up emails',
  ],
  privacyServicesNote: "Each service processes only what's needed to operate the platform. You can opt out of Google Analytics via the ",
  privacyGaOptout: 'browser add-on',
  privacyStorageTitle: 'Data storage & retention',
  privacyStorageP1: "Conversations are stored securely in Supabase. Data is retained until you request deletion — there's no automatic expiry.",
  privacyStorageP2Pre: 'To delete your session data, email',
  privacyStorageP2Post: 'with the address you used to start the session.',
  privacyRightsTitle: 'Your rights (GDPR)',
  privacyRightsIntro: 'This platform operates from Spain and is subject to GDPR. Processing is based on legitimate interest (Art. 6(1)(f)) — helping Pablo present his professional profile to recruiters.',
  privacyRightsHaveRight: 'You have the right to:',
  privacyRightsItems: [
    'Access the data stored from your session',
    'Correct inaccurate information',
    'Delete your conversation data',
    'Object to processing based on legitimate interest',
  ],
  privacyRightsNote: 'You can also lodge a complaint with the Spanish data protection authority:',
  privacyContactTitle: 'Contact',
  privacyContactP: 'For any privacy-related questions, reach out directly:',
  endReminderPrefix: 'Click',
  endReminderSuffix: 'when done',
  listenModeOn: 'Listen mode on — click to disable',
  listenModeOff: 'Listen mode off — click to hear all responses',
  exitIntentTitle: 'Before you go…',
  exitIntentBody: 'You\'re mid-conversation. Get your insights first — Pablo will send his CV and a summary to your inbox.',
  exitIntentCta: 'Get insights & leave',
  exitIntentLeave: 'Leave without insights',
  resumeBannerPrefix: 'Resume your session',
  resumeBannerWith: 'with',
  resumeBannerMsg: 'message',
  resumeBannerMsgs: 'messages',
  resumeBtn: 'Resume',
  dismissBtn: 'Dismiss',
  howItWorksChip: 'See how it works',
  hiwStep: 'Step',
  hiwStep1Title: 'Introduce yourself',
  hiwStep2Title: 'Start the interview',
  hiwStep3Title: 'Ask anything',
  hiwStep4Title: 'Get your insights',
  hiwStep1Desc: 'Fill in your name and email — everything else is optional. Takes under 30 seconds.',
  hiwStep2Desc: "Ask Pablo anything you'd ask in a real interview. No preparation needed — just start.",
  hiwStep3Desc: "Every answer draws on real stories from Pablo's career — with concrete context and outcomes.",
  hiwStep4Desc: "Click Insights when done. Pablo will send his CV and a conversation summary straight to your inbox.",
  hiwClose: 'Got it',
  hiwNext: 'Next',
};

const ES: Translations = {
  tagline: 'Entrevista su IA. Luego entrevístalo a él.',
  visionTitle: 'Bienvenido a la próxima generación del CV: una identidad profesional viva, inteligente y dinámica.',
  visionHighlight: 'una identidad profesional viva, inteligente y dinámica.',
  visionBody: 'Este no es un documento estático — es una IA entrenada con mi experiencia real, mis historias y mi forma de pensar. Pregúntame lo que preguntarías en una entrevista real.',
  visionClosing: 'Porque tu futuro profesional ya no puede resumirse en un PDF. Se construye en tiempo real.',
  visionP2: 'Un nuevo estándar donde la inteligencia artificial, el storytelling y la autenticidad transforman un currículum estático en una experiencia que conecta, demuestra y evoluciona contigo.',
  visionP3: 'Porque tu futuro profesional ya no puede resumirse en un PDF.',
  visionP3Emphasis: 'Se construye en tiempo real.',
  howItWorksTitle: 'Cómo funciona',
  step1: 'Preséntate — solo tu nombre y email son obligatorios.',
  step2: 'Pregunta a Pablo cualquier cosa que preguntarías en una entrevista real.',
  step3: 'Cada respuesta está fundamentada en historias reales con resultados concretos.',
  step3Label: 'Cuando termines, haz clic en',
  step3Action: 'Finalizar entrevista',
  step3Rest: '— no cierres la pestaña sin más',
  captchaLabel: 'Soy una persona real, no un bot',
  captchaSub: 'Una pequeña verificación de tecnología hotelera.',
  gdprText: 'Entiendo que la transcripción de la conversación puede almacenarse para mejorar la preparación de las entrevistas de Pablo. La información compartida puede usarse para personalizar respuestas en tiempo real. Todos los datos son privados y nunca se comparten con terceros.',
  formTitle: 'Preséntate — Pablo personalizará la conversación',
  labelName: 'Tu nombre',
  placeholderName: 'p.ej. Ana',
  labelEmail: 'Tu email',
  placeholderEmail: 'sara@empresa.com',
  labelCompany: 'Empresa',
  placeholderCompany: 'p.ej. Mews, Apaleo, HubOS',
  labelRole: 'Puesto que buscas cubrir',
  placeholderRole: 'p.ej. SDR, Account Executive, CSM',
  consentText: 'Me gustaría recibir un email con el resumen de la entrevista de Pablo y sus materiales',
  buttonStart: 'Iniciar entrevista',
  buttonStarting: 'Iniciando…',
  footerNote: 'Nombre, empresa y rol opcionales · * Email obligatorio',
  emailError: 'Por favor introduce un email válido',
  nameError: 'Por favor introduce tu nombre',
  intakeSubtitle: 'SaaS y Tecnología Hotelera | Ayudando a la hostelería a crecer con soluciones inteligentes',
  timeHint: '⏱ Suele durar entre 3 y 5 minutos',
  emptyGreeting: 'Hola, soy Pablo Agis.',
  emptySubtitle: '¡Pregúntame lo que quieras!',
  tryAsking: 'Prueba preguntando',
  q1: '¿Cuál fue tu rol en HubOS?',
  q2: 'Cuéntame sobre una situación difícil con un cliente',
  q3: '¿Por qué el cambio de hostelería a tecnología?',
  inputPlaceholder: 'Pregúntale cualquier cosa a Pablo…',
  topicsLabel: 'Temas',
  playingIndicator: 'Pablo está hablando — toca para parar',
  downloadTranscript: 'Descargar transcripción',
  reset: 'Reiniciar',
  interviewEndedTitle: 'Entrevista finalizada.',
  interviewEndedMsg: '¡Gracias por la conversación! — Pablo',
  allDoneTitle: '¡Todo listo!',
  allDoneMsg: 'Revisa tu bandeja de entrada, te hemos enviado todo a',
  allDoneSignature: 'Espero saber de ti pronto. — Pablo',
  conversationReset: 'Conversación reiniciada.',
  connectionIssue: 'Error de conexión. Por favor inténtalo de nuevo.',
  microphoneDenied: 'Acceso al micrófono denegado. Por favor permite el acceso al micrófono.',
  transcribeFailed: 'No se pudo transcribir. Por favor inténtalo de nuevo.',
  thinking: [
    'Pensando…',
    'Recordando experiencias de proyecto…',
    'Analizando implementaciones anteriores…',
    'Recuperando del historial…',
    'Conectando ideas…',
    'Considerando el contexto…',
    'Revisando el historial profesional…',
    'Preparando una respuesta reflexiva…',
  ],
  topics: [
    { label: 'Rol reciente',         question: 'Cuéntame sobre tu rol más reciente' },
    { label: 'Trayectoria',          question: 'Repasa tu trayectoria profesional' },
    { label: 'Por qué tech hotelera',question: '¿Por qué te mueves hacia la tecnología hotelera?' },
    { label: 'Stack tecnológico',    question: '¿Qué sistemas PMS y herramientas has usado?' },
    { label: 'Implementación',       question: 'Explícame una implementación que lideraste' },
    { label: 'Objetivos',            question: '¿Qué tipo de rol buscas?' },
    { label: 'Experiencia SaaS',     question: '¿Cuál es tu experiencia con el onboarding SaaS?' },
    { label: 'Situaciones difíciles',question: 'Cuéntame cuando algo no salió según lo planeado' },
    { label: 'Estilo de trabajo',    question: '¿Cómo trabajas con equipos no técnicos?' },
    { label: 'Motivo de salida',     question: '¿Por qué dejaste tu último puesto?' },
    { label: 'Fortalezas',           question: '¿Cuál es tu habilidad profesional más fuerte?' },
    { label: 'Idiomas y mercados',   question: '¿Qué mercados puedes cubrir con tus idiomas?' },
  ],
  endButtonShort: 'Insights',
  endButtonFull: 'Insights',
  endTooltipActive: 'Haz clic aquí para terminar correctamente la entrevista',
  endTooltipInactive: 'Sigue chateando — disponible tras mín. 3 preguntas',
  startVoiceInput: 'Entrada de voz',
  stopRecording: 'Parar grabación',
  changeLanguage: 'Cambiar idioma',
  sendTooltip: 'Enviar (Enter)',
  clearConversation: 'Borrar conversación',
  meetPablo: 'Conoce a Pablo Agis Burgos',
  endModalTitle: '¿Ver tus insights?',
  endModalWithConsent: 'Te enviaremos los insights de la conversación y la transcripción a tu email.',
  endModalWithoutConsent: 'La entrevista se cerrará. Gracias por chatear con Pablo.',
  endModalCancel: 'Cancelar',
  endModalConfirm: 'Sí, enviar insights',
  endModalSending: 'Enviando…',
  endModalError: 'Algo salió mal. Por favor inténtalo de nuevo.',
  footerPrivacy: 'Privacidad',
  footerContact: 'Contacto',
  footerPrivateNote: 'Todas las conversaciones son privadas y nunca se comparten externamente.',
  privacyTitle: 'Política de privacidad',
  privacyLastUpdated: 'Última actualización: mayo 2026',
  privacyClose: 'Entendido',
  privacyIntro: 'InterviewMind es un perfil profesional impulsado por IA, creado y operado por Pablo Agis Burgos, Barcelona, España. Permite a los reclutadores explorar el perfil de Pablo a través de una conversación en vivo. Aquí tienes exactamente lo que ocurre con tus datos — sin tecnicismos.',
  privacyCollectTitle: 'Qué recopilamos',
  privacyCollectItems: [
    'Tu nombre, email, empresa y rol — introducidos en el formulario',
    'La transcripción completa de tu conversación',
    'Metadatos de sesión: marcas de tiempo e ID de sesión',
  ],
  privacyCollectNote: 'La empresa y el rol son opcionales. El email es obligatorio para iniciar la sesión.',
  privacyUsedTitle: 'Cómo se usa',
  privacyUsedItems: [
    'Personalizar las respuestas de la IA en tiempo real según tu contexto',
    'Enviar a Pablo una notificación automática para que sepa que alguien está chateando',
    "Enviarte un email de seguimiento con el CV de Pablo si lo solicitas al final",
    'Ayudar a Pablo a preparar entrevistas en vivo y mejorar la experiencia con el tiempo',
  ],
  privacyUsedNote: 'Tus datos nunca se venden ni se comparten con fines comerciales.',
  privacyServicesTitle: 'Servicios de IA y terceros',
  privacyServicesIntro: 'Para funcionar, InterviewMind comparte datos de conversación con estos proveedores de confianza:',
  privacyServiceRoles: [
    'Genera todas las respuestas de IA',
    'Potencia la memoria de conversación',
    'Almacena sesiones y transcripciones',
    'Aloja la plataforma',
    'Analítica anónima de uso',
    'Envía emails de seguimiento',
  ],
  privacyServicesNote: 'Cada servicio procesa solo lo necesario para operar la plataforma. Puedes desactivar Google Analytics mediante el ',
  privacyGaOptout: 'complemento del navegador',
  privacyStorageTitle: 'Almacenamiento y retención de datos',
  privacyStorageP1: "Las conversaciones se almacenan de forma segura en Supabase. Los datos se conservan hasta que solicites su eliminación — no hay caducidad automática.",
  privacyStorageP2Pre: 'Para eliminar los datos de tu sesión, envía un email a',
  privacyStorageP2Post: 'indicando la dirección con la que iniciaste la sesión.',
  privacyRightsTitle: 'Tus derechos (RGPD)',
  privacyRightsIntro: 'Esta plataforma opera desde España y está sujeta al RGPD. El tratamiento se basa en el interés legítimo (Art. 6(1)(f)) — ayudar a Pablo a presentar su perfil profesional a los reclutadores.',
  privacyRightsHaveRight: 'Tienes derecho a:',
  privacyRightsItems: [
    'Acceder a los datos almacenados de tu sesión',
    'Corregir información inexacta',
    'Eliminar los datos de tu conversación',
    'Oponerte al tratamiento basado en interés legítimo',
  ],
  privacyRightsNote: 'También puedes presentar una reclamación ante la autoridad española de protección de datos:',
  privacyContactTitle: 'Contacto',
  privacyContactP: 'Para cualquier consulta relacionada con la privacidad, contacta directamente:',
  endReminderPrefix: 'Haz clic en',
  endReminderSuffix: 'cuando termines',
  listenModeOn: 'Modo escucha activado — haz clic para desactivar',
  listenModeOff: 'Modo escucha desactivado — haz clic para escuchar todas las respuestas',
  exitIntentTitle: 'Antes de irte…',
  exitIntentBody: 'Estás a mitad de conversación. Obtén tus insights primero — Pablo te enviará su CV y un resumen.',
  exitIntentCta: 'Obtener insights y salir',
  exitIntentLeave: 'Salir sin insights',
  resumeBannerPrefix: 'Retomar tu sesión',
  resumeBannerWith: 'con',
  resumeBannerMsg: 'mensaje',
  resumeBannerMsgs: 'mensajes',
  resumeBtn: 'Retomar',
  dismissBtn: 'Descartar',
  howItWorksChip: 'Ver cómo funciona',
  hiwStep: 'Paso',
  hiwStep1Title: 'Preséntate',
  hiwStep2Title: 'Empieza la entrevista',
  hiwStep3Title: 'Pregunta lo que quieras',
  hiwStep4Title: 'Obtén tus insights',
  hiwStep1Desc: 'Introduce tu nombre y email — el resto es opcional. Menos de 30 segundos.',
  hiwStep2Desc: 'Pregúntale a Pablo cualquier cosa que le preguntarías en una entrevista real. Sin preparación.',
  hiwStep3Desc: 'Cada respuesta se basa en historias reales de la carrera de Pablo — con contexto y resultados concretos.',
  hiwStep4Desc: 'Haz clic en Insights cuando termines. Pablo enviará su CV y un resumen de la conversación a tu email.',
  hiwClose: 'Entendido',
  hiwNext: 'Siguiente',
};

const IT: Translations = {
  tagline: "Intervista la sua IA. Poi intervistalo.",
  visionTitle: "Benvenuto alla prossima generazione del CV: un'identità professionale viva, intelligente e dinamica.",
  visionHighlight: "un'identità professionale viva, intelligente e dinamica.",
  visionBody: "Questo non è un documento statico — è un'IA addestrata sulla mia vera esperienza, le mie storie e il mio modo di pensare. Chiedimi qualsiasi cosa chiederesti in un colloquio reale.",
  visionClosing: "Perché il tuo futuro professionale non può più essere riassunto in un PDF. Si costruisce in tempo reale.",
  visionP2: "Un nuovo standard in cui intelligenza artificiale, storytelling e autenticità trasformano un curriculum statico in un'esperienza che connette, dimostra ed evolve con te.",
  visionP3: "Perché il tuo futuro professionale non può più essere riassunto in un PDF.",
  visionP3Emphasis: "Si costruisce in tempo reale.",
  howItWorksTitle: 'Come funziona',
  step1: 'Presentati — sono richiesti solo nome e email.',
  step2: "Chiedi a Pablo qualsiasi cosa gli chiederesti in un colloquio reale.",
  step3: 'Ogni risposta è basata su storie reali con risultati concreti.',
  step3Label: 'Quando hai finito, clicca su',
  step3Action: 'Fine colloquio',
  step3Rest: '— non chiudere semplicemente la scheda',
  captchaLabel: 'Sono una persona reale, non un bot',
  captchaSub: 'Un piccolo controllo di tecnologia alberghiera.',
  gdprText: "Capisco che la trascrizione della conversazione potrà essere archiviata per migliorare la preparazione ai colloqui di Pablo. Le informazioni condivise potranno essere utilizzate per personalizzare le risposte in tempo reale. Tutti i dati sono privati e non vengono mai condivisi con terzi.",
  formTitle: 'Presentati — Pablo personalizzerà la conversazione',
  labelName: 'Il tuo nome',
  placeholderName: 'es. Anna',
  labelEmail: 'La tua email',
  placeholderEmail: 'sara@azienda.com',
  labelCompany: 'Azienda',
  placeholderCompany: 'es. Mews, Apaleo, HubOS',
  labelRole: 'Ruolo che stai cercando',
  placeholderRole: 'es. SDR, Account Executive, CSM',
  consentText: "Vorrei ricevere un'email con il riepilogo del colloquio di Pablo e i suoi materiali",
  buttonStart: 'Inizia colloquio',
  buttonStarting: 'Avvio…',
  footerNote: 'Nome, azienda e ruolo opzionali · * Email obbligatoria',
  emailError: "Inserisci un indirizzo email valido",
  nameError: 'Inserisci il tuo nome',
  intakeSubtitle: 'SaaS e Tecnologia Alberghiera | Aiutare l\'ospitalità a crescere con soluzioni intelligenti',
  timeHint: '⏱ Di solito dura 3–5 minuti',
  emptyGreeting: 'Ciao, sono Pablo Agis.',
  emptySubtitle: 'Chiedimi quello che vuoi!',
  tryAsking: 'Prova a chiedere',
  q1: 'Qual era il tuo ruolo in HubOS?',
  q2: 'Raccontami di una situazione difficile con un cliente',
  q3: "Perché il passaggio dall'ospitalità alla tecnologia?",
  inputPlaceholder: 'Chiedi qualsiasi cosa a Pablo…',
  topicsLabel: 'Argomenti',
  playingIndicator: 'Pablo sta parlando — tocca per fermare',
  downloadTranscript: 'Scarica trascrizione',
  reset: 'Ricomincia',
  interviewEndedTitle: 'Colloquio terminato.',
  interviewEndedMsg: 'Grazie per la chiacchierata! — Pablo',
  allDoneTitle: 'Tutto pronto!',
  allDoneMsg: "Controlla la tua casella di posta — ti abbiamo inviato tutto a",
  allDoneSignature: "Non vedo l'ora di sentirti. — Pablo",
  conversationReset: 'Conversazione reimpostata.',
  connectionIssue: 'Problema di connessione. Per favore riprova.',
  microphoneDenied: "Accesso al microfono negato. Per favore consenti l'accesso al microfono.",
  transcribeFailed: 'Impossibile trascrivere. Per favore riprova.',
  thinking: [
    'Sto pensando…',
    'Ricordando esperienze di progetto…',
    'Analizzando implementazioni precedenti…',
    'Recuperando dalla memoria…',
    'Collegando i punti…',
    'Considerando il contesto…',
    'Guardando indietro alla storia lavorativa…',
    'Preparando una risposta ponderata…',
  ],
  topics: [
    { label: 'Ruolo recente',        question: 'Raccontami del tuo ruolo più recente' },
    { label: 'Percorso',             question: 'Ripercorri il tuo percorso professionale' },
    { label: 'Perché tech alberghiera', question: "Perché ti stai spostando verso la tecnologia alberghiera?" },
    { label: 'Stack tecnologico',    question: 'Quali sistemi PMS e strumenti hai utilizzato?' },
    { label: 'Implementazione',      question: "Illustrami un'implementazione che hai guidato" },
    { label: 'Obiettivi',            question: 'Che tipo di ruolo stai cercando?' },
    { label: 'Esperienza SaaS',      question: "Qual è la tua esperienza con l'onboarding SaaS?" },
    { label: 'Situazioni difficili', question: "Raccontami di una volta in cui le cose non sono andate come previsto" },
    { label: 'Stile di lavoro',      question: 'Come lavori con team non tecnici?' },
    { label: 'Motivo di uscita',     question: 'Perché hai lasciato il tuo ultimo ruolo?' },
    { label: 'Punti di forza',       question: "Qual è la tua competenza professionale più forte?" },
    { label: 'Lingue e mercati',     question: 'Quali mercati puoi coprire con le tue competenze linguistiche?' },
  ],
  endButtonShort: 'Insights',
  endButtonFull: 'Insights',
  endTooltipActive: 'Clicca qui per terminare correttamente il colloquio',
  endTooltipInactive: 'Continua a chattare — disponibile dopo min. 3 domande',
  startVoiceInput: 'Input vocale',
  stopRecording: 'Ferma registrazione',
  changeLanguage: 'Cambia lingua',
  sendTooltip: 'Invia (Enter)',
  clearConversation: 'Cancella conversazione',
  meetPablo: 'Incontra Pablo Agis Burgos',
  endModalTitle: 'Vuoi i tuoi insights?',
  endModalWithConsent: "Ti invieremo gli insights della conversazione e la trascrizione alla tua email.",
  endModalWithoutConsent: 'Il colloquio verrà chiuso. Grazie per aver chattato con Pablo.',
  endModalCancel: 'Annulla',
  endModalConfirm: 'Sì, invia insights',
  endModalSending: 'Invio…',
  endModalError: 'Qualcosa è andato storto. Per favore riprova.',
  footerPrivacy: 'Privacy',
  footerContact: 'Contatto',
  footerPrivateNote: 'Tutte le conversazioni rimangono private e non vengono mai condivise esternamente.',
  privacyTitle: 'Informativa sulla privacy',
  privacyLastUpdated: 'Ultimo aggiornamento: maggio 2026',
  privacyClose: 'Capito',
  privacyIntro: "InterviewMind è un profilo professionale basato sull'IA, creato e gestito da Pablo Agis Burgos, Barcellona, Spagna. Permette ai recruiter di esplorare il profilo di Pablo attraverso una conversazione dal vivo. Ecco esattamente cosa succede con i tuoi dati — senza tecnicismi.",
  privacyCollectTitle: 'Cosa raccogliamo',
  privacyCollectItems: [
    'Il tuo nome, email, azienda e ruolo — inseriti nel modulo',
    'La trascrizione completa della tua conversazione',
    'Metadati di sessione: timestamp e ID sessione',
  ],
  privacyCollectNote: "Azienda e ruolo sono facoltativi. L'email è obbligatoria per avviare la sessione.",
  privacyUsedTitle: 'Come vengono utilizzati',
  privacyUsedItems: [
    "Personalizzare le risposte dell'IA in tempo reale in base al tuo contesto",
    'Inviare a Pablo una notifica automatica in modo che sappia che qualcuno sta chattando',
    "Inviarti un'email di follow-up con il CV di Pablo se richiesto alla fine",
    "Aiutare Pablo a prepararsi per colloqui dal vivo e migliorare l'esperienza nel tempo",
  ],
  privacyUsedNote: 'I tuoi dati non vengono mai venduti né condivisi per scopi commerciali.',
  privacyServicesTitle: 'Servizi AI e di terze parti',
  privacyServicesIntro: 'Per funzionare, InterviewMind condivide i dati della conversazione con questi fornitori attendibili:',
  privacyServiceRoles: [
    'Genera tutte le risposte AI',
    'Alimenta la memoria della conversazione',
    'Archivia sessioni e trascrizioni',
    'Ospita la piattaforma',
    'Analisi anonima degli utilizzi',
    'Invia email di follow-up',
  ],
  privacyServicesNote: 'Ogni servizio elabora solo ciò che è necessario per far funzionare la piattaforma. Puoi disattivare Google Analytics tramite il ',
  privacyGaOptout: 'componente aggiuntivo del browser',
  privacyStorageTitle: 'Archiviazione e conservazione dei dati',
  privacyStorageP1: "Le conversazioni vengono archiviate in modo sicuro su Supabase. I dati vengono conservati fino a quando non ne richiedi la cancellazione — non c'è scadenza automatica.",
  privacyStorageP2Pre: "Per eliminare i dati della tua sessione, invia un'email a",
  privacyStorageP2Post: "indicando l'indirizzo utilizzato per avviare la sessione.",
  privacyRightsTitle: 'I tuoi diritti (GDPR)',
  privacyRightsIntro: "Questa piattaforma opera dalla Spagna ed è soggetta al GDPR. Il trattamento si basa sull'interesse legittimo (Art. 6(1)(f)) — aiutare Pablo a presentare il suo profilo professionale ai recruiter.",
  privacyRightsHaveRight: 'Hai il diritto di:',
  privacyRightsItems: [
    'Accedere ai dati archiviati dalla tua sessione',
    'Correggere informazioni inesatte',
    'Eliminare i dati della tua conversazione',
    "Opporsi al trattamento basato sull'interesse legittimo",
  ],
  privacyRightsNote: "Puoi anche presentare un reclamo all'autorità spagnola per la protezione dei dati:",
  privacyContactTitle: 'Contatto',
  privacyContactP: 'Per qualsiasi domanda relativa alla privacy, contatta direttamente:',
  endReminderPrefix: 'Clicca su',
  endReminderSuffix: 'quando hai finito',
  listenModeOn: 'Modalità ascolto attiva — clicca per disattivare',
  listenModeOff: 'Modalità ascolto disattiva — clicca per ascoltare tutte le risposte',
  exitIntentTitle: 'Prima di andare…',
  exitIntentBody: 'Sei a metà conversazione. Ottieni prima i tuoi insights — Pablo ti invierà il CV e un riepilogo.',
  exitIntentCta: 'Ottieni insights ed esci',
  exitIntentLeave: 'Esci senza insights',
  resumeBannerPrefix: 'Riprendi la sessione',
  resumeBannerWith: 'con',
  resumeBannerMsg: 'messaggio',
  resumeBannerMsgs: 'messaggi',
  resumeBtn: 'Riprendi',
  dismissBtn: 'Ignora',
  howItWorksChip: 'Scopri come funziona',
  hiwStep: 'Passo',
  hiwStep1Title: 'Presentati',
  hiwStep2Title: 'Inizia il colloquio',
  hiwStep3Title: 'Chiedi qualsiasi cosa',
  hiwStep4Title: 'Ottieni i tuoi insights',
  hiwStep1Desc: 'Inserisci nome e email — il resto è facoltativo. Meno di 30 secondi.',
  hiwStep2Desc: "Chiedi a Pablo qualsiasi cosa gli chiederesti in un colloquio reale. Senza preparazione.",
  hiwStep3Desc: "Ogni risposta attinge a storie reali della carriera di Pablo — con contesto e risultati concreti.",
  hiwStep4Desc: "Clicca su Insights quando hai finito. Pablo ti invierà il CV e un riepilogo della conversazione via email.",
  hiwClose: 'Capito',
  hiwNext: 'Avanti',
};

const PT: Translations = {
  tagline: 'Entreviste a sua IA. Depois entreviste-o.',
  visionTitle: 'Bem-vindo à próxima geração do CV: uma identidade profissional viva, inteligente e dinâmica.',
  visionHighlight: 'uma identidade profissional viva, inteligente e dinâmica.',
  visionBody: 'Este não é um documento estático — é uma IA treinada com a minha experiência real, as minhas histórias e o meu pensamento. Pergunte-me qualquer coisa que perguntaria numa entrevista real.',
  visionClosing: 'Porque o seu futuro profissional já não pode ser resumido num PDF. Constrói-se em tempo real.',
  visionP2: 'Um novo padrão onde inteligência artificial, storytelling e autenticidade transformam um currículo estático numa experiência que conecta, demonstra e evolui consigo.',
  visionP3: 'Porque o seu futuro profissional já não pode ser resumido num PDF.',
  visionP3Emphasis: 'Constrói-se em tempo real.',
  howItWorksTitle: 'Como funciona',
  step1: 'Apresente-se — apenas o nome e email são obrigatórios.',
  step2: 'Pergunte ao Pablo qualquer coisa que perguntaria numa entrevista real.',
  step3: 'Cada resposta baseia-se em histórias reais com resultados concretos.',
  step3Label: 'Quando terminar, clique em',
  step3Action: 'Terminar entrevista',
  step3Rest: '— não feche apenas o separador',
  captchaLabel: 'Sou uma pessoa real, não um bot',
  captchaSub: 'Uma pequena verificação de tecnologia hoteleira.',
  gdprText: 'Compreendo que a transcrição da conversa poderá ser armazenada para melhorar a preparação das entrevistas de Pablo. As informações partilhadas poderão ser usadas para personalizar respostas em tempo real. Todos os dados são privados e nunca partilhados com terceiros.',
  formTitle: 'Apresente-se — Pablo irá personalizar a conversa',
  labelName: 'O seu nome',
  placeholderName: 'ex. Ana',
  labelEmail: 'O seu email',
  placeholderEmail: 'sara@empresa.com',
  labelCompany: 'Empresa',
  placeholderCompany: 'ex. Mews, Apaleo, HubOS',
  labelRole: 'Vaga que está a preencher',
  placeholderRole: 'ex. SDR, Account Executive, CSM',
  consentText: 'Gostaria de receber um email com o resumo da entrevista de Pablo e os seus materiais',
  buttonStart: 'Iniciar entrevista',
  buttonStarting: 'A iniciar…',
  footerNote: 'Nome, empresa e cargo opcionais · * Email obrigatório',
  emailError: 'Por favor introduza um endereço de email válido',
  nameError: 'Por favor introduza o seu nome',
  intakeSubtitle: 'SaaS e Tecnologia Hoteleira | Ajudando a hotelaria a crescer com soluções inteligentes',
  timeHint: '⏱ Geralmente demora 3–5 minutos',
  emptyGreeting: 'Olá, sou o Pablo Agis.',
  emptySubtitle: 'Pergunte o que quiser!',
  tryAsking: 'Experimente perguntar',
  q1: 'Qual foi o seu papel na HubOS?',
  q2: 'Conte-me sobre uma situação difícil com um cliente',
  q3: 'Porquê a mudança de hotelaria para tecnologia?',
  inputPlaceholder: 'Pergunte qualquer coisa ao Pablo…',
  topicsLabel: 'Tópicos',
  playingIndicator: 'Pablo está a falar — toque para parar',
  downloadTranscript: 'Descarregar transcrição',
  reset: 'Reiniciar',
  interviewEndedTitle: 'Entrevista terminada.',
  interviewEndedMsg: 'Obrigado pela conversa! — Pablo',
  allDoneTitle: 'Tudo pronto!',
  allDoneMsg: 'Verifique a sua caixa de entrada — enviámos tudo para',
  allDoneSignature: 'Fico à espera do seu contacto. — Pablo',
  conversationReset: 'Conversa reiniciada.',
  connectionIssue: 'Problema de ligação. Por favor tente novamente.',
  microphoneDenied: 'Acesso ao microfone negado. Por favor permita o acesso ao microfone.',
  transcribeFailed: 'Não foi possível transcrever. Por favor tente novamente.',
  thinking: [
    'A pensar…',
    'A recordar experiências de projeto…',
    'A analisar implementações anteriores…',
    'A recuperar da memória…',
    'A ligar os pontos…',
    'A considerar o contexto…',
    'A rever o historial profissional…',
    'A preparar uma resposta cuidadosa…',
  ],
  topics: [
    { label: 'Função recente',       question: 'Fale-me da sua função mais recente' },
    { label: 'Percurso',             question: 'Percorra o seu trajeto profissional' },
    { label: 'Porquê tech hoteleira',question: 'Porque está a entrar na tecnologia hoteleira?' },
    { label: 'Stack tecnológico',    question: 'Que sistemas PMS e ferramentas já usou?' },
    { label: 'Implementação',        question: 'Descreva uma implementação que liderou' },
    { label: 'Objetivos',            question: 'Que tipo de função está à procura?' },
    { label: 'Experiência SaaS',     question: "Qual é a sua experiência com onboarding SaaS?" },
    { label: 'Situações difíceis',   question: 'Conte-me sobre uma vez em que as coisas não correram como planeado' },
    { label: 'Estilo de trabalho',   question: 'Como trabalha com equipas não técnicas?' },
    { label: 'Motivo de saída',      question: 'Porque saiu da sua última função?' },
    { label: 'Pontos fortes',        question: "Qual é a sua competência profissional mais forte?" },
    { label: 'Idiomas e mercados',   question: 'Que mercados pode cobrir com as suas competências linguísticas?' },
  ],
  endButtonShort: 'Insights',
  endButtonFull: 'Insights',
  endTooltipActive: 'Clique aqui para terminar corretamente a entrevista',
  endTooltipInactive: 'Continue a conversar — disponível após mín. 3 perguntas',
  startVoiceInput: 'Entrada de voz',
  stopRecording: 'Parar gravação',
  changeLanguage: 'Mudar idioma',
  sendTooltip: 'Enviar (Enter)',
  clearConversation: 'Limpar conversa',
  meetPablo: 'Conhecer Pablo Agis Burgos',
  endModalTitle: 'Ver os seus insights?',
  endModalWithConsent: "Enviaremos os insights da conversa e a transcrição para o seu email.",
  endModalWithoutConsent: 'A entrevista será encerrada. Obrigado por conversar com Pablo.',
  endModalCancel: 'Cancelar',
  endModalConfirm: 'Sim, enviar insights',
  endModalSending: 'A enviar…',
  endModalError: 'Algo correu mal. Por favor tente novamente.',
  footerPrivacy: 'Privacidade',
  footerContact: 'Contacto',
  footerPrivateNote: 'Todas as conversas são privadas e nunca partilhadas externamente.',
  privacyTitle: 'Política de Privacidade',
  privacyLastUpdated: 'Última atualização: maio de 2026',
  privacyClose: 'Percebido',
  privacyIntro: 'InterviewMind é um perfil profissional impulsionado por IA, criado e operado por Pablo Agis Burgos, Barcelona, Espanha. Permite que os recrutadores explorem o perfil de Pablo através de uma conversa em direto. Eis exatamente o que acontece com os seus dados — sem tecnicismos.',
  privacyCollectTitle: 'O que recolhemos',
  privacyCollectItems: [
    'O seu nome, email, empresa e cargo — introduzidos no formulário',
    'A transcrição completa da sua conversa',
    'Metadados de sessão: timestamps e ID de sessão',
  ],
  privacyCollectNote: 'Empresa e cargo são opcionais. O email é obrigatório para iniciar a sessão.',
  privacyUsedTitle: 'Como são utilizados',
  privacyUsedItems: [
    'Personalizar as respostas da IA em tempo real com base no seu contexto',
    'Enviar a Pablo uma notificação automática para que saiba que alguém está a conversar',
    'Enviar-lhe um email de acompanhamento com o CV do Pablo, se solicitado no final',
    'Ajudar Pablo a preparar-se para entrevistas ao vivo e melhorar a experiência ao longo do tempo',
  ],
  privacyUsedNote: 'Os seus dados nunca são vendidos nem partilhados para fins comerciais.',
  privacyServicesTitle: 'Serviços de IA e de terceiros',
  privacyServicesIntro: 'Para funcionar, o InterviewMind partilha dados de conversa com estes fornecedores de confiança:',
  privacyServiceRoles: [
    'Gera todas as respostas de IA',
    'Alimenta a memória da conversa',
    'Armazena sessões e transcrições',
    'Aloja a plataforma',
    'Análise anónima de utilização',
    'Envia emails de acompanhamento',
  ],
  privacyServicesNote: 'Cada serviço processa apenas o necessário para operar a plataforma. Pode desativar o Google Analytics através do ',
  privacyGaOptout: 'add-on do navegador',
  privacyStorageTitle: 'Armazenamento e retenção de dados',
  privacyStorageP1: "As conversas são armazenadas de forma segura no Supabase. Os dados são retidos até que solicite a sua eliminação — não há expiração automática.",
  privacyStorageP2Pre: 'Para eliminar os dados da sua sessão, envie um email para',
  privacyStorageP2Post: 'indicando o endereço utilizado para iniciar a sessão.',
  privacyRightsTitle: 'Os seus direitos (RGPD)',
  privacyRightsIntro: 'Esta plataforma opera a partir de Espanha e está sujeita ao RGPD. O tratamento baseia-se no interesse legítimo (Art. 6(1)(f)) — ajudar Pablo a apresentar o seu perfil profissional aos recrutadores.',
  privacyRightsHaveRight: 'Tem o direito de:',
  privacyRightsItems: [
    'Aceder aos dados armazenados da sua sessão',
    'Corrigir informações incorretas',
    'Eliminar os dados da sua conversa',
    'Opor-se ao tratamento baseado em interesse legítimo',
  ],
  privacyRightsNote: 'Pode também apresentar uma reclamação junto da autoridade espanhola de proteção de dados:',
  privacyContactTitle: 'Contacto',
  privacyContactP: 'Para qualquer questão relacionada com a privacidade, contacte diretamente:',
  endReminderPrefix: 'Clique em',
  endReminderSuffix: 'quando terminar',
  listenModeOn: 'Modo de escuta ativo — clique para desativar',
  listenModeOff: 'Modo de escuta inativo — clique para ouvir todas as respostas',
  exitIntentTitle: 'Antes de sair…',
  exitIntentBody: 'Está a meio da conversa. Obtenha primeiro os seus insights — Pablo enviará o CV e um resumo.',
  exitIntentCta: 'Obter insights e sair',
  exitIntentLeave: 'Sair sem insights',
  resumeBannerPrefix: 'Retomar a sessão',
  resumeBannerWith: 'com',
  resumeBannerMsg: 'mensagem',
  resumeBannerMsgs: 'mensagens',
  resumeBtn: 'Retomar',
  dismissBtn: 'Dispensar',
  howItWorksChip: 'Ver como funciona',
  hiwStep: 'Passo',
  hiwStep1Title: 'Apresente-se',
  hiwStep2Title: 'Inicie a entrevista',
  hiwStep3Title: 'Pergunte o que quiser',
  hiwStep4Title: 'Obtenha os seus insights',
  hiwStep1Desc: 'Introduza o seu nome e email — o resto é opcional. Menos de 30 segundos.',
  hiwStep2Desc: 'Pergunte ao Pablo qualquer coisa que perguntaria numa entrevista real. Sem preparação.',
  hiwStep3Desc: 'Cada resposta baseia-se em histórias reais da carreira do Pablo — com contexto e resultados concretos.',
  hiwStep4Desc: 'Clique em Insights quando terminar. O Pablo enviará o CV e um resumo da conversa para o seu email.',
  hiwClose: 'Entendido',
  hiwNext: 'Próximo',
};

const TRANSLATIONS: Record<Lang, Translations> = { en: EN, es: ES, it: IT, pt: PT };

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: EN,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('im_lang') as Lang | null;
    const valid: Lang[] = ['en', 'es', 'it', 'pt'];
    if (stored && valid.includes(stored)) {
      setLangState(stored);
    } else {
      setLangState(detectLanguage());
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('im_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
