export type Section = {
  id: string;
  type: "chapter" | "subtitle" | "prose" | "break" | "banner" | "image";
  content?: string;
  label?: string;
  imageUrl?: string;
};

export type EpisodeData = {
  number: string;
  title: string;
  series: string;
  minutesTotal: number;
  coverUrl: string;
  languages: string[];
  sections: Record<string, Section[]>;
};

const EPISODE_1_EN: Section[] = [
  { id: "ch1", type: "chapter", label: "I. The Realm of Alke" },
  { id: "img-p1", type: "image", imageUrl: "https://hercules-cdn.com/file_EVo0hAQ7Mcy8msZx31ieS5nh" },
  { id: "img-p2", type: "image", imageUrl: "https://hercules-cdn.com/file_7gufT2lAe52C1OMd9uWhSFAx" },
  { id: "img-p3", type: "image", imageUrl: "https://hercules-cdn.com/file_ruRsgXieZjIeHEAQlpV5te3C" },
  { id: "img-p4", type: "image", imageUrl: "https://hercules-cdn.com/file_qdhmwyhzO79tToWA8isSocwu" },
  { id: "img-p5", type: "image", imageUrl: "https://hercules-cdn.com/file_T6Ddd4a8bvFmAYI0DGI6GdSh" },
  { id: "img-p6", type: "image", imageUrl: "https://hercules-cdn.com/file_8CptIB8QIqeqI7753XUURBUe" },
  { id: "img-p7", type: "image", imageUrl: "https://hercules-cdn.com/file_MmVTQ86gzkqdQ5Yq3MXC42q2" },
  { id: "img-p8", type: "image", imageUrl: "https://hercules-cdn.com/file_13WRP2LexLr0LkVLfHX1uYDb" },
  { id: "img-p9", type: "image", imageUrl: "https://hercules-cdn.com/file_VikIipM43ntOzF4qwtv9X2Z1" },
  { id: "img-p10", type: "image", imageUrl: "https://hercules-cdn.com/file_3A042jzq4609mz4teNkYuCyM" },
  { id: "img-p11", type: "image", imageUrl: "https://hercules-cdn.com/file_ubNRFVM1gGbhulIM8vaZMn87" },
  { id: "img-p12", type: "image", imageUrl: "https://hercules-cdn.com/file_hcYeUIOAS90VGn12o1bMqBCt" },
  { id: "img-p13", type: "image", imageUrl: "https://hercules-cdn.com/file_r2viF9sOjhr3AgV2BLG0Lt52" },
  { id: "img-p14", type: "image", imageUrl: "https://hercules-cdn.com/file_0hg1FBCkL2dnhCgTRyqbs3V4" },
];

const EPISODE_1_EN_PLAIN: Section[] = [
  { id: "ch1", type: "chapter", label: "I. The Realm of Alke" },
  { id: "ns-p1", type: "image", imageUrl: "https://hercules-cdn.com/file_395j54PEej5U34FIQY6OfJut" },
  { id: "ns-p2", type: "image", imageUrl: "https://hercules-cdn.com/file_mP9yD6q4am84sunW4N8BVgyG" },
  { id: "ns-p3", type: "image", imageUrl: "https://hercules-cdn.com/file_Eplkiv31zfAO5OdH1GXUQ8dS" },
  { id: "ns-p4", type: "image", imageUrl: "https://hercules-cdn.com/file_bJfJpZtE1ONuHQeSBlhCmoPX" },
  { id: "ns-p5", type: "image", imageUrl: "https://hercules-cdn.com/file_kAzG2YZAe0hMTd0lUJNK6Zbt" },
  { id: "ns-p6", type: "image", imageUrl: "https://hercules-cdn.com/file_zsdf2OLtpGPbCyouDgRi2yle" },
  { id: "ns-p7", type: "image", imageUrl: "https://hercules-cdn.com/file_nPU9Qo60mxw2zyMFF7fxUJM0" },
  { id: "ns-p8", type: "image", imageUrl: "https://hercules-cdn.com/file_vk8pvIJKm7Kpp6R3lQLUfhIz" },
  { id: "ns-p9", type: "image", imageUrl: "https://hercules-cdn.com/file_eCk36lYpBZUpSVzJibC0oxLr" },
  { id: "ns-p10", type: "image", imageUrl: "https://hercules-cdn.com/file_TqVrDCQBO4D5yp1SDaREFizK" },
  { id: "ns-p11", type: "image", imageUrl: "https://hercules-cdn.com/file_1mzICUq6tYgYFPe2mCHIKYoo" },
  { id: "ns-p12", type: "image", imageUrl: "https://hercules-cdn.com/file_8EJjgKbM2xQGZvIH6KJkAa0u" },
];

