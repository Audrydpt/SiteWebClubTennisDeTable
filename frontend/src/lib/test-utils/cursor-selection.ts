/**
 * Utility functions for testing cursor position and text selection in JSDOM
 */

import { vi } from 'vitest';

// Fix missing DOM type declarations
declare global {
  interface Window {
    getSelection: () => Selection | null;
  }

  interface Document {
    caretPositionFromPoint: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number };
  }
}

/**
 * Mock the Selection API for testing text selection functionality
 */
export function mockSelectionAPI() {
  // Store original implementations to restore later
  const originalGetSelection = window.getSelection;
  const originalCreateRange = document.createRange;

  // Mock data for selection
  let mockSelectionText = '';
  let mockSelectionNode: Node | null = null;
  let mockSelectionOffset = 0;
  let mockSelectionFocusNode: Node | null = null;
  let mockSelectionFocusOffset = 0;

  // Mock Range
  const mockRange = {
    setStart: vi.fn((node, offset) => {
      mockSelectionNode = node;
      mockSelectionOffset = offset;
    }),
    setEnd: vi.fn((node, offset) => {
      mockSelectionFocusNode = node;
      mockSelectionFocusOffset = offset;
    }),
    selectNodeContents: vi.fn((node) => {
      mockSelectionNode = node;
      mockSelectionFocusNode = node;
      if (node.textContent) {
        mockSelectionText = node.textContent;
      }
    }),
    collapse: vi.fn((toStart = false) => {
      if (toStart && mockSelectionNode) {
        mockSelectionFocusNode = mockSelectionNode;
        mockSelectionFocusOffset = mockSelectionOffset;
      } else if (mockSelectionFocusNode) {
        mockSelectionNode = mockSelectionFocusNode;
        mockSelectionOffset = mockSelectionFocusOffset;
      }
    }),
    commonAncestorContainer: document.body,
    startContainer: document.body,
    endContainer: document.body,
    startOffset: 0,
    endOffset: 0,
    collapsed: false,
    cloneContents: vi.fn(() => document.createDocumentFragment()),
    cloneRange: vi.fn(() => ({ ...mockRange })),
    comparePoint: vi.fn(() => 0),
    createContextualFragment: vi.fn(() => document.createDocumentFragment()),
    deleteContents: vi.fn(),
    detach: vi.fn(),
    extractContents: vi.fn(() => document.createDocumentFragment()),
    getBoundingClientRect: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: vi.fn(),
    })),
    getClientRects: vi.fn(() => []),
    insertNode: vi.fn(),
    intersectsNode: vi.fn(() => false),
    isPointInRange: vi.fn(() => false),
    surroundContents: vi.fn(),
    toString: vi.fn(() => mockSelectionText),
  };

  // Mock Selection
  const mockSelection = {
    anchorNode: null as Node | null,
    anchorOffset: 0,
    focusNode: null as Node | null,
    focusOffset: 0,
    isCollapsed: true,
    rangeCount: 0,
    type: 'None',
    addRange: vi.fn((range) => {
      mockSelection.rangeCount = 1;
      mockSelection.isCollapsed = false;
      mockSelection.type = 'Range';
      mockSelection.anchorNode = mockSelectionNode;
      mockSelection.anchorOffset = mockSelectionOffset;
      mockSelection.focusNode = mockSelectionFocusNode;
      mockSelection.focusOffset = mockSelectionFocusOffset;
    }),
    collapse: vi.fn((node, offset) => {
      mockSelection.anchorNode = node;
      mockSelection.anchorOffset = offset || 0;
      mockSelection.focusNode = node;
      mockSelection.focusOffset = offset || 0;
      mockSelection.isCollapsed = true;
      mockSelection.type = node ? 'Caret' : 'None';
    }),
    collapseToEnd: vi.fn(() => {
      if (mockSelection.focusNode) {
        mockSelection.collapse(
          mockSelection.focusNode,
          mockSelection.focusOffset
        );
      }
    }),
    collapseToStart: vi.fn(() => {
      if (mockSelection.anchorNode) {
        mockSelection.collapse(
          mockSelection.anchorNode,
          mockSelection.anchorOffset
        );
      }
    }),
    containsNode: vi.fn(() => false),
    deleteFromDocument: vi.fn(),
    empty: vi.fn(() => {
      mockSelection.anchorNode = null;
      mockSelection.anchorOffset = 0;
      mockSelection.focusNode = null;
      mockSelection.focusOffset = 0;
      mockSelection.isCollapsed = true;
      mockSelection.rangeCount = 0;
      mockSelection.type = 'None';
    }),
    extend: vi.fn((node, offset) => {
      mockSelection.focusNode = node;
      mockSelection.focusOffset = offset;
      mockSelection.isCollapsed = false;
      mockSelection.type = 'Range';
    }),
    getRangeAt: vi.fn(() => mockRange),
    removeAllRanges: vi.fn(() => {
      mockSelection.empty();
    }),
    removeRange: vi.fn(),
    selectAllChildren: vi.fn((node) => {
      mockSelection.anchorNode = node;
      mockSelection.anchorOffset = 0;
      mockSelection.focusNode = node;
      mockSelection.focusOffset = node.childNodes.length;
      mockSelection.isCollapsed = node.childNodes.length === 0;
      mockSelection.rangeCount = 1;
      mockSelection.type = mockSelection.isCollapsed ? 'Caret' : 'Range';
    }),
    setBaseAndExtent: vi.fn(
      (anchorNode, anchorOffset, focusNode, focusOffset) => {
        mockSelection.anchorNode = anchorNode;
        mockSelection.anchorOffset = anchorOffset;
        mockSelection.focusNode = focusNode;
        mockSelection.focusOffset = focusOffset;
        mockSelection.isCollapsed =
          anchorNode === focusNode && anchorOffset === focusOffset;
        mockSelection.rangeCount = 1;
        mockSelection.type = mockSelection.isCollapsed ? 'Caret' : 'Range';
      }
    ),
    toString: vi.fn(() => mockSelectionText),
  };

  // Replace native implementations with mocks
  window.getSelection = vi.fn(() => mockSelection);
  document.createRange = vi.fn(() => ({ ...mockRange }));

  // Return function to restore original implementations
  return () => {
    window.getSelection = originalGetSelection;
    document.createRange = originalCreateRange;
  };
}

