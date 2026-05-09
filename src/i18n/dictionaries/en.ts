import type { Dictionary } from '../types'

export const en: Dictionary = {
  language: {
    label: 'Language',
    ru: 'Русский',
    en: 'English',
    uk: 'Українська',
  },
  common: {
    back: 'Back',
    close: 'Close',
    next: 'Next',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading…',
    soon: 'Soon',
    nothingFound: 'Nothing found',
  },
  home: {
    pickMap: 'Pick a map',
    logoLink: 'Home',
    lineupsCount: '{count} lineups',
    grenadesEmpty: 'Soon',
    twoLayers: '2 levels',
    footerHint: 'Tap a map to see its lineups',
    nav: {
      ariaLabel: 'App sections',
      search: 'Search',
      maps: 'Maps',
      tactics: 'Tactics',
      news: 'New',
    },
    globalSearch: {
      hint: 'Type a spot name, e.g. Window or Окно',
      resultsHint: 'Tap a card — lineups for that map, side, and spot (T-side / CT-side).',
    },
    tacticsTab: {
      title: 'Team tactics',
      hint: 'Coming soon: per-round plans with your squad, right on your phone.',
    },
    newsTab: {
      title: 'What’s new',
      hint: 'Coming soon: a feed of fresh lineups and short clips.',
    },
    teamCta: {
      title: 'Team tactics',
      description:
        'Get the squad together, split roles, and have a per-round plan right on your phone.',
      create: 'Create meet',
      soonBadge: 'Soon',
    },
  },
  side: {
    title: 'Pick a side',
    subtitle: 'Side filters which positions and lineups you see',
    t: {
      short: 'T',
      full: 'Terrorists',
      hint: 'Attack. Plant the bomb.',
    },
    ct: {
      short: 'CT',
      full: 'Counter-Terrorists',
      hint: 'Defend. Stop the plant.',
    },
    pill: {
      reset: 'Change side',
    },
  },
  position: {
    title: 'Pick a position',
    subtitle: 'Where are you on the map',
    tab: {
      list: 'List',
      map: 'Map',
      photos: 'Cards',
    },
    photosSoon: 'Coming soon: visual picker — recognize your view from a screenshot.',
    listSoon:
      'The position list is temporarily disabled — use the map. We will bring back an updated list later.',
    noPhoto: 'No photo',
    mapSoon: 'Coming soon: tap a hotspot on the radar.',
    search: 'Search (e.g. Window, Окно)',
    empty: 'No lineups for this position yet',
    grenadesCount: '{count}',
    zoneAll: 'All',
    filter: {
      nadesTitle: 'Nades',
      teamsTitle: 'Teams',
      anyTeam: 'Any',
      allNades: 'ALL',
      smoke: 'Smokes',
      flash: 'Flashes',
      molotov: 'Molotovs',
      he: 'HE grenades',
    },
    pill: {
      reset: 'Change position',
    },
    pickerNav: {
      ariaLabel:
        'Map, photos, or list — tabs at the bottom; on phones swipe the bar left or right to change the screen',
    },
    category: {
      spawn: 'Spawns',
      a_site: 'A site',
      b_site: 'B site',
      mid: 'Mid & connectors',
      rotation: 'Rotations',
      utility: 'Utility',
    },
  },
  map: {
    backToMaps: 'Back to maps',
    grenadesCount: '{count} lineups',
    layerToggle: '↕',
  },
  subspot: {
    pickerTitle: 'Where did you spawn?',
    pickerHint: 'Pick the spot you are standing on — you will see lineups for that exact spot.',
    pillReset: 'Change spot',
    countLabel: '{count}',
    emptyHint: 'No sub-spots described for this position yet.',
  },
  lineupGallery: {
    title: 'Where to throw?',
    hint: 'Tap a card to open the video and description.',
    empty: 'No lineups from this spot yet. Try another?',
  },
  throwOrigin: {
    title: 'Where to throw from?',
    hint: 'Pick a starting point — the video and details for that throw will open.',
    mapHint: 'Only spots from which you can reach the selected target are shown.',
    empty: 'No throw options for this target yet.',
    listMode: 'List',
    mapMode: 'Map',
    externalMapHint: 'Throw starts are on the main map — tap a marker or the dashed line to the target.',
    modeDockAria: 'Mode: map or list of throw spots',
    variantDockAria: 'Throw spots for this same target. Swipe left or right on the bar, or tap a number.',
    variantPointAria: '{n} of {total}',
  },
  admin: {
    pickSide: 'Pick a side',
    pickSideHint: 'Which side are you adding lineups for — Ts or CTs.',
    pickPosition: 'Pick a position',
    pickPositionHint:
      'Where these lineups are thrown from. New points will inherit this tag automatically.',
    anyPosition: 'Any position',
    anyPositionHint: 'No callout — point will not appear in filters. Use for one-offs.',
    noPositions: 'No positions described for this side yet.',
    showAll: 'All points',
    allLabel: 'No filters',
    toApp: 'Open app',
    contextHint:
      'Only points for this side & position are visible. New points get these tags automatically.',
    contextHintAny:
      'Showing points without a callout. New points keep their position field empty.',
    autoTagged: 'Auto-tagged',
    positionsField: 'Positions (callouts)',
    positionsHint:
      'Where it is thrown from. Multiple allowed. Players use these tags to find lineups.',
    sideField: 'Side',
    sideAuto: 'Inherited from context',
    pickSubspot: 'Where does the player stand?',
    pickSubspotHint:
      'Pick the exact spawn spot — its photo will appear for users. Tap the card to start adding lineups from there.',
    anySubspot: 'Any sub-spot',
    anySubspotHint: 'No specific spawn point. Lineup will only appear in the parent filter.',
    uploadPhoto: 'Upload photo',
    replacePhoto: 'Replace photo',
    removePhoto: 'Remove photo',
    removePhotoConfirm: 'Remove photo from this spot?',
    subspotField: 'Sub-spot',
    subspotAuto: 'Inherited from context',
    changelogNav: 'Changelog',
    changelogBack: 'Back to maps',
    changelogTitle: 'Admin changelog',
    changelogLead:
      'Full history of moderator UI and related data changes. Update ADMIN_CHANGELOG.md after each notable change to catch regressions faster.',
  },
}
