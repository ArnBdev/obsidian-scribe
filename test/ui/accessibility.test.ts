import { AgentViewUI, UICallbacks } from '../../src/ui/agent-view/agent-view-ui';
import type ObsidianGemini from '../../main';
import { App } from 'obsidian';

// Mock dependencies
jest.mock('obsidian', () => {
	const mock = jest.requireActual('../../__mocks__/obsidian.js');
	return {
		...mock,
		setIcon: jest.fn(),
		Notice: jest.fn(),
	};
});

describe('AgentViewUI Accessibility Tests', () => {
	let plugin: any;
	let app: App;
	let ui: AgentViewUI;
	let container: HTMLElement;
	let callbacks: UICallbacks;

	beforeEach(() => {
		// Mock DOM
		document.body.innerHTML = '<div id="test-container"></div>';
		container = document.getElementById('test-container')!;

		// Mock plugin and app
		app = {
			workspace: {
				getActiveFile: jest.fn(),
			},
			vault: {
				getAbstractFileByPath: jest.fn(),
			},
			fileManager: {
				renameFile: jest.fn(),
			},
		} as any;

		plugin = {
			logger: {
				error: jest.fn(),
				debug: jest.fn(),
				warn: jest.fn(),
			},
			sessionManager: {
				sanitizeFileName: jest.fn((name) => name),
			},
			app: app,
		} as any;

		ui = new AgentViewUI(app, plugin);

		// Helper to mock DOM methods on container
		const addDOMMethods = (el: any) => {
			el.addClass = (cls: string) => el.classList.add(...cls.split(' '));
			el.removeClass = (cls: string) => el.classList.remove(...cls.split(' '));
			el.hasClass = (cls: string) => el.classList.contains(cls);
			el.empty = () => {
				el.innerHTML = '';
			};

			el.createDiv = (options?: any) => {
				const div = document.createElement('div');
				if (options?.cls) div.className = options.cls;
				if (options?.attr) {
					for (const [key, value] of Object.entries(options.attr)) {
						div.setAttribute(key, value as string);
					}
				}
				addDOMMethods(div);
				el.appendChild(div);
				return div;
			};

			el.createEl = (tag: string, options?: any) => {
				const elem = document.createElement(tag);
				if (options?.cls) elem.className = options.cls;
				if (options?.text) elem.textContent = options.text;
				if (options?.title) elem.title = options.title;
				if (options?.attr) {
					for (const [key, value] of Object.entries(options.attr)) {
						elem.setAttribute(key, value as string);
					}
				}
				addDOMMethods(elem);
				el.appendChild(elem);
				return elem;
			};

			el.createSpan = (options?: any) => el.createEl('span', options);
		};

		addDOMMethods(container);

		callbacks = {
			showFilePicker: jest.fn(),
			showFileMention: jest.fn(),
			showSessionList: jest.fn(),
			showSessionSettings: jest.fn(),
			createNewSession: jest.fn(),
			sendMessage: jest.fn(),
			stopAgentLoop: jest.fn(),
			removeContextFile: jest.fn(),
			updateContextFilesList: jest.fn(),
			updateSessionHeader: jest.fn(),
			updateSessionMetadata: jest.fn(),
			loadSession: jest.fn(),
			isCurrentSession: jest.fn(),
			addImageAttachment: jest.fn(),
			removeImageAttachment: jest.fn(),
			getImageAttachments: jest.fn().mockReturnValue([]),
		} as unknown as UICallbacks;
	});

	afterEach(() => {
		jest.clearAllMocks();
		document.body.innerHTML = '';
	});

	it('should add aria-label to icon-only buttons', () => {
		const sessionHeader = container.createDiv();
		const contextPanel = container.createDiv();
		const currentSession = {
			id: '1',
			title: 'Test Session',
			historyPath: 'history/1.md',
			context: { contextFiles: [] },
		} as any;

		ui.createCompactHeader(sessionHeader, contextPanel, currentSession, callbacks);

		const toggleBtn = sessionHeader.querySelector('.gemini-agent-toggle-btn');
		expect(toggleBtn?.getAttribute('aria-label')).toBe('Toggle context panel');

		const settingsBtn = sessionHeader.querySelector('button[title="Session Settings"]');
		expect(settingsBtn?.getAttribute('aria-label')).toBe('Session settings');

		const newSessionBtn = sessionHeader.querySelector('button[title="New Session"]');
		expect(newSessionBtn?.getAttribute('aria-label')).toBe('New session');

		const listSessionsBtn = sessionHeader.querySelector('button[title="Browse Sessions"]');
		expect(listSessionsBtn?.getAttribute('aria-label')).toBe('Browse sessions');
	});

	it('should add aria-expanded to context toggle button and update on click', () => {
		const sessionHeader = container.createDiv();
		const contextPanel = container.createDiv();
		// Initially collapsed
		contextPanel.classList.add('gemini-agent-context-panel-collapsed');

		const currentSession = {
			id: '1',
			title: 'Test Session',
			historyPath: 'history/1.md',
			context: { contextFiles: [] },
		} as any;

		ui.createCompactHeader(sessionHeader, contextPanel, currentSession, callbacks);

		const toggleBtn = sessionHeader.querySelector('.gemini-agent-toggle-btn') as HTMLElement;
		expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

		// Click to expand
		toggleBtn.click();
		expect(contextPanel.classList.contains('gemini-agent-context-panel-collapsed')).toBe(false);
		expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

		// Click to collapse
		toggleBtn.click();
		expect(contextPanel.classList.contains('gemini-agent-context-panel-collapsed')).toBe(true);
		expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
	});

	it('should have Edit Title button next to session title', () => {
		const sessionHeader = container.createDiv();
		const contextPanel = container.createDiv();
		const currentSession = {
			id: '1',
			title: 'Test Session',
			historyPath: 'history/1.md',
			context: { contextFiles: [] },
		} as any;

		ui.createCompactHeader(sessionHeader, contextPanel, currentSession, callbacks);

		const editBtn = sessionHeader.querySelector('.gemini-agent-title-edit-btn');
		expect(editBtn).toBeTruthy();
		expect(editBtn?.getAttribute('aria-label')).toBe('Edit session title');
	});

	it('should add accessibility attributes to user input', () => {
		const inputArea = container.createDiv();
		const { userInput } = ui.createInputArea(inputArea, callbacks);

		expect(userInput.getAttribute('role')).toBe('textbox');
		expect(userInput.getAttribute('aria-multiline')).toBe('true');
		expect(userInput.getAttribute('aria-label')).toBe('Message input');
	});

	it('should add aria-label to context file buttons', () => {
		const contextPanel = container.createDiv();
		const filesList = container.createDiv();

		const currentSession = {
			id: '1',
			title: 'Test Session',
			historyPath: 'history/1.md',
			context: {
				contextFiles: [{ basename: 'Note 1', path: 'Note 1.md' }],
			},
		} as any;

		// We need to implement updateContextFilesList callback to simulate what AgentView does,
		// OR we can test ui.updateContextFilesList directly which is what we want.

		ui.updateContextFilesList(filesList, currentSession, callbacks);

		const removeBtn = filesList.querySelector('.gemini-agent-remove-btn');
		expect(removeBtn?.getAttribute('aria-label')).toBe('Remove Note 1');
	});

	it('should add aria-label to Add Context Files button', () => {
		const contextPanel = container.createDiv();
		const currentSession = {
			id: '1',
			title: 'Test Session',
			historyPath: 'history/1.md',
			context: { contextFiles: [] },
		} as any;

		ui.createContextPanel(contextPanel, currentSession, callbacks);

		const addBtn = contextPanel.querySelector('button[title="Add context files"]');
		expect(addBtn?.getAttribute('aria-label')).toBe('Add context files');
	});
});