const EPISODE_1_FR: Section[] = [
  { id: "ch1", type: "chapter", label: "I. La Ville Qui Se Souvient" },
  { id: "sub1", type: "subtitle", content: "À Ravelmark, oublier est un crime." },
  {
    id: "p1",
    type: "prose",
    content:
      "La ville respirait par couches. Au niveau de la rue, des marchands vendaient des souvenirs en bouteille — des après-midis d'enfance conservés dans du verre ambré, des premiers baisers tourbillonnant comme du brouillard dans des flacons de cristal. Au-dessus d'eux, les Flèches de la Mémoire s'élevaient vers le ciel meurtri.",
  },
  {
    id: "p2",
    type: "prose",
    content:
      "Malka se déplaçait dans le Quartier des Braises comme l'eau dans une fissure dans la pierre — silencieusement, avec détermination, sans laisser de trace. Elle gardait son col haut. La cicatrice sur son sternum avait l'habitude de briller aux moments inopportuns.",
  },
  {
    id: "p3",
    type: "prose",
    content:
      "Tout le monde à Ravelmark avait un Sceau de Mémoire. Le Sceau de Malka indiquait : vide.",
  },
  { id: "break1", type: "break" },
  { id: "ch2", type: "chapter", label: "II. La Cicatrice Parle" },
  { id: "sub2", type: "subtitle", content: "Certaines blessures ne sont pas des accidents. Certaines cicatrices sont des portes." },
  {
    id: "p4",
    type: "prose",
    content:
      "Elle avait remarqué la cicatrice trois mois auparavant — une ligne irrégulière de la clavicule au sternum, pâle contre sa peau brune. Elle ne faisait pas mal. Elle pulsait parfois dans un rythme qu'elle avait commencé à reconnaître comme un langage.",
  },
  {
    id: "end",
    type: "subtitle",
    content: "— Fin de l'Épisode Un : La Première Cicatrice —",
  },
];

const EPISODE_1_ES: Section[] = [
  { id: "ch1", type: "chapter", label: "I. La Ciudad Que Recuerda" },
  { id: "sub1", type: "subtitle", content: "En Ravelmark, olvidar es un crimen." },
  {
    id: "p1",
    type: "prose",
    content:
      "La ciudad respiraba en capas. A nivel de calle, los vendedores ofrecían recuerdos embotellados — tardes de infancia preservadas en vidrio ámbar, primeros besos arremolinándose como niebla en frascos de cristal. Sobre ellos, las Torres de Memoria se alzaban hacia el cielo amoratado.",
  },
  {
    id: "p2",
    type: "prose",
    content:
      "Malka se movía por el Barrio de las Brasas como el agua a través de una grieta en la piedra — silenciosa, con propósito, sin dejar rastro. El sello de Malka decía: vacío.",
  },
  { id: "break1", type: "break" },
  { id: "ch2", type: "chapter", label: "II. La Cicatriz Habla" },
  { id: "sub2", type: "subtitle", content: "Algunas heridas no son accidentes. Algunas cicatrices son puertas." },
  {
    id: "p3",
    type: "prose",
    content:
      "Notó la cicatriz por primera vez hace tres meses — una línea irregular desde la clavícula hasta el esternón, pálida contra su piel morena. No dolía. Pulsaba a veces, en un ritmo que había comenzado a reconocer como lenguaje.",
  },
  {
    id: "end",
    type: "subtitle",
    content: "— Fin del Episodio Uno: La Primera Cicatriz —",
  },
];

export const EPISODE_1: EpisodeData = {
  number: "01",
  title: "The Realm of Alke",
  series: "Scar-heart Malka Raurah",
  minutesTotal: 44,
  coverUrl: "https://hercules-cdn.com/file_zwKoMroNRzrAPhnO04OOvFqt",
  languages: [
    "English (With Subtitles)", "English (No Subtitles)", "Chinese", "Arabic", "Spanish", "Hindi", "French",
    "Korean", "Zulu", "Portuguese", "Russian", "Urdu", "Bengali",
    "Indonesian", "German", "Vietnamese", "Swahili", "Hausa", "Japanese",
  ],
  sections: {
    "English (With Subtitles)": EPISODE_1_EN,
    "English (No Subtitles)": EPISODE_1_EN_PLAIN,
    Français: EPISODE_1_FR,
    Español: EPISODE_1_ES,
  },
};
