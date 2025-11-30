import ElevenLabsStudioClient from './elevenlabsStudioClient.js';

const apiKeyInput = document.getElementById('api-key-input');
const connectButton = document.getElementById('connect-button');
const statusMessage = document.getElementById('status-message');
const projectsList = document.getElementById('projects-list');
const refreshButton = document.getElementById('refresh-projects');
const createForm = document.getElementById('create-project-form');
const projectNameInput = document.getElementById('project-name');
const projectDescriptionInput = document.getElementById('project-description');

let client = null;
let isLoadingProjects = false;

const setStatus = (text, tone = 'info') => {
  statusMessage.textContent = text;
  statusMessage.className = `text-sm ${tone === 'error' ? 'text-red-600' : 'text-gray-700'}`;
};

const renderProjects = (projects = []) => {
  projectsList.innerHTML = '';

  if (!projects.length) {
    projectsList.innerHTML = '<p class="text-sm text-gray-500">No projects found yet. Create one to get started.</p>';
    return;
  }

  projects.forEach((project) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 rounded-md p-4 shadow-sm';

    const name = document.createElement('p');
    name.className = 'text-base font-semibold text-gray-900';
    name.textContent = project.name || 'Untitled project';

    const id = document.createElement('p');
    id.className = 'text-xs text-gray-500 break-all';
    id.textContent = project.project_id || 'Unknown project id';

    item.appendChild(name);
    item.appendChild(id);
    projectsList.appendChild(item);
  });
};

const extractProjects = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.projects)) return payload.projects;
  return [];
};

const toggleProjectsLoading = (loading) => {
  isLoadingProjects = loading;
  refreshButton.disabled = loading;
  refreshButton.textContent = loading ? 'Loading...' : 'Refresh';
};

const loadProjects = async () => {
  if (!client || isLoadingProjects) return;

  toggleProjectsLoading(true);
  setStatus('Fetching projects...', 'info');

  try {
    const response = await client.listProjects();
    const projects = extractProjects(response);
    renderProjects(projects);
    setStatus('Projects loaded.');
  } catch (error) {
    console.error(error);
    renderProjects([]);
    setStatus(error.message || 'Unable to fetch projects.', 'error');
  } finally {
    toggleProjectsLoading(false);
  }
};

const setupClient = () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setStatus('Please provide an API key to continue.', 'error');
    return false;
  }

  try {
    client = new ElevenLabsStudioClient({ apiKey });
    setStatus('Connected. You can now refresh or create projects.');
    return true;
  } catch (error) {
    setStatus(error.message, 'error');
    return false;
  }
};

connectButton?.addEventListener('click', async () => {
  const ready = setupClient();
  if (ready) {
    await loadProjects();
  }
});

refreshButton?.addEventListener('click', async () => {
  if (!client) {
    setStatus('Connect with your API key before refreshing projects.', 'error');
    return;
  }
  await loadProjects();
});

createForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!client) {
    setStatus('Connect with your API key before creating a project.', 'error');
    return;
  }

  const name = projectNameInput.value.trim();
  const description = projectDescriptionInput.value.trim();

  if (!name) {
    setStatus('Please enter a project name.', 'error');
    projectNameInput.focus();
    return;
  }

  const submitButton = createForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Creating...';
  setStatus('Creating project...');

  try {
    await client.createProject({ name, description: description || undefined });
    projectNameInput.value = '';
    projectDescriptionInput.value = '';
    setStatus('Project created successfully!');
    await loadProjects();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Unable to create project.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Create project';
  }
});