/**
 * Simulate setting cursor position in an element
 */
export function setCursorPosition(element: HTMLElement, position: number) {
  const textNode = element.firstChild as Text;
  const selection = window.getSelection();

  if (!selection || !textNode) return;

  const range = document.createRange();
  range.setStart(textNode, Math.min(position, textNode.length));
  range.setEnd(textNode, Math.min(position, textNode.length));

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Simulate selecting text in an element
 */
export function selectText(element: HTMLElement, start: number, end: number) {
  const textNode = element.firstChild as Text;
  const selection = window.getSelection();

  if (!selection || !textNode) return;

  const range = document.createRange();
  range.setStart(textNode, Math.min(start, textNode.length));
  range.setEnd(textNode, Math.min(end, textNode.length));

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Get the current cursor position from an element
 */
export function getCursorPosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return 0;

  return range.startOffset;
}

/**
 * Get the current text selection range
 */
export function getSelectionRange(
  element: HTMLElement
): { start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return null;

  return {
    start: range.startOffset,
    end: range.endOffset,
  };
}

/**
 * Mock CaretPosition API
 */
export function mockCaretPositionAPI() {
  const originalDocumentCaretPositionFromPoint =
    document.caretPositionFromPoint;

  document.caretPositionFromPoint = vi.fn((x, y) => ({
    offsetNode: document.body,
    offset: 0,
  }));

  return () => {
    document.caretPositionFromPoint = originalDocumentCaretPositionFromPoint;
  };
}
