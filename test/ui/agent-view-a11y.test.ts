import { AgentViewUI, UICallbacks } from '../../src/ui/agent-view/agent-view-ui';
import { App } from 'obsidian';

// Mock Obsidian
jest.mock('obsidian', () => {
	return {
		setIcon: jest.fn(),
		Notice: jest.fn(),
		TFile: class {},
	};
});

describe('AgentViewUI Accessibility', () => {
	let ui: AgentViewUI;
	let mockApp: any;
	let mockPlugin: any;
	let mockCallbacks: UICallbacks;
	let container: HTMLElement;

	beforeEach(() => {
		// Mock DOM
		document.body.innerHTML = '<div id="test-container"></div>';
		container = document.getElementById('test-container')!;

		// Add helper methods to container (mimicking Obsidian's createEl/createDiv)
		const addDOMMethods = (el: any) => {
			el.createDiv = function (options?: any) {
				return this.createEl('div', options);
			};
			el.createEl = function (tag: string, options?: any) {
				const child = document.createElement(tag);
				if (options?.cls) child.className = options.cls;
				if (options?.text) child.textContent = options.text;
				if (options?.title) child.title = options.title;
				if (options?.attr) {
					for (const key in options.attr) {
						child.setAttribute(key, options.attr[key]);
					}
				}

				// Add helpers to child
				addDOMMethods(child);

				// Add specialized helpers
				(child as any).empty = function () {
					this.innerHTML = '';
				};
				(child as any).hasClass = function (cls: string) {
					return this.classList.contains(cls);
				};
				(child as any).addClass = function (cls: string) {
					this.classList.add(cls);
				};
				(child as any).removeClass = function (cls: string) {
					this.classList.remove(cls);
				};
				(child as any).createSpan = function (opts?: any) {
					return this.createEl('span', opts);
				};

				this.appendChild(child);
				return child;
			};
			el.empty = function () {
				this.innerHTML = '';
			};
			el.createSpan = function (opts?: any) {
				return this.createEl('span', opts);
			};
		};

		addDOMMethods(container);

		mockApp = {
			workspace: {
				getActiveFile: jest.fn(),
			},
		};

		mockPlugin = {
			logger: {
				error: jest.fn(),
				debug: jest.fn(),
			},
		};

		mockCallbacks = {
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
		} as any;

		ui = new AgentViewUI(mockApp as App, mockPlugin);
	});

	describe('Context Panel Toggle', () => {
		it('should have correct ARIA attributes', () => {
			const sessionHeader = container.createDiv();
			const contextPanel = container.createDiv({
				cls: 'gemini-agent-context-panel gemini-agent-context-panel-collapsed',
			});

			ui.createCompactHeader(sessionHeader, contextPanel, null, mockCallbacks);

			const toggleBtn = sessionHeader.querySelector('.gemini-agent-toggle-btn');
			expect(toggleBtn).toBeTruthy();
			expect(toggleBtn?.getAttribute('aria-label')).toBe('Toggle context panel');
			expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
		});

		it('should toggle aria-expanded on click', () => {
			const sessionHeader = container.createDiv();
			const contextPanel = container.createDiv({
				cls: 'gemini-agent-context-panel gemini-agent-context-panel-collapsed',
			});

			ui.createCompactHeader(sessionHeader, contextPanel, null, mockCallbacks);

			const toggleBtn = sessionHeader.querySelector('.gemini-agent-toggle-btn') as HTMLButtonElement;

			// First click - expand
			toggleBtn.click();
			expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
			expect(contextPanel.classList.contains('gemini-agent-context-panel-collapsed')).toBe(false);

			// Second click - collapse
			toggleBtn.click();
			expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
			expect(contextPanel.classList.contains('gemini-agent-context-panel-collapsed')).toBe(true);
		});
	});

	describe('Context Files List', () => {
		it('should have descriptive ARIA labels for remove buttons', () => {
			const listContainer = container.createDiv();
			const mockSession = {
				context: {
					contextFiles: [
						{ basename: 'notes.md', path: 'folder/notes.md' },
						{ basename: 'budget.csv', path: 'data/budget.csv' },
					],
				},
			};

			ui.updateContextFilesList(listContainer, mockSession as any, mockCallbacks);

			const removeBtns = listContainer.querySelectorAll('.gemini-agent-remove-btn');
			expect(removeBtns.length).toBe(2);

			expect(removeBtns[0].getAttribute('aria-label')).toBe('Remove notes.md from context');
			expect(removeBtns[1].getAttribute('aria-label')).toBe('Remove budget.csv from context');
		});
	});
});
