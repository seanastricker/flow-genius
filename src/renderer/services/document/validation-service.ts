/**
 * Document Validation Service - Validates BrainLift documents before save
 * 
 * Provides comprehensive validation of document content, structure,
 * and completeness to ensure quality before final save.
 */
import type { BrainLiftDocument } from '../../stores/document-store';

/**
 * Validates a BrainLift document and returns array of validation errors
 * @param document - The document to validate
 * @returns Promise resolving to array of error messages (empty if valid)
 */
export async function validateDocument(document: BrainLiftDocument): Promise<string[]> {
  const errors: string[] = [];

  // Validate basic document structure
  if (!document.title?.trim()) {
    errors.push('Document title is required');
  }

  if (document.title && document.title.length > 200) {
    errors.push('Document title must be 200 characters or less');
  }

  // Validate purpose section
  if (!document.purpose?.isComplete) {
    errors.push('Purpose section must be completed before saving');
  }

  if (document.purpose) {
    const { coreProblem, targetOutcome, boundaries } = document.purpose;

    // Core Problem validation
    if (!coreProblem.challenge?.trim()) {
      errors.push('Purpose: Core Problem challenge is required');
    }
    if (!coreProblem.importance?.trim()) {
      errors.push('Purpose: Core Problem importance is required');
    }

    // Target Outcome validation
    if (!targetOutcome.successDefinition?.trim()) {
      errors.push('Purpose: Target Outcome success definition is required');
    }

    // Boundaries validation
    if (!boundaries.included?.trim()) {
      errors.push('Purpose: Boundaries included section is required');
    }
    if (!boundaries.excluded?.trim()) {
      errors.push('Purpose: Boundaries excluded section is required');
    }
  }

  // Validate research sections
  if (document.status === 'in-review' || document.status === 'completed') {
    // Check for minimum research content
    if (document.experts.length === 0) {
      errors.push('At least one expert analysis is required');
    }

    if (document.spikyPOVs.length === 0) {
      errors.push('At least one SpikyPOV analysis is required');
    }

    if (document.knowledgeTree.length === 0) {
      errors.push('At least one Knowledge Tree analysis is required');
    }

    // Validate expert sections
    document.experts.forEach((expert, index) => {
      if (!expert.expert.name?.trim()) {
        errors.push(`Expert ${index + 1}: Name is required`);
      }
      if (!expert.expert.title?.trim()) {
        errors.push(`Expert ${index + 1}: Title is required`);
      }
      if (!expert.generatedContent?.trim()) {
        errors.push(`Expert ${index + 1}: Generated content is missing`);
      }
      if (expert.sources.length === 0) {
        errors.push(`Expert ${index + 1}: At least one source is required`);
      }
    });

    // Validate SpikyPOV sections
    document.spikyPOVs.forEach((spiky, index) => {
      if (!spiky.consensusView?.trim()) {
        errors.push(`SpikyPOV ${index + 1}: Consensus view is required`);
      }
      if (!spiky.contrarianInsight?.trim()) {
        errors.push(`SpikyPOV ${index + 1}: Contrarian insight is required`);
      }
      if (!spiky.generatedContent?.trim()) {
        errors.push(`SpikyPOV ${index + 1}: Generated content is missing`);
      }
      if (spiky.sources.length === 0) {
        errors.push(`SpikyPOV ${index + 1}: At least one source is required`);
      }
    });

    // Validate Knowledge Tree sections
    document.knowledgeTree.forEach((knowledge, index) => {
      if (!knowledge.generatedContent?.trim()) {
        errors.push(`Knowledge Tree ${index + 1}: Generated content is missing`);
      }
      if (knowledge.sources.length === 0) {
        errors.push(`Knowledge Tree ${index + 1}: At least one source is required`);
      }
    });

    // Validate source quality
    const allSources = [
      ...document.experts.flatMap(e => e.sources),
      ...document.spikyPOVs.flatMap(s => s.sources),
      ...document.knowledgeTree.flatMap(k => k.sources)
    ];

    const lowCredibilitySources = allSources.filter(source => source.credibilityScore < 4);
    if (lowCredibilitySources.length > allSources.length * 0.5) {
      errors.push('Too many sources have low credibility scores (< 4/10)');
    }

    const missingUrls = allSources.filter(source => !source.url?.trim());
    if (missingUrls.length > 0) {
      errors.push(`${missingUrls.length} sources are missing URLs`);
    }
  }

  // Validate content length and quality
  const allContent = [
    ...document.experts.map(e => e.generatedContent),
    ...document.spikyPOVs.map(s => s.generatedContent),
    ...document.knowledgeTree.map(k => k.generatedContent)
  ].filter(content => content?.trim());

  // Check for minimum content length
  const shortContent = allContent.filter(content => content.length < 100);
  if (shortContent.length > 0) {
    errors.push(`${shortContent.length} sections have insufficient content (< 100 characters)`);
  }

  // Check for potentially AI-generated placeholder text
  const placeholderPatterns = [
    /as an ai/i,
    /i cannot/i,
    /i don't have/i,
    /placeholder/i,
    /lorem ipsum/i,
    /coming soon/i
  ];

  allContent.forEach((content, index) => {
    const hasPlaceholder = placeholderPatterns.some(pattern => pattern.test(content));
    if (hasPlaceholder) {
      errors.push(`Section ${index + 1} appears to contain placeholder or AI refusal text`);
    }
  });

  return errors;
}

/**
 * Validates document readiness for specific status transitions
 * @param document - The document to validate
 * @param targetStatus - The status to transition to
 * @returns Promise resolving to array of error messages
 */
export async function validateStatusTransition(
  document: BrainLiftDocument, 
  targetStatus: BrainLiftDocument['status']
): Promise<string[]> {
  const errors: string[] = [];

  switch (targetStatus) {
    case 'research-active':
      if (!document.purpose?.isComplete) {
        errors.push('Purpose must be completed before starting research');
      }
      break;

    case 'in-review':
      if (document.status !== 'research-complete') {
        errors.push('Research must be completed before review');
      }
      break;

    case 'completed':
      const fullValidation = await validateDocument(document);
      errors.push(...fullValidation);
      break;
  }

  return errors;
}

/**
 * Gets document completeness statistics
 * @param document - The document to analyze
 * @returns Object with completion statistics
 */
export function getDocumentStats(document: BrainLiftDocument) {
  const stats = {
    purposeComplete: document.purpose?.isComplete || false,
    expertCount: document.experts.length,
    spikyPOVCount: document.spikyPOVs.length,
    knowledgeTreeCount: document.knowledgeTree.length,
    totalSources: 0,
    averageCredibility: 0,
    totalWordCount: 0,
    lastUpdated: document.updatedAt
  };

  // Calculate source statistics
  const allSources = [
    ...document.experts.flatMap(e => e.sources),
    ...document.spikyPOVs.flatMap(s => s.sources),
    ...document.knowledgeTree.flatMap(k => k.sources)
  ];

  stats.totalSources = allSources.length;
  stats.averageCredibility = allSources.length > 0 
    ? allSources.reduce((sum, source) => sum + source.credibilityScore, 0) / allSources.length
    : 0;

  // Calculate word count
  const allContent = [
    ...document.experts.map(e => e.generatedContent),
    ...document.spikyPOVs.map(s => s.generatedContent),
    ...document.knowledgeTree.map(k => k.generatedContent)
  ].filter(content => content?.trim());

  stats.totalWordCount = allContent.reduce((total, content) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return total + words.length;
  }, 0);

  return stats;
} 