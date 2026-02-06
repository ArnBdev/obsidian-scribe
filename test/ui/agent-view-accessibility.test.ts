import { AgentView } from '../../src/ui/agent-view/agent-view';
import { AgentViewUI } from '../../src/ui/agent-view/agent-view-ui';
import { SessionManager } from '../../src/agent/session-manager';
import { ToolRegistry } from '../../src/tools/tool-registry';
import { ToolExecutionEngine } from '../../src/tools/execution-engine';
import { WorkspaceLeaf } from 'obsidian';

// Mock dependencies
jest.mock('../../src/agent/session-history');
jest.mock('../../src/tools/tool-registry');
jest.mock('../../src/tools/execution-engine');
jest.mock('../../src/ui/agent-view/file-picker-modal');
jest.mock('../../src/ui/agent-view/session-settings-modal');

// Mock Obsidian
jest.mock('obsidian', () => {
	const mock = jest.requireActual('../../__mocks__/obsidian.js');
	return {
		...mock,
		ItemView: class ItemView {
			contentEl = document.createElement('div');
			containerEl = document.createElement('div');
			app: any = {};
			leaf: any = {};
			navigation = true;

			constructor(leaf: any) {
				this.leaf = leaf;
			}

			load() {}
			onload() {}
			onunload() {}
			getViewType() {
				return 'test';
			}
			getDisplayText() {
				return 'Test';
			}
			getIcon() {
				return 'test';
			}
		},
		setIcon: jest.fn(),
	};
});

