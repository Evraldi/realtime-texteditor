import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { SUCCESS_MESSAGES } from '../../config/constants';
import { debugAuth, fixAuthTokens } from '../../utils/debugAuth';
import { getDocument, saveDocument, createDocument, deleteDocument, updateDocument } from '../../services/documentService';
import { restoreVersion } from '../../services/versionService';
import { shareDocument } from '../../services/sharingService';
import { useSocket } from '../SocketProvider';
import { useAuth } from '../../context/AuthContext';
import Loading from '../UI/Loading';
import ErrorMessage from '../UI/ErrorMessage';
import CursorOverlay from './CursorOverlay';
import FormatToolbar from './FormatToolbar';
import ConfirmationDialog from '../UI/ConfirmationDialog';
import DocumentHistory from '../Document/DocumentHistory';
import ShareDialog from '../Document/ShareDialog';
import CommentList from '../Comments/CommentList';
import CommentMarker from '../Comments/CommentMarker';
import NewCommentForm from '../Comments/NewCommentForm';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Generate a random color for the user's cursor from a predefined set of distinct colors
 * @returns {string} Hex color code
 */
const getRandomColor = () => {
  // Distinct colors that are easily distinguishable from each other
  const colors = [
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#8BC34A', // Light Green
    '#CDDC39', // Lime
    '#FFC107', // Amber
    '#FF9800', // Orange
    '#FF5722'  // Deep Orange
  ];

  // Generate a consistent color based on the current time to reduce the chance of duplicates
  const index = Math.floor(Date.now() % colors.length);
  return colors[index];
};

/**
 * Text editor component for editing documents
 * @param {Object} props - Component props
 * @param {boolean} props.isMobile - Whether the device is mobile
 * @param {Function} props.onError - Function to handle errors
 * @param {string} props.connectionQuality - Connection quality ('good', 'fair', 'poor')
 * @returns {JSX.Element} Text editor component
 */
