# BrainLift Generator - User Flow Document

## Overview

This document defines the complete user journey through the BrainLift Generator application, detailing how users navigate between different features and states. The flow supports multiple concurrent BrainLift documents and maintains progress automatically.

## Primary User Flow States

### 1. Application Launch
**Entry Point:** User opens the BrainLift Generator application

**Interface Elements:**
- Main dashboard/home screen
- List of in-progress BrainLift documents
- List of completed BrainLift documents
- "Create New BrainLift" button
- Application menu/settings

**User Actions:**
- View existing BrainLift documents (in-progress and completed)
- Start a new BrainLift creation process
- Return to an existing in-progress BrainLift
- Open a completed BrainLift for viewing/editing

### 2. Purpose Definition Phase
**Entry Point:** User clicks "Create New BrainLift" or returns to in-progress BrainLift in Purpose phase

**Interface Elements:**
- Chat interface for AI interaction
- Purpose section display with subsections:
  - Core Problem
  - Target Outcome
  - Clear Boundaries
- "Start Research" button (enabled when Purpose is complete)
- "Home" button
- Progress indicator showing current phase

**User Actions:**
- Engage in chat conversation to refine Purpose
- Review and modify Purpose subsections
- Confirm Purpose completion and start research
- Navigate back to home (auto-saves progress)

**Flow Transitions:**
- **To Research Phase:** Click "Start Research" button
- **To Home:** Click "Home" button (auto-saves current state)

### 3. Research Phase
**Entry Point:** User clicks "Start Research" from Purpose Definition phase

**Interface Elements:**
- Research progress indicators for three parallel workflows:
  - Experts research progress
  - SpikyPOVs research progress
  - Knowledge Tree research progress
- "Stop Research" button
- "Home" button
- Current research status/activity display

**User Actions:**
- Monitor research progress
- Stop research process if needed
- Navigate back to home (auto-saves progress)
- Wait for research completion notification

**Flow Transitions:**
- **To Purpose Modification:** Click "Stop Research" → return to Purpose Definition
- **To Review Phase:** Research completes → automatic transition with notification
- **To Home:** Click "Home" button (auto-saves current state)

### 4. Review and Edit Phase
**Entry Point:** Research completion notification or returning to completed research BrainLift

**Interface Elements:**
- Complete BrainLift document display with all sections:
  - Purpose (editable)
  - Experts (editable with sources)
  - SpikyPOVs (editable with sources)
  - Knowledge Tree (editable with sources)
- Source citations and links for each section
- Edit controls:
  - Direct text editing capability
  - "AI Edit" button for each section
  - "Continue Research" button for each section
- "Save BrainLift" button
- "Home" button

**User Actions:**
- Review generated content and sources
- Edit document content directly
- Request AI to edit specific sections
- Request additional research for specific sections
- Save completed BrainLift document
- Navigate back to home (auto-saves progress)

**Flow Transitions:**
- **To Additional Research:** Click "Continue Research" for specific section
- **To Save Process:** Click "Save BrainLift"
- **To Home:** Click "Home" button (auto-saves current state)

### 5. Additional Research Sub-flow
**Entry Point:** User clicks "Continue Research" from Review phase

**Interface Elements:**
- Research progress indicator for specific section
- "Stop Research" button
- Current research activity display

**User Actions:**
- Monitor additional research progress
- Stop additional research if needed

**Flow Transitions:**
- **Back to Review Phase:** Research completes or user stops research

### 6. Save Process
**Entry Point:** User clicks "Save BrainLift" from Review phase

**Interface Elements:**
- Project selection/creation dialog
- Project name input field
- Directory path display: "C:\Users\seana\OneDrive\Documents\Gauntlet Projects\[project name]\docs\"
- "Save" button
- "Cancel" button

**User Actions:**
- Select existing project or create new project name
- Confirm save location
- Complete save process

**Flow Transitions:**
- **To Home:** Save completes → return to home screen
- **Back to Review:** Click "Cancel"

## Navigation Patterns

### Global Navigation
- **Home Button:** Available from all screens except home screen
  - Auto-saves current progress
  - Returns to main dashboard
  - Preserves all in-progress work

### State Persistence
- **Auto-save Triggers:**
  - Navigation to home screen
  - Application close
  - Phase transitions
  - Periodic intervals during active work

- **Resumable States:**
  - Purpose Definition (with chat history)
  - Active Research (with current progress)
  - Review and Edit (with all modifications)

## Multi-Document Support

### Concurrent BrainLift Management
- Users can have multiple BrainLift documents in different phases simultaneously
- Each document maintains independent state
- Home screen shows status of all documents:
  - In-progress documents with current phase indicator
  - Completed documents with creation date

### Document States
1. **Purpose Definition:** Yellow indicator - defining problem scope
2. **Research Active:** Blue indicator - AI conducting background research
3. **Research Complete:** Green indicator - ready for review
4. **In Review:** Orange indicator - user reviewing/editing content
5. **Completed:** Gray indicator - saved to project directory

## Error Handling and Edge Cases

### Research Interruption
- If research is stopped, user returns to Purpose Definition phase
- All research progress is discarded
- User can modify Purpose and restart research

### Network/API Failures
- Research progress is saved at checkpoint intervals
- User receives error notification
- Option to retry or return to previous phase

### Application Closure
- All progress automatically saved
- In-progress research continues in background if possible
- User can resume exactly where they left off

## User Experience Considerations

### Progress Visibility
- Clear indication of current phase
- Progress bars for research activities
- Status messages for background operations

### Context Preservation
- Chat history maintained during Purpose definition
- Research sources preserved during review
- Edit history available during document modification

### Efficiency Features
- Quick access to recently worked-on documents
- One-click return to active work
- Minimal clicks required for common operations 