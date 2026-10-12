// =====================================================================
//  La Beer Road — Données des 7 plaques
//  ---------------------------------------------------------------------
//  Modifie librement ce fichier pour mettre à jour tes contenus.
//  Aucun besoin de toucher au reste du code : l'interface se met à jour
//  automatiquement à partir de ces données.
//
//  - `position` : coordonnées en % sur la photo (x = gauche, y = haut).
//    Ajuste ces valeurs si les zones ne tombent pas pile sur les plaques.
//  - `universe` : détermine la couleur et l'icône de la plaque.
//  - `content`  : les blocs affichés dans la fenêtre (modale).
// =====================================================================

export type Universe =
  | "fondateur"
  | "musique"
  | "cookiwiki"
  | "actus"
  | "livres"
  | "film"

export type LinkKind =
  | "spotify"
  | "deezer"
  | "apple"
  | "external"
  | "pdf"
  | "video"

export interface PlaqueLink {
  label: string
  url: string
  kind: LinkKind
}

export interface Album {
  title: string
  subtitle?: string
  cover: string
  audio?: string
  links: PlaqueLink[]
}

export interface NewsItem {
  date: string
  title: string
  body: string
}

export interface BookItem {
  title: string
  description: string
  cover: string
  pdf?: string
}

export interface PlaqueContent {
  /** Paragraphe(s) d'introduction affiché(s) en haut de la modale. */
  intro?: string[]
  /** Liste d'albums / musiques (univers Musique). */
  albums?: Album[]
  /** Liste de liens simples (boutons). */
  links?: PlaqueLink[]
  /** Fil d'actualités (univers En Vrac & Actus). */
  news?: NewsItem[]
  /** Livres pour enfants (univers Livres). */
  books?: BookItem[]
  /** Vidéo/film à intégrer (univers Film). */
  video?: {
    title: string
    description?: string
    embedUrl?: string
    poster?: string
  }
  /** Petites cartes récapitulatives (univers Fondateur). */
  highlights?: { label: string; description: string }[]
}

export interface Plaque {
  /** Identifiant stable (utilisé pour les clés React). */
  id: string
  /** Ordre le long du chemin, 1 = bas de la photo, 7 = haut. */
  order: number
  /** Nom affiché au survol et en titre de modale. */
  name: string
  /** Petit sous-titre / catégorie affiché dans le badge. */
  tagline: string
  /** Univers → pilote la couleur + l'icône. */
  universe: Universe
  /** Emoji décoratif du badge. */
  emoji: string
  /** Position de la zone cliquable sur la photo, en pourcentages. */
  position: { x: number; y: number; width: number; height: number; rotate?: number }
  /** Contenu de la fenêtre. */
  content: PlaqueContent
}

export const siteMeta = {
  title: "La Beer Road",
  emojiTitle: "🍺👣",
  welcome:
    "Bienvenue sur le chemin de la famille. Chaque plaque de ciment cache un petit univers : nos musiques, nos recettes, nos livres et nos histoires. Cliquez sur une empreinte pour explorer.",
  searchPlaceholder: "Chercher un livre, une musique, CookiWiki…",
  heroImage: "/beer-road.jpeg",
}

