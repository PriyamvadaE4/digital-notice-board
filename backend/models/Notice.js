const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    // New system (preferred)
    content: {
      type: String,
      trim: true
    },

    // Legacy field (kept for backward compatibility)
    description: {
      type: String,
      trim: true
    },

    image: {
      type: String,
      default: ''
    },

    category: {
      type: String,
      trim: true,
      default: ''
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low'
    },

    isPinned: {
      type: Boolean,
      default: false
    },

    expiryDate: {
      type: Date,
      default: null
    },

    // New system
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Legacy field (kept for older UIs)
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', NoticeSchema);