const TextEditor = ({ isMobile = false, onError = () => {}, connectionQuality = 'good' }) => {
  // Get document ID from URL params
  const { docId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [activeComment, setActiveComment] = useState(null);
  const [commentPosition, setCommentPosition] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, ch: 0 });
  const [activeUsers, setActiveUsers] = useState([]);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [editorHeight, setEditorHeight] = useState(400); // Default height in pixels
  const [isResizing, setIsResizing] = useState(false);

  // Refs for resize handlers to avoid circular dependencies
  const resizeMoveHandlerRef = useRef(null);
  const resizeEndHandlerRef = useRef(null);

  // Document title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');

  // Document deletion state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Document history state
  const [showHistory, setShowHistory] = useState(false);

  // Document sharing state
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Get socket from context
  const { socket, isConnected, emit, on } = useSocket();

  // Refs
  const saveTimeoutRef = useRef(null);
  const contentRef = useRef('');
  const quillRef = useRef(null);
  const cursorUpdateTimeoutRef = useRef(null);
  const userColorRef = useRef(getRandomColor());
  // Track users who have already joined to prevent duplicate notifications
  const joinedUsersRef = useRef(new Set());

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  /**
   * Handle cursor movement and selection in the editor
   * @param {Object} range - The selection range from Quill
   */
  const handleCursorMove = (range) => {
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    // Use a shorter delay for selection events to make them more responsive
    // We'll use an even shorter delay for better real-time collaboration experience
    const delay = 15; // Even faster updates for better responsiveness

    // Throttle cursor updates to avoid too many events
    cursorUpdateTimeoutRef.current = setTimeout(() => {
      // Check if there's a valid range before sending cursor position
      if (quillRef.current && range) {
        // Get the Quill editor instance
        const quill = quillRef.current.getEditor();

        // Make sure we have the most up-to-date selection
        const currentRange = quill.getSelection() || range;

        // Add visual indicator for cursor position (for debugging)
        if (process.env.NODE_ENV === 'development') {
          // Get the text content
          const text = quill.getText();
          const lines = text.split('\n');

          // Initialize line and column counters
          let line = 0;
          let ch = 0;
          let charCount = 0;

          // Find the line and column by counting characters
          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length;

            // Check if cursor is in this line
            if (charCount + lineLength >= currentRange.index) {
              line = i;
              ch = currentRange.index - charCount;
              break;
            }

            // Move to next line (add 1 for the newline character)
            charCount += lineLength + 1;
          }

          // Ensure we don't exceed the line length
          if (line < lines.length) {
            ch = Math.min(ch, lines[line].length);
          }

          // Update cursor position for debugging (in console only)
          if (process.env.NODE_ENV === 'development') {
            console.debug(`Cursor position - Line: ${line + 1}, Column: ${ch + 1}`);
          }
        }

        // Always send cursor position with the most accurate data
        sendCursorPosition(currentRange);
      }
    }, delay);
  };

  // We'll use onSelect event on textarea instead of document-level selectionchange
  // This avoids issues with server-side rendering and null references

  // Monitor online/offline status
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const handleOnline = () => {
        setOfflineMode(false);
        // Sync any pending changes when coming back online
        if (pendingChanges.length > 0) {
          handleSave(true);
        }
      };

      const handleOffline = () => {
        setOfflineMode(true);
        // Show a message to the user
        onError('You are offline. Changes will be saved locally and synced when you reconnect.');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial offline status
      setOfflineMode(!navigator.onLine);

      return () => {
        try {
          if (typeof window !== 'undefined') {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
          }
        } catch (error) {
          console.log('Cleanup error (safe to ignore):', error);
          // Silently ignore errors during cleanup
        }
      };
    }
  }, [pendingChanges, onError]);

  // Fetch document on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError('');

        // If no document ID, create a new document
        if (!docId) {
          // Check if we're offline
          if (offlineMode) {
            // Create a temporary document in local storage
            const tempDoc = {
              _id: 'temp-' + Date.now(),
              content: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem('offlineDocument', JSON.stringify(tempDoc));
            if (isMounted) {
              setDocument(tempDoc);
              setContent('');
              setLastSavedContent('');
              onError('You are working in offline mode. Changes will be synced when you reconnect.');
            }
          } else {
            // Create a new document on the server
            const newDoc = await createDocument('');
            if (isMounted) {
              navigate(`/editor/${newDoc._id}`, { replace: true });
            }
          }
          return;
        }

        // Check if we have this document in local storage (for offline mode)
        const cachedDoc = localStorage.getItem(`document-${docId}`);

        if (offlineMode && cachedDoc) {
          // Use cached version when offline
          const parsedDoc = JSON.parse(cachedDoc);
          if (isMounted) {
            setDocument(parsedDoc);
            setContent(parsedDoc.content || '');
            setLastSavedContent(parsedDoc.content || '');
            onError('You are working in offline mode. Changes will be synced when you reconnect.');
          }
        } else {
          try {
            // Fetch existing document from server
            const doc = await getDocument(docId);
            if (isMounted && doc) {
              setDocument(doc);
              setContent(doc.content || '');
              setLastSavedContent(doc.content || '');
              setDocumentTitle(doc.title || 'Untitled Document');

              // Cache document for offline use
              localStorage.setItem(`document-${docId}`, JSON.stringify(doc));
            }
          } catch (error) {
            // If fetch fails and we have a cached version, use it
            if (cachedDoc) {
              const parsedDoc = JSON.parse(cachedDoc);
              if (isMounted) {
                setDocument(parsedDoc);
                setContent(parsedDoc.content || '');
                setLastSavedContent(parsedDoc.content || '');
                setOfflineMode(true);
                onError('Could not connect to server. Using cached version.');
              }
            } else {
              throw error; // Re-throw if no cached version
            }
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        if (isMounted) {
          setError('Failed to load document. Please try again.');
          onError('Failed to load document: ' + error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
    };
  }, [docId, navigate, offlineMode, onError]);

  /**
   * Calculate cursor position (line and character) from textarea
   * @param {HTMLTextAreaElement} textarea - The textarea element
   * @param {number} selectionStart - The selection start position
   * @returns {Object} The cursor position with line and character
   */
  const calculateCursorPosition = useCallback((textarea, selectionStart) => {
    try {
      // Get text before cursor
      const textBeforeCursor = textarea.value.substring(0, selectionStart);

      // Split by newlines to get lines
      const lines = textBeforeCursor.split('\n');

      // Current line is the last line in the array (0-based)
      const line = lines.length - 1;

      // Character position is the length of the last line
      // This gives us the position AFTER the last character
      // which is exactly what we want for cursor positioning
      const ch = lines[lines.length - 1].length;

      // Return the calculated position

      return { line, ch };
    } catch (error) {
      console.error('Error calculating cursor position:', error);
      return { line: 0, ch: 0 }; // Default fallback
    }
  }, []);

  /**
   * Handle mouse down event on resize handle
   * @param {Event} e - Mouse down event
   */
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);

    // Add event listeners for mouse move and mouse up
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', resizeMoveHandlerRef.current);
      document.addEventListener('mouseup', resizeEndHandlerRef.current);
    }
  }, []);

  /**
   * Handle mouse move event during resize
   * @param {Event} e - Mouse move event
   */
  const handleResizeMove = useCallback((e) => {
    // We check the state directly from the DOM to avoid circular dependency
    const isCurrentlyResizing = document.querySelector('.text-editor-wrapper.resizing') !== null;
    if (!isCurrentlyResizing) return;

    // Calculate new height based on mouse position
    const editorContainer = document.querySelector('.text-editor-wrapper');
    if (editorContainer) {
      const containerRect = editorContainer.getBoundingClientRect();
      const newHeight = Math.max(200, e.clientY - containerRect.top); // Minimum height of 200px
      setEditorHeight(newHeight);
    }
  }, []);

  // Store the current handler in a ref to avoid circular dependencies
  useEffect(() => {
    resizeMoveHandlerRef.current = handleResizeMove;
  }, [handleResizeMove]);

  /**
   * Handle mouse up event to end resize
   */
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', resizeMoveHandlerRef.current);
      document.removeEventListener('mouseup', resizeEndHandlerRef.current);
    }
  }, []);

  // Store the current handler in a ref to avoid circular dependencies
  useEffect(() => {
    resizeEndHandlerRef.current = handleResizeEnd;
  }, [handleResizeEnd]);

  /**
   * Toggle comments panel visibility
   */
  const toggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  /**
   * Handle adding a new comment
   * @param {Object} newComment - The new comment to add
   */
  const handleAddComment = useCallback(async (newComment) => {
    if (!docId || !user) return;

    try {
      // Make sure we have the user information
      if (!newComment.user) {
        newComment.user = user._id;
      }

      // Add position information if available
      if (commentPosition && !newComment.position) {
        newComment.position = commentPosition;
      }

      // Call API to add comment using axios
      const response = await axios.post(
        `/api/comments/document/${docId}`,
        newComment
      );

      // Update comments state
      setComments(prev => [response.data, ...prev]);

      // Reset comment position
      setCommentPosition(null);

      // Show success message
      setSuccessMessage(SUCCESS_MESSAGES.COMMENT_ADDED);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
  }, [docId, user, commentPosition]);

  // Helper function to process the selection and create a comment
  const processSelection = useCallback((quill, selection) => {
    if (!quill || !selection) return;

    // Get text content
    const text = quill.getText();

    // Calculate line and column
    let line = 0;
    let ch = 0;
    let charCount = 0;

    // Find the line and column by counting characters
    for (let i = 0; i < text.length && charCount < selection.index; i++) {
      if (text[i] === '\n') {
        line++;
        ch = 0;
      } else {
        ch++;
      }
      charCount++;
    }

    // Get selected text if any
    const selectedText = selection.length > 0
      ? text.substr(selection.index, selection.length)
      : '';

    // Create position object
    const position = {
      index: selection.index,
      line,
      ch,
      selectedText,
      selection: selection.length > 0 ? {
        start: { line, ch },
        end: { line, ch: ch + selection.length } // This is simplified and may not be accurate for multi-line selections
      } : null
    };

    // Set comment position
    console.log('Setting comment position:', position);
    setCommentPosition(position);

    // Show comments panel
    setShowComments(true);

    // If no text is selected, we'll just add a comment at the cursor position
    if (!selection.length) {
      console.log('No text selected, adding comment at cursor position');
    }
  }, [setCommentPosition, setShowComments]);

  /**
   * Set the position for a new comment based on current selection
   */
  const addCommentAtSelection = useCallback(() => {
    console.log('addCommentAtSelection called');
    if (!quillRef.current) {
      console.log('quillRef.current is null');
      return;
    }

    const quill = quillRef.current.getEditor();

    // Use setTimeout to ensure Quill has time to process the selection
    setTimeout(() => {
      // Force selection if none exists
      let selection = quill.getSelection();
      console.log('Selection after timeout:', selection);

      if (!selection) {
        console.log('No selection found, creating one');
        // Default to the beginning of the document
        const currentIndex = 0;

        // Create a selection at the current position with length 0
        quill.setSelection(currentIndex, 0);

        // Use another setTimeout to ensure the selection is set
        setTimeout(() => {
          selection = quill.getSelection() || { index: currentIndex, length: 0 };
          processSelection(quill, selection);
        }, 50);
      } else {
        processSelection(quill, selection);
      }
    }, 50);
  }, [quillRef, processSelection]);

  /**
   * Fetch comments for the current document
   */
  const fetchComments = useCallback(async () => {
    if (!docId) return;

    try {
      // Use axios instance with configured baseURL and auth
      const response = await axios.get(
        `/api/comments/document/${docId}`
      );
      setComments(response.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      // Don't show error to user to avoid cluttering the UI
      setComments([]);
    }
  }, [docId]);

  // Add event listeners for resize when component mounts
  useEffect(() => {
    return () => {
      // Clean up event listeners when component unmounts
      try {
        // Check if we're in a browser environment and document is available
        if (typeof window !== 'undefined' &&
            typeof document !== 'undefined' &&
            document &&
            resizeMoveHandlerRef.current &&
            resizeEndHandlerRef.current) {
          document.removeEventListener('mousemove', resizeMoveHandlerRef.current);
          document.removeEventListener('mouseup', resizeEndHandlerRef.current);
        }
      } catch (error) {
        console.log('Cleanup error (safe to ignore):', error);
        // Silently ignore errors during cleanup
      }
    };
  }, []);

  // No longer need calculateSelectionRange as Quill handles this for us

  /**
   * Send cursor position and selection to other users
   * @param {Object} range - The selection range from Quill
   */
  const sendCursorPosition = useCallback((range) => {
    // Safety check for server-side rendering and disconnected state
    if (!isConnected || !docId || !quillRef.current || typeof window === 'undefined' || !range) return;

    try {
      // Get the Quill editor instance
      const quill = quillRef.current.getEditor();

      // Get the text content
      const text = quill.getText();

      // Get the current selection
      const cursorPosition = quill.getSelection();
      if (!cursorPosition) return;

      // Calculate line and column information more accurately
      // Split the text into lines
      const lines = text.split('\n');

      // Initialize line and column counters
      let line = 0;
      let ch = 0;
      let charCount = 0;

      // Find the line and column by counting characters
      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length;

        // Check if cursor is in this line
        if (charCount + lineLength >= range.index) {
          line = i;
          ch = range.index - charCount;
          break;
        }

        // Move to next line (add 1 for the newline character)
        charCount += lineLength + 1;
      }

      // Ensure we don't exceed the line length (can happen with formatting)
      if (line < lines.length) {
        ch = Math.min(ch, lines[line].length);
      }

      // Create position object
      const position = {
        line,
        ch
      };

      // Calculate selection end position if there is a selection
      let selection = null;

      if (range.length > 0) {
        // For selections, we need to calculate the end position
        const endIndex = range.index + range.length;
        let selectionEndLine = line;
        let selectionEndCh = ch;

        // Reset character count to the start of the current line
        charCount = charCount - ch;

        // Find the end line and column
        for (let i = line; i < lines.length; i++) {
          const lineLength = lines[i].length;

          // Check if selection end is in this line
          if (charCount + lineLength >= endIndex) {
            selectionEndLine = i;
            selectionEndCh = endIndex - charCount;
            break;
          }

          // Move to next line
          charCount += lineLength + 1;
        }

        // Ensure end position doesn't exceed line length
        if (selectionEndLine < lines.length) {
          selectionEndCh = Math.min(selectionEndCh, lines[selectionEndLine].length);
        }

        // Create selection object
        selection = {
          start: { line, ch },
          end: { line: selectionEndLine, ch: selectionEndCh }
        };
      }

      // Always send an update to ensure synchronization
      // Get username from user object or generate a random one if not available
      const username = user?.email?.split('@')[0] ||
        `User-${Math.floor(Math.random() * 1000)}`;

      // Update local state
      setCursorPosition(position);

      // Ensure we have a valid color
      if (!userColorRef.current) {
        userColorRef.current = getRandomColor();
      }

      // Send cursor position to server with all required data
      const cursorData = {
        docId,
        userId: socket.id,
        username,
        position,
        selection,
        color: userColorRef.current,
        timestamp: Date.now()
      };

      // Log what we're sending for debugging
      console.log('Sending cursor data:', {
        userId: cursorData.userId,
        username: cursorData.username,
        color: cursorData.color,
        hasSelection: !!cursorData.selection
      });

      emit('cursorMove', cursorData);
    } catch (error) {
      // Silently handle any errors to prevent app crashes
      console.error('Error sending cursor position:', error);
    }
  }, [isConnected, docId, socket, emit, user, calculateCursorPosition]);

  // Fetch comments when document loads
  useEffect(() => {
    if (docId) {
      // Debug auth tokens and fix if needed
      console.log('TextEditor mounted, debugging auth tokens...');
      debugAuth();

      // Fix auth tokens if needed
      const token = fixAuthTokens();
      if (token) {
        console.log('Auth tokens fixed, using token:', token.substring(0, 10) + '...');
      }

      // Fetch comments
      fetchComments();
    }
  }, [docId, fetchComments]);

  // Set up socket connection for document and cursors
  useEffect(() => {
    if (!isConnected || !docId) return;

    // Join document room
    emit('joinDocument', docId);

    // Handle document updates from other users
    const handleDocumentUpdate = (updatedDoc) => {
      if (updatedDoc && updatedDoc._id === docId) {
        const newContent = updatedDoc.content || '';
        setContent(newContent);
      }
    };

    // Handle cursor updates from other users
    const handleCursorUpdate = (cursor) => {
      if (cursor.docId !== docId || cursor.userId === socket.id) return;

      // Log cursor data for debugging
      console.log('Received cursor update:', {
        userId: cursor.userId,
        username: cursor.username,
        color: cursor.color,
        hasSelection: !!cursor.selection
      });

      setRemoteCursors(prevCursors => {
        // Update existing cursor or add new one
        const existingCursorIndex = prevCursors.findIndex(c => c.userId === cursor.userId);

        if (existingCursorIndex >= 0) {
          const newCursors = [...prevCursors];
          const existingCursor = newCursors[existingCursorIndex];

          // Create a new cursor object with merged properties
          const updatedCursor = {
            ...existingCursor,  // Keep existing properties
            ...cursor,         // Update with new properties
            // Always preserve the color from the first time we saw this user
            color: existingCursor.color || cursor.color || getRandomColor()
          };

          newCursors[existingCursorIndex] = updatedCursor;
          return newCursors;
        } else {
          // For new cursors, ensure they have a color
          const newCursor = {
            ...cursor,
            color: cursor.color || getRandomColor()
          };
          return [...prevCursors, newCursor];
        }
      });
    };

    // Handle user joined the document
    const handleUserJoined = (userData) => {
      if (userData.docId !== docId) return;

      // Check if we've already shown a notification for this user
      if (!joinedUsersRef.current.has(userData.userId)) {
        // Add to joined users set
        joinedUsersRef.current.add(userData.userId);

        // Show notification (only once per user)
        setSuccessMessage(`${userData.username} joined the document`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }

      setActiveUsers(prevUsers => {
        if (!prevUsers.some(u => u.userId === userData.userId)) {
          return [...prevUsers, userData];
        }
        return prevUsers;
      });
    };

    // Handle user left the document
    const handleUserLeft = (userData) => {
      if (userData.docId !== docId) return;

      // Get username from the event or from active users
      const username = userData.username ||
        activeUsers.find(u => u.userId === userData.userId)?.username ||
        'User';

      // Only show notification if we've seen this user before
      if (joinedUsersRef.current.has(userData.userId)) {
        // Remove from joined users set
        joinedUsersRef.current.delete(userData.userId);

        // Show notification
        setError(`${username} left the document`);
        setTimeout(() => setError(''), 3000);
      }

      setActiveUsers(prevUsers =>
        prevUsers.filter(u => u.userId !== userData.userId)
      );

      setRemoteCursors(prevCursors =>
        prevCursors.filter(c => c.userId !== userData.userId)
      );
    };

    // Handle active users list
    const handleActiveUsers = (data) => {
      if (data.docId !== docId) return;

      setActiveUsers(data.users.filter(u => u.userId !== socket.id));
    };

    // Subscribe to events
    const unsubscribeDocUpdate = on('documentUpdated', handleDocumentUpdate);
    const unsubscribeCursorUpdate = on('cursorMove', handleCursorUpdate);
    const unsubscribeUserJoined = on('userJoined', handleUserJoined);
    const unsubscribeUserLeft = on('userLeft', handleUserLeft);
    const unsubscribeActiveUsers = on('activeUsers', handleActiveUsers);

    // Get username from user object or generate a random one
    const username = user?.email?.split('@')[0] ||
      `User-${Math.floor(Math.random() * 1000)}`;

    // Send initial user joined event
    emit('userJoined', {
      docId,
      userId: socket.id,
      username,
      color: userColorRef.current
    });

    // Cleanup function
    return () => {
      try {
        // Unsubscribe from all events
        if (unsubscribeDocUpdate) unsubscribeDocUpdate();
        if (unsubscribeCursorUpdate) unsubscribeCursorUpdate();
        if (unsubscribeUserJoined) unsubscribeUserJoined();
        if (unsubscribeUserLeft) unsubscribeUserLeft();
        if (unsubscribeActiveUsers) unsubscribeActiveUsers();

        // Clear joined users set
        if (joinedUsersRef.current) {
          joinedUsersRef.current = new Set();
        }

        // Notify others that user has left
        if (isConnected && docId && emit && socket && socket.id) {
          emit('userLeft', {
            docId,
            userId: socket.id,
            username: user?.email?.split('@')[0] || 'User'
          });
        }
      } catch (error) {
        console.log('Socket cleanup error (safe to ignore):', error);
        // Silently ignore errors during cleanup
      }
    };
  }, [docId, isConnected, emit, on, socket, user]);

  /**
   * Handle text formatting
   * @param {string} formatType - Type of format to apply
   * @param {any} value - Optional value for the format
   */
  const handleFormat = (formatType, value) => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    let range = quill.getSelection();

    // If no selection and not inserting content, try to get selection
    if (!range && !['image', 'link', 'video', 'formula'].includes(formatType)) {
      quill.focus();
      // Try to get selection again after focus
      range = quill.getSelection(true);
      if (!range) return;
    }

    // Apply format based on type using Quill's API
    switch(formatType) {
      // Text formatting
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
        quill.format(formatType, !quill.getFormat(range)[formatType]);
        break;

      // Headers
      case 'header':
        quill.format('header', value);
        break;

      // Lists
      case 'list':
        quill.format('list', value);
        break;

      // Indentation
      case 'indent':
        if (value === '+1') {
          quill.format('indent', '+1');
        } else {
          quill.format('indent', '-1');
        }
        break;

      // Alignment
      case 'align':
        quill.format('align', value);
        break;

      // Script
      case 'script':
        quill.format('script', value);
        break;

      // Code block
      case 'code-block':
        quill.format('code-block', !quill.getFormat(range)['code-block']);
        break;

      // Blockquote
      case 'blockquote':
        quill.format('blockquote', !quill.getFormat(range)['blockquote']);
        break;

      // Link
      case 'link':
        if (range && range.length > 0) {
          const url = prompt('Enter URL:', 'https://example.com');
          if (url) {
            quill.format('link', url);
          } else {
            quill.format('link', false);
          }
        }
        break;

      // Image
      case 'image':
        const imgUrl = prompt('Enter image URL:', 'https://example.com/image.jpg');
        if (imgUrl && range) {
          quill.insertEmbed(range.index, 'image', imgUrl);
        }
        break;

      // Clear formatting
      case 'removeFormat':
        quill.removeFormat(range.index, range.length);
        break;

      // Color
      case 'color':
        quill.format('color', value);
        break;

      // Background
      case 'background':
        quill.format('background', value);
        break;

      // Font
      case 'font':
        quill.format('font', value);
        break;

      // Size
      case 'size':
        quill.format('size', value);
        break;

      default:
        console.log(`Format type not implemented: ${formatType}`);
        break;
    }

    // Get the updated content from Quill
    const newContent = quill.root.innerHTML;
    setContent(newContent);

    // Emit change to socket if connected
    if (isConnected && docId && !offlineMode) {
      emit('updateDocument', { _id: docId, content: newContent });
    }

    // Also emit format event to socket
    if (isConnected && docId && !offlineMode) {
      emit('applyFormat', {
        docId,
        format: {
          formatType,
          range: range,
          formatData: null
        }
      });
    }
  };

  /**
   * Handle text change in editor
   * @param {string} content - New content from Quill
   */
  const handleChange = (content) => {
    // Ensure newContent is at least an empty string, not null or undefined
    const newContent = content || '';
    setContent(newContent);

    // Check if there are unsaved changes
    if (newContent !== lastSavedContent) {
      setUnsavedChanges(true);
    } else {
      setUnsavedChanges(false);
    }

    // Emit change to socket if connected
    if (isConnected && docId && !offlineMode) {
      emit('updateDocument', { _id: docId, content: newContent });
    } else if (offlineMode) {
      // Store changes locally when offline
      const timestamp = Date.now();
      setPendingChanges(prev => [...prev, { timestamp, content: newContent }]);

      // Update local storage
      if (docId) {
        const cachedDoc = localStorage.getItem(`document-${docId}`);
        if (cachedDoc) {
          const parsedDoc = JSON.parse(cachedDoc);
          parsedDoc.content = newContent;
          parsedDoc.updatedAt = new Date().toISOString();
          localStorage.setItem(`document-${docId}`, JSON.stringify(parsedDoc));
        }
      }
    }

    // Auto-save after typing stops (with different delays based on connection quality)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Adjust auto-save delay based on connection quality
    const saveDelays = {
      good: 2000, // 2 seconds
      fair: 3000, // 3 seconds
      poor: 5000  // 5 seconds
    };
    const saveDelay = saveDelays[connectionQuality] || saveDelays.good;

    saveTimeoutRef.current = setTimeout(() => {
      if (!offlineMode) {
        handleSave(false);
      }
    }, saveDelay);
  };

  // handleCursorMove is now declared at the top of the component

  // handleSelectionChange is now declared at the top of the component

  /**
   * Handle document title update
   */
  const handleUpdateTitle = async () => {
    if (!docId || !documentTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      setSaving(true);
      await updateDocument(docId, { title: documentTitle.trim() });

      // Update document in state
      setDocument(prev => ({ ...prev, title: documentTitle.trim() }));

      setSuccessMessage('Document title updated successfully');
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating document title:', error);
      setError(`Failed to update document title: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle document deletion
   */
  const handleDeleteDocument = async () => {
    if (!docId) return;

    try {
      setLoading(true);
      await deleteDocument(docId);

      // Navigate back to documents list
      navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(`Failed to delete document: ${error.message || 'Please try again.'}`);
      setShowDeleteConfirmation(false);
      setLoading(false);
    }
  };

  /**
   * Handle document version restoration
   * @param {string} documentId - Document ID
   * @param {string} versionId - Version ID to restore
   */
  const handleRestoreVersion = async (documentId, versionId) => {
    try {
      setLoading(true);

      // Restore the document to the selected version
      await restoreVersion(documentId, versionId);

      // Reload the document to get the restored content
      const updatedDoc = await getDocument(documentId);
      if (updatedDoc) {
        setDocument(updatedDoc);
        setContent(updatedDoc.content || '');
        setLastSavedContent(updatedDoc.content || '');
        setDocumentTitle(updatedDoc.title || 'Untitled Document');
      }

      setSuccessMessage('Document restored to previous version successfully');
    } catch (error) {
      console.error('Error restoring document version:', error);
      setError(`Failed to restore document: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle document sharing
   * @param {string} documentId - Document ID
   * @param {string} email - Email of the user to share with
   * @param {string} permission - Permission level ('view' or 'edit')
   */
  const handleShareDocument = async (documentId, email, permission) => {
    try {
      // Call the sharing service to share the document
      const result = await shareDocument(documentId, email, permission);
      console.log('Share document result:', result);

      // Update document in state to reflect new sharing status
      if (result && result.document) {
        console.log('Setting document with shared users:', result.document.sharedWith);

        // Make sure to update the document state with the latest data
        setDocument(prevDoc => ({
          ...prevDoc,
          ...result.document
        }));

        // Reload the document to ensure we have the latest data
        try {
          const updatedDoc = await getDocument(documentId);
          if (updatedDoc) {
            setDocument(updatedDoc);
          }
        } catch (reloadError) {
          console.error('Error reloading document after sharing:', reloadError);
        }
      }

      return result;
    } catch (error) {
      console.error('Error sharing document:', error);
      throw new Error(error.message || 'Failed to share document');
    }
  };

  /**
   * Save document to server or locally when offline
   * @param {boolean} showMessage - Whether to show success message
   */
  const handleSave = async (showMessage = true) => {
    if (!docId) {
      setError('Cannot save: Document ID is missing');
      onError('Cannot save: Document ID is missing');
      return;
    }

    try {
      if (showMessage) {
        setSaving(true);
      }

      // Get current content
      const currentContent = contentRef.current;

      // Ensure content is at least an empty string, not null or undefined
      const safeContent = currentContent || '';

      if (offlineMode) {
        // Save to local storage when offline
        const cachedDoc = localStorage.getItem(`document-${docId}`);
        if (cachedDoc) {
          const parsedDoc = JSON.parse(cachedDoc);
          parsedDoc.content = safeContent;
          parsedDoc.updatedAt = new Date().toISOString();
          localStorage.setItem(`document-${docId}`, JSON.stringify(parsedDoc));

          // Update last saved content
          setLastSavedContent(safeContent);
          setUnsavedChanges(false);

          if (showMessage) {
            setSuccessMessage('Document saved locally (offline mode)');
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        }
      } else {
        // Save to server when online
        await saveDocument(docId, safeContent);

        // Update last saved content
        setLastSavedContent(safeContent);
        setUnsavedChanges(false);

        // Clear pending changes after successful save
        setPendingChanges([]);

        if (showMessage) {
          setSuccessMessage('Document saved successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving document:', error);

      // Check if it's a validation error
      if (error.message && error.message.includes('validation failed')) {
        console.warn('Validation error detected, trying to handle empty document case');

        // Try again with explicitly empty string
        try {
          if (!offlineMode) {
            await saveDocument(docId, '');
            setLastSavedContent('');
            setUnsavedChanges(false);
            setPendingChanges([]);

            if (showMessage) {
              setSuccessMessage('Document saved successfully (empty content)');
              setTimeout(() => setSuccessMessage(''), 3000);
            }
            return; // Exit early if successful
          }
        } catch (retryError) {
          console.error('Failed retry with empty string:', retryError);
          // Continue to fallback handling
        }
      }

      // Show error to user
      setError('Failed to save document. Please try again.');
      onError('Failed to save document: ' + error.message);

      // If we're online but save failed, store changes locally as backup
      if (!offlineMode) {
        const currentContent = contentRef.current || '';
        const timestamp = Date.now();
        setPendingChanges(prev => [...prev, { timestamp, content: currentContent }]);

        // Also save to local storage as backup
        if (docId) {
          try {
            const cachedDoc = localStorage.getItem(`document-${docId}`) ||
              JSON.stringify({ _id: docId, content: '', createdAt: new Date().toISOString() });
            const parsedDoc = JSON.parse(cachedDoc);
            parsedDoc.content = currentContent;
            parsedDoc.updatedAt = new Date().toISOString();
            localStorage.setItem(`document-${docId}`, JSON.stringify(parsedDoc));
          } catch (e) {
            console.error('Error saving to local storage:', e);
          }
        }
      }
    } finally {
      if (showMessage) {
        setSaving(false);
      }
    }
  };

  // Show loading state
  if (loading) {
    return <Loading message="Loading document..." />;
  }

  return (
    <div className={`text-editor-container ${isMobile ? 'mobile-view' : ''} ${offlineMode ? 'offline-mode' : ''}`}>
      {/* Toolbar */}
      <div className="text-editor-toolbar">
        <button
          className={`btn btn-sm ${unsavedChanges ? 'btn-warning' : 'btn-primary'}`}
          onClick={() => handleSave(true)}
          disabled={saving}
          aria-label="Save document"
        >
          {saving ? 'Saving...' : unsavedChanges ? 'Save*' : 'Save'}
        </button>

        {document && (
          <div className="document-title-container ml-3">
            {isEditingTitle ? (
              <div className="document-title-edit">
                <input
                  type="text"
                  className="title-input"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                  autoFocus
                />
                <div className="title-edit-actions">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={handleUpdateTitle}
                    title="Save title"
                    disabled={saving}
                  >
                    ✓
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsEditingTitle(false)}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="document-title-display">
                <span className="document-title" title={document.title || `Document ${docId}`}>
                  {document.title || `Document ${docId?.substring(0, 8)}`}
                  {unsavedChanges && <span className="unsaved-indicator">*</span>}
                </span>
                <button
                  className="btn btn-sm btn-icon"
                  onClick={() => setIsEditingTitle(true)}
                  title="Edit title"
                >
                  ✎
                </button>
              </div>
            )}
          </div>
        )}

        {/* Connection status indicator */}
        <div className="connection-status ml-2">
          <span
            className={`status-indicator ${offlineMode ? 'offline' : isConnected ? 'online' : 'disconnected'}`}
            title={offlineMode ? 'Offline Mode' : isConnected ? 'Connected' : 'Disconnected'}
          ></span>
        </div>

        {/* Active users */}
        <div className="ml-auto d-flex align-items-center">
          {/* Share document button */}
          <button
            className="btn btn-sm btn-primary mr-2"
            onClick={() => setShowShareDialog(true)}
            title="Share document"
          >
            Share
          </button>

          {/* Document history button */}
          <button
            className="btn btn-sm btn-info mr-2"
            onClick={() => setShowHistory(true)}
            title="Document history"
          >
            History
          </button>

          {/* Comments button */}
          <button
            className={`btn btn-sm ${showComments ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
            onClick={toggleComments}
            title="Toggle comments"
          >
            Comments
          </button>

          {/* Add comment button */}
          <button
            className="btn btn-sm btn-outline-secondary mr-2"
            onClick={addCommentAtSelection}
            title="Add comment at selection"
          >
            Add Comment
          </button>

          {/* Delete document button */}
          <button
            className="btn btn-sm btn-danger mr-3"
            onClick={() => setShowDeleteConfirmation(true)}
            title="Delete document"
          >
            Delete
          </button>

          {/* Active users */}
          {activeUsers.map(activeUser => (
            <div
              key={activeUser.userId}
              className="editor-user-avatar ml-1"
              style={{ backgroundColor: activeUser.color }}
              aria-label={`User: ${activeUser.username}`}
            >
              {activeUser.username?.charAt(0).toUpperCase()}
              <div className="editor-user-tooltip">
                {activeUser.username}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error and success messages */}
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      {successMessage && (
        <ErrorMessage
          type="success"
          message={successMessage}
          onDismiss={() => setSuccessMessage('')}
        />
      )}

      {/* Offline mode banner */}
      {offlineMode && (
        <div className="offline-banner">
          <span className="offline-icon">⚠️</span>
          You are working in offline mode. Changes will be saved locally and synced when you reconnect.
        </div>
      )}

      {/* Format toolbar */}
      <FormatToolbar onFormat={handleFormat} />

      {/* Editor with cursor overlay */}
      <div
        className={`text-editor-wrapper ${isResizing ? 'resizing' : ''}`}
        style={{ height: `${editorHeight}px` }}
      >
        <ReactQuill
          ref={quillRef}
          className={`text-editor ${unsavedChanges ? 'unsaved' : ''}`}
          value={content}
          onChange={handleChange}
          onChangeSelection={handleCursorMove}
          placeholder="Start typing here..."
          theme="snow"
          modules={{
            toolbar: false // We're using our own toolbar
          }}
          formats={[
            'bold', 'italic', 'underline', 'strike',
            'header', 'list', 'bullet', 'ordered', 'indent',
            'link', 'image', 'code-block', 'blockquote',
            'color', 'background', 'font', 'size', 'script',
            'align'
          ]}
        />

        {/* Cursor overlay */}
        <CursorOverlay
          cursors={remoteCursors}
          editorRef={quillRef}
        />

        {/* Resize handle */}
        <div
          className="resize-handle"
          onMouseDown={handleResizeStart}
        >
          {isResizing && (
            <div className="resize-indicator">{Math.round(editorHeight)}px</div>
          )}
        </div>

        {/* Position indicator */}
        <div className="position-indicator">
          Line: {cursorPosition.line + 1}, Column: {cursorPosition.ch + 1}
          {unsavedChanges && <span className="ml-2 unsaved-indicator" title="Unsaved changes">*</span>}
        </div>
      </div>

      {/* Connection quality indicator */}
      {connectionQuality !== 'good' && !offlineMode && (
        <div className={`connection-quality-indicator quality-${connectionQuality}`}>
          <span className="quality-icon">📶</span>
          {connectionQuality === 'fair' ?
            'Connection is slow. Auto-save delay increased.' :
            'Poor connection. Changes may take longer to sync.'}
        </div>
      )}

      {/* Disconnected status */}
      {!isConnected && !offlineMode && (
        <div className="p-2 text-center disconnected-banner">
          <small className="text-danger">
            <span className="disconnected-icon">⚠️</span>
            Not connected to server. Changes will not be shared in real-time.
          </small>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Document"
        message={`Are you sure you want to delete "${document?.title || 'this document'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteDocument}
        onCancel={() => setShowDeleteConfirmation(false)}
        type="danger"
      />

      {/* Document history dialog */}
      <DocumentHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        documentId={docId}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Share dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        documentId={docId}
        documentTitle={document?.title || 'Untitled Document'}
        onShare={handleShareDocument}
      />

      {/* Comments panel */}
      {showComments && (
        <CommentList
          documentId={docId}
          onClose={() => setShowComments(false)}
          onAddComment={handleAddComment}
        />
      )}

      {/* Comment markers */}
      <div className="comment-markers">
        {Array.isArray(comments) && comments.map((comment) => (
          comment && comment.position && (
            <CommentMarker
              key={comment._id || `comment-${Math.random()}`}
              position={comment.position}
              commentCount={1}
              isActive={activeComment === (comment._id || '')}
              onClick={() => setActiveComment(comment._id || '')}
            />
          )
        ))}
      </div>

      {/* New comment form when text is selected */}
      {commentPosition && (
        <div className="floating-comment-form">
          <NewCommentForm
            onAddComment={handleAddComment}
            initialPosition={commentPosition}
            onCancel={() => setCommentPosition(null)}
          />
        </div>
      )}
    </div>
  );
};

export default TextEditor;
