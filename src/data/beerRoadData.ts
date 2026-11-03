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

// Textes courts et liens publics des sept univers. Médias privés : administration.
export const siteMeta = {
  "title": "La Beer Road",
  "emojiTitle": "👣",
  "heroImage": "/beer-road.jpeg",
  "searchPlaceholder": "Chercher un tuto, un podcast, une contribution…",
  "driveFolderUrl": "https://drive.google.com/drive/folders/1tn5NZkTjxGQHj_LJC9hVGPtB31Vh-4vq?usp=drive_link"
}

export const plaques: Plaque[] = [
  {
    "id": "origines",
    "name": "La Bobine des origines",
    "tagline": "Film et album Beer Road",
    "emoji": "🎬",
    "universe": "origines",
    "position": {
      "x": 39,
      "y": 82,
      "width": 12,
      "height": 10.5,
      "rotate": 1
    },
    "content": {
      "intro": [
        "Le film, les chansons, le livret et les paroles de la Beer Road."
      ],
      "albums": [
        {
          "title": "La Beer Road",
          "subtitle": "Livret et paroles",
          "cover": "/Beer_road.png",
          "links": [
            {
              "label": "Ouvrir le livret de l'album (PDF)",
              "url": "/Livret_de_la_Beer_Road.pdf",
              "kind": "pdf"
            },
            {
              "label": "Ouvrir les paroles sur Google Drive",
              "url": "https://drive.google.com/drive/folders/1xcqEB3VeeiV5huZlIpcoAWTsvY27cngD?usp=drive_link",
              "kind": "external",
              "displayInResources": false
            }
          ]
        }
      ]
    }
  },
  {
    "id": "transmission",
    "name": "Les Mots qui restent",
    "tagline": "Livres et podcasts",
    "emoji": "📚",
    "universe": "transmission",
    "position": {
      "x": 42,
      "y": 62.5,
      "width": 11,
      "height": 7.5,
      "rotate": -2
    },
    "content": {
      "intro": [
        "Deux livres et douze podcasts à lire, écouter et partager."
      ]
    }
  },
  {
    "id": "atelier",
    "name": "L'Atelier des possibles",
    "tagline": "Applications de la famille",
    "emoji": "🧪",
    "universe": "atelier",
    "position": {
      "x": 39.5,
      "y": 51,
      "width": 11,
      "height": 6,
      "rotate": -5
    },
    "content": {
      "intro": [
        "Nos applications pour simplifier le quotidien."
      ]
    }
  },
  {
    "id": "grenier",
    "name": "Le Grenier d'Elwood",
    "tagline": "Musique et créations",
    "emoji": "🎸",
    "universe": "grenier",
    "position": {
      "x": 34,
      "y": 40.8,
      "width": 9.5,
      "height": 4.4,
      "rotate": -8
    },
    "content": {
      "intro": [
        "Les créations et les actualités du Grenier d’Elwood."
      ],
      "links": [
        {
          "label": "Le site du Grenier",
          "url": "https://www.legrenierdelwood.com/",
          "kind": "external"
        },
        {
          "label": "Toutes les plateformes — Linktree",
          "url": "https://linktr.ee/LeGrenierElwood",
          "kind": "music"
        },

      ]
    }
  },
  {
    "id": "kerhuon",
    "name": "La Maison apprivoisée",
    "tagline": "Guides de la maison",
    "emoji": "🏡",
    "universe": "kerhuon",
    "position": {
      "x": 29.7,
      "y": 34,
      "width": 9.5,
      "height": 4,
      "rotate": -10
    },
    "content": {
      "intro": [
        "Les guides pratiques pour profiter de Ker Huon."
      ]
    }
  },
  {
    "id": "legendes",
    "name": "Le Cabinet des légendes",
    "tagline": "À découvrir et à raconter",
    "emoji": "🍻",
    "universe": "legendes",
    "position": {
      "x": 23.5,
      "y": 29,
      "width": 8.5,
      "height": 3.8,
      "rotate": -7
    },
    "content": {
      "intro": [
        "Nos recommandations et nos souvenirs en famille."
      ]
    }
  },
  {
    "id": "avenir",
    "name": "La Route des lendemains",
    "tagline": "Agenda et projets",
    "emoji": "🧭",
    "position": {
      "x": 19,
      "y": 24.5,
      "width": 8.5,
      "height": 3.5,
      "rotate": -8
    },
    "universe": "avenir",
    "content": {
      "intro": [
        "Nos prochains rendez-vous et projets communs."
      ]
    }
  }
]