export const plaques: Plaque[] = [
  // -------------------------------------------------------------------
  // PLAQUE 1 — bas de la photo — FONDATEUR
  // -------------------------------------------------------------------
  {
    id: "fondateur",
    order: 1,
    name: "Le Fondateur",
    tagline: "L'histoire de la Beer Road",
    universe: "fondateur",
    emoji: "🍺",
    position: { x: 38, y: 81, width: 12, height: 8, rotate: -6 },
    content: {
      intro: [
        "Tout a commencé par un chemin de plaques de ciment marquées de nos empreintes, coulées un été en famille.",
        "La Beer Road, c'est notre petit musée à ciel ouvert : chaque pas raconte une création — de la musique aux recettes, en passant par les histoires pour enfants.",
      ],
      highlights: [
        { label: "🎵 Musique", description: "Nos albums et reprises façon Abbey Road." },
        { label: "🍳 CookiWiki", description: "Le carnet de recettes de la maison." },
        { label: "📰 En Vrac", description: "Les coulisses et anecdotes du chemin." },
        { label: "👣 Les P'tits Pas", description: "Livres et film pour les enfants." },
      ],
    },
  },

  // -------------------------------------------------------------------
  // PLAQUE 2 — MUSIQUE (Abbey Road)
  // -------------------------------------------------------------------
  {
    id: "musique-1",
    order: 2,
    name: "Abbey Road · Vol. 1",
    tagline: "Musique",
    universe: "musique",
    emoji: "🎵",
    position: { x: 40, y: 62, width: 11, height: 7, rotate: -4 },
    content: {
      intro: ["Nos premiers enregistrements, à écouter en marchant sur le chemin."],
      albums: [
        {
          title: "Premier Pas",
          subtitle: "EP · 5 titres",
          cover: "/albums/premier-pas.jpg",
          audio: "",
          links: [
            { label: "Spotify", url: "https://open.spotify.com", kind: "spotify" },
            { label: "Deezer", url: "https://www.deezer.com", kind: "deezer" },
            { label: "Apple Music", url: "https://music.apple.com", kind: "apple" },
          ],
        },
      ],
    },
  },

  // -------------------------------------------------------------------
  // PLAQUE 3 — MUSIQUE (Abbey Road)
  // -------------------------------------------------------------------
  {
    id: "musique-2",
    order: 3,
    name: "Abbey Road · Vol. 2",
    tagline: "Musique",
    universe: "musique",
    emoji: "🎶",
    position: { x: 39, y: 50, width: 11, height: 7, rotate: -8 },
    content: {
      intro: ["Les reprises et compositions récentes de la famille."],
      albums: [
        {
          title: "Sentiers Sonores",
          subtitle: "Album · 9 titres",
          cover: "/albums/sentiers-sonores.jpg",
          audio: "",
          links: [
            { label: "Spotify", url: "https://open.spotify.com", kind: "spotify" },
            { label: "Deezer", url: "https://www.deezer.com", kind: "deezer" },
            { label: "Apple Music", url: "https://music.apple.com", kind: "apple" },
          ],
        },
      ],
    },
  },

  // -------------------------------------------------------------------
  // PLAQUE 4 — COOKIWIKI
  // -------------------------------------------------------------------
  {
    id: "cookiwiki",
    order: 4,
    name: "CookiWiki",
    tagline: "Recettes",
    universe: "cookiwiki",
    emoji: "🍳",
    position: { x: 33, y: 40, width: 10, height: 6, rotate: -6 },
    content: {
      intro: ["Le carnet de recettes de la maison, et sa playlist pour cuisiner en musique."],
      links: [
        { label: "Ouvrir CookiWiki", url: "https://cookiwiki.example.com", kind: "external" },
        { label: "Playlist de cuisine", url: "https://open.spotify.com", kind: "spotify" },
      ],
    },
  },

  // -------------------------------------------------------------------
  // PLAQUE 5 — EN VRAC & ACTUS
  // -------------------------------------------------------------------
  {
    id: "actus",
    order: 5,
    name: "En Vrac & Actus",
    tagline: "Coulisses",
    universe: "actus",
    emoji: "📰",
    position: { x: 30, y: 33, width: 9, height: 6, rotate: -4 },
    content: {
      news: [
        {
          date: "Été 2024",
          title: "Une nouvelle plaque sur le chemin",
          body: "On a coulé une empreinte de plus ce week-end. Le chemin grandit !",
        },
        {
          date: "Printemps 2024",
          title: "Session d'enregistrement au grenier",
          body: "Trois nouveaux titres en boîte, sortie prévue bientôt.",
        },
      ],
    },
  },

  // -------------------------------------------------------------------
  // PLAQUE 6 — LES P'TITS PAS · LIVRES
  // -------------------------------------------------------------------
  {
    id: "livres",
    order: 6,
    name: "Les P'tits Pas · Livres",
    tagline: "Enfants",
    universe: "livres",
    emoji: "📚",
    position: { x: 27, y: 28, width: 9, height: 5, rotate: -6 },
    content: {
      intro: ["Les histoires écrites et illustrées pour les enfants de la famille."],
      books: [
        {
          title: "Le Chemin des Empreintes",
          description: "Un petit conte à lire le soir, à propos d'un chemin magique.",
          cover: "/books/chemin-empreintes.jpg",
          pdf: "",
        },
      ],
    },
  },

  // -------------------------------------------------------------------
  // PLAQUE 7 — haut de la photo — LES P'TITS PAS · FILM
  // -------------------------------------------------------------------
  {
    id: "film",
    order: 7,
    name: "Les P'tits Pas · Film",
    tagline: "Enfants",
    universe: "film",
    emoji: "🎬",
    position: { x: 20, y: 23, width: 9, height: 5, rotate: -8 },
    content: {
      intro: ["Le court-métrage de famille, tourné le long de la Beer Road."],
      video: {
        title: "La Beer Road — Le Film",
        description: "Un court-métrage réalisé avec les enfants.",
        embedUrl: "",
        poster: "/film/poster.jpg",
      },
    },
  },
]
