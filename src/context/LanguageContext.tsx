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
  visionP2: string;
  visionP3: string;
  visionP3Emphasis: string;
  howItWorksTitle: string;
  step1: string;
  step2: string;
  step3Label: string;
  step3Action: string;
  step3Rest: string;
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
  endModalTitle: string;
  endModalWithConsent: string;
  endModalWithoutConsent: string;
  endModalCancel: string;
  endModalConfirm: string;
  endModalSending: string;
  endModalError: string;
};

const EN: Translations = {
  tagline: 'Interview his AI. Then interview him.',
  visionTitle: 'Welcome to the next generation of the CV:',
  visionHighlight: 'a living, intelligent, and dynamic professional identity.',
  visionP2: 'A new standard where artificial intelligence, storytelling and authenticity transform a static résumé into an experience that connects, demonstrates, and evolves with you.',
  visionP3: 'Because your professional future can no longer be summed up in a PDF.',
  visionP3Emphasis: "It's built in real time.",
  howItWorksTitle: 'How it works',
  step1: 'Introduce yourself below (optional)',
  step2: "Ask Pablo anything you'd ask in a real interview",
  step3Label: "When you're finished, click",
  step3Action: 'End Interview',
  step3Rest: "— don't just close the tab",
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
  endButtonShort: 'End',
  endButtonFull: 'End Interview',
  endTooltipActive: 'Click here to properly finish the interview',
  endTooltipInactive: 'Keep chatting — available after min. 3 questions',
  endModalTitle: 'End this interview?',
  endModalWithConsent: "We'll send you Pablo's CV, LinkedIn profile and conversation transcript to your email.",
  endModalWithoutConsent: 'The interview will be closed. Thanks for chatting with Pablo.',
  endModalCancel: 'Cancel',
  endModalConfirm: 'Yes, send everything',
  endModalSending: 'Sending…',
  endModalError: 'Something went wrong. Please try again.',
};

const ES: Translations = {
  tagline: 'Entrevista su IA. Luego entrevístalo a él.',
  visionTitle: 'Bienvenido a la próxima generación del CV:',
  visionHighlight: 'una identidad profesional viva, inteligente y dinámica.',
  visionP2: 'Un nuevo estándar donde la inteligencia artificial, el storytelling y la autenticidad transforman un currículum estático en una experiencia que conecta, demuestra y evoluciona contigo.',
  visionP3: 'Porque tu futuro profesional ya no puede resumirse en un PDF.',
  visionP3Emphasis: 'Se construye en tiempo real.',
  howItWorksTitle: 'Cómo funciona',
  step1: 'Preséntate a continuación (opcional)',
  step2: 'Pregunta a Pablo cualquier cosa que preguntarías en una entrevista real',
  step3Label: 'Cuando termines, haz clic en',
  step3Action: 'Finalizar entrevista',
  step3Rest: '— no cierres la pestaña sin más',
  formTitle: 'Preséntate — Pablo personalizará la conversación',
  labelName: 'Tu nombre',
  placeholderName: 'p.ej. Ana',
  labelEmail: 'Tu correo electrónico',
  placeholderEmail: 'sara@empresa.com',
  labelCompany: 'Empresa',
  placeholderCompany: 'p.ej. Mews, Apaleo, HubOS',
  labelRole: 'Puesto que buscas cubrir',
  placeholderRole: 'p.ej. SDR, Account Executive, CSM',
  consentText: 'Me gustaría recibir un correo con el resumen de la entrevista de Pablo y sus materiales',
  buttonStart: 'Iniciar entrevista',
  buttonStarting: 'Iniciando…',
  footerNote: 'Nombre, empresa y rol opcionales · * Email obligatorio',
  emailError: 'Por favor introduce un correo electrónico válido',
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
  endButtonShort: 'Fin',
  endButtonFull: 'Finalizar entrevista',
  endTooltipActive: 'Haz clic aquí para terminar correctamente la entrevista',
  endTooltipInactive: 'Sigue chateando — disponible tras mín. 3 preguntas',
  endModalTitle: '¿Finalizar esta entrevista?',
  endModalWithConsent: 'Te enviaremos el CV de Pablo, su perfil de LinkedIn y la transcripción de la conversación a tu correo.',
  endModalWithoutConsent: 'La entrevista se cerrará. Gracias por chatear con Pablo.',
  endModalCancel: 'Cancelar',
  endModalConfirm: 'Sí, enviar todo',
  endModalSending: 'Enviando…',
  endModalError: 'Algo salió mal. Por favor inténtalo de nuevo.',
};

