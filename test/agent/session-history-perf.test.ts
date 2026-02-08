import { SessionHistory } from '../../src/agent/session-history';
import { TFile } from 'obsidian';
import { ChatSession, SessionType } from '../../src/types/agent';
import { GeminiConversationEntry } from '../../src/types/conversation';

// Mock plugin
const mockPlugin = {
	app: {
		vault: {
			getAbstractFileByPath: jest.fn(),
			createFolder: jest.fn(),
			read: jest.fn(),
			modify: jest.fn(),
			append: jest.fn(),
			create: jest.fn(),
			adapter: {
				exists: jest.fn(),
			},
		},
		metadataCache: {
			getFileCache: jest.fn(),
		},
	},
	settings: {
		chatHistory: true,
		historyFolder: 'gemini-scribe',
	},
	logger: {
		log: jest.fn(),
		debug: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	},
	manifest: {
		version: '1.0.0',
	},
} as any;

describe('SessionHistory - Performance', () => {
	let sessionHistory: SessionHistory;
	let mockSession: ChatSession;

	beforeEach(() => {
		sessionHistory = new SessionHistory(mockPlugin);
		jest.clearAllMocks();

		mockSession = {
			id: 'test-session',
			type: SessionType.AGENT_SESSION,
			title: 'Test Session',
			historyPath: 'gemini-scribe/Agent-Sessions/test-session.md',
			created: new Date(),
			lastActive: new Date(),
			context: {
				contextFiles: [],
				enabledTools: [],
				requireConfirmation: false,
			},
		};
	});

	it('should use vault.append for existing files instead of read/modify', async () => {
		const entry: GeminiConversationEntry = {
			role: 'user',
			message: 'Hello world',
			created_at: new Date(),
			model: 'gemini-pro',
		};

		// Mock file existence
		const mockFile = new TFile();
		(mockFile as any).path = mockSession.historyPath;
		mockPlugin.app.vault.getAbstractFileByPath.mockReturnValue(mockFile);
		mockPlugin.app.vault.adapter.exists.mockResolvedValue(true);

		await sessionHistory.addEntryToSession(mockSession, entry);

		// Assert that read and modify were NOT called
		expect(mockPlugin.app.vault.read).not.toHaveBeenCalled();
		expect(mockPlugin.app.vault.modify).not.toHaveBeenCalled();

		// Assert that append WAS called
		expect(mockPlugin.app.vault.append).toHaveBeenCalledTimes(1);
		expect(mockPlugin.app.vault.append).toHaveBeenCalledWith(mockFile, expect.stringContaining('Hello world'));
		// Verify newline separator
		expect(mockPlugin.app.vault.append).toHaveBeenCalledWith(mockFile, expect.stringMatching(/^\n/));
	});

	it('should still use create for new files', async () => {
		const entry: GeminiConversationEntry = {
			role: 'user',
			message: 'First message',
			created_at: new Date(),
			model: 'gemini-pro',
		};

		// Mock file NOT exists
		mockPlugin.app.vault.getAbstractFileByPath.mockReturnValue(null);
		mockPlugin.app.vault.adapter.exists.mockResolvedValue(false);

		await sessionHistory.addEntryToSession(mockSession, entry);

		// Assert that create WAS called
		expect(mockPlugin.app.vault.create).toHaveBeenCalledTimes(1);
		expect(mockPlugin.app.vault.create).toHaveBeenCalledWith(
			mockSession.historyPath,
			expect.stringContaining('First message')
		);

		// Assert append was NOT called
		expect(mockPlugin.app.vault.append).not.toHaveBeenCalled();
	});
});