describe('AgentView Accessibility Tests', () => {
	let plugin: any;
	let leaf: WorkspaceLeaf;
	let agentView: AgentView;

	beforeEach(() => {
		document.body.innerHTML = '<div id="test-container"></div>';

		// Mock plugin
		plugin = {
			settings: { historyFolder: 'gemini-scribe' },
			logger: { debug: jest.fn(), log: jest.fn(), warn: jest.fn(), error: jest.fn() },
			app: {
				workspace: { getLeaf: jest.fn(), getActiveFile: jest.fn() },
				vault: { getAbstractFileByPath: jest.fn(), getMarkdownFiles: jest.fn().mockReturnValue([]) },
			},
		};

		plugin.sessionManager = new SessionManager(plugin);
		plugin.toolRegistry = new ToolRegistry(plugin);
		plugin.toolEngine = new ToolExecutionEngine(plugin, plugin.toolRegistry);

		leaf = {} as WorkspaceLeaf;
		agentView = new AgentView(leaf, plugin);

		// Setup agentView.ui with mocked app
		agentView.ui = new AgentViewUI(plugin.app, plugin);

		// DOM Mocking Helper
		const addDOMMethods = (el: any) => {
			el.empty = () => {
				el.innerHTML = '';
			};
			el.addClass = (cls: string) => {
				el.classList.add(cls);
			};
			el.removeClass = (cls: string) => {
				el.classList.remove(cls);
			};
			el.hasClass = (cls: string) => el.classList.contains(cls);
			el.createEl = (tag: string, options?: any) => {
				const child = document.createElement(tag);
				if (options?.cls) child.className = options.cls;
				if (options?.text) child.textContent = options.text;
				if (options?.attr) {
					// console.log(`Setting attributes for ${tag}:`, options.attr);
					for (const [k, v] of Object.entries(options.attr)) {
						child.setAttribute(k, v as string);
					}
				}
				if (options?.title) child.setAttribute('title', options.title);
				addDOMMethods(child);
				el.appendChild(child);
				return child;
			};
			el.createDiv = (options?: any) => el.createEl('div', options);
			el.createSpan = (options?: any) => el.createEl('span', options);
		};

		const mockContainer = document.createElement('div');
		addDOMMethods(mockContainer);
		agentView.containerEl = mockContainer;

		// Mock onOpen/onClose
		agentView.onOpen = jest.fn(async () => {
			(agentView as any).opened = true;
		});
	});

	it('should have aria-labels on header buttons', async () => {
		const ui = agentView.ui;

		const callbacks = {
			showSessionSettings: jest.fn(),
			createNewSession: jest.fn(),
			showSessionList: jest.fn(),
			updateContextFilesList: jest.fn(),
		} as any;

		const container = document.createElement('div');
		// Add DOM methods locally for this test container
		const addDOMMethods = (el: any) => {
			el.empty = () => {
				el.innerHTML = '';
			};
			el.addClass = (cls: string) => {
				el.classList.add(cls);
			};
			el.removeClass = (cls: string) => {
				el.classList.remove(cls);
			};
			el.hasClass = (cls: string) => el.classList.contains(cls);
			el.createEl = (tag: string, options?: any) => {
				const child = document.createElement(tag);
				if (options?.cls) child.className = options.cls;
				if (options?.text) child.textContent = options.text;
				if (options?.attr) {
					for (const [k, v] of Object.entries(options.attr)) {
						child.setAttribute(k, v as string);
					}
				}
				if (options?.title) child.setAttribute('title', options.title);
				addDOMMethods(child);
				el.appendChild(child);
				return child;
			};
			el.createDiv = (options?: any) => el.createEl('div', options);
			el.createSpan = (options?: any) => el.createEl('span', options);
		};
		addDOMMethods(container);

		const elements = ui.createAgentInterface(container, null, callbacks);

		// Populate header
		ui.createCompactHeader(elements.sessionHeader, elements.contextPanel, null, callbacks);

		// Check buttons
		const toggleBtn = elements.sessionHeader.querySelector('.gemini-agent-toggle-btn');
		const settingsBtn = elements.sessionHeader.querySelector('button[title="Session Settings"]');
		const newSessionBtn = elements.sessionHeader.querySelector('button[title="New Session"]');
		const listSessionsBtn = elements.sessionHeader.querySelector('button[title="Browse Sessions"]');

		expect(toggleBtn?.getAttribute('aria-label')).toBe('Toggle context panel');
		expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

		expect(settingsBtn?.getAttribute('aria-label')).toBe('Session settings');
		expect(newSessionBtn?.getAttribute('aria-label')).toBe('New session');
		expect(listSessionsBtn?.getAttribute('aria-label')).toBe('Browse sessions');
	});

	it('should have aria-label on remove file button', async () => {
		const ui = agentView.ui;

		const container = document.createElement('div');
		const addDOMMethods = (el: any) => {
			el.empty = () => {
				el.innerHTML = '';
			};
			el.addClass = (cls: string) => {
				el.classList.add(cls);
			};
			el.removeClass = (cls: string) => {
				el.classList.remove(cls);
			};
			el.hasClass = (cls: string) => el.classList.contains(cls);
			el.createEl = (tag: string, options?: any) => {
				const child = document.createElement(tag);
				if (options?.cls) child.className = options.cls;
				if (options?.text) child.textContent = options.text;
				if (options?.attr) {
					for (const [k, v] of Object.entries(options.attr)) {
						child.setAttribute(k, v as string);
					}
				}
				if (options?.title) child.setAttribute('title', options.title);
				addDOMMethods(child);
				el.appendChild(child);
				return child;
			};
			el.createDiv = (options?: any) => el.createEl('div', options);
			el.createSpan = (options?: any) => el.createEl('span', options);
		};
		addDOMMethods(container);

		const currentSession = {
			id: 'test',
			title: 'Test',
			historyPath: 'test.md',
			context: {
				contextFiles: [{ path: 'test.md', basename: 'test' }],
			},
		} as any;

		ui.updateContextFilesList(container, currentSession, { removeContextFile: jest.fn() } as any);

		const removeBtn = container.querySelector('.gemini-agent-remove-btn');
		expect(removeBtn?.getAttribute('aria-label')).toBe('Remove file');
	});
});
