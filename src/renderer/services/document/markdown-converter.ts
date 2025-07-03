/**
 * Markdown Converter Service
 * Converts structured BrainLift document data into formatted markdown
 * Following the implementation guide specification for document generation
 */

import type { BrainLiftDocument, ExpertSection, SpikyPOVSection, KnowledgeTreeSection, ResearchSource } from '../../stores/document-store';

/**
 * Configuration options for markdown generation
 */
interface MarkdownOptions {
  includeSourceLinks: boolean;
  includeMetadata: boolean;
  includeTableOfContents: boolean;
  sectionNumbering: boolean;
}

/**
 * Default options for markdown conversion
 */
const DEFAULT_OPTIONS: MarkdownOptions = {
  includeSourceLinks: true,
  includeMetadata: true,
  includeTableOfContents: true,
  sectionNumbering: true
};

/**
 * Converts a BrainLift document to markdown format
 * @param document - The BrainLift document to convert
 * @param options - Configuration options for markdown generation
 * @returns Formatted markdown string
 */
export function convertToMarkdown(document: BrainLiftDocument, options: Partial<MarkdownOptions> = {}): string {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const sections: string[] = [];
  
  // Document title
  sections.push(`# ${document.title}`);
  sections.push('');
  
  // Metadata section
  if (config.includeMetadata) {
    sections.push(generateMetadataSection(document));
    sections.push('');
  }
  
  // Table of contents
  if (config.includeTableOfContents) {
    sections.push(generateTableOfContents(document, config.sectionNumbering));
    sections.push('');
  }
  
  // Purpose section
  sections.push(generatePurposeSection(document, config.sectionNumbering));
  sections.push('');
  
  // Experts section
  if (document.experts && document.experts.length > 0) {
    sections.push(generateExpertsSection(document.experts, config));
    sections.push('');
  }
  
  // SpikyPOVs section
  if (document.spikyPOVs && document.spikyPOVs.length > 0) {
    sections.push(generateSpikyPOVsSection(document.spikyPOVs, config));
    sections.push('');
  }
  
  // Knowledge Tree section
  if (document.knowledgeTree && document.knowledgeTree.length > 0) {
    sections.push(generateKnowledgeTreeSection(document.knowledgeTree, config));
    sections.push('');
  }
  
  // Footer
  sections.push(generateFooter());
  
  return sections.join('\n');
}

/**
 * Generates document metadata section
 * @param document - The BrainLift document
 * @returns Formatted metadata string
 */
function generateMetadataSection(document: BrainLiftDocument): string {
  const metadata = [
    '## Document Information',
    '',
    `**Status:** ${document.status}`,
    `**Created:** ${formatDate(document.createdAt)}`,
    `**Last Updated:** ${formatDate(document.updatedAt)}`,
    `**Document ID:** ${document.id}`
  ];
  
  if (document.projectName) {
    metadata.push(`**Project:** ${document.projectName}`);
  }
  
  return metadata.join('\n');
}

/**
 * Generates table of contents
 * @param document - The BrainLift document
 * @param numbering - Whether to include section numbering
 * @returns Formatted table of contents string
 */
function generateTableOfContents(document: BrainLiftDocument, numbering: boolean): string {
  const toc = ['## Table of Contents', ''];
  
  const sections = [
    '1. Purpose',
    '   - Core Problem',
    '   - Target Outcome', 
    '   - Boundaries'
  ];
  
  let sectionNumber = 2;
  
  if (document.experts && document.experts.length > 0) {
    sections.push(`${sectionNumber}. Experts (${document.experts.length})`);
    sectionNumber++;
  }
  
  if (document.spikyPOVs && document.spikyPOVs.length > 0) {
    sections.push(`${sectionNumber}. SpikyPOVs (${document.spikyPOVs.length})`);
    sectionNumber++;
  }
  
  if (document.knowledgeTree && document.knowledgeTree.length > 0) {
    sections.push(`${sectionNumber}. Knowledge Tree (${document.knowledgeTree.length})`);
  }
  
  toc.push(...sections);
  return toc.join('\n');
}

/**
 * Generates the Purpose section
 * @param document - The BrainLift document
 * @param numbering - Whether to include section numbering
 * @returns Formatted purpose section string
 */
function generatePurposeSection(document: BrainLiftDocument, numbering: boolean): string {
  const sectionTitle = numbering ? '## 1. Purpose' : '## Purpose';
  const purpose = document.purpose;
  
  return [
    sectionTitle,
    '',
    '### Core Problem',
    `**Challenge:** ${purpose.coreProblem.challenge}`,
    `**Importance:** ${purpose.coreProblem.importance}`,
    `**Current Impact:** ${purpose.coreProblem.currentImpact}`,
    '',
    '### Target Outcome',
    `**Success Definition:** ${purpose.targetOutcome.successDefinition}`,
    `**Measurable Results:** ${purpose.targetOutcome.measurableResults}`,
    `**Beneficiaries:** ${purpose.targetOutcome.beneficiaries}`,
    '',
    '### Boundaries',
    `**Included:** ${purpose.boundaries.included}`,
    `**Excluded:** ${purpose.boundaries.excluded}`,
    `**Adjacent Problems:** ${purpose.boundaries.adjacentProblems}`
  ].join('\n');
}

