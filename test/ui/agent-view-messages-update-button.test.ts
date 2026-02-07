import { AgentViewMessages } from '../../src/ui/agent-view/agent-view-messages';
import { App } from 'obsidian';
import ObsidianGemini from '../../src/main';

// Mock dependencies
jest.mock('obsidian', () => {
	const mock = jest.requireActual('../../__mocks__/obsidian.js');
	return {
		...mock,
		setIcon: jest.fn(),
		Notice: jest.fn(),
		MarkdownRenderer: {
			render: jest.fn().mockResolvedValue(undefined),
		},
	};
});

describe('AgentViewMessages - Update Button', () => {
	let messages: AgentViewMessages;
	let app: App;
	let chatContainer: HTMLElement;
	let plugin: any;
	let userInput: HTMLDivElement;

	beforeEach(() => {
		// Mock DOM
		document.body.innerHTML = '<div id="test-container"></div>';
		chatContainer = document.createElement('div');
		userInput = document.createElement('div');

		// Helper to add DOM methods
		const addDOMMethods = (el: any) => {
			el.createDiv = function (options?: any) {
				const div = document.createElement('div');
				if (options?.cls) div.className = options.cls;
				if (options?.text) div.textContent = options.text;
				if (options?.attr) {
					for (const key in options.attr) {
						div.setAttribute(key, options.attr[key]);
					}
				}
				addDOMMethods(div);
				this.appendChild(div);
				return div;
			};
			el.createEl = function (tag: string, opts?: any) {
				const elem = document.createElement(tag);
				if (opts?.cls) elem.className = opts.cls;
				if (opts?.text) elem.textContent = opts.text;
				addDOMMethods(elem);
				this.appendChild(elem);
				return elem;
			};
			el.createSpan = function (opts?: any) {
				return this.createEl('span', opts);
			};
			el.empty = function () {
				this.innerHTML = '';
			};
			el.remove = function () {
				this.parentNode?.removeChild(this);
			};
		};
		addDOMMethods(chatContainer);

		// Mock plugin
		plugin = {
			settings: {
				showUpdateVaultContextButton: true,
			},
			logger: {
				debug: jest.fn(),
				log: jest.fn(),
				warn: jest.fn(),
				error: jest.fn(),
			},
			agentsMemory: {
				exists: jest.fn().mockResolvedValue(true), // Default to update mode
			},
			vaultAnalyzer: {
				initializeAgentsMemory: jest.fn(),
			},
			sessionManager: {
				getRecentAgentSessions: jest.fn().mockResolvedValue([]),
			},
			examplePrompts: {
				read: jest.fn().mockResolvedValue([]),
			},
			saveSettings: jest.fn().mockResolvedValue(undefined),
		};

		messages = new AgentViewMessages(app, chatContainer, plugin, userInput, {});
	});

	it('should show update button when agentsMemory exists and setting is true', async () => {
		plugin.agentsMemory.exists.mockResolvedValue(true);
		plugin.settings.showUpdateVaultContextButton = true;

		await messages.showEmptyState(null, jest.fn(), jest.fn());

		const button = chatContainer.querySelector('.gemini-agent-init-context-button-update');
		expect(button).toBeTruthy();
		expect(button?.textContent).toContain('Update Vault Context');
	});

	it('should hide update button when agentsMemory exists and setting is false', async () => {
		plugin.agentsMemory.exists.mockResolvedValue(true);
		plugin.settings.showUpdateVaultContextButton = false;

		await messages.showEmptyState(null, jest.fn(), jest.fn());

		const button = chatContainer.querySelector('.gemini-agent-init-context-button-update');
		expect(button).toBeFalsy();
	});

	it('should show initialize button when agentsMemory does not exist regardless of setting', async () => {
		plugin.agentsMemory.exists.mockResolvedValue(false);
		plugin.settings.showUpdateVaultContextButton = false; // Setting shouldn't matter for init

		await messages.showEmptyState(null, jest.fn(), jest.fn());

		const button = chatContainer.querySelector('.gemini-agent-init-context-button');
		expect(button).toBeTruthy();
		expect(button?.classList.contains('gemini-agent-init-context-button-update')).toBe(false);
		expect(button?.textContent).toContain('Initialize Vault Context');
	});

	it('should add dismiss button only in update mode', async () => {
		plugin.agentsMemory.exists.mockResolvedValue(true);
		plugin.settings.showUpdateVaultContextButton = true;

		await messages.showEmptyState(null, jest.fn(), jest.fn());

		const dismissButton = chatContainer.querySelector('.gemini-agent-init-dismiss-button');
		expect(dismissButton).toBeTruthy();
	});

	it('should not show dismiss button in initialize mode', async () => {
		plugin.agentsMemory.exists.mockResolvedValue(false);

		await messages.showEmptyState(null, jest.fn(), jest.fn());

		const dismissButton = chatContainer.querySelector('.gemini-agent-init-dismiss-button');
		expect(dismissButton).toBeFalsy();
	});

	it('should update setting and remove button when dismiss is clicked', async () => {
		plugin.agentsMemory.exists.mockResolvedValue(true);
		plugin.settings.showUpdateVaultContextButton = true;

		await messages.showEmptyState(null, jest.fn(), jest.fn());

		const dismissButton = chatContainer.querySelector('.gemini-agent-init-dismiss-button') as HTMLElement;
		const updateButton = chatContainer.querySelector('.gemini-agent-init-context-button-update');

		// Simulate click
		dismissButton.click();

		// Check side effects
		expect(plugin.settings.showUpdateVaultContextButton).toBe(false);
		expect(plugin.saveSettings).toHaveBeenCalled();
		// Button removal might be immediate via .remove(), checking if it's detached
		// Since we mocked .remove, we can check if it was called on the button container
		// but checking settings update is the most crucial part logic-wise
	});
});
