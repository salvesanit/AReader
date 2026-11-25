/* ============================================================
   AReader — library data
   The shelf, the reading text, the extension catalogue and the
   web novels that installed extensions surface.
   ============================================================ */

export type Chapter = { title: string; paras: string[] };

export type BookSeed = {
  id: string;
  title: string;
  titleJa: string;
  author: string;
  authorJa: string;
  year: number;
  genre: string;
  edition: string;
  spine: string;
  cover: string | null;
  synopsis: string;
  credit: string;
  chapters: Chapter[];
};

export const GENRES = [
  "All",
  "Fiction",
  "Horror",
  "Science Fiction",
  "Philosophy",
  "Poetry",
] as const;

export const BOOKS: BookSeed[] = [
  {
    id: "frankenstein",
    title: "Frankenstein",
    titleJa: "",
    author: "Mary Shelley",
    authorJa: "",
    year: 1818,
    genre: "Horror",
    edition: "Geneva edition",
    spine: "#C8452B",
    cover: "images/cover-frankenstein.jpg",
    synopsis:
      "A young scientist assembles life out of dead matter, then abandons the thing he made. The rest of the book is the creature asking, patiently, to be let in.",
    credit: "First published anonymously, 1818. AR clothbound.",
    chapters: [
      {
        title: "Letter I — The Ice",
        paras: [
          "You will rejoice to hear that no disaster has accompanied the beginning of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.",
          "I am already far north of London, and as I walk in the streets of Petersburgh I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight. Do you understand this feeling?",
          "This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes. Inspirited by this wind of promise, my daydreams become more fervent and vivid.",
        ],
      },
      {
        title: "Chapter II — The Workshop",
        paras: [
          "I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was on a dreary night of November that I beheld the accomplishment of my toils.",
          "With an anxiety that almost amounted to agony, I observed the features of the being which I had created. I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.",
        ],
      },
      {
        title: "Chapter III — The Departure",
        paras: [
          "I had worked hard for two years, the sole purpose of which was to bestow animation upon lifeless matter. I had desired it with an ardour that far exceeded moderation; but now that I had finished, the beauty of the dream vanished.",
          "Breathless horror and disgust filled my heart. Unable to endure the aspect of the being I had created, I rushed out of the room and continued a long time traversing my bed-chamber, unable to compose my mind to sleep.",
        ],
      },
    ],
  },
  {
    id: "janeeyre",
    title: "Jane Eyre",
    titleJa: "",
    author: "Charlotte Brontë",
    authorJa: "",
    year: 1847,
    genre: "Fiction",
    edition: "Currer Bell edition",
    spine: "#141414",
    cover: "images/cover-janeeyre.jpg",
    synopsis:
      "An orphaned governess who refuses to be small tells her own story, in the first person, to a reader she trusts to believe her.",
    credit: "First published as Currer Bell, 1847. AR clothbound.",
    chapters: [
      {
        title: "Chapter I — The Garden",
        paras: [
          "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further out-door exercise was now out of the question.",
          "I was glad of it: I never liked long walks, especially on chilly afternoons. Dreadful to me was the coming home in the raw twilight, with nipped fingers and toes, and a heart saddened by the chidings of Bessie, the nurse.",
          "The said garden was a square enclosure, with high walls all round, and a gate of iron bars on one side, half of which stood open.",
        ],
      },
      {
        title: "Chapter II — The Red Room",
        paras: [
          "I resisted all the way: a new thing for me, and a circumstance which greatly strengthened the bad opinion Bessie and Miss Abbot were disposed to entertain of me.",
          "The fact is, I was a trifle beside myself; or rather out of myself, as the French would say: I was conscious that a moment's mutiny had already rendered me liable to strange penalties.",
        ],
      },
      {
        title: "Chapter III — The Letter",
        paras: [
          "Mr. Brocklehurst, I endeavoured to put aside, with as much indifference as I could, the subject of his coming; but he would not be put aside: he came to the table, and leaning over it, began in a half whisper.",
          "I shall send to Lowood a box of books, of which I have a selection: you will find in it the works of Dr. Johnson, and the Immortal Spectator; and such others as may be thought proper for the improvement of young minds.",
        ],
      },
    ],
  },
  {
    id: "wuthering",
    title: "Wuthering Heights",
    titleJa: "",
    author: "Emily Brontë",
    authorJa: "",
    year: 1847,
    genre: "Fiction",
    edition: "Yorkshire edition",
    spine: "#3B5B4A",
    cover: "images/cover-wuthering.jpg",
    synopsis:
      "A tenant calls on a strange household on the moor and is handed a story that will not stay inside its own frame.",
    credit: "First published as Ellis Bell, 1847. AR clothbound.",
    chapters: [
      {
        title: "Chapter I — The Visitor",
        paras: [
          "I have just returned from a visit to my landlord — the solitary neighbour that I shall be troubled with. This is certainly a beautiful country! In all England, I do not believe that I could have fixed on a situation so completely removed from the stir of society.",
          "A perfect misanthropist's heaven: and Mr. Heathcliff and I are such a suitable pair to divide the desolation between us. A capital fellow! He little imagined how my heart warmed towards him.",
          "A change of weather on the moor brings the wind in off the hills before you have walked a mile of it.",
        ],
      },
      {
        title: "Chapter II — The Kitchen",
        paras: [
          "The kitchen, or rather the room in which I was, was a perfect toy-house: it had an extremely low ceiling, and a huge chimney, the passage of which was occupied by a great number of huge chests.",
          "Wuthering Heights is the name of Mr. Heathcliff's dwelling. 'Etching' would better express the thoughts of the inhabitants.",
        ],
      },
      {
        title: "Chapter III — The Moor",
        paras: [
          "I don't suppose she has ever been here before, and I could hardly carry her on to the moor now; and she'll be safe enough till Heathcliff comes home.",
          "The house stands empty, and the wind whistles through the firs on the hill, and the moor stretches away with nothing on it but a single tree.",
        ],
      },
    ],
  },
  {
    id: "moby",
    title: "Moby-Dick",
    titleJa: "",
    author: "Herman Melville",
    authorJa: "",
    year: 1851,
    genre: "Fiction",
    edition: "Whaling edition",
    spine: "#1F3FB0",
    cover: "images/cover-moby.jpg",
    synopsis:
      "A schoolteacher who prefers the sea to the shore signs on to a whaling ship whose captain has one animal left in the world to argue with.",
    credit: "First published as The Whale, 1851. AR clothbound.",
    chapters: [
      {
        title: "Chapter I — Loomings",
        paras: [
          "Call me Ishmael. Some years ago — never mind how long precisely — having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
          "It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul, then I account it high time to get to sea as soon as I can.",
          "This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.",
        ],
      },
      {
        title: "Chapter II — The Carpet-Bag",
        paras: [
          "I stuffed a shirt or two into my old carpet-bag, tucked it under my arm, and started for Cape Horn and the Pacific. Quitting the good city of Manhatto, I duly arrived in New Bedford. It was on a Saturday night in December.",
          "Much was I disappointed upon learning that the little packet for Nantucket had already sailed, and that no way of reaching that place would offer, till the following Monday.",
        ],
      },
      {
        title: "Chapter III — The Spouter-Inn",
        paras: [
          "Entering that gable-ended Spouter-Inn, you found yourself in a wide, low, straggling entry with old-fashioned wainscots, reminding one of the bulwarks of some condemned old craft.",
          "On one side hung a very large oilpainting so thoroughly besmoked, and every way defaced, that in the unsteady lights of day and night it was as the place to see, if you would see anything of the picture.",
        ],
      },
    ],
  },
  {
    id: "walden",
    title: "Walden",
    titleJa: "",
    author: "Henry David Thoreau",
    authorJa: "",
    year: 1854,
    genre: "Philosophy",
    edition: "Concord edition",
    spine: "#5A574F",
    cover: "images/cover-walden.jpg",
    synopsis:
      "Two years, two months and two days in a cabin he built himself, with an exact account of what everything cost and what it was worth.",
    credit: "First published 1854. AR clothbound.",
    chapters: [
      {
        title: "Economy — I",
        paras: [
          "When I wrote the following pages, or rather the bulk of them, I lived alone, in the woods, a mile from any neighbour, in a house which I had built myself, on the shore of Walden Pond, in Concord, Massachusetts, and earned my living by the labour of my hands only.",
          "I lived there two years and two months. At present I am a sojourner in civilized life again. I should not obtrude my affairs so much on the notice of my readers if very particular inquiries had not been made by my townsmen concerning my mode of life.",
          "The mass of men lead lives of quiet desperation. What is called resignation is confirmed desperation. They must be a sort of Numidian grenadiers who go into voluntary service.",
        ],
      },
      {
        title: "Where I Lived, and What I Lived For",
        paras: [
          "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.",
          "I did not wish to live what was not life, living is so dear; nor did I wish to practise resignation, unless it was quite necessary.",
        ],
      },
      {
        title: "Reading",
        paras: [
          "With a little more deliberation in the choice of their pursuits, all men would perhaps become essentially students and observers, for certainly their nature and destiny are interesting to all alike.",
          "The works of the great poets have never yet been read by mankind, for only great poets can read them.",
        ],
      },
    ],
  },
  {
    id: "leaves",
    title: "Leaves of Grass",
    titleJa: "",
    author: "Walt Whitman",
    authorJa: "",
    year: 1855,
    genre: "Poetry",
    edition: "Brooklyn edition",
    spine: "#8A6A2F",
    cover: null,
    synopsis:
      "A self-published book of poems, printed at the author's own expense, that rewrote what an American sentence could hold.",
    credit: "First published 1855. AR clothbound.",
    chapters: [
      {
        title: "Song of Myself — I",
        paras: [
          "I celebrate myself, and sing myself, And what I assume you shall assume, For every atom belonging to me as good belongs to you. I loafe and invite my soul, I lean and loafe at my ease observing a spear of summer grass.",
          "My tongue, every atom of my blood, form'd from this soil, this air, Born here of parents born here from parents the same, and their parents the same, I, now thirty-seven years old in perfect health begin, Hoping to cease not till death.",
          "Creeds and schools in abeyance, Retiring back a while sufficed at what they are, but never forgotten, I harbour for good or bad, I permit to speak at every moment, Reason and persuasion.",
        ],
      },
      {
        title: "The Open Road",
        paras: [
          "Afoot and light-hearted I take to the open road, Healthy, free, the world before me, The long brown path before me leading wherever I choose.",
          "Henceforth I ask not good-fortune, I myself am good-fortune, Henceforth I whimper no more, postpone no more, need nothing, Done with indoor complaints, libraries, querulous criticisms.",
        ],
      },
      {
        title: "When Lilacs Last in the Dooryard Bloom'd",
        paras: [
          "When lilacs last in the dooryard bloom'd, And the great star early droop'd in the western night in the sky, I mourn'd, and yet shall mourn with ever-returning spring.",
          "Coffin that passes along the street, I hear the jewelled hearse, I hear the keys of the tombs.",
        ],
      },
    ],
  },
  {
    id: "zarathustra",
    title: "Thus Spoke Zarathustra",
    titleJa: "",
    author: "Friedrich Nietzsche",
    authorJa: "",
    year: 1883,
    genre: "Philosophy",
    edition: "Leipzig edition",
    spine: "#141414",
    cover: null,
    synopsis:
      "A prophet comes down from his mountain, finds nobody interested, and keeps talking anyway.",
    credit: "First published 1883–1885. AR clothbound.",
    chapters: [
      {
        title: "Zarathustra's Prologue — I",
        paras: [
          "When Zarathustra was thirty years old, he left his home and the lake of his home, and went into the mountains. Here he enjoyed his spirit and his solitude, and for ten years he did not tire of it. But at last his heart changed, and rising one morning with the rosy dawn, he stepped before the sun and spoke to it thus.",
          "You great star! What would be your happiness if you had not those for whom you shine! For ten years you have climbed here to my cave: you would have grown weary of your light and of the journey, had it not been for me.",
          "But we awaited you every morning, took your overflow from you, and blessed you for it. Behold, I am weary of my wisdom, like a bee that has gathered too much honey; I need hands outstretched to take it.",
        ],
      },
      {
        title: "On the Three Metamorphoses",
        paras: [
          "Of three metamorphoses of the spirit I tell you: how the spirit becomes a camel, the camel a lion, and the lion at last a child.",
          "There is much that is heavy for the spirit, the strong load-bearing spirit in which dwell gravity and the lion: what is heavy, it seeks to load upon itself.",
        ],
      },
      {
        title: "On Reading and Writing",
        paras: [
          "Of all that is written I love only what a man has written with his blood. Write with blood: and you will discover that blood is spirit.",
          "It is not easy to understand unfamiliar blood: I hate reading idlers.",
        ],
      },
    ],
  },
  {
    id: "timemachine",
    title: "The Time Machine",
    titleJa: "",
    author: "H. G. Wells",
    authorJa: "",
    year: 1895,
    genre: "Science Fiction",
    edition: "Heathman edition",
    spine: "#1F3FB0",
    cover: "images/cover-timemachine.jpg",
    synopsis:
      "An inventor demonstrates a machine that moves through the fourth dimension, and comes back with a report nobody asked for.",
    credit: "First published 1895. AR clothbound.",
    chapters: [
      {
        title: "The Time Traveller's Demonstration",
        paras: [
          "The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His pale grey eyes shone and twinkled, and his usually pale face was flushed and animated.",
          "The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.",
          "'You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception.'",
        ],
      },
      {
        title: "The Machine Vanishes",
        paras: [
          "I put my hand on the lever and pressed it. There was a sound of a strange wind, a gust of air, the lamp flared, and the little machine swung round, became indistinct, and vanished.",
          "Except for the gliding lights and the shadows, it was quite gone — like a ghost or a dream. The thing had gone, and the darkness had come again.",
        ],
      },
      {
        title: "The Garden of the Future",
        paras: [
          "The air grew very much colder, and the sky was like a sheet of copper, and the landscape was very still. I saw the white things running through the trees, and understood at last what the Morlocks were.",
          "It is a world that has had a thousand thousand years to forget the things we think important.",
        ],
      },
    ],
  },
  {
    id: "dracula",
    title: "Dracula",
    titleJa: "",
    author: "Bram Stoker",
    authorJa: "",
    year: 1897,
    genre: "Horror",
    edition: "Constanta edition",
    spine: "#C8452B",
    cover: "images/cover-dracula.jpg",
    synopsis:
      "A young solicitor travels east to conclude an estate, and the paperwork turns out to be the least of it. Told in letters, diaries and phonograph notes.",
    credit: "First published 1897. AR clothbound.",
    chapters: [
      {
        title: "3 May — Bistritz",
        paras: [
          "3 May. Bistritz. — Left Munich at 8:35 p.m., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late.",
          "Budapest seems a wonderful place, from the glimpse which I got of it from the train and the little I could walk through the streets. I feared to go very far from the station, as we had arrived late and would start as near the correct time as possible.",
          "The impression I had was that we were leaving the West and entering the East; the most western of splendid bridges over the Danube, which is here of noble width and depth.",
        ],
      },
      {
        title: "5 May — The Castle",
        paras: [
          "I think I must have been asleep, for certainly if I had been fully awake I must have noticed the turn to the right. The carriage went at a hard pace straight along, then made a turn to the left and then another to the right.",
          "My landlord, who had greeted me with such courtesy when I arrived, was waiting for me at the door of the castle, and helped me to alight from the carriage.",
        ],
      },
      {
        title: "7 May — The Count's Welcome",
        paras: [
          "I saw the whole of the back of the castle; the windows were as narrow and as closely set as those of the battlements, and there was one very small window at the top of the stair.",
          "Welcome to my house! Enter freely and of your own will! Leave something of the joy you bring. The night air is chill, and you must need rest and food.",
        ],
      },
    ],
  },
  {
    id: "warworlds",
    title: "The War of the Worlds",
    titleJa: "",
    author: "H. G. Wells",
    authorJa: "",
    year: 1898,
    genre: "Science Fiction",
    edition: "Woking edition",
    spine: "#3B5B4A",
    cover: null,
    synopsis:
      "Mars, short of water, sends machines ahead of its own emigration. The first chapter is the only one anybody quotes.",
    credit: "First published 1898. AR clothbound.",
    chapters: [
      {
        title: "I — The Cylinder Opens",
        paras: [
          "No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man's and yet as mortal as his own; that as men busied themselves about their various concerns they were being scrutinised and studied, almost as narrowly as a man with a microscope could scrutinise the transient creatures that swarm and multiply in a drop of water.",
          "That men busied themselves about their various concerns they were being scrutinised and studied: yet across the gulf of space, minds that are to our minds as ours are to those of the beasts that perish, intellects vast and cool and unsympathetic, regarded this earth with envious eyes.",
          "Slowly and surely they drew their plans against us.",
        ],
      },
      {
        title: "II — The Falling Star",
        paras: [
          "Early in the morning a star fell from the sky. It came down in a long glow, and the people who saw it ran before it, for it was heading for the common.",
          "The thing must have been twenty yards across, and the air roared with the heat of its passage, and the ground shook.",
        ],
      },
      {
        title: "III — The Heat Ray",
        paras: [
          "There was a voice from over the common, and someone was calling for a flag. A young artillery officer, who had been sent to observe, came back across the grass at a run.",
          "Then came a long silence. Out of the cylinder rose a thin, grey, snake-like shape, and the machines came walking over the heath.",
        ],
      },
    ],
  },
  {
    id: "gatsby",
    title: "The Great Gatsby",
    titleJa: "",
    author: "F. Scott Fitzgerald",
    authorJa: "",
    year: 1925,
    genre: "Fiction",
    edition: "West Egg edition",
    spine: "#1F3FB0",
    cover: "images/cover-gatsby.jpg",
    synopsis:
      "A neighbour with a good address and no visible income narrates the summer a man across the bay tried to buy back a past that had already happened to somebody else.",
    credit: "First published 1925. AR clothbound.",
    chapters: [
      {
        title: "I — The Advice",
        paras: [
          "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. 'Whenever you feel like criticizing anyone,' he told me, 'just remember that all the people in this world haven't had the advantages that you've had.'",
          "There's something gorgeous about him, suggested a woman. Those are enormous words, I objected. They're dangerous, I said.",
          "And so it happened that on a warm windy evening I drove over to East Egg to see two old friends whom I scarcely knew at all. My house is at the very tip of the egg, only fifty yards from the Sound.",
        ],
      },
      {
        title: "II — The Valley of Ashes",
        paras: [
          "About halfway between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land.",
          "This is a valley of ashes — a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke.",
        ],
      },
      {
        title: "III — The Green Light",
        paras: [
          "He stretched out his arms towards the dark water in a curious way, and, far as I was from him, I could have sworn he was trembling. Involuntarily I glanced seaward — and distinguished nothing except a single green light.",
          "It might be the end of a dock. When I looked once more for Gatsby he had vanished, and I was alone again in the unquiet darkness.",
        ],
      },
    ],
  },
  {
    id: "cthulhu",
    title: "The Call of Cthulhu",
    titleJa: "",
    author: "H. P. Lovecraft",
    authorJa: "",
    year: 1928,
    genre: "Horror",
    edition: "Arkham edition",
    spine: "#141414",
    cover: null,
    synopsis:
      "An accountant finds a dead cousin's papers, and the papers turn out to be an argument about something that is still waiting in the Pacific.",
    credit: "First published 1928. AR clothbound.",
    chapters: [
      {
        title: "I — The Horror in Clay",
        paras: [
          "The most merciful thing in the world, I think, is the inability of the human mind to correlate all its contents. We live on a placid island of ignorance in the midst of black seas of infinity, and it was not meant that we should voyage far.",
          "Some day the piecing together of dissociated knowledge will open up such terrifying vistas of reality, and of our frightful position therein, that we shall either go mad from the revelation or flee from the deadly light into the peace and safety of a new dark age.",
          "The sciences, each straining in its own direction, have hitherto harmed us little; but some day the piecing together of dissociated knowledge will open up such terrifying vistas.",
        ],
      },
      {
        title: "II — The Statue",
        paras: [
          "The relief is of a monstrous character, and portrays a thing which seemed almost human in the outlines of its vast, unhewn limbs, but was in fact a bestial idol of an unclean cult.",
          "The artist had drawn it from a statue of basalt, and there was something about its squatting posture that made the young man uneasy.",
        ],
      },
      {
        title: "III — The Coast",
        paras: [
          "On November first the storm was at its height, and a great wave broke over the sea wall, carrying with it a smell of salt and of something older than salt.",
          "There is a place where the old stones do not sit square, and the men who fish there do not speak of it afterwards.",
        ],
      },
    ],
  },
];