/**
 * Generates the Experts section
 * @param experts - Array of expert sections
 * @param config - Markdown configuration options
 * @returns Formatted experts section string
 */
function generateExpertsSection(experts: ExpertSection[], config: MarkdownOptions): string {
  const sectionTitle = config.sectionNumbering ? '## 2. Experts' : '## Experts';
  const sections = [sectionTitle, ''];
  
  experts.forEach((expert, index) => {
    sections.push(`### Expert ${index + 1}: ${expert.expert.name}`);
    sections.push(`**Title:** ${expert.expert.title}`);
    sections.push(`**Focus Area:** ${expert.expert.focusArea}`);
    sections.push(`**Relevance:** ${expert.expert.relevance}`);
    sections.push('');
    sections.push(expert.generatedContent);
    sections.push('');
    
    if (config.includeSourceLinks && expert.sources && expert.sources.length > 0) {
      sections.push('**Sources:**');
      expert.sources.forEach(source => {
        sections.push(`- [${source.title}](${source.url})`);
      });
      sections.push('');
    }
  });
  
  return sections.join('\n');
}

/**
 * Generates the SpikyPOVs section
 * @param spikyPOVs - Array of spiky POV sections
 * @param config - Markdown configuration options  
 * @returns Formatted SpikyPOVs section string
 */
function generateSpikyPOVsSection(spikyPOVs: SpikyPOVSection[], config: MarkdownOptions): string {
  const sectionTitle = config.sectionNumbering ? '## 3. SpikyPOVs' : '## SpikyPOVs';
  const sections = [sectionTitle, ''];
  
  spikyPOVs.forEach((spiky, index) => {
    sections.push(`### SpikyPOV ${index + 1}: ${spiky.consensusView} vs ${spiky.contrarianInsight}`);
    sections.push('');
    sections.push(spiky.generatedContent);
    sections.push('');
    
    if (config.includeSourceLinks && spiky.sources && spiky.sources.length > 0) {
      sections.push('**Sources:**');
      spiky.sources.forEach(source => {
        sections.push(`- [${source.title}](${source.url})`);
      });
      sections.push('');
    }
  });
  
  return sections.join('\n');
}

/**
 * Generates the Knowledge Tree section
 * @param knowledgeTree - Array of knowledge tree sections
 * @param config - Markdown configuration options
 * @returns Formatted knowledge tree section string
 */
function generateKnowledgeTreeSection(knowledgeTree: KnowledgeTreeSection[], config: MarkdownOptions): string {
  const sectionTitle = config.sectionNumbering ? '## 4. Knowledge Tree' : '## Knowledge Tree';
  const sections = [sectionTitle, ''];
  
  knowledgeTree.forEach((knowledge, index) => {
    sections.push(`### Knowledge Tree ${index + 1}`);
    sections.push('');
    sections.push(knowledge.generatedContent);
    sections.push('');
    
    if (config.includeSourceLinks && knowledge.sources && knowledge.sources.length > 0) {
      sections.push('**Sources:**');
      knowledge.sources.forEach(source => {
        sections.push(`- [${source.title}](${source.url})`);
      });
      sections.push('');
    }
  });
  
  return sections.join('\n');
}

/**
 * Generates document footer
 * @returns Formatted footer string
 */
function generateFooter(): string {
  return [
    '---',
    `*Generated on ${new Date().toISOString()} by BrainLift Generator*`
  ].join('\n');
}

/**
 * Formats a date value to a readable string
 * @param dateValue - Date value that could be a Date object, string, or timestamp
 * @returns Formatted date string
 */
function formatDate(dateValue: any): string {
  try {
    if (!dateValue) return 'Not set';
    
    let date: Date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Generates a filename from a document title
 * @param title - Document title
 * @returns Sanitized filename
 */
export function generateFilename(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const timestamp = new Date().toISOString().split('T')[0];
  return `brainlift-${sanitized}-${timestamp}.md`;
}

/**
 * Validates that a document has sufficient content for markdown generation
 * @param document - The BrainLift document to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateDocumentForMarkdown(document: BrainLiftDocument): string[] {
  const errors: string[] = [];
  
  if (!document.title || document.title.trim() === '') {
    errors.push('Document title is required');
  }
  
  if (!document.purpose.coreProblem.challenge) {
    errors.push('Core problem challenge is required');
  }
  
  if (!document.purpose.targetOutcome.successDefinition) {
    errors.push('Target outcome success definition is required');
  }
  
  if (!document.purpose.boundaries.included) {
    errors.push('Purpose boundaries (included) is required');
  }
  
  // Check if document has any research content
  const hasContent = (document.experts && document.experts.length > 0) ||
                    (document.spikyPOVs && document.spikyPOVs.length > 0) ||
                    (document.knowledgeTree && document.knowledgeTree.length > 0);
  
  if (!hasContent) {
    errors.push('Document must have at least one research section (Experts, SpikyPOVs, or Knowledge Tree)');
  }
  
  return errors;
} 