const IT: Translations = {
  tagline: "Intervista la sua IA. Poi intervistalo.",
  visionTitle: 'Benvenuto alla prossima generazione del CV:',
  visionHighlight: "un'identità professionale viva, intelligente e dinamica.",
  visionP2: "Un nuovo standard in cui intelligenza artificiale, storytelling e autenticità trasformano un curriculum statico in un'esperienza che connette, dimostra ed evolve con te.",
  visionP3: "Perché il tuo futuro professionale non può più essere riassunto in un PDF.",
  visionP3Emphasis: "Si costruisce in tempo reale.",
  howItWorksTitle: 'Come funziona',
  step1: 'Presentati qui sotto (opzionale)',
  step2: "Chiedi a Pablo qualsiasi cosa gli chiederesti in un colloquio reale",
  step3Label: 'Quando hai finito, clicca su',
  step3Action: 'Fine colloquio',
  step3Rest: '— non chiudere semplicemente la scheda',
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
  endButtonShort: 'Fine',
  endButtonFull: 'Fine colloquio',
  endTooltipActive: 'Clicca qui per terminare correttamente il colloquio',
  endTooltipInactive: 'Continua a chattare — disponibile dopo min. 3 domande',
  endModalTitle: 'Terminare questo colloquio?',
  endModalWithConsent: "Ti invieremo il CV di Pablo, il suo profilo LinkedIn e la trascrizione della conversazione alla tua email.",
  endModalWithoutConsent: 'Il colloquio verrà chiuso. Grazie per aver chattato con Pablo.',
  endModalCancel: 'Annulla',
  endModalConfirm: 'Sì, invia tutto',
  endModalSending: 'Invio…',
  endModalError: 'Qualcosa è andato storto. Per favore riprova.',
};

const PT: Translations = {
  tagline: 'Entreviste a sua IA. Depois entreviste-o.',
  visionTitle: 'Bem-vindo à próxima geração do CV:',
  visionHighlight: 'uma identidade profissional viva, inteligente e dinâmica.',
  visionP2: 'Um novo padrão onde inteligência artificial, storytelling e autenticidade transformam um currículo estático numa experiência que conecta, demonstra e evolui consigo.',
  visionP3: 'Porque o seu futuro profissional já não pode ser resumido num PDF.',
  visionP3Emphasis: 'Constrói-se em tempo real.',
  howItWorksTitle: 'Como funciona',
  step1: 'Apresente-se abaixo (opcional)',
  step2: 'Pergunte ao Pablo qualquer coisa que perguntaria numa entrevista real',
  step3Label: 'Quando terminar, clique em',
  step3Action: 'Terminar entrevista',
  step3Rest: '— não feche apenas o separador',
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
  endButtonShort: 'Fim',
  endButtonFull: 'Terminar entrevista',
  endTooltipActive: 'Clique aqui para terminar corretamente a entrevista',
  endTooltipInactive: 'Continue a conversar — disponível após mín. 3 perguntas',
  endModalTitle: 'Terminar esta entrevista?',
  endModalWithConsent: "Enviaremos o CV do Pablo, o seu perfil LinkedIn e a transcrição da conversa para o seu email.",
  endModalWithoutConsent: 'A entrevista será encerrada. Obrigado por conversar com Pablo.',
  endModalCancel: 'Cancelar',
  endModalConfirm: 'Sim, enviar tudo',
  endModalSending: 'A enviar…',
  endModalError: 'Algo correu mal. Por favor tente novamente.',
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
