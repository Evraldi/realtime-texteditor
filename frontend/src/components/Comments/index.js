/**
 * Comments Module
 *
 * This file exports all comment-related components for easier imports
 */

import CommentItem from './CommentItem';
import CommentList from './CommentList';
import CommentMarker from './CommentMarker';
import NewCommentForm from './NewCommentForm';

// Export all components
export {
  CommentItem,
  CommentList,
  CommentMarker,
  NewCommentForm
};

// Default export for the main component
export default CommentList;
