import { Label } from './types.js';

export const DELETE = '3lb4xfkaj7w2v';
export const LABEL_LIMIT = 0; // 0 significa sin límite de etiquetas
export const LABELS: Label[] = [
  // Orientaciones Sexuales Principales
  {
    rkey: '3lb7gjf3ugi2v',
    identifier: 'lesbian',
    locales: [
      { lang: 'es', name: 'Lesbiana 🏳️‍🌈', description: 'Persona que se alinea con la feminidad y siente atracción sexual hacia otras personas que se alinean con la feminidad'},
      { lang: 'en', name: 'Lesbian 🏳️‍🌈', description: 'Person who aligns with femininity and experiences sexual attraction to others who align with femininity'},
      { lang: 'de', name: 'Lesbisch 🏳️‍🌈', description: 'Person, die sich mit Weiblichkeit identifiziert und sexuelle Anziehung zu anderen Menschen empfindet, die sich mit Weiblichkeit identifizieren'},
      { lang: 'fr', name: 'Lesbienne 🏳️‍🌈', description: 'Personne qui s\'aligne avec la féminité et ressent une attirance sexuelle envers d\'autres personnes qui s\'alignent avec la féminité'},
      { lang: 'ja', name: 'レズビアン 🏳️‍🌈', description: '女性らしさに共感し、同様に女性らしさに共感する人々に性的な魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjeanud2c',
    identifier: 'gay',
    locales: [
      { lang: 'es', name: 'Gay 🏳️‍🌈', description: 'Persona que se alinea con la masculinidad y siente atracción sexual hacia otras personas que se alinean con la masculinidad'},
      { lang: 'en', name: 'Gay 🏳️‍🌈', description: 'Person who aligns with masculinity and experiences sexual attraction to others who align with masculinity'},
      { lang: 'de', name: 'Schwul 🏳️‍🌈', description: 'Person, die sich mit Männlichkeit identifiziert und sexuelle Anziehung zu anderen Menschen empfindet, die sich mit Männlichkeit identifizieren'},
      { lang: 'fr', name: 'Gay 🏳️‍🌈', description: 'Personne qui s\'aligne avec la masculinité et ressent une attirance sexuelle envers d\'autres personnes qui s\'alignent avec la masculinité'},
      { lang: 'ja', name: 'ゲイ 🏳️‍🌈', description: '男性らしさに共感し、同様に男性らしさに共感する人々に性的な魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfbz9g2e',
    identifier: 'bisexual',
    locales: [
      { lang: 'es', name: 'Bisexual 💗💜💙', description: 'Persona que siente atracción sexual hacia personas de más de un género'},
      { lang: 'en', name: 'Bisexual 💗💜💙', description: 'Person who experiences sexual attraction to people of more than one gender'},
      { lang: 'de', name: 'Bisexuell 💗💜💙', description: 'Person, die sexuelle Anziehung zu Menschen mehrerer Geschlechter empfindet'},
      { lang: 'fr', name: 'Bisexuel·le 💗💜💙', description: 'Personne qui ressent une attirance sexuelle envers des personnes de plus d\'un genre'},
      { lang: 'ja', name: 'バイセクシャル 💗💜💙', description: '複数の性別の人々に性的な魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfhpv22g',
    identifier: 'pansexual',
    locales: [
      { lang: 'es', name: 'Pansexual 💗💛💙', description: 'Persona que siente atracción sexual hacia otras personas independientemente de su expresión o identidad de género'},
      { lang: 'en', name: 'Pansexual 💗💛💙', description: 'Person who experiences sexual attraction regardless of gender expression or identity'},
      { lang: 'de', name: 'Pansexuell 💗💛💙', description: 'Person, die sexuelle Anziehung unabhängig von Geschlechtsausdruck oder -identität empfindet'},
      { lang: 'fr', name: 'Pansexuel·le 💗💛💙', description: 'Personne qui ressent une attirance sexuelle indépendamment de l\'expression ou de l\'identité de genre'},
      { lang: 'ja', name: 'パンセクシュアル 💗💛💙', description: 'ジェンダー表現やアイデンティティに関係なく性的な魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfkrv22i',
    identifier: 'transgender',
    locales: [
      { lang: 'es', name: 'Trans 🏳️‍⚧️', description: 'Persona cuya identidad de género difiere del sexo que le fue asignado al nacer'},
      { lang: 'en', name: 'Trans 🏳️‍⚧️', description: 'Person whose gender identity differs from their assigned sex at birth'},
      { lang: 'de', name: 'Trans 🏳️‍⚧️', description: 'Person, deren Geschlechtsidentität sich von dem bei der Geburt zugewiesenen Geschlecht unterscheidet'},
      { lang: 'fr', name: 'Trans 🏳️‍⚧️', description: 'Personne dont l\'identité de genre diffère du sexe assigné à la naissance'},
      { lang: 'ja', name: 'トランスジェンダー 🏳️‍⚧️', description: '出生時に割り当てられた性別とは異なるジェンダーアイデンティティを持つ人'}
    ]
  },
  {
    rkey: '3lb7gjfnwvg2k',
    identifier: 'nonbinary',
    locales: [
      { lang: 'es', name: 'No Binario 🏳️‍⚧️', description: 'Persona cuya identidad de género existe fuera o entre las categorías tradicionales de género'},
      { lang: 'en', name: 'Non-Binary 🏳️‍⚧️', description: 'Person whose gender identity exists outside or between traditional gender categories'},
      { lang: 'de', name: 'Nichtbinär 🏳️‍⚧️', description: 'Person, deren Geschlechtsidentität außerhalb oder zwischen traditionellen Geschlechterkategorien liegt'},
      { lang: 'fr', name: 'Non-Binaire 🏳️‍⚧️', description: 'Personne dont l\'identité de genre existe en dehors ou entre les catégories traditionnelles de genre'},
      { lang: 'ja', name: 'ノンバイナリー 🏳️‍⚧️', description: '伝統的な性別カテゴリーの外側または間に存在するジェンダーアイデンティティを持つ人'}
    ]
  },
  {
    rkey: '3lb7gjfp9n62a',
    identifier: 'agender',
    locales: [
      { lang: 'es', name: 'Agénero 🏳️‍⚧️', description: 'Persona que no se identifica con ningún género'},
      { lang: 'en', name: 'Agender 🏳️‍⚧️', description: 'Person who does not identify with any gender'},
      { lang: 'de', name: 'Agender 🏳️‍⚧️', description: 'Person, die sich mit keinem Geschlecht identifiziert'},
      { lang: 'fr', name: 'Agenre 🏳️‍⚧️', description: 'Personne qui ne s\'identifie à aucun genre'},
      { lang: 'ja', name: 'アゲンダー 🏳️‍⚧️', description: 'どのジェンダーにも同定しない人'}
    ]
  },
  {
    rkey: '3lb7gjfpm722a',
    identifier: 'queer',
    locales: [
      { lang: 'es', name: 'Queer 🏳️‍🌈', description: 'Persona que no se identifica con las normas tradicionales de género y sexualidad'},
      { lang: 'en', name: 'Queer 🏳️‍🌈', description: 'Person who does not identify with traditional gender and sexuality norms'},
      { lang: 'de', name: 'Queer 🏳️‍🌈', description: 'Person, die sich nicht mit traditionellen Geschlechts- und Sexualitätsnormen identifiziert'},
      { lang: 'fr', name: 'Queer 🏳️‍🌈', description: 'Personne qui ne s\'identifie pas aux normes traditionnelles de genre et de sexualité'},
      { lang: 'ja', name: 'クィア 🏳️‍🌈', description: '伝統的なジェンダーとセクシュアリティの規範に同定しない人'}
    ]
  },
  {
    rkey: '3lb7gjfqot27a',
    identifier: 'intersex',
    locales: [
      { lang: 'es', name: 'Intersex ⚧', description: 'Persona con características sexuales que no se ajustan a las definiciones típicas de masculino o femenino'},
      { lang: 'en', name: 'Intersex ⚧', description: 'Person with sex characteristics that do not fit typical binary notions of male or female bodies'},
      { lang: 'de', name: 'Intersex ⚧', description: 'Person mit sexuellen Merkmalen, die nicht den typischen binären Vorstellungen von männlichen oder weiblichen Körpern entsprechen'},
      { lang: 'fr', name: 'Intersex ⚧', description: 'Personne avec des caractéristiques sexuelles qui ne correspondent pas aux notions binaires typiques de corps masculins ou féminins'},
      { lang: 'ja', name: 'インターセックス ⚧', description: '典型的な男性または女性の身体の二元的な概念に当てはまらない性別特徴を持つ人'}
    ]
  },
  // Espectro Asexual
  {
    rkey: '3lb7gjfrfl22v',
    identifier: 'asexual',
    locales: [
      { lang: 'es', name: 'Asexual 🖤🤍💜', description: 'Persona que experimenta poca o ninguna atracción sexual'},
      { lang: 'en', name: 'Asexual 🖤🤍💜', description: 'Person who experiences little to no sexual attraction'},
      { lang: 'de', name: 'Asexuell 🖤🤍💜', description: 'Person, die wenig oder keine sexuelle Anziehung empfindet'},
      { lang: 'fr', name: 'Asexuel·le 🖤🤍💜', description: 'Personne qui ressent peu ou pas d\'attraction sexuelle'},
      { lang: 'ja', name: 'アセクシュアル 🖤🤍💜', description: 'ほとんどまたはまったく性的魅力を感じない人'}
    ]
  },
  {
    rkey: '3lb7gjfsgx22v',
    identifier: 'demisexual',
    locales: [
      { lang: 'es', name: 'Demisexual 🖤💜', description: 'Persona que solo experimenta atracción sexual después de formar un vínculo emocional'},
      { lang: 'en', name: 'Demisexual 🖤💜', description: 'Person who only experiences sexual attraction after forming an emotional bond'},
      { lang: 'de', name: 'Demisexuell 🖤💜', description: 'Person, die erst nach dem Aufbau einer emotionalen Bindung sexuelle Anziehung empfindet'},
      { lang: 'fr', name: 'Demisexuel·le 🖤💜', description: 'Personne qui ne ressent une attirance sexuelle qu\'après avoir établi un lien émotionnel'},
      { lang: 'ja', name: 'デミセクシャル 🖤💜', description: '感情的な絆を形成した後にのみ性的な魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjftx62a',
    identifier: 'graysexual',
    locales: [
      { lang: 'es', name: 'Grisexual 🖤', description: 'Persona que experimenta atracción sexual raramente o con baja intensidad'},
      { lang: 'en', name: 'Graysexual 🖤', description: 'Person who experiences sexual attraction rarely or with low intensity'},
      { lang: 'de', name: 'Grauasexuell 🖤', description: 'Person, die sexuelle Anziehung nur selten oder mit geringer Intensität empfindet'},
      { lang: 'fr', name: 'Grisexuel·le 🖤', description: 'Personne qui ressent une attirance sexuelle rarement ou avec une faible intensité'},
      { lang: 'ja', name: 'グレーセクシュアル 🖤', description: 'まれにまたは低い強度で性的魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfum722v',
    identifier: 'aceflux',
    locales: [
      { lang: 'es', name: 'Aceflux 💜', description: 'Persona cuya atracción sexual fluctúa dentro del espectro asexual'},
      { lang: 'en', name: 'Aceflux 💜', description: 'Person whose sexual attraction fluctuates within the asexual spectrum'},
      { lang: 'de', name: 'Aceflux 💜', description: 'Person, deren sexuelle Anziehung innerhalb des asexuellen Spektrums schwankt'},
      { lang: 'fr', name: 'Aceflux 💜', description: 'Personne dont l\'attraction sexuelle fluctue dans le spectre asexuel'},
      { lang: 'ja', name: 'エースフラックス 💜', description: '性的魅力がアセクシュアルスペクトル内で変動する人'}
    ]
  },
  // Espectro Arromántico
  {
    rkey: '3lb7gjfvw525',
    identifier: 'aromantic',
    locales: [
      { lang: 'es', name: 'Aromántico 💚🤍🖤', description: 'Persona que experimenta poca o ninguna atracción romántica hacia otras personas'},
      { lang: 'en', name: 'Aromantic 💚🤍🖤', description: 'Person who experiences little to no romantic attraction to others'},
      { lang: 'de', name: 'Aromantisch 💚🤍🖤', description: 'Person, die wenig oder keine romantische Anziehung zu anderen Menschen empfindet'},
      { lang: 'fr', name: 'Aromantique 💚🤍🖤', description: 'Personne qui ressent peu ou pas d\'attraction romantique envers d\'autres personnes'},
      { lang: 'ja', name: 'アロマンティック 💚🤍🖤', description: 'ほとんどまたはまったくロマンチックな魅力を感じない人'}
    ]
  },
  {
    rkey: '3lb7gjfxhj92m',
    identifier: 'heteroromantic',
    locales: [
      { lang: 'es', name: 'Heterorromántico 💚❤️', description: 'Persona que siente atracción romántica hacia personas que se alinean con un género diferente al propio'},
      { lang: 'en', name: 'Heteroromantic 💚❤️', description: 'Person who experiences romantic attraction to people who align with a different gender than their own'},
      { lang: 'de', name: 'Heteroromantisch 💚❤️', description: 'Person, die romantische Anziehung zu Menschen empfindet, die sich mit einem anderen Geschlecht als dem eigenen identifizieren'},
      { lang: 'fr', name: 'Hétéroromantique 💚❤️', description: 'Personne qui ressent une attirance romantique envers des personnes qui s\'identifient à un genre différent du sien'},
      { lang: 'ja', name: 'ヘテロロマンティック 💚❤️', description: '自分と異なるジェンダーに同定する人々にロマンチックな魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfxpq82n',
    identifier: 'biromantic',
    locales: [
      { lang: 'es', name: 'Birromántico 💗💜💙', description: 'Persona que siente atracción romántica hacia personas de todo el espectro de género'},
      { lang: 'en', name: 'Biromantic 💗💜💙', description: 'Person who experiences romantic attraction to people across the gender spectrum'},
      { lang: 'de', name: 'Biromantisch 💗💜💙', description: 'Person, die romantische Anziehung zu Menschen verschiedener Geschlechter empfindet'},
      { lang: 'fr', name: 'Biromantique 💗💜💙', description: 'Personne qui ressent une attirance romantique envers des personnes de tout le spectre des genres'},
      { lang: 'ja', name: 'バイロマンティック 💗💜💙', description: '性別を超えて人々にロマンティックな魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfyats72p',
    identifier: 'homoromantic',
    locales: [
      { lang: 'es', name: 'Homorromántico 🌈', description: 'Persona que siente atracción romántica hacia personas que se alinean con su mismo género'},
      { lang: 'en', name: 'Homoromantic 🌈', description: 'Person who experiences romantic attraction to people who align with their same gender'},
      { lang: 'de', name: 'Homoromantisch 🌈', description: 'Person, die romantische Anziehung zu Menschen empfindet, die sich mit dem gleichen Geschlecht wie das eigene identifizieren'},
      { lang: 'fr', name: 'Homoromantique 🌈', description: 'Personne qui ressent une attirance romantique envers des personnes qui s\'identifient au même genre que le sien'},
      { lang: 'ja', name: 'ホモロマンティック 🌈', description: '自分と同じジェンダーに同定する人々にロマンチックな魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfzwbky2m',
    identifier: 'demiromantic',
    locales: [
      { lang: 'es', name: 'Demiromántico 💚', description: 'Persona que solo experimenta atracción romántica después de formar un vínculo emocional'},
      { lang: 'en', name: 'Demiromantic 💚', description: 'Person who only experiences romantic attraction after forming an emotional bond'},
      { lang: 'de', name: 'Demioromantisch 💚', description: 'Person, die nur romantische Anziehung empfindet, nachdem sie eine emotionale Bindung aufgebaut hat'},
      { lang: 'fr', name: 'Démioromantique 💚', description: 'Personne qui ne ressent une attirance romantique qu\'après avoir formé un lien émotionnel'},
      { lang: 'ja', name: 'デミロマンティック 💚', description: '感情的な絆を築いた後にのみロマンチックな魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjfzuak2v',
    identifier: 'grayromantic',
    locales: [
      { lang: 'es', name: 'Grisoromántico 🖤💚', description: 'Persona que experimenta atracción romántica raramente o con baja intensidad'},
      { lang: 'en', name: 'Grayromantic 🖤💚', description: 'Person who experiences romantic attraction rarely or with low intensity'},
      { lang: 'de', name: 'Grauromantisch 🖤💚', description: 'Person, die romantische Anziehung nur selten oder mit geringer Intensität empfindet'},
      { lang: 'fr', name: 'Grisoromantique 🖤💚', description: 'Personne qui ressent une attirance romantique rarement ou avec une faible intensité'},
      { lang: 'ja', name: 'グレーロマンティック 🖤💚', description: 'まれにまたは低い強度でロマンチックな魅力を感じる人'}
    ]
  },
  {
    rkey: '3lb7gjf5jv722',
    identifier: 'aroflux',
    locales: [
      { lang: 'es', name: 'Aroflux 💚', description: 'Persona cuya atracción romántica fluctúa dentro del espectro arromántico'},
      { lang: 'en', name: 'Aroflux 💚', description: 'Person whose romantic attraction fluctuates within the aromantic spectrum'},
      { lang: 'de', name: 'Aroflux 💚', description: 'Person, deren romantische Anziehung innerhalb des aromantischen Spektrums schwankt'},
      { lang: 'fr', name: 'Aroflux 💚', description: 'Personne dont l\'attraction romantique fluctue dans le spectre aromantique'},
      { lang: 'ja', name: 'アロフラックス 💚', description: 'ロマンチックな魅力がアロマンティックスペクトル内で変動する人'}
    ]
  }
];
