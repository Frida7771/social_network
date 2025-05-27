const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: String,
    publicId: String, // For Cloudinary
    caption: String
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  hashtags: [{
    type: String,
    lowercase: true
  }],
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  }],
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Index for search and performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ content: 'text' });

// Pre-hook to populate author info
postSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'username firstName lastName avatar isVerified'
  }).populate({
    path: 'likes.user',
    select: 'username firstName lastName avatar'
  }).populate({
    path: 'comments',
    populate: {
      path: 'author',
      select: 'username firstName lastName avatar'
    }
  });
  next();
});

// Method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user._id.toString() === userId.toString());
};

// Method to extract hashtags from content
postSchema.methods.extractHashtags = function() {
  const hashtagRegex = /#[\w]+/g;
  const hashtags = this.content.match(hashtagRegex) || [];
  return hashtags.map(tag => tag.substring(1).toLowerCase());
};

// Method to extract mentions from content
postSchema.methods.extractMentions = function() {
  const mentionRegex = /@[\w]+/g;
  const mentions = this.content.match(mentionRegex) || [];
  return mentions.map(mention => mention.substring(1).toLowerCase());
};

// Pre-save hook to extract hashtags and mentions
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.hashtags = this.extractHashtags();
    // Note: You'll need to resolve mentions to actual users in your controller
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);