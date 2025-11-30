/**
 * Lightweight ElevenLabs Studio API client.
 *
 * The Studio API is HTTP-based and authenticated with an API key passed via
 * the `xi-api-key` header. This client focuses on common project workflows and
 * keeps dependencies to a minimum by relying on the global `fetch` implementation.
 */
export default class ElevenLabsStudioClient {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Your ElevenLabs API key.
   * @param {string} [options.baseUrl] - Optional override for the API host.
   * @param {typeof fetch} [options.fetchImpl] - Custom fetch implementation (useful for SSR or testing).
   */
  constructor({ apiKey, baseUrl = 'https://api.elevenlabs.io/v1/studio', fetchImpl = undefined } = {}) {
    if (!apiKey) {
      throw new Error('An apiKey is required to use the ElevenLabs Studio API client.');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);

    if (!this.fetch) {
      throw new Error('A fetch implementation must be available in the current environment.');
    }
  }

  /**
   * Base request helper used by all endpoint methods.
   * @private
   */
  async request(path, { method = 'GET', headers = {}, query = {}, body } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    const isFormData = body instanceof FormData;
    const headersInit = { 'xi-api-key': this.apiKey, ...headers };
    if (!isFormData && !headersInit['Content-Type']) {
      headersInit['Content-Type'] = 'application/json';
    }

    const response = await this.fetch(url.toString(), {
      method,
      headers: headersInit,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = payload?.error || payload?.message || response.statusText;
      const detail = isJson ? JSON.stringify(payload) : payload;
      throw new Error(`ElevenLabs Studio API request failed: ${message}\n${detail}`);
    }

    return payload;
  }

  /**
   * Retrieve the list of Studio projects available for the authenticated user.
   */
  listProjects() {
    return this.request('/projects');
  }

  /**
   * Create a new project with the provided name and optional description.
   * @param {Object} input
   * @param {string} input.name
   * @param {string} [input.description]
   */
  createProject({ name, description } = {}) {
    if (!name) {
      throw new Error('A project name is required when creating a project.');
    }

    return this.request('/projects', {
      method: 'POST',
      body: { name, description },
    });
  }

  /**
   * Fetch a single project by ID.
   * @param {string} projectId
   */
  getProject(projectId) {
    this.#assertId('projectId', projectId);
    return this.request(`/projects/${projectId}`);
  }

  /**
   * Delete a project by ID.
   * @param {string} projectId
   */
  deleteProject(projectId) {
    this.#assertId('projectId', projectId);
    return this.request(`/projects/${projectId}`, { method: 'DELETE' });
  }

  /**
   * Create a clip inside a project.
   * @param {string} projectId
   * @param {Object} payload - Clip payload as expected by ElevenLabs (e.g., script text and voice ID).
   */
  createClip(projectId, payload = {}) {
    this.#assertId('projectId', projectId);
    return this.request(`/projects/${projectId}/clips`, {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Retrieve the details of a specific clip within a project.
   * @param {string} projectId
   * @param {string} clipId
   */
  getClip(projectId, clipId) {
    this.#assertId('projectId', projectId);
    this.#assertId('clipId', clipId);
    return this.request(`/projects/${projectId}/clips/${clipId}`);
  }

  /**
   * Trigger generation for a clip and return the resulting job metadata.
   * @param {string} projectId
   * @param {string} clipId
   * @param {Object} [payload] - Additional generation options.
   */
  generateClip(projectId, clipId, payload = {}) {
    this.#assertId('projectId', projectId);
    this.#assertId('clipId', clipId);
    return this.request(`/projects/${projectId}/clips/${clipId}/generate`, {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Upload an asset (e.g., background music or reference audio) to a project.
   * @param {string} projectId
   * @param {File|Blob|Buffer|ReadableStream} file
   * @param {Object} options
   * @param {string} options.filename - File name to associate with the upload.
   * @param {string} [options.contentType] - Optional MIME type when FormData cannot infer it.
   */
  uploadAsset(projectId, file, { filename, contentType } = {}) {
    this.#assertId('projectId', projectId);
    if (!file) {
      throw new Error('A file is required when uploading an asset.');
    }
    if (!filename) {
      throw new Error('A filename is required when uploading an asset.');
    }

    const formData = new FormData();
    if (contentType) {
      formData.append('file', file, filename, { contentType });
    } else {
      formData.append('file', file, filename);
    }

    return this.request(`/projects/${projectId}/assets`, {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Poll a long-running job until it completes or a timeout is reached.
   * @param {string} jobId
   * @param {Object} [options]
   * @param {number} [options.intervalMs=2000]
   * @param {number} [options.timeoutMs=60000]
   */
  async pollJob(jobId, { intervalMs = 2000, timeoutMs = 60000 } = {}) {
    this.#assertId('jobId', jobId);

    const start = Date.now();
    while (true) {
      const job = await this.request(`/jobs/${jobId}`);
      if (job.status && ['completed', 'failed', 'canceled'].includes(job.status)) {
        return job;
      }

      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timed out waiting for job ${jobId} to finish.`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  #assertId(name, value) {
    if (!value) {
      throw new Error(`${name} is required.`);
    }
  }
}
