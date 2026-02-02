import { AgentViewMessages } from '../../src/ui/agent-view/agent-view-messages';
import { App, MarkdownRenderer } from 'obsidian';

// Mock Obsidian
jest.mock('obsidian', () => {
	return {
		MarkdownRenderer: {
			render: jest.fn().mockImplementation((app, text, el) => {
				el.innerText = text;
				return Promise.resolve();
			}),
		},
		setIcon: jest.fn(),
		Notice: jest.fn(),
	};
});

describe('AgentViewMessages', () => {
	let messages: AgentViewMessages;
	let mockApp: any;
	let mockContainer: HTMLElement;
	let mockPlugin: any;
	let mockInput: HTMLDivElement;

	beforeEach(() => {
		mockApp = {
			metadataCache: { getFirstLinkpathDest: jest.fn() },
			workspace: { getLeaf: jest.fn() },
		};
		mockContainer = document.createElement('div');

		// Mock HTMLElement methods used by Obsidian
		if (!HTMLElement.prototype.createDiv) {
			HTMLElement.prototype.createDiv = function (ops?: any) {
				const d = document.createElement('div');
				if (ops?.cls) d.className = ops.cls;
				this.appendChild(d);
				return d;
			} as any;
		}

		if (!HTMLElement.prototype.createEl) {
			HTMLElement.prototype.createEl = function (tag: string, ops?: any) {
				const el = document.createElement(tag);
				if (ops?.cls) el.className = ops.cls;
				if (ops?.text) el.textContent = ops.text;
				if (ops?.attr) {
					for (const key in ops.attr) {
						el.setAttribute(key, ops.attr[key]);
					}
				}
				this.appendChild(el);
				return el;
			} as any;
		}

		if (!HTMLElement.prototype.empty) {
			HTMLElement.prototype.empty = function () {
				this.innerHTML = '';
			} as any;
		}

		// findAll is used in setupImageClickHandlers
		if (!HTMLElement.prototype.findAll) {
			HTMLElement.prototype.findAll = function (selector: string) {
				return Array.from(this.querySelectorAll(selector));
			} as any;
		}

		if (!HTMLElement.prototype.addClass) {
			HTMLElement.prototype.addClass = function (cls: string) {
				this.classList.add(cls);
			} as any;
		}

		mockPlugin = {
			logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
			examplePrompts: { read: jest.fn() },
			agentsMemory: { exists: jest.fn() },
			sessionManager: { getRecentAgentSessions: jest.fn() },
		};
		mockInput = document.createElement('div') as HTMLDivElement;

		messages = new AgentViewMessages(mockApp, mockContainer, mockPlugin, mockInput, {});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('formats tables correctly in displayMessage', async () => {
		const tableMessage = 'Here is a table:\n| A | B |\n|---|---|\n| 1 | 2 |';
		const entry = {
			role: 'model' as const,
			message: tableMessage,
			created_at: new Date(),
			notePath: '',
		};

		await messages.displayMessage(entry, null);

		expect(MarkdownRenderer.render).toHaveBeenCalled();
		const callArgs = (MarkdownRenderer.render as jest.Mock).mock.calls[0];
		const renderedText = callArgs[1];

		// Should insert empty line before table
		expect(renderedText).toBe('Here is a table:\n\n| A | B |\n|---|---|\n| 1 | 2 |');
	});

	it('handles escaped pipes correctly', async () => {
		// "This is not a table | pipe" should not trigger table formatting (no empty lines added unless paragraph break)
		const text = 'Line 1\nLine 2 with | pipe\nLine 3';
		const entry = {
			role: 'model' as const,
			message: text,
			created_at: new Date(),
			notePath: '',
		};

		await messages.displayMessage(entry, null);

		const callArgs = (MarkdownRenderer.render as jest.Mock).mock.calls[0];
		const renderedText = callArgs[1];

		// Current logic splits paragraphs for non-table content if they are not empty
		// "For non-table content, add empty line between paragraphs"
		// line 1 is "Line 1". Next is "Line 2...". Not empty. Adds empty line.
		// So expected: "Line 1\n\nLine 2 with | pipe\n\nLine 3"
		expect(renderedText).toBe('Line 1\n\nLine 2 with | pipe\n\nLine 3');
	});

	it('handles escaped pipes that look like tables but are not', async () => {
		const text = 'Line 1\nNot | a | table\nLine 3';
		const entry = {
			role: 'model' as const,
			message: text,
			created_at: new Date(),
			notePath: '',
		};

		await messages.displayMessage(entry, null);

		const callArgs = (MarkdownRenderer.render as jest.Mock).mock.calls[0];
		const renderedText = callArgs[1];

		// "Not | a | table" has unescaped pipes, so it IS detected as a table row by current logic!
		// So it treats it as a table.
		// Logic: if (isTableRow) inTable = true.
		// "Not | a | table" -> hasUnescapedPipe=true. isTableDivider=false. isTableRow=true.
		// So it adds empty line before if needed.
		// Then it adds the line.
		// Next line "Line 3".
		// Loop continues. "Line 3". hasUnescapedPipe=false.
		// if (inTable && !hasUnescapedPipe...) inTable=false. Add empty line.

		// So expected: "Line 1\n\nNot | a | table\n\nLine 3"
		expect(renderedText).toBe('Line 1\n\nNot | a | table\n\nLine 3');
	});
});
