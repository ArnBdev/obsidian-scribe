import { AgentViewSession, SessionUICallbacks } from '../../src/ui/agent-view/agent-view-session';
import { GeminiConversationEntry } from '../../src/types/conversation';
import { ChatSession } from '../../src/types/agent';
import { App } from 'obsidian';

// Mock AgentViewMessages
jest.mock('../../src/ui/agent-view/agent-view-messages');

describe('AgentView Performance Optimizations', () => {
	let session: AgentViewSession;
	let mockApp: App;
	let mockPlugin: any;
	let mockUICallbacks: SessionUICallbacks;
	let mockState: any;

	beforeEach(() => {
		mockApp = {} as App;

		mockPlugin = {
			logger: {
				error: jest.fn(),
			},
			sessionHistory: {
				getHistoryForSession: jest.fn(),
			},
		};

		mockUICallbacks = {
			clearChat: jest.fn(),
			displayMessage: jest.fn().mockResolvedValue(undefined),
			scrollToBottom: jest.fn(),
			updateSessionHeader: jest.fn(),
			updateContextPanel: jest.fn(),
			showEmptyState: jest.fn().mockResolvedValue(undefined),
			addActiveFileToContext: jest.fn().mockResolvedValue(undefined),
			focusInput: jest.fn(),
		};

		mockState = {
			mentionedFiles: [],
			allowedWithoutConfirmation: new Set(),
			getAutoAddedActiveFile: jest.fn(),
			clearAutoAddedActiveFile: jest.fn(),
			userInput: document.createElement('div'),
		};

		session = new AgentViewSession(mockApp, mockPlugin, mockUICallbacks, mockState);
	});

	it('should render messages in parallel and scroll once at the end', async () => {
		const mockHistory: GeminiConversationEntry[] = [
			{ role: 'user', message: 'Hello', created_at: new Date(), notePath: '' },
			{ role: 'model', message: 'Hi there', created_at: new Date(), notePath: '' },
			{ role: 'user', message: 'How are you?', created_at: new Date(), notePath: '' },
		];

		// Setup mock history
		mockPlugin.sessionHistory.getHistoryForSession.mockResolvedValue(mockHistory);

		// Setup current session
		const currentSession: ChatSession = {
			id: 'test',
			title: 'Test',
			historyPath: 'test.md',
			context: { contextFiles: [] },
		} as any;
		session.setCurrentSession(currentSession);

		// Execute loadSessionHistory
		await session.loadSessionHistory();

		// Verify calls
		expect(mockUICallbacks.clearChat).toHaveBeenCalledTimes(1);

		// Verify displayMessage calls
		expect(mockUICallbacks.displayMessage).toHaveBeenCalledTimes(3);

		// Verify parameters: shouldScroll should be false
		mockHistory.forEach((entry, index) => {
			expect(mockUICallbacks.displayMessage).toHaveBeenNthCalledWith(index + 1, entry, false);
		});

		// Verify scrollToBottom called ONLY ONCE
		expect(mockUICallbacks.scrollToBottom).toHaveBeenCalledTimes(1);
	});
});
