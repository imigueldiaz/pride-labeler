import { Label } from './types.js';

export const DELETE = '3lb4xfkaj7w2v';
export const LABEL_LIMIT = 0; // 0 significa sin límite de etiquetas
export const LABELS: Label[] = [
  // Orientaciones Sexuales Principales
  {
    rkey: '3lb4xfigg652t',
    identifier: 'lesbian',
    locales: [
      { lang: 'es', name: 'Lesbiana 🏳️‍🌈', description: 'Persona que se identifica como mujer y siente atracción por otras mujeres'},
      { lang: 'en', name: 'Lesbian 🏳️‍🌈', description: 'Person who identifies as a woman and is attracted to women'},
    ]
  },
  {
    rkey: '3lb4xfijnlx2d',
    identifier: 'gay',
    locales: [
      { lang: 'es', name: 'Gay 🏳️‍🌈', description: 'Persona que se identifica como hombre y siente atracción por otros hombres'},
      { lang: 'en', name: 'Gay 🏳️‍🌈', description: 'Person who identifies as a man and is attracted to men'},
    ]
  },
  {
    rkey: '3lb4xfindf426',
    identifier: 'bisexual',
    locales: [
      { lang: 'es', name: 'Bisexual 💗💜💙', description: 'Persona que siente atracción por dos o más géneros'},
      { lang: 'en', name: 'Bisexual 💗💜💙', description: 'Person who is attracted to two or more genders'},
    ]
  },
  {
    rkey: '3lb4xfiqrfl22',
    identifier: 'pansexual',
    locales: [
      { lang: 'es', name: 'Pansexual 💗💛💙', description: 'Persona que siente atracción independientemente del género'},
      { lang: 'en', name: 'Pansexual 💗💛💙', description: 'Person who experiences attraction regardless of gender'},
    ]
  },
  // Identidades de Género
  {
    rkey: '3lb4xfiu4nf2t',
    identifier: 'transgender',
    locales: [
      { lang: 'es', name: 'Trans 🏳️‍⚧️', description: 'Persona cuya identidad de género difiere del sexo asignado al nacer'},
      { lang: 'en', name: 'Trans 🏳️‍⚧️', description: 'Person whose gender identity differs from their assigned sex at birth'},
    ]
  },
  {
    rkey: '3lb4xfixjmd27',
    identifier: 'nonbinary',
    locales: [
      { lang: 'es', name: 'No Binario 🏳️‍⚧️', description: 'Persona cuya identidad de género está fuera del binario hombre/mujer'},
      { lang: 'en', name: 'Non-Binary 🏳️‍⚧️', description: 'Person whose gender identity falls outside the man/woman binary'},
    ]
  },
  {
    rkey: '3lb4xfj32rn25',
    identifier: 'agender',
    locales: [
      { lang: 'es', name: 'Agénero 🏳️‍⚧️', description: 'Persona que no se identifica con ningún género'},
      { lang: 'en', name: 'Agender 🏳️‍⚧️', description: 'Person who does not identify with any gender'},
    ]
  },
  // Otras Identidades
  {
    rkey: '3lb4xfj6cdo2a',
    identifier: 'queer',
    locales: [
      { lang: 'es', name: 'Queer 🏳️‍🌈', description: 'Persona que no se identifica con las normas tradicionales de género y sexualidad'},
      { lang: 'en', name: 'Queer 🏳️‍🌈', description: 'Person who does not identify with traditional gender and sexuality norms'},
    ]
  },
  {
    rkey: '3lb4xfjbtot27',
    identifier: 'intersex',
    locales: [
      { lang: 'es', name: 'Intersex ⚧', description: 'Persona con características sexuales que no se ajustan a las definiciones típicas de masculino o femenino'},
      { lang: 'en', name: 'Intersex ⚧', description: 'Person with sex characteristics that do not fit typical binary notions of male or female bodies'},
    ]
  },
  // Espectro Asexual
  {
    rkey: '3lb4xfjffx22v',
    identifier: 'asexual',
    locales: [
      { lang: 'es', name: 'Asexual 🖤🤍💜', description: 'Persona que experimenta poca o ninguna atracción sexual'},
      { lang: 'en', name: 'Asexual 🖤🤍💜', description: 'Person who experiences little to no sexual attraction'},
    ]
  },
  {
    rkey: '3lb4xfjiuqx22',
    identifier: 'demisexual',
    locales: [
      { lang: 'es', name: 'Demisexual 🖤💜', description: 'Persona que solo experimenta atracción sexual después de formar un vínculo emocional'},
      { lang: 'en', name: 'Demisexual 🖤💜', description: 'Person who only experiences sexual attraction after forming an emotional bond'},
    ]
  },
  {
    rkey: '3lb4xfjm5p62a',
    identifier: 'graysexual',
    locales: [
      { lang: 'es', name: 'Grisexual 🖤', description: 'Persona que experimenta atracción sexual raramente o con baja intensidad'},
      { lang: 'en', name: 'Graysexual 🖤', description: 'Person who experiences sexual attraction rarely or with low intensity'},
    ]
  },
  {
    rkey: '3lb4xfjpml722',
    identifier: 'aceflux',
    locales: [
      { lang: 'es', name: 'Aceflux 💜', description: 'Persona cuya atracción sexual fluctúa dentro del espectro asexual'},
      { lang: 'en', name: 'Aceflux 💜', description: 'Person whose sexual attraction fluctuates within the asexual spectrum'},
    ]
  },
  // Espectro Arromántico
  {
    rkey: '3lb4xfjswh525',
    identifier: 'aromantic',
    locales: [
      { lang: 'es', name: 'Aromántico 💚🤍🖤', description: 'Persona que experimenta poca o ninguna atracción romántica'},
      { lang: 'en', name: 'Aromantic 💚🤍🖤', description: 'Person who experiences little to no romantic attraction'},
    ]
  },
  {
    rkey: '3lb4xfjwbky2m',
    identifier: 'demiromantic',
    locales: [
      { lang: 'es', name: 'Demiromántico 💚', description: 'Persona que solo experimenta atracción romántica después de formar un vínculo emocional'},
      { lang: 'en', name: 'Demiromantic 💚', description: 'Person who only experiences romantic attraction after forming an emotional bond'},
    ]
  },
  {
    rkey: '3lb4xfjzuak2v',
    identifier: 'grayromantic',
    locales: [
      { lang: 'es', name: 'Grisoromántico 🖤💚', description: 'Persona que experimenta atracción romántica raramente o con baja intensidad'},
      { lang: 'en', name: 'Grayromantic 🖤💚', description: 'Person who experiences romantic attraction rarely or with low intensity'},
    ]
  },
  {
    rkey: '3lb4xfk5jv722',
    identifier: 'aroflux',
    locales: [
      { lang: 'es', name: 'Aroflux 💚', description: 'Persona cuya atracción romántica fluctúa dentro del espectro arromántico'},
      { lang: 'en', name: 'Aroflux 💚', description: 'Person whose romantic attraction fluctuates within the aromantic spectrum'},
    ]
  }
];
