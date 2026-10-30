export type Universe =
  | "origines"
  | "transmission"
  | "atelier"
  | "grenier"
  | "kerhuon"
  | "legendes"
  | "avenir"

export type PlaqueLink = {
  label: string
  url?: string
  kind: "pdf" | "video" | "external" | "music"
  /** False when the same resource is already presented in another, clearer part of the card. */
  displayInResources?: boolean
}

export type Highlight = {
  label: string
  description: string
}

export type Plaque = {
  id: string
  name: string
  tagline: string
  emoji: string
  universe: Universe
  position: { x: number; y: number; width: number; height: number; rotate?: number }
  content: {
    intro?: string[]
    highlights?: Highlight[]
    albums?: {
      title: string
      subtitle?: string
      cover?: string
      audio?: string
      links: PlaqueLink[]
    }[]
    news?: { date: string; title: string; body: string; pdf?: string }[]
    books?: { title: string; description: string; cover?: string; pdf?: string }[]
    video?: { title: string; description?: string; embedUrl?: string }
    links?: PlaqueLink[]
  }
}

// SOURCE ÉDITORIALE DU SITE : noms, textes, ressources, liens et positions des 7 empreintes.
// Pour une ressource publique, renseigne url (lien externe https://… ou fichier du dossier public /mon-fichier.pdf).
// Pour intégrer un film dans le lecteur, renseigne content.video.embedUrl avec une URL d’intégration valide.
export const siteMeta = {
  title: "La Beer Road",
  emojiTitle: "👣",
  heroImage: "/beer-road.jpeg",
  searchPlaceholder: "Chercher un univers, une idée, un mot…",
  // Dossier racine Beer Road partagé par la famille. Les sous-dossiers peuvent être ajoutés au fil du temps.
  driveFolderUrl: "https://drive.google.com/drive/folders/1tn5NZkTjxGQHj_LJC9hVGPtB31Vh-4vq?usp=drive_link",
}

