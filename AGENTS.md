# Slowhaven delivery conventions

The user wants a playable, polished, mobile-friendly life game. Preserve existing IndexedDB lives and the original diorama entry.

- Implement in `dist/life/`; Three.js and all assets are local. Keep simulation rules independent of rendering and browser audio.
- Phone text inputs/selects must be at least 16 CSS pixels to avoid iOS focus zoom. Verify 320, 375/390, and landscape layouts. The header, joystick, action button and bottom menu must fit without clipping or overlap. Do not leave the first-run desktop help card over the phone game.
- The joystick must stop on release, cancellation, blur, panels and hidden pages. Keyboard and tap-to-walk remain available.
- Sound is a core feature: retain separate master/music/ambience/effects levels, start audio only after a user gesture, respect mute, suspend in the background, and bound the audio graph.
- Interaction cards must reserve visible scene space and reframe both the player and target. Hide the mobile toolbar/HUD while a card is open; keep long menus in scrollable reader surfaces with a fixed close button. Fit complete interiors, including exits, around visible controls. Keep 2D picking and 3D projection aligned with the visual viewport.
- Verify continuous life after NPCs have reached their destinations. Use elapsed-time clock tests at low and variable frame rates, verify explicit pause/resume and background behavior, and check real running scenes as well as screenshots. NPC interaction coordinates must match rendered poses; keep existing schema-2 saves intact.
- Run `npm test` and the relevant browser checks. Clearly distinguish viewport checks, geometry checks and real-device GPU/audio testing.
- Run `npm run prepare:pages` after game changes to refresh the portable `docs/` static copy before source synchronization; do not edit generated `docs/` files directly.
- Publish finished updates to the existing Site with its supported source workflow. The user has requested a link other people can open to play; game access may be public while each browser's saves remain local.
- This project is backed up in the public GitHub repository https://github.com/DozenSoap/slowhaven-town (repository ID 1439165438, owner DozenSoap). On 2026-10-30 the user explicitly authorized making this repository public to enable GitHub Pages. Pages publishes `main:/docs` at https://dozensoap.github.io/slowhaven-town/. Later source synchronization must target this repository only. The user explicitly forbids changing any other pre-existing GitHub projects, code, branches, permissions, or deployment settings. Do not purchase or upgrade a plan.
- Use the connected GitHub tools for source writes when supported. If creation or Pages settings require browser sign-in, use the secure authentication flow. Do not create or copy access tokens.
- Keep test frames, credentials, user saves, local databases, uploaded personal photos and generated QA captures out of the deployed game and the GitHub source mirror. Remove `dist/__qa__/` before packaging.
