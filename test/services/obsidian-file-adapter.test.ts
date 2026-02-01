// Mock obsidian module
jest.mock('obsidian', () => {
	const MockTFile = class {
		path: string;
		stat: { mtime: number; size: number; mtimeMs: number };
		constructor(path: string) {
			this.path = path;
			this.stat = { mtime: 1000, size: 10, mtimeMs: 1000 };
		}
	};
	return {
		TFile: MockTFile,
		MetadataCache: jest.fn(),
		Vault: jest.fn(),
	};
});

// Mock gemini-utils
jest.mock('@allenhutchison/gemini-utils', () => ({
	getMimeTypeWithFallback: jest.fn().mockReturnValue({ mimeType: 'text/markdown' }),
	isExtensionSupportedWithFallback: jest.fn().mockReturnValue(true),
}));

import { ObsidianVaultAdapter } from '../../src/services/obsidian-file-adapter';
import { TFile } from 'obsidian';

describe('ObsidianVaultAdapter', () => {
	let adapter: ObsidianVaultAdapter;
	let mockVault: any;
	let mockMetadataCache: any;
	let mockHashCacheProvider: jest.Mock;

	beforeEach(() => {
		mockVault = {
			getAbstractFileByPath: jest.fn(),
			readBinary: jest.fn(),
			getFiles: jest.fn().mockReturnValue([]),
			getMarkdownFiles: jest.fn().mockReturnValue([]),
		};

		mockMetadataCache = {
			getFileCache: jest.fn(),
		};

		mockHashCacheProvider = jest.fn();

		adapter = new ObsidianVaultAdapter({
			vault: mockVault,
			metadataCache: mockMetadataCache,
			hashCacheProvider: mockHashCacheProvider,
		});
	});

	describe('computeHash', () => {
		it('should return cached hash if provider returns one', async () => {
			const filePath = 'test.md';
			const cachedHash = 'cached-hash-123';
			const mockFile = new (TFile as any)(filePath);
			mockFile.stat.mtime = 2000;

			mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
			mockHashCacheProvider.mockReturnValue(cachedHash);

			const hash = await adapter.computeHash(filePath);

			expect(hash).toBe(cachedHash);
			expect(mockHashCacheProvider).toHaveBeenCalledWith(filePath, 2000);
			expect(mockVault.readBinary).not.toHaveBeenCalled();
		});

		it('should compute hash if provider returns null', async () => {
			const filePath = 'test.md';
			const fileContent = new Uint8Array([1, 2, 3]);
			const mockFile = new (TFile as any)(filePath);
			mockFile.stat.mtime = 2000;

			mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
			mockHashCacheProvider.mockReturnValue(null);
			mockVault.readBinary.mockResolvedValue(fileContent);

			// Mock crypto.subtle.digest
			const mockDigest = jest.fn().mockResolvedValue(new Uint8Array([0xaa, 0xbb]).buffer);
			Object.defineProperty(global, 'crypto', {
				value: {
					subtle: {
						digest: mockDigest,
					},
				},
				writable: true,
			});

			const hash = await adapter.computeHash(filePath);

			expect(hash).toBe('aabb'); // Hex representation
			expect(mockHashCacheProvider).toHaveBeenCalledWith(filePath, 2000);
			expect(mockVault.readBinary).toHaveBeenCalledWith(mockFile);
		});

		it('should compute hash if provider is not defined', async () => {
			adapter = new ObsidianVaultAdapter({
				vault: mockVault,
				metadataCache: mockMetadataCache,
				// No hashCacheProvider
			});

			const filePath = 'test.md';
			const fileContent = new Uint8Array([1, 2, 3]);
			const mockFile = new (TFile as any)(filePath);

			mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
			mockVault.readBinary.mockResolvedValue(fileContent);

			// Mock crypto.subtle.digest
			const mockDigest = jest.fn().mockResolvedValue(new Uint8Array([0xcc, 0xdd]).buffer);
			Object.defineProperty(global, 'crypto', {
				value: {
					subtle: {
						digest: mockDigest,
					},
				},
				writable: true,
			});

			const hash = await adapter.computeHash(filePath);

			expect(hash).toBe('ccdd');
			expect(mockVault.readBinary).toHaveBeenCalledWith(mockFile);
		});

		it('should return empty string if file does not exist', async () => {
			mockVault.getAbstractFileByPath.mockReturnValue(null);

			const hash = await adapter.computeHash('nonexistent.md');

			expect(hash).toBe('');
			expect(mockHashCacheProvider).not.toHaveBeenCalled();
		});
	});
});