/* ============================================================
   Extension repositories
   ============================================================ */

export type PluginSeed = {
  id: string;
  name: string;
  site: string;
  url: string;
  lang: string;
  nsfw?: boolean;
};

/** Bundled catalogue — used when the live repository cannot be reached. */
export const FALLBACK_PLUGINS: PluginSeed[] = [
  { id: "royalroad", name: "Royal Road", site: "royalroad.com", url: "https://www.royalroad.com", lang: "en" },
  { id: "scribblehub", name: "Scribble Hub", site: "scribblehub.com", url: "https://www.scribblehub.com", lang: "en" },
  { id: "syosetu", name: "Shōsetsuka ni Narō", site: "syosetu.com", url: "https://ncode.syosetu.com", lang: "ja" },
  { id: "kakuyomu", name: "Kakuyomu", site: "kakuyomu.jp", url: "https://kakuyomu.jp", lang: "ja" },
  { id: "novelupdates", name: "Novel Updates", site: "novelupdates.com", url: "https://www.novelupdates.com", lang: "en" },
  { id: "wuxiaworld", name: "WuxiaWorld", site: "wuxiaworld.com", url: "https://www.wuxiaworld.com", lang: "en" },
  { id: "webnovel", name: "WebNovel", site: "webnovel.com", url: "https://www.webnovel.com", lang: "en" },
  { id: "mtlnovel", name: "MTL Novel", site: "mtlnovel.com", url: "https://www.mtlnovel.com", lang: "en" },
  { id: "novelbin", name: "NovelBin", site: "novelbin.com", url: "https://novelbin.com", lang: "en" },
  { id: "boxnovel", name: "Box Novel", site: "boxnovel.com", url: "https://boxnovel.com", lang: "en" },
  { id: "goodnovel", name: "GoodNovel", site: "goodnovel.com", url: "https://www.goodnovel.com", lang: "en" },
  { id: "lightnovelworld", name: "Light Novel World", site: "lightnovelworld.com", url: "https://www.lightnovelworld.com", lang: "en" },
  { id: "readlightnovel", name: "Read Light Novel", site: "readlightnovel.com", url: "https://www.readlightnovel.com", lang: "en" },
  { id: "novelhall", name: "Novel Hall", site: "novelhall.com", url: "https://novelhall.com", lang: "en" },
  { id: "ao3", name: "Archive of Our Own", site: "archiveofourown.org", url: "https://archiveofourown.org", lang: "en" },
  { id: "fanfiction", name: "FanFiction.net", site: "fanfiction.net", url: "https://www.fanfiction.net", lang: "en" },
  { id: "spacebattles", name: "Space Battles", site: "spacebattles.com", url: "https://forums.spacebattles.com", lang: "en" },
  { id: "questionable", name: "Questionable Questing", site: "questionablequesting.com", url: "https://questionablequesting.com", lang: "en" },
  { id: "medcom", name: "Media-Common", site: "media-common.com", url: "https://www.media-common.com", lang: "en" },
  { id: "wattpad", name: "Wattpad", site: "wattpad.com", url: "https://www.wattpad.com", lang: "en" },
  { id: "gravitytales", name: "Gravity Tales", site: "gravitytales.com", url: "https://gravitytales.com", lang: "en" },
  { id: "novelhall2", name: "Novel Hall Archive", site: "novelhall.org", url: "https://novelhall.org", lang: "en" },
  { id: "9tut", name: "9TUT", site: "9tut.com", url: "https://9tut.com", lang: "en" },
  { id: "koreanmtl", name: "Korean MTL", site: "koreanmtl.org", url: "https://koreanmtl.org", lang: "en" },
];

