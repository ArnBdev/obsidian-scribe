import { AgentViewUI } from '../../src/ui/agent-view/agent-view-ui';
import { AgentViewMessages } from '../../src/ui/agent-view/agent-view-messages';
import { MarkdownRenderer } from 'obsidian';

// Mock Obsidian
jest.mock('obsidian', () => {
	return {
		App: class {},
		TFile: class {},
		Notice: jest.fn(),
		setIcon: jest.fn(),
		MarkdownRenderer: {
			render: jest.fn().mockImplementation((app, text, el) => {
				el.textContent = text;
				return Promise.resolve();
			}),
		},
	};
});

// Mock Image Attachment
jest.mock('../../src/ui/agent-view/image-attachment', () => ({
	isSupportedImageType: jest.fn().mockReturnValue(true),
	fileToBase64: jest.fn().mockResolvedValue('base64data'),
	getMimeType: jest.fn().mockReturnValue('image/png'),
	generateAttachmentId: jest.fn().mockReturnValue('test-id'),
}));

describe('AgentView Accessibility Tests', () => {
	let container: HTMLElement;
	let ui: AgentViewUI;
	let messages: AgentViewMessages;
	let plugin: any;
	let app: any;

	beforeEach(() => {
		// Mock DOM
		container = document.createElement('div');

		// Add helper methods to container and its children
		const addDOMMethods = (el: any) => {
			el.createDiv = function (options?: any) {
				const div = document.createElement('div');
				if (options?.cls) div.className = options.cls;
				if (options?.attr) {
					Object.entries(options.attr).forEach(([key, value]) => {
						div.setAttribute(key, value as string);
					});
				}
				addDOMMethods(div);
				this.appendChild(div);
				return div;
			};
			el.createEl = function (tag: string, options?: any) {
				const elem = document.createElement(tag);
				if (options?.cls) elem.className = options.cls;
				if (options?.text) elem.textContent = options.text;
				if (options?.title) elem.setAttribute('title', options.title);
				if (options?.attr) {
					Object.entries(options.attr).forEach(([key, value]) => {
						elem.setAttribute(key, value as string);
					});
				}
				addDOMMethods(elem);
				this.appendChild(elem);
				return elem;
			};
			el.createSpan = function (options?: any) {
				return this.createEl('span', options);
			};
			el.empty = function () {
				this.innerHTML = '';
			};
			el.addClass = function (cls: string) {
				this.classList.add(cls);
			};
			el.removeClass = function (cls: string) {
				this.classList.remove(cls);
			};
			el.hasClass = function (cls: string) {
				return this.classList.contains(cls);
			};
			el.findAll = function (selector: string) {
				return this.querySelectorAll(selector);
			};
		};
		addDOMMethods(container);

		// Mock plugin and app
		app = {};
		plugin = {
			logger: {
				debug: jest.fn(),
				error: jest.fn(),
			},
		};

		ui = new AgentViewUI(app, plugin);
		messages = new AgentViewMessages(app, container, plugin, document.createElement('div') as any, {});
	});

	describe('AgentViewUI Accessibility', () => {
		it('should add ARIA labels to header buttons', () => {
			const callbacks = {
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
				getImageAttachments: jest.fn(),
			};

			const elements = ui.createAgentInterface(container, null, callbacks as any);
			ui.createCompactHeader(elements.sessionHeader, elements.contextPanel, null, callbacks as any);

			// Check Toggle Button
			const toggleBtn = elements.sessionHeader.querySelector('.gemini-agent-toggle-btn');
			expect(toggleBtn?.getAttribute('aria-label')).toBe('Toggle context panel');
			expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

			// Check Settings Button
			const settingsBtn = elements.sessionHeader.querySelector('button[title="Session Settings"]');
			expect(settingsBtn?.getAttribute('aria-label')).toBe('Session Settings');

			// Check New Session Button
			const newSessionBtn = elements.sessionHeader.querySelector('button[title="New Session"]');
			expect(newSessionBtn?.getAttribute('aria-label')).toBe('New Session');

			// Check Browse Sessions Button
			const listSessionsBtn = elements.sessionHeader.querySelector('button[title="Browse Sessions"]');
			expect(listSessionsBtn?.getAttribute('aria-label')).toBe('Browse Sessions');
		});

		it('should toggle aria-expanded on toggle button click', () => {
			const callbacks = {
				updateContextFilesList: jest.fn(),
			} as any;

			const elements = ui.createAgentInterface(container, null, callbacks);
			ui.createCompactHeader(elements.sessionHeader, elements.contextPanel, null, callbacks);

			const toggleBtn = elements.sessionHeader.querySelector('.gemini-agent-toggle-btn') as HTMLElement;

			// Initial state
			expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

			// Click to expand
			toggleBtn.click();
			expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

			// Click to collapse
			toggleBtn.click();
			expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
		});

		it('should add accessibility roles to user input', () => {
			const callbacks = {} as any;
			const { userInput } = ui.createInputArea(container, callbacks);

			expect(userInput.getAttribute('role')).toBe('textbox');
			expect(userInput.getAttribute('aria-multiline')).toBe('true');
			expect(userInput.getAttribute('aria-label')).toBe('Message the agent');
		});

		it('should add ARIA labels to remove buttons in context list', () => {
			const callbacks = {
				removeContextFile: jest.fn(),
			} as any;

			const contextFilesList = container.createDiv({ cls: 'gemini-agent-files-list' });

			const session = {
				context: {
					contextFiles: [{ basename: 'test.md', path: 'test.md' }],
				},
			};

			// Mock getActiveFile
			app.workspace = {
				getActiveFile: jest.fn(),
			};

			ui.updateContextFilesList(contextFilesList, session as any, callbacks);

			const removeBtn = contextFilesList.querySelector('.gemini-agent-remove-btn');
			expect(removeBtn?.getAttribute('aria-label')).toBe('Remove file');
		});
	});

	describe('AgentViewMessages Accessibility', () => {
		it('should add ARIA label to copy button in messages', async () => {
			const entry = {
				role: 'model',
				message: 'Test message',
				created_at: new Date(),
			};

			await messages.displayMessage(entry as any, null);

			const copyButton = container.querySelector('.gemini-agent-copy-button');
			expect(copyButton?.getAttribute('aria-label')).toBe('Copy message');
		});

		it('should add accessibility attributes to tool execution headers', async () => {
			const entry = {
				role: 'model',
				message: 'Tool Execution Results:\n### read_file\nContent',
				created_at: new Date(),
				metadata: { toolName: 'read_file' },
			};

			await messages.displayMessage(entry as any, null);

			const toolHeader = container.querySelector('.gemini-agent-tool-header');
			expect(toolHeader?.getAttribute('role')).toBe('button');
			expect(toolHeader?.getAttribute('aria-expanded')).toBe('false');
			expect(toolHeader?.getAttribute('tabindex')).toBe('0');
			expect(toolHeader?.getAttribute('aria-label')).toContain('Toggle details for tool read_file');

			// Test toggle
			(toolHeader as HTMLElement).click();
			expect(toolHeader?.getAttribute('aria-expanded')).toBe('true');
		});
	});
});
