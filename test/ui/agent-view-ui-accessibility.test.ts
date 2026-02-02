import { AgentViewUI, UICallbacks } from '../../src/ui/agent-view/agent-view-ui';
import { App } from 'obsidian';
import type ObsidianGemini from '../../main';

// Mock Obsidian
jest.mock('obsidian', () => {
    return {
        App: class {},
        Notice: jest.fn(),
        setIcon: jest.fn(),
        TFile: class {
            basename: string;
            path: string;
            constructor(name: string) {
                this.basename = name;
                this.path = name;
            }
        },
    };
});

describe('AgentViewUI Accessibility', () => {
    let ui: AgentViewUI;
    let mockApp: App;
    let mockPlugin: ObsidianGemini;
    let container: HTMLElement;
    let callbacks: UICallbacks;

    beforeEach(() => {
        mockApp = new (require('obsidian').App)();
        mockPlugin = {
            sessionManager: {
                sanitizeFileName: (name: string) => name,
            }
        } as any;
        ui = new AgentViewUI(mockApp, mockPlugin);

        // Mock DOM container with createDiv/createEl helpers
        container = document.createElement('div');
        const addHelpers = (el: any) => {
            el.createDiv = (opts: any) => {
                const div = document.createElement('div');
                if (opts?.cls) div.className = opts.cls;
                addHelpers(div);
                el.appendChild(div);
                return div;
            };
            el.createEl = (tag: string, opts: any) => {
                const elem = document.createElement(tag);
                if (opts?.cls) elem.className = opts.cls;
                if (opts?.text) elem.textContent = opts.text;
                if (opts?.title) elem.title = opts.title;
                if (opts?.attr) {
                    for (const key in opts.attr) {
                        elem.setAttribute(key, opts.attr[key]);
                    }
                }
                addHelpers(elem);
                el.appendChild(elem);
                return elem;
            };
            el.empty = () => { el.innerHTML = ''; };
            el.addClass = (cls: string) => { el.classList.add(cls); };
            el.removeClass = (cls: string) => { el.classList.remove(cls); };
            el.hasClass = (cls: string) => el.classList.contains(cls);
            el.createSpan = (opts: any) => el.createEl('span', opts);
        };
        addHelpers(container);

        callbacks = {
            updateContextFilesList: jest.fn(),
            showSessionSettings: jest.fn(),
            createNewSession: jest.fn(),
            showSessionList: jest.fn(),
            updateSessionMetadata: jest.fn(),
            // ... other callbacks mocked as needed
        } as any;
    });

    test('Toggle Context Panel Button should have aria attributes', () => {
        const header = container.createDiv();
        const contextPanel = container.createDiv();
        // Setup class on contextPanel
        contextPanel.classList.add('gemini-agent-context-panel-collapsed');
        // Add helpers to contextPanel
        (contextPanel as any).hasClass = (cls: string) => contextPanel.classList.contains(cls);
        (contextPanel as any).addClass = (cls: string) => contextPanel.classList.add(cls);
        (contextPanel as any).removeClass = (cls: string) => contextPanel.classList.remove(cls);

        ui.createCompactHeader(header, contextPanel, null, callbacks);

        const toggleBtn = header.querySelector('.gemini-agent-toggle-btn');
        expect(toggleBtn).toBeTruthy();
        expect(toggleBtn?.getAttribute('aria-label')).toBe('Toggle context panel');
        expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

        // Test click
        (toggleBtn as HTMLButtonElement).click();
        expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');
    });

    test('Header buttons should have aria-labels', () => {
        const header = container.createDiv();
        const contextPanel = container.createDiv();
        ui.createCompactHeader(header, contextPanel, null, callbacks);

        const settingsBtn = header.querySelector('button[title="Session Settings"]');
        expect(settingsBtn?.getAttribute('aria-label')).toBe('Session Settings');

        const newSessionBtn = header.querySelector('button[title="New Session"]');
        expect(newSessionBtn?.getAttribute('aria-label')).toBe('New Session');

        const listSessionsBtn = header.querySelector('button[title="Browse Sessions"]');
        expect(listSessionsBtn?.getAttribute('aria-label')).toBe('Browse Sessions');
    });

    test('Edit Title Button should exist and have aria-label', () => {
        const header = container.createDiv();
        const contextPanel = container.createDiv();
        const session = { title: 'Test Session', historyPath: 'test.md', context: { contextFiles: [] } } as any;

        ui.createCompactHeader(header, contextPanel, session, callbacks);

        // Find by aria-label since we added it
        const editBtn = header.querySelector('button[aria-label="Rename session"]');
        expect(editBtn).toBeTruthy();
        // Also check if it has the class we reused
        expect(editBtn?.classList.contains('gemini-agent-toggle-btn')).toBe(true);
    });

    test('Context File Remove Button should have specific aria-label', () => {
        const listContainer = container.createDiv();
        const session = {
            context: {
                contextFiles: [{ basename: 'MyNote', path: 'MyNote.md' }]
            }
        } as any;

        // Mock getActiveFile
        mockApp.workspace = { getActiveFile: () => null } as any;

        ui.updateContextFilesList(listContainer, session, callbacks);

        const removeBtn = listContainer.querySelector('.gemini-agent-remove-btn');
        expect(removeBtn).toBeTruthy();
        expect(removeBtn?.getAttribute('aria-label')).toBe('Remove MyNote');
    });
});