export const REPO_URL =
  "https://raw.githubusercontent.com/LNReader/lnreader-plugins/plugins/v3.0.0/.dist/plugins.min.json";

/* ============================================================
   Web novels surfaced by installed extensions
   ============================================================ */

export type NovelSeed = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  author: string;
  tags: string;
  chapters: number;
  synopsis: string;
  content: string[];
};

export const NOVELS: NovelSeed[] = [
  {
    id: "n-salt",
    sourceId: "royalroad",
    sourceName: "Royal Road",
    title: "The Salt Road",
    author: "H. W. Merrow",
    tags: "Fantasy · Progression",
    chapters: 41,
    synopsis:
      "A cartographer is hired to map a road that moves, and paid in a currency that only exists on it.",
    content: [
      "The road was not on any of my charts, which is the first thing you should understand about it. I had drawn the coast from Lome to the salt flats twice, in two different seasons, and the line ran true both times. On the third survey it ran somewhere else entirely.",
      "My client did not seem surprised. He was a small man with a ledger and no name worth writing down, and he paid me in coin that had a hole punched through the king's face. 'Draw what you see,' he said. 'Not what you remember.'",
      "I have learned, since, that this is the whole of the trade. The salt road does not move. You do. Every man who walks it carries a slightly different version of the world behind him, and the chart has to be redrawn each morning before the dew dries off the paper.",
    ],
  },
  {
    id: "n-lantern",
    sourceId: "syosetu",
    sourceName: "Shōsetsuka ni Narō",
    title: "Lantern-Keeper of the Fourth Ward",
    author: "Tsukiori",
    tags: "Urban Fantasy · Slice of Life",
    chapters: 128,
    synopsis:
      "Every lamp in the district must be lit before dark, or something walks in with the unlit ones. The job has excellent pension terms.",
    content: [
      "The wick has to be trimmed to the width of a fingernail. Any wider and the flame runs, any narrower and it starves — and a starving flame draws things that a healthy one keeps politely outside the circle of light.",
      "I did not apply for the position. The previous keeper left a note that said only 'third pole from the bridge, the one with the crack', and the ward office has been very helpful about not asking follow-up questions.",
      "It is a quiet life, all things considered. On good nights I walk the route in forty minutes, drink my tea while it is still hot, and am in bed by the hour the last lamp settles. On bad nights I count the poles twice.",
    ],
  },
  {
    id: "n-iron",
    sourceId: "wuxiaworld",
    sourceName: "WuxiaWorld",
    title: "Iron Furnace, Empty Hand",
    author: "Bai Shan",
    tags: "Martial Arts · Reincarnation",
    chapters: 87,
    synopsis:
      "A blacksmith wakes in the body of a young master who has never held anything heavier than a fan, and gets the family's attention within a week.",
    content: [
      "The first thing he did was pick up the hammer. Not to swing it — to feel the balance, the way the haft had been worn smooth on one side by a hand that was not his. The forge in the courtyard had gone cold, and that, more than anything, told him where he was.",
      "A servant watching from the doorway said nothing, which meant he had already been told to say nothing. That was fine. Silence was a language the smith understood: it was what a blade sounded like before the quench.",
      "By evening the whole household knew. By morning, three of them had opinions. The young master listened to all of them, thanked them, and went back to the anvil, because the metal does not care whose name is on the deed.",
    ],
  },
  {
    id: "n-quiet",
    sourceId: "novelupdates",
    sourceName: "Novel Updates",
    title: "The Quiet Reaches",
    author: "E. Vantablack",
    tags: "Science Fiction · First Contact",
    chapters: 23,
    synopsis:
      "Deep-space relays have started returning messages that were never sent, and the delay is getting shorter.",
    content: [
      "The relay at Kepler-442 answered on a Tuesday, which is a stupid thing to remember and the only thing I can. The message was mine. My voice, my clearance, my bad habit of tapping the console twice before I speak.",
      "The timestamp was nine years in the future.",
      "We ran the checksum four times. On the fifth, the reply came back while we were still reading the previous one — same voice, same tapping, and this time a single sentence: do not answer the second one.",
    ],
  },
  {
    id: "n-teahouse",
    sourceId: "kakuyomu",
    sourceName: "Kakuyomu",
    title: "Teahouse at the End of the Line",
    author: "Nagisa Ko",
    tags: "Fantasy · Drama",
    chapters: 64,
    synopsis:
      "The last train of the night stops at a station that is not on the map, and the woman running the teahouse remembers every passenger.",
    content: [
      "The station appears at 1:12 in the morning, between the second and third stops from the terminus, and only if you are still awake to see it. Most nights there is nobody. Some nights there is one.",
      "She pours without asking what you want. That is the rule of the house: you sit down, you drink, and you say the thing you have been carrying since the morning. Then the train comes, and it takes you back to whichever stop you got on at.",
      "I have been four times. I have not told anyone, because the fourth time she said my name, and I do not know how she learned it.",
    ],
  },
  {
    id: "n-glass",
    sourceId: "scribblehub",
    sourceName: "Scribble Hub",
    title: "A Castle Made of Glass Arithmetic",
    author: "quillwright",
    tags: "Progression · Academy",
    chapters: 152,
    synopsis:
      "In a school where buildings are built by solving, the newest student can only manage walls — and the walls are already cracking.",
    content: [
      "Rule one of the Atelier: anything you build, you sign. Rule two: anything you sign, you maintain. There is no rule three, because nobody who reached it has ever needed one.",
      "I could do walls. Walls were arithmetic — straightforward, load-bearing, honest about their limits. Arches were poetry and I was no poet, which is why the west corridor of my first year is still standing but the ceiling above it is a rumour.",
      "Master Ilva walked the length of it, tapped once with a knuckle, and said the only kind thing anyone had said to me in that place: 'It is holding. Keep going.'",
    ],
  },
  {
    id: "n-tide",
    sourceId: "mtlnovel",
    sourceName: "MTL Novel",
    title: "Reborn as the Tide",
    author: "Seafoam Translator",
    tags: "Xianxia · Transmigration",
    chapters: 309,
    synopsis:
      "A river spirit with one hundred years of merit wakes up inside a tax collector, and the merit does not transfer.",
    content: [
      "He remembered the river first: the cold of it, the particular patience of water moving over stone. Then he remembered that he was lying on a floor, in a body that ached in the shape of a man, with a ledger under his cheek.",
      "The merit was gone. A hundred years of holding the bank against the flood, gone as completely as if it had never been — and in its place, an office, a stamp, and a list of eleven villages behind on their grain.",
      "The river would have drowned the list. The tax collector folded it neatly, put on his coat, and went out into the rain, because drowning was not a thing this body could do and patience, it turned out, was transferable.",
    ],
  },
  {
    id: "n-paper",
    sourceId: "ao3",
    sourceName: "Archive of Our Own",
    title: "Everything We Left in the Margin",
    author: "footnotes",
    tags: "Epistolary · Historical",
    chapters: 17,
    synopsis:
      "Two scholars annotate the same borrowed book for thirty years without ever meeting, until the library decides to sell it.",
    content: [
      "The first hand is careful, dated, and disagrees with the text on page forty. The second hand is faster, undated, and agrees with the first hand every time, which is how you know they never met.",
      "Between them they leave a running argument in the margin: about the translator, about the war, about whether a book that has been borrowed this many times still belongs to anyone at all.",
      "In the final entry, the second hand writes: if you are reading this, they have put it up for sale. I have bought it. Do not write your name in it again — write to me instead.",
    ],
  },
];

/** Sentence-safe split for the TTS engine. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