export const plaques: Plaque[] = [
  {
    id: "origines",
    name: "La Bobine des origines",
    tagline: "Le film, l'album et la légende Beer Road",
    emoji: "🎬",
    universe: "origines",
    position: { x: 39.0, y: 82, width: 12, height: 10.5, rotate: 1 },
    content: {
      intro: [
        "Tout commence par une traversée de passage piéton qui n'aurait jamais dû entrer dans l'histoire du cinéma. Quatre gendres, quatre soifs, une radio TSF et un point de chute : Ker Huon.",
        "La Beer Road est à la fois un film familial, un album musical et une invitation à retrouver ce qui nous rassemble. La route est physique, mais la légende n'a pas de frontières.",
      ],
      highlights: [
        { label: "Le film", description: "Le récit fondateur, ses surprises, ses gags et ses retrouvailles à Ker Huon." },
        { label: "Les quatre soifs", description: "Les mots, la fête, les défis et le style : quatre personnalités, une même aventure." },
        { label: "Les coulisses", description: "Les scènes coupées, les bêtisiers, les détails cachés et les secrets de fabrication à ajouter au fil du temps." },
      ],
      albums: [
        {
          title: "La Beer Road",
          subtitle: "Le deuxième album du Grenier d'Elwood — livret et paroles",
          cover: "/Beer_road.png",
          links: [
            { label: "Ouvrir le livret de l'album (PDF)", url: "/Livret_de_la_Beer_Road.pdf", kind: "pdf" },
            { label: "Ouvrir les paroles sur Google Drive", url: "https://drive.google.com/drive/folders/1xcqEB3VeeiV5huZlIpcoAWTsvY27cngD?usp=drive_link", kind: "external", displayInResources: false },
            { label: "Écouter les chansons (.wav) sur Google Drive", url: "https://drive.google.com/drive/folders/1-LGw_SDDk1QqtPsA8_p9QPgd89zfrIxF?usp=drive_link", kind: "music", displayInResources: false },
          ],
        },
      ],
      video: {
        title: "Le film La Beer Road",
        description: "Le film est conservé dans le dossier familial Google Drive. Clique pour l'ouvrir ; si Drive le demande, connecte-toi à un compte autorisé.",
      },
      links: [
        { label: "Ouvrir le dossier du film La Beer Road", url: "https://drive.google.com/drive/folders/1_ixkqhZkDROkBlIlgTo5EMO_pjI3oW32?usp=drive_link", kind: "video", displayInResources: false },
        { label: "Ouvrir les paroles sur Google Drive", url: "https://drive.google.com/drive/folders/1xcqEB3VeeiV5huZlIpcoAWTsvY27cngD?usp=drive_link", kind: "external", displayInResources: false },
        { label: "Écouter les chansons (.wav) sur Google Drive", url: "https://drive.google.com/drive/folders/1-LGw_SDDk1QqtPsA8_p9QPgd89zfrIxF?usp=drive_link", kind: "music", displayInResources: false },
      ],
    },
  },
  {
    id: "transmission",
    name: "Les Mots qui restent",
    tagline: "Livres, lettres et podcasts pour aller plus loin",
    emoji: "📚",
    universe: "transmission",
    position: { x: 42.0, y: 62.5, width: 11, height: 7.5, rotate: -2 },
    content: {
      intro: [
        "Certaines conversations méritent de durer plus longtemps qu'un repas ou qu'un séjour. Ici, les mots servent à ouvrir des questions, transmettre des idées et poursuivre les échanges commencés avec le film.",
        "Les lettres aux filles, les lettres aux gendres, les livres et les podcasts pourront se répondre sans devoir raconter une nouvelle fois l'histoire propre à chaque foyer.",
      ],
      highlights: [
        { label: "Lettres à mes filles", description: "Des textes à lire, à relire, à discuter et à transmettre." },
        { label: "Lettres à mes gendres", description: "Des mots personnels autour de la famille, de la vie commune et de l'humour partagé." },
        { label: "Les podcasts", description: "Des épisodes décalés ou plus profonds pour éclairer les idées derrière les histoires." },
      ],
      books: [
        { title: "Les livres et textes à venir", description: "Les prochaines publications prendront place ici avec leur présentation et, si possible, une version à lire ou à écouter." },
      ],
      links: [
        { label: "Lettres à mes filles", kind: "pdf" },
        { label: "Lettres à mes gendres", kind: "pdf" },
        { label: "Lire les livres et textes", kind: "pdf" },
        { label: "Écouter les podcasts", kind: "external" },
      ],
    },
  },
  {
    id: "atelier",
    name: "L'Atelier des possibles",
    tagline: "Les applications imaginées pour la tribu",
    emoji: "🧪",
    universe: "atelier",
    position: { x: 39.5, y: 51, width: 11, height: 6.0, rotate: -5 },
    content: {
      intro: [
        "Une idée peut devenir un outil utile. Cet atelier rassemble les applications conçues pour simplifier le quotidien, cuisiner, mieux gérer les provisions ou faire naître de nouveaux usages familiaux.",
        "Ce n'est pas une vitrine de technologie pour la technologie : chaque application doit répondre à un besoin concret et rendre service.",
      ],
      highlights: [
        { label: "CookiWiki", description: "L'univers des recettes et de la cuisine de Mamifa." },
        { label: "Frosti", description: "La gestion des congélateurs et de ce qu'ils contiennent." },
        { label: "Cellio", description: "Une application familiale à présenter ici avec ses usages et son accès." },
        { label: "Mealio", description: "Un autre outil de la famille des applications de cuisine et d'organisation." },
      ],
      links: [
        { label: "Ouvrir CookiWiki", kind: "external" },
        { label: "Ouvrir Frosti", kind: "external" },
        { label: "Ouvrir Cellio", kind: "external" },
        { label: "Ouvrir Mealio", kind: "external" },
      ],
    },
  },
  {
    id: "grenier",
    name: "Le Grenier d'Elwood",
    tagline: "Les albums, les chansons et les histoires derrière la musique",
    emoji: "🎸",
    universe: "grenier",
    position: { x: 34.0, y: 40.8, width: 9.5, height: 4.4, rotate: -8 },
    content: {
      intro: [
        "Le Grenier d'Elwood est la maison des créations musicales : les albums, les titres, les paroles et les histoires qui les ont fait naître.",
        "La Beer Road est le deuxième album. Un album est déjà sorti et deux autres sont en préparation : cet univers est donc appelé à grandir au fil des sorties.",
      ],
      highlights: [
        { label: "Écouter", description: "Les liens vers les plateformes musicales seront rassemblés ici, album par album." },
        { label: "Comprendre", description: "Les histoires des morceaux, les paroles et les anecdotes de création." },
        { label: "Suivre les prochaines sorties", description: "Un espace vivant pour annoncer les nouveaux projets musicaux du Grenier." },
      ],
      links: [
        { label: "Chansons du Grenier d’Elwood sur les plateformes", url: "https://linktr.ee/LeGrenierElwood", kind: "music" },
        { label: "Paroles des chansons sur Google Drive", url: "https://drive.google.com/drive/folders/1xcqEB3VeeiV5huZlIpcoAWTsvY27cngD?usp=drive_link", kind: "external" },
        { label: "Lire le livret La Beer Road (PDF)", url: "/Livret_de_la_Beer_Road.pdf", kind: "pdf" },
        { label: "Troisième album — en préparation", kind: "music" },
        { label: "Quatrième album — en préparation", kind: "music" },
        { label: "Spotify — tous les albums", kind: "music" },
        { label: "YouTube Music — tous les albums", kind: "music" },
        { label: "Apple Music — tous les albums", kind: "music" },
        { label: "Deezer — tous les albums", kind: "music" },
      ],
    },
  },
  {
    id: "kerhuon",
    name: "La Maison apprivoisée",
    tagline: "Les astuces pour bien vivre à Ker Huon",
    emoji: "🏡",
    universe: "kerhuon",
    position: { x: 29.7, y: 34, width: 9.5, height: 4.0, rotate: -10 },
    content: {
      intro: [
        "Ker Huon est le point de départ physique de la Beer Road, mais pas sa limite. Ce pas rassemble tout ce qui aide chacun à se sentir chez lui, à prendre soin de la maison et à faciliter la vie collective.",
        "Des tutoriels courts, des astuces et des règles simples éviteront de devoir réexpliquer les mêmes choses à chaque séjour.",
      ],
      highlights: [
        { label: "Les tutos maison", description: "Chauffage, appareils, équipements, eau, électricité et petits dépannages." },
        { label: "Le jardin et les extérieurs", description: "Les gestes utiles pour profiter des lieux et en prendre soin." },
        { label: "Les bons réflexes", description: "Arrivée, départ, rangement, tri et informations pratiques communes." },
      ],
      links: [
        { label: "Tutoriels vidéo de la maison", kind: "video" },
        { label: "Consignes d’arrivée et de départ", kind: "pdf" },
        { label: "Équipements et dépannage", kind: "pdf" },
        { label: "Jardin et extérieurs", kind: "external" },
      ],
    },
  },
  {
    id: "legendes",
    name: "Le Cabinet des légendes",
    tagline: "Les codes, les rituels et les blagues que l'on partage",
    emoji: "🍻",
    universe: "legendes",
    position: { x: 23.5, y: 29, width: 8.5, height: 3.8, rotate: -7 },
    content: {
      intro: [
        "Chaque tribu fabrique peu à peu ses expressions, ses personnages, ses traditions et ses histoires impossibles à raconter aux gens de l'extérieur. Ici, on conserve la culture commune sans empiéter sur les albums privés de chaque foyer.",
        "Le mot « ermifugé », les quatre soifs, le décret communal de la Beer Road ou les règles très discutables de la tireuse méritent un endroit où continuer à vivre.",
      ],
      highlights: [
        { label: "Le dictionnaire de la tribu", description: "Expressions cultes, surnoms, traductions improbables et phrases à ne surtout pas sortir en public." },
        { label: "Les rites de Ker Huon", description: "Les habitudes et rituels des retrouvailles qui font sourire tout le monde." },
        { label: "La boîte à anecdotes", description: "Photos, vidéos, notes, enregistrements audio et histoires ajoutés par toute la famille." },
        { label: "Le musée du presque-raté", description: "Bêtisiers, ratés de tournage et photos improbables — les coulisses qu'on n'a pas mises dans le film." },
        { label: "La boîte à sons", description: "Expressions cultes, messages vocaux, mini-podcasts et ambiances sonores enregistrées par la tribu." },
        { label: "Le quiz Beer Road", description: "Des questions pour tester la mémoire de la tribu — et désigner le prochain payeur de pinte." },
      ],
      links: [
        { label: "Le dictionnaire de la tribu", kind: "external" },
        { label: "Le quiz Beer Road", kind: "external" },
        { label: "Les anecdotes partagées", kind: "external" },
      ],
    },
  },
  {
    id: "avenir",
    name: "La Route des lendemains",
    tagline: "Projets communs, agenda et messages pour le futur",
    emoji: "🧭",
    position: { x: 19, y: 24.5, width: 8.5, height: 3.5, rotate: -8 },
    universe: "avenir",
    content: {
      intro: [
        "La Beer Road n'est pas un monument terminé : c'est une première étape. Ce dernier pas regarde devant lui et donne à chacun la possibilité de proposer une idée, de préparer les prochaines retrouvailles ou de lancer un projet commun.",
        "Il pourra aussi accueillir une capsule temporelle numérique : des messages audio, des vidéos et des lettres destinées à être redécouverts dans quelques années, en écho au rendez-vous imaginé pour Rose et Romy en 2045.",
      ],
      highlights: [
        { label: "L'agenda de la tribu", description: "Séjours à Ker Huon, anniversaires, rendez-vous et événements familiaux communs." },
        { label: "Les chantiers ouverts", description: "Des projets proposés par chacun, avec des idées, des volontaires et les prochaines étapes." },
        { label: "Les défis de la tribu", description: "Un défi audio, une mini-vidéo, une recette collective, un quiz ou une création à plusieurs mains." },
        { label: "La capsule temporelle", description: "Des messages à laisser aux enfants et petits-enfants pour qu'ils les découvrent plus tard." },
      ],
      links: [
        { label: "Agenda familial partagé", kind: "external" },
        { label: "Proposer un projet commun", kind: "external" },
        { label: "Capsule temporelle — messages pour plus tard", kind: "external" },
      ],
    },
  },
]
