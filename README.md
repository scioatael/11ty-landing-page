# 11ty-landing-page

A simple landing page built with 11ty and Tailwind CSS.

> Port of the [Hugo Version](https://github.com/ttntm/hugo-landing-page)

## How to use this template

**Requirements:**

1. Eleventy (developed and tested with version 0.12.1)
2. Tailwind CSS (@2.0.4 - see [#2](https://github.com/ttntm/11ty-landing-page/issues/2))

All other dependencies are either linked from a CDN or included in this repository.

**Setup:**

1. Fork, clone or download
2. `cd` into the root folder
3. run `npm install`
4. run `npm run serve`
5. open a browser and go to `http://localhost:8080`

**Basic configuration:**

1. Eleventy -> `./.eleventy.js`
2. Tailwind -> `./tailwind.config.js`
3. Netlify -> `./netlify.toml`

CSS is built via PostCSS and based on `./src/_includes/css/_page.css`. Building CSS gets triggered by `./src/css/page.11ty.js`.

Please note that this CSS build _does not_ include the `normalize.css` file used for the 2 regular pages (imprint, privacy) - a minified production version is stored in `./src/static/css` and gets included in the build by default.

**Change Content:**

Page content is stored in

- `./src/`
  - `imprint.md`
  - `privacy.md`
- `./src/sections/`
- `./src/_data/features.json`

**Change Templates/Layout:**

Page structure and templates are stored in `./src/_layouts/` and can be edited there.

Best have a look at `./layouts/base.njk` first to understand how it all comes together - the page itself is constructed from partial templates stored in `./src/includes/` and each section has a corresponding template file (`section.**.njk`) stored there.

`index.njk` in `./src/` arranges everything, meaning that sections can be added/re-ordered/removed/... there.

**Change images:**

Images are stored in `./static/img/`; everything in there can be considered a placeholder that should eventually be replaced with your actual production images.

## ElevenLabs Studio API client

This repository now includes a lightweight browser-friendly client for the ElevenLabs Studio API at `./src/static/js/elevenlabsStudioClient.js`.

### Quick start

1. Import the client with an API key (for example via a `<script type="module">` block):

   ```js
   import ElevenLabsStudioClient from '/static/js/elevenlabsStudioClient.js';

   const studio = new ElevenLabsStudioClient({ apiKey: 'YOUR_API_KEY' });
   ```

2. Call the helper methods to work with projects and clips:

   ```js
   // Create a project
   const project = await studio.createProject({ name: 'Demo Project' });

   // Add and generate a clip
   const clip = await studio.createClip(project.project_id, {
     title: 'Intro',
     script_text: 'Welcome to our product!',
     voice_id: 'YOUR_VOICE_ID'
   });
   const job = await studio.generateClip(project.project_id, clip.clip_id);

   // Poll until the generation job finishes
   const result = await studio.pollJob(job.job_id);
   ```

See the inline JSDoc comments in `elevenlabsStudioClient.js` for all supported helper methods. The client relies on the global `fetch` implementation, so it can be used in modern browsers or in server-side environments that provide `fetch`.

### Simple Studio SPA

You can try the client without wiring up your own frontend by visiting `/studio` in a local build. The page provides a small single-page app that:

- Accepts your ElevenLabs API key and connects directly from the browser.
- Lists your existing Studio projects (showing names and `project_id` values).
- Lets you create new projects with an optional description.

Run `npm run serve` and navigate to `http://localhost:8080/studio/` to use the page. No data is stored; the API key is kept in the current browser session only.